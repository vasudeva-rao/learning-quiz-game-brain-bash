import type { InsertGame, InsertPlayer, InsertQuestion } from "../shared/schema";
import type { Express } from "express";
import { createServer, type Server } from "http";
import type { IStorage } from "./storage";
import { GameWebSocketServer } from "./websocket";
import { validateMsalToken, optionalAuth, type AuthenticatedRequest } from "./auth";

export async function registerRoutes(
  app: Express,
  storage: IStorage
): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server with storage
  new GameWebSocketServer(httpServer, storage);

  // Create a new game - requires authentication
  app.post("/api/games", validateMsalToken, async (req: AuthenticatedRequest, res) => {
    try {
      const gameData: InsertGame = req.body;
      
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Create game with userId
      const game = await storage.createGame({
        ...gameData,
        hostId: "", // Will be set after creating host player
        userId: req.user.id,
      });
      
      // Create host as player
      const hostPlayer = await storage.createPlayer({
        gameId: game.id,
        name: req.user.name || "Host",
        avatar: "🎯",
      });
      
      // Update host player to be marked as host
      await storage.updatePlayerAsHost(hostPlayer.id);
      
      // Update the game to set hostId to the host player's id
      await storage.updateGameHostId(game.id, hostPlayer.id);
      
      // Fetch the updated game
      const updatedGame = await storage.getGameById(game.id);
      res.json(updatedGame);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(400).json({ error: "Failed to create game" });
    }
  });

  // Get game by room code
  app.get("/api/games/:gameCode", async (req, res) => {
    try {
      const { gameCode } = req.params;
      const game = await storage.getGameByGameCode(gameCode);

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const players = await storage.getPlayersByGameId(game.id);
      const questions = await storage.getQuestionsByGameId(game.id);

      res.json({ game, players, questions });
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  // Add questions to a game
  app.post("/api/games/:gameId/questions", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const { questions: questionsData }: { questions: InsertQuestion[] } =
        req.body;

      if (!questionsData || !Array.isArray(questionsData)) {
        return res
          .status(400)
          .json({ error: "Invalid request, 'questions' array is required." });
      }

      const questions = [];
      for (let i = 0; i < questionsData.length; i++) {
        const question = await storage.createQuestion({
          ...questionsData[i],
          gameId,
          questionOrder: i,
        });
        questions.push(question);
      }

      res.json(questions);
    } catch (error) {
      console.error("Error adding questions:", error);
      res.status(400).json({ error: "Failed to add questions" });
    }
  });

  // Join a game
  app.post("/api/games/:gameCode/join", async (req, res) => {
    try {
      const { gameCode } = req.params;
      const playerData: InsertPlayer = req.body;

      const game = await storage.getGameByGameCode(gameCode);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      if (game.status !== "lobby") {
        return res.status(400).json({ error: "Game has already started" });
      }

      const player = await storage.createPlayer({
        ...playerData,
        gameId: game.id,
      });

      res.json({ player, game });
    } catch (error) {
      console.error("Error joining game:", error);
      res.status(400).json({ error: "Failed to join game" });
    }
  });

  // Get players for a game
  app.get("/api/games/:gameId/players", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const players = await storage.getPlayersByGameId(gameId);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  // Get questions for a game
  app.get("/api/games/:gameId/questions", async (req, res) => {
    try {
      const gameId = req.params.gameId;
      const questions = await storage.getQuestionsByGameId(gameId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  // Get host's game history - requires authentication
  app.get("/api/host/games", validateMsalToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const games = await storage.getGamesByUserId(req.user.id);

      // Add player count and question count for each game
      const gamesWithDetails = await Promise.all(
        games.map(async (game) => {
          let playerCount = 0;
          if (game.status === 'completed' && game.finalResults) {
            playerCount = game.finalResults.filter(p => !p.isHost).length;
          } else {
            const players = await storage.getPlayersByGameId(game.id);
            playerCount = players.filter(p => !p.isHost).length;
          }

          const questions = await storage.getQuestionsByGameId(game.id);
          return {
            ...game,
            playerCount: playerCount,
            questionCount: questions.length,
            // Ensure player IDs in finalResults are strings
            finalResults: game.finalResults?.map(p => ({
              ...p,
              id: (p as any)._id?.toString() ?? p.id,
            })),
          };
        })
      );

      res.json(gamesWithDetails);
    } catch (error) {
      console.error("Error fetching host games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  // Re-host a game - requires authentication
  app.post("/api/games/:gameId/rehost", validateMsalToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { gameId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // 1. Get the original game and its questions
      const originalGame = await storage.getGameById(gameId);
      if (!originalGame) {
        return res.status(404).json({ error: "Original game not found" });
      }

      // Verify the user owns this game
      if (originalGame.userId !== req.user.id) {
        return res.status(403).json({ error: "You can only rehost your own games" });
      }

      const originalQuestions = await storage.getQuestionsByGameId(gameId);

      // 2. Create a new game, copying details from the original
      const newGameData = {
        title: originalGame.title,
        description: originalGame.description,
        timePerQuestion: originalGame.timePerQuestion,
        pointsPerQuestion: originalGame.pointsPerQuestion,
        allowNegativePoints: originalGame.allowNegativePoints,
        hostId: "", // will be set after creating the host player
        userId: req.user.id,
      };
      const newGame = await storage.createGame(newGameData);

      // 3. Create a new host player for the new game
      const hostPlayer = await storage.createPlayer({
        gameId: newGame.id,
        name: req.user.name || "Host",
        avatar: "🎯",
      });
      await storage.updatePlayerAsHost(hostPlayer.id);
      await storage.updateGameHostId(newGame.id, hostPlayer.id);

      // 4. Copy questions to the new game
      for (let i = 0; i < originalQuestions.length; i++) {
        const q = originalQuestions[i];
        await storage.createQuestion({
          gameId: newGame.id,
          questionText: q.questionText,
          questionType: q.questionType,
          answers: q.answers,
          correctAnswerIndex: q.correctAnswerIndex,
          correctAnswerIndices: q.correctAnswerIndices,
          questionOrder: i,
        });
      }
      
      // 5. Return the new game details to the client
      res.json({
        ...newGame,
        hostId: hostPlayer.id,
      });

    } catch (error) {
      console.error("Error re-hosting game:", error);
      res.status(500).json({ error: "Failed to re-host game" });
    }
  });

  // Cancel a game - requires authentication and host ownership
  app.post("/api/games/:gameId/cancel", validateMsalToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { gameId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get the game to verify ownership
      const game = await storage.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      // Verify the user owns this game
      if (game.userId !== req.user.id) {
        return res.status(403).json({ error: "You can only cancel your own games" });
      }

      // Only allow cancellation if the game is in lobby or active status
      if (game.status !== "lobby" && game.status !== "active") {
        return res.status(400).json({ error: "Game cannot be cancelled in its current state" });
      }

      // Update game status to cancelled
      const updatedGame = await storage.updateGameStatus(gameId, "cancelled");
      if (!updatedGame) {
        return res.status(500).json({ error: "Failed to cancel game" });
      }

      res.json({ message: "Game cancelled successfully", game: updatedGame });
    } catch (error) {
      console.error("Error cancelling game:", error);
      res.status(500).json({ error: "Failed to cancel game" });
    }
  });

  return httpServer;
}
