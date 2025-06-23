import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import type { IStorage } from "./storage";

interface GameRoom {
  gameId: string;
  hostSocket: WebSocket | null;
  playerSockets: Map<string, WebSocket>;
  questionStartTime: number | null;
  questionTimer: NodeJS.Timeout | null;
}

class GameWebSocketServer {
  private wss: WebSocketServer;
  private rooms: Map<string, GameRoom> = new Map();
  private socketToPlayer: Map<
    WebSocket,
    { playerId: string; gameCode: string }
  > = new Map();
  private storage: IStorage;

  constructor(server: Server, storage: IStorage) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      perMessageDeflate: false,
      maxPayload: 16 * 1024 * 1024,
    });
    this.storage = storage;
    this.setupEventHandlers();
    console.log("WebSocket server initialized on path /ws");
  }

  private setupEventHandlers() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("WebSocket connection established");

      // Send initial connection confirmation
      this.sendMessage(ws, { type: "connection_established" });

      ws.on("message", async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          console.log("Received WebSocket message:", message.type);
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          this.sendError(ws, "Invalid message format");
        }
      });

      ws.on("close", (code, reason) => {
        console.log("WebSocket connection closed:", code, reason.toString());
        this.handleDisconnection(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case "join_game":
        await this.handleJoinGame(ws, payload);
        break;
      case "host_game":
        await this.handleHostGame(ws, payload);
        break;
      case "start_game":
        await this.handleStartGame(ws, payload);
        break;
      case "next_question":
        await this.handleNextQuestion(ws, payload);
        break;
      case "submit_answer":
        await this.handleSubmitAnswer(ws, payload);
        break;
      case "ping":
        this.sendMessage(ws, { type: "pong" });
        break;
      default:
        this.sendError(ws, "Unknown message type");
    }
  }

  private async handleJoinGame(
    ws: WebSocket,
    payload: { gameCode: string; playerId: string }
  ) {
    const { gameCode, playerId } = payload;

    const game = await this.storage.getGameByGameCode(gameCode);
    if (!game) {
      this.sendError(ws, "Game not found");
      return;
    }

    const player = await this.storage.getPlayerById(playerId);
    if (!player || player.gameId !== game.id) {
      this.sendError(ws, "Player not found in this game");
      return;
    }

    // Add to room
    let room = this.rooms.get(gameCode);
    if (!room) {
      room = {
        gameId: game.id,
        hostSocket: null,
        playerSockets: new Map(),
        questionStartTime: null,
        questionTimer: null,
      };
      this.rooms.set(gameCode, room);
    } else {
      // Always ensure the gameId is up to date (in case of reconnects)
      room.gameId = game.id;
    }

    room.playerSockets.set(playerId, ws);
    this.socketToPlayer.set(ws, { playerId, gameCode });

    // Send current game state to all players in the room
    const players = await this.storage.getPlayersByGameId(game.id);
    this.broadcastToRoom(gameCode, {
      type: "game_state",
      payload: {
        game,
        players,
        status: game.status,
      },
    });

    // Send confirmation to the joining player
    this.sendMessage(ws, {
      type: "joined_game",
      payload: {
        game,
        players,
        playerId,
      },
    });
  }

  private async handleHostGame(
    ws: WebSocket,
    payload: { gameId: string; hostId: string }
  ) {
    const { gameId, hostId } = payload;

    const game = await this.storage.getGameById(gameId);
    console.log("Comparing host IDs:", {
      dbHostId: game?.hostId,
      dbHostIdType: typeof game?.hostId,
      clientHostId: hostId,
      clientHostIdType: typeof hostId,
    });
    if (!game || String(game.hostId) !== String(hostId)) {
      this.sendError(ws, "Unauthorized");
      return;
    }

    const gameCode = game.gameCode;
    let room = this.rooms.get(gameCode);
    if (!room) {
      room = {
        gameId: game.id,
        hostSocket: null,
        playerSockets: new Map(),
        questionStartTime: null,
        questionTimer: null,
      };
      this.rooms.set(gameCode, room);
    }

    room.hostSocket = ws;
    this.socketToPlayer.set(ws, { playerId: hostId, gameCode });

    // When the host connects, they are also a player in the room.
    // Ensure they are in the playerSockets map to receive all broadcasts.
    // The host player document is created in the DB when the game is created/re-hosted.
    const hostPlayer = await this.storage.getPlayerById(hostId);
    if (hostPlayer) {
      room.playerSockets.set(hostId, ws);
    }

    // Broadcast current game state to all sockets in the room (including host)
    const players = await this.storage.getPlayersByGameId(game.id);
    this.broadcastToRoom(gameCode, {
      type: "game_state",
      payload: {
        game,
        players,
        status: game.status,
      },
    });

    this.sendMessage(ws, {
      type: "host_connected",
      payload: { game },
    });
  }

  private async handleStartGame(ws: WebSocket, payload: { gameCode: string }) {
    const { gameCode } = payload;
    const playerInfo = this.socketToPlayer.get(ws);

    // 1. Authorize the user
    if (!playerInfo) {
      this.sendError(ws, "Unauthorized: Player not associated with a socket.");
      return;
    }

    const game = await this.storage.getGameByGameCode(gameCode);

    // 2. Check if game exists and if the user is the host
    if (!game) {
      this.sendError(ws, "Game not found.");
      return;
    }

    if (String(game.hostId) !== String(playerInfo.playerId)) {
      console.error(
        `[handleStartGame] Auth failed: Game host is ${game.hostId}, but player ${playerInfo.playerId} tried to start.`
      );
      this.sendError(ws, "Unauthorized: Only the host can start the game.");
      return;
    }

    // 3. Update game status
    const updatedGame = await this.storage.updateGameStatus(game.id, "active");
    if (!updatedGame) {
      console.error(
        `[handleStartGame] updateGameStatus failed for gameId: ${game.id}`
      );
      this.sendError(ws, "Game not found (updateGameStatus failed)");
      return;
    }

    console.log(
      `[handleStartGame] Game ${game.id} started by host ${playerInfo.playerId}`
    );

    // 4. Start the first question
    await this.startQuestion(gameCode, 0);
  }

  private async handleNextQuestion(
    ws: WebSocket,
    payload: { gameCode: string }
  ) {
    const { gameCode } = payload;
    const room = this.rooms.get(gameCode);

    if (!room || room.hostSocket !== ws) {
      this.sendError(ws, "Unauthorized");
      return;
    }

    const game = await this.storage.getGameById(room.gameId);
    if (!game) {
      this.sendError(ws, "Game not found");
      return;
    }

    const nextQuestionIndex = (game.currentQuestionIndex ?? 0) + 1;
    const questions = await this.storage.getQuestionsByGameId(game.id);

    if (nextQuestionIndex >= questions.length) {
      // Game completed
      await this.storage.updateGameStatus(room.gameId, "completed");
      const players = await this.storage.getPlayersByGameId(room.gameId);
      this.broadcastToRoom(gameCode, {
        type: "game_completed",
        payload: {
          players: players.sort((a, b) => b.score - a.score),
        },
      });
      return;
    }

    await this.startQuestion(gameCode, nextQuestionIndex);
  }

  private async startQuestion(gameCode: string, questionIndex: number) {
    const room = this.rooms.get(gameCode);
    if (!room) return;

    const game = await this.storage.getGameById(room.gameId);
    if (!game) return;

    const questions = await this.storage.getQuestionsByGameId(game.id);
    if (questionIndex >= questions.length) {
      // No more questions, end the game
      const finalGame = await this.storage.finalizeGame(game.id);

      this.broadcastToRoom(gameCode, {
        type: "game_completed",
        payload: {
          players: finalGame?.finalResults ?? [],
        },
      });
      return;
    }

    // Update game to the new question index
    await this.storage.updateCurrentQuestion(game.id, questionIndex);
    const currentQuestion = questions[questionIndex];

    this.broadcastToRoom(gameCode, {
      type: "question_started",
      payload: {
        question: {
          id: currentQuestion.id,
          questionText: currentQuestion.questionText,
          answers: currentQuestion.answers,
          questionType: currentQuestion.questionType,
          questionOrder: currentQuestion.questionOrder,
        },
        timeLimit: game.timePerQuestion * 1000, // send in ms
        currentQuestionIndex: questionIndex,
        totalQuestions: questions.length,
      },
    });

    // Set a timer to automatically end the question
    room.questionStartTime = Date.now();
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
    }
    room.questionTimer = setTimeout(() => {
      this.endQuestion(gameCode, currentQuestion.id);
    }, game.timePerQuestion * 1000);
  }

  private async handleSubmitAnswer(
    ws: WebSocket,
    payload: { questionId: string; answerIndex?: number; answerIndices?: number[] }
  ) {
    const playerInfo = this.socketToPlayer.get(ws);
    if (!playerInfo) {
      this.sendError(ws, "Unauthorized");
      return;
    }

    const { gameCode, playerId } = playerInfo;
    const game = await this.storage.getGameByGameCode(gameCode);
    if (!game) {
      this.sendError(ws, "Game not found");
      return;
    }

    const room = this.rooms.get(gameCode);
    if (!room || !room.questionStartTime) {
      this.sendError(ws, "No active question or question hasn't started.");
      return;
    }

    const { questionId, answerIndex, answerIndices } = payload;
    const player = await this.storage.getPlayerById(playerId);
    if (!player) {
      this.sendError(ws, "Player not found");
      return;
    }

    const question = await this.storage.getQuestionById(questionId);
    if (!question) {
      this.sendError(ws, "Question not found");
      return;
    }

    const timeToAnswer = Date.now() - room.questionStartTime;
    let isCorrect = false;
    let selectedAnswer: number | number[] | undefined;

    if (question.questionType === 'multi_select') {
      const correct = question.correctAnswerIndices || [];
      const submitted = answerIndices || [];
      isCorrect = correct.length === submitted.length && correct.every(val => submitted.includes(val));
      selectedAnswer = submitted;
    } else {
      isCorrect = answerIndex === question.correctAnswerIndex;
      selectedAnswer = answerIndex;
    }

    // Calculate points
    let pointsEarned = 0;
    if (isCorrect) {
      const timePercentage = Math.max(
        0,
        (game.timePerQuestion * 1000 - timeToAnswer) /
          (game.timePerQuestion * 1000)
      );
      pointsEarned = Math.round(game.pointsPerQuestion * timePercentage);
    }

    // Save answer
    await this.storage.createPlayerAnswer({
      playerId: player.id,
      questionId,
      selectedAnswerIndex: answerIndex, // Note: For multi-select, this is simplified.
      selectedAnswerIndices: answerIndices,
      timeToAnswer,
    });

    // Update player score
    await this.storage.updatePlayerScore(
      player.id,
      player.score + pointsEarned
    );

    this.sendMessage(ws, {
      type: "answer_submitted",
      payload: {
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
      },
    });

    // Optional: broadcast player count to all
    const players = await this.storage.getPlayersByGameId(game.id);
    const answers = await this.storage.getPlayerAnswersByQuestionId(questionId);
    this.broadcastToRoom(gameCode, {
      type: "player_answered",
      payload: {
        totalPlayers: players.length,
        answeredCount: answers.length,
      },
    });

    // If all non-host players have answered, end question early
    if (answers.length >= players.filter((p) => !p.isHost).length) {
      if (room.questionTimer) {
        clearTimeout(room.questionTimer);
      }
      await this.endQuestion(gameCode, questionId);
    }
  }

  private async endQuestion(gameCode: string, questionId: string) {
    const room = this.rooms.get(gameCode);
    if (!room) return;

    // Clear the timer
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
      room.questionTimer = null;
    }

    const question = await this.storage.getQuestionById(questionId);
    if (!question) return;

    const answers = await this.storage.getPlayerAnswersByQuestionId(questionId);
    const players = await this.storage.getPlayersByGameId(room.gameId);

    // Calculate answer breakdown
    const answerBreakdown = Array.from(
      { length: question.answers.length },
      (_, i) => {
        let count = 0;
        if (question.questionType === 'multi_select') {
          // Count how many players included this answer index in their submission
          count = answers.filter(a => a.selectedAnswerIndices?.includes(i)).length;
        } else {
          // Count how many players chose this specific answer index
          count = answers.filter(a => a.selectedAnswerIndex === i).length;
        }
        return { answerIndex: i, count };
      }
    );

    this.broadcastToRoom(gameCode, {
      type: "question_ended",
      payload: {
        question: {
          id: question.id,
          questionText: question.questionText,
          answers: question.answers,
          questionType: question.questionType,
          correctAnswerIndex: question.correctAnswerIndex,
          correctAnswerIndices: question.correctAnswerIndices,
        },
        answerBreakdown,
        players: players.sort((a, b) => b.score - a.score),
      },
    });

    // After broadcasting results, check if the game should end
    const game = await this.storage.getGameById(room.gameId);
    if (!game) return;

    const questions = await this.storage.getQuestionsByGameId(room.gameId);
    if (game.currentQuestionIndex >= questions.length - 1) {
      // This was the last question, finalize the game
      await this.storage.finalizeGame(room.gameId);
      // The `game_completed` message is now sent from `startQuestion` when it's
      // called one last time by the host clicking "Next". We can optionally send it here too,
      // but that might create a race condition. The current flow is okay.
    }
  }

  private handleDisconnection(ws: WebSocket) {
    const playerInfo = this.socketToPlayer.get(ws);
    if (!playerInfo) return;

    const { playerId, gameCode } = playerInfo;
    const room = this.rooms.get(gameCode);

    if (room) {
      if (room.hostSocket === ws) {
        room.hostSocket = null;
      } else {
        room.playerSockets.delete(playerId);
      }

      // Clean up empty rooms
      if (!room.hostSocket && room.playerSockets.size === 0) {
        if (room.questionTimer) {
          clearTimeout(room.questionTimer);
        }
        this.rooms.delete(gameCode);
      }
    }

    this.socketToPlayer.delete(ws);
  }

  private broadcastToRoom(gameCode: string, message: any) {
    const room = this.rooms.get(gameCode);
    if (!room) return;

    const messageStr = JSON.stringify(message);

    if (room.hostSocket && room.hostSocket.readyState === WebSocket.OPEN) {
      room.hostSocket.send(messageStr);
    }

    room.playerSockets.forEach((socket) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(messageStr);
      }
    });
  }

  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error("Error sending WebSocket message:", error);
      }
    }
  }

  private sendError(ws: WebSocket, error: string) {
    console.error("WebSocket error being sent:", error);
    this.sendMessage(ws, { type: "error", payload: { error } });
  }
}

export { GameWebSocketServer };
