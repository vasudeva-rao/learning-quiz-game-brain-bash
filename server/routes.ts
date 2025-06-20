import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GameWebSocketServer } from "./websocket";
import { insertGameSchema, insertQuestionSchema, insertPlayerSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  new GameWebSocketServer(httpServer);

  // Create a new game
  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const hostId = 1; // TODO: Get from session/auth
      
      const game = await storage.createGame({ ...gameData, hostId });
      
      // Create host as player
      await storage.createPlayer({
        gameId: game.id,
        name: "Host",
        avatar: "🎯",
        isHost: true,
      });
      
      res.json(game);
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
      const gameId = parseInt(req.params.gameId);
      const questionsData = z.array(insertQuestionSchema).parse(req.body);
      
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
      const playerData = insertPlayerSchema.parse(req.body);
      
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
      const gameId = parseInt(req.params.gameId);
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
      const gameId = parseInt(req.params.gameId);
      const questions = await storage.getQuestionsByGameId(gameId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  return httpServer;
}
