import type { Express } from "express";
import { createServer, type Server } from "http";
import { GameWebSocketServer } from "./websocket";
import type { InsertGame, InsertQuestion, InsertPlayer } from "@shared/schema";
import type { IStorage } from "./storage";

export async function registerRoutes(app: Express, storage: IStorage): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server with storage
  new GameWebSocketServer(httpServer, storage);

  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const gameData: InsertGame = req.body;
      // Create game first (without hostId)
      const game = await storage.createGame({ ...gameData, hostId: "" });
      // Create host as player
      const hostPlayer = await storage.createPlayer({
        gameId: game.id,
        name: "Host",
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
  app.get("/api/games/:roomCode", async (req, res) => {
    try {
      const { roomCode } = req.params;
      const game = await storage.getGameByRoomCode(roomCode);
      
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
      const questionsData: InsertQuestion[] = req.body;
      
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
  app.post("/api/games/:roomCode/join", async (req, res) => {
    try {
      const { roomCode } = req.params;
      const playerData: InsertPlayer = req.body;
      
      const game = await storage.getGameByRoomCode(roomCode);
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

  // Get host's game history
  app.get("/api/host/games", async (req, res) => {
    try {
      const hostId = 1; // TODO: Get from session/auth
      const games = await storage.getGamesByHostId(hostId);
      
      // Add player count and question count for each game
      const gamesWithDetails = await Promise.all(
        games.map(async (game) => {
          const players = await storage.getPlayersByGameId(game.id);
          const questions = await storage.getQuestionsByGameId(game.id);
          return {
            ...game,
            playerCount: players.filter(p => !p.isHost).length,
            questionCount: questions.length,
          };
        })
      );
      
      res.json(gamesWithDetails);
    } catch (error) {
      console.error("Error fetching host games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  return httpServer;
}
