import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

interface GameRoom {
  gameId: number;
  hostSocket: WebSocket | null;
  playerSockets: Map<number, WebSocket>;
  questionStartTime: number | null;
  questionTimer: NodeJS.Timeout | null;
}

class GameWebSocketServer {
  private wss: WebSocketServer;
  private rooms: Map<string, GameRoom> = new Map();
  private socketToPlayer: Map<WebSocket, { playerId: number; roomCode: string }> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      perMessageDeflate: false,
      maxPayload: 16 * 1024 * 1024
    });
    this.setupEventHandlers();
    console.log('WebSocket server initialized on path /ws');
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket connection established');
      
      // Send initial connection confirmation
      this.sendMessage(ws, { type: 'connection_established' });

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('Received WebSocket message:', message.type);
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', (code, reason) => {
        console.log('WebSocket connection closed:', code, reason.toString());
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    const { type, payload } = message;

    switch (type) {
      case 'join_game':
        await this.handleJoinGame(ws, payload);
        break;
      case 'host_game':
        await this.handleHostGame(ws, payload);
        break;
      case 'start_game':
        await this.handleStartGame(ws, payload);
        break;
      case 'next_question':
        await this.handleNextQuestion(ws, payload);
        break;
      case 'submit_answer':
        await this.handleSubmitAnswer(ws, payload);
        break;
      case 'ping':
        this.sendMessage(ws, { type: 'pong' });
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleJoinGame(ws: WebSocket, payload: { roomCode: string; playerId: number }) {
    const { roomCode, playerId } = payload;
    
    const game = await storage.getGameByRoomCode(roomCode);
    if (!game) {
      this.sendError(ws, 'Game not found');
      return;
    }

    const player = await storage.getPlayerById(playerId);
    if (!player || player.gameId !== game.id) {
      this.sendError(ws, 'Player not found in this game');
      return;
    }

    // Add to room
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = {
        gameId: game.id,
        hostSocket: null,
        playerSockets: new Map(),
        questionStartTime: null,
        questionTimer: null,
      };
      this.rooms.set(roomCode, room);
    }

    if (player.isHost) {
      room.hostSocket = ws;
    } else {
      room.playerSockets.set(playerId, ws);
    }

    this.socketToPlayer.set(ws, { playerId, roomCode });

    // Send current game state to all players in the room
    const players = await storage.getPlayersByGameId(game.id);
    this.broadcastToRoom(roomCode, {
      type: 'game_state',
      payload: {
        game,
        players,
        status: game.status,
      },
    });

    // Send confirmation to the joining player
    this.sendMessage(ws, {
      type: 'joined_game',
      payload: {
        game,
        players,
        playerId,
      },
    });
  }

  private async handleHostGame(ws: WebSocket, payload: { gameId: number; hostId: number }) {
    const { gameId, hostId } = payload;
    
    const game = await storage.getGameById(gameId);
    if (!game || game.hostId !== hostId) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    const roomCode = game.roomCode;
    let room = this.rooms.get(roomCode);
    if (!room) {
      room = {
        gameId: game.id,
        hostSocket: null,
        playerSockets: new Map(),
        questionStartTime: null,
        questionTimer: null,
      };
      this.rooms.set(roomCode, room);
    }

    room.hostSocket = ws;
    this.socketToPlayer.set(ws, { playerId: hostId, roomCode });

    this.sendMessage(ws, {
      type: 'host_connected',
      payload: { game },
    });
  }

  private async handleStartGame(ws: WebSocket, payload: { roomCode: string }) {
    const { roomCode } = payload;
    const room = this.rooms.get(roomCode);
    
    if (!room || room.hostSocket !== ws) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    const game = await storage.updateGameStatus(room.gameId, 'active');
    if (!game) {
      this.sendError(ws, 'Game not found');
      return;
    }

    await this.startQuestion(roomCode, 0);
  }

  private async handleNextQuestion(ws: WebSocket, payload: { roomCode: string }) {
    const { roomCode } = payload;
    const room = this.rooms.get(roomCode);
    
    if (!room || room.hostSocket !== ws) {
      this.sendError(ws, 'Unauthorized');
      return;
    }

    const game = await storage.getGameById(room.gameId);
    if (!game) {
      this.sendError(ws, 'Game not found');
      return;
    }

    const nextQuestionIndex = (game.currentQuestionIndex ?? 0) + 1;
    const questions = await storage.getQuestionsByGameId(game.id);
    
    if (nextQuestionIndex >= questions.length) {
      // Game completed
      await storage.updateGameStatus(room.gameId, 'completed');
      this.broadcastToRoom(roomCode, {
        type: 'game_completed',
        payload: {},
      });
      return;
    }

    await this.startQuestion(roomCode, nextQuestionIndex);
  }

  private async startQuestion(roomCode: string, questionIndex: number) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const game = await storage.updateCurrentQuestion(room.gameId, questionIndex);
    if (!game) return;

    const questions = await storage.getQuestionsByGameId(game.id);
    const currentQuestion = questions[questionIndex];
    
    if (!currentQuestion) return;

    // Clear any existing timer
    if (room.questionTimer) {
      clearTimeout(room.questionTimer);
    }

    room.questionStartTime = Date.now();

    // Send question to all players
    this.broadcastToRoom(roomCode, {
      type: 'question_started',
      payload: {
        question: {
          id: currentQuestion.id,
          questionText: currentQuestion.questionText,
          answers: currentQuestion.answers,
          questionOrder: currentQuestion.questionOrder,
        },
        timeLimit: game.timePerQuestion * 1000,
        currentQuestionIndex: questionIndex,
        totalQuestions: questions.length,
      },
    });

    // Set timer for question end
    room.questionTimer = setTimeout(async () => {
      await this.endQuestion(roomCode, currentQuestion.id);
    }, game.timePerQuestion * 1000);
  }

  private async handleSubmitAnswer(ws: WebSocket, payload: { questionId: number; answerIndex: number }) {
    const playerInfo = this.socketToPlayer.get(ws);
    if (!playerInfo) {
      this.sendError(ws, 'Player not found');
      return;
    }

    const { playerId, roomCode } = playerInfo;
    const room = this.rooms.get(roomCode);
    if (!room || !room.questionStartTime) {
      this.sendError(ws, 'No active question');
      return;
    }

    const question = await storage.getQuestionById(payload.questionId);
    if (!question) {
      this.sendError(ws, 'Question not found');
      return;
    }

    const timeToAnswer = Date.now() - room.questionStartTime;
    const isCorrect = payload.answerIndex === question.correctAnswerIndex;
    
    // Calculate points (base points + speed bonus)
    const game = await storage.getGameById(room.gameId);
    if (!game) return;

    let pointsEarned = 0;
    if (isCorrect) {
      const maxTime = game.timePerQuestion * 1000;
      const speedBonus = Math.max(0, (maxTime - timeToAnswer) / maxTime);
      pointsEarned = Math.round(game.pointsPerQuestion * (0.5 + 0.5 * speedBonus));
    }

    // Save answer
    await storage.createPlayerAnswer({
      playerId,
      questionId: question.id,
      selectedAnswerIndex: payload.answerIndex,
      timeToAnswer,
    });

    // Update player score
    const player = await storage.getPlayerById(playerId);
    if (player) {
      await storage.updatePlayerScore(playerId, (player.score ?? 0) + pointsEarned);
    }

    // Send confirmation to player
    this.sendMessage(ws, {
      type: 'answer_submitted',
      payload: {
        isCorrect,
        pointsEarned,
        timeToAnswer,
      },
    });

    // Check if all players have answered
    const players = await storage.getPlayersByGameId(room.gameId);
    const answers = await storage.getPlayerAnswersByQuestionId(question.id);
    
    if (answers.length >= players.filter(p => !p.isHost).length) {
      // All players answered, end question early
      if (room.questionTimer) {
        clearTimeout(room.questionTimer);
      }
      await this.endQuestion(roomCode, question.id);
    }
  }

  private async endQuestion(roomCode: string, questionId: number) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const question = await storage.getQuestionById(questionId);
    if (!question) return;

    const answers = await storage.getPlayerAnswersByQuestionId(questionId);
    const players = await storage.getPlayersByGameId(room.gameId);

    // Calculate answer breakdown
    const answerBreakdown = Array.from({ length: (question.answers as string[]).length }, (_, i) => ({
      answerIndex: i,
      count: answers.filter(a => a.selectedAnswerIndex === i).length,
    }));

    this.broadcastToRoom(roomCode, {
      type: 'question_ended',
      payload: {
        question: {
          id: question.id,
          questionText: question.questionText,
          answers: question.answers,
          correctAnswerIndex: question.correctAnswerIndex,
        },
        answerBreakdown,
        players: players.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
      },
    });

    room.questionStartTime = null;
    room.questionTimer = null;
  }

  private handleDisconnection(ws: WebSocket) {
    const playerInfo = this.socketToPlayer.get(ws);
    if (!playerInfo) return;

    const { playerId, roomCode } = playerInfo;
    const room = this.rooms.get(roomCode);
    
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
        this.rooms.delete(roomCode);
      }
    }

    this.socketToPlayer.delete(ws);
  }

  private broadcastToRoom(roomCode: string, message: any) {
    const room = this.rooms.get(roomCode);
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
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  private sendError(ws: WebSocket, error: string) {
    console.error('WebSocket error being sent:', error);
    this.sendMessage(ws, { type: 'error', payload: { error } });
  }
}

export { GameWebSocketServer };
