import { games, questions, players, playerAnswers, type Game, type Question, type Player, type PlayerAnswer, type InsertGame, type InsertQuestion, type InsertPlayer, type InsertPlayerAnswer } from "@shared/schema";
import { MongoClient, Db, ObjectId } from "mongodb";

export interface IStorage {
  // Game operations
  createGame(game: InsertGame & { hostId: number | string }): Promise<Game>;
  getGameByRoomCode(roomCode: string): Promise<Game | undefined>;
  getGameById(id: string): Promise<Game | undefined>;
  getGamesByHostId(hostId: number): Promise<Game[]>;
  updateGameStatus(gameId: string, status: string): Promise<Game | undefined>;
  updateCurrentQuestion(gameId: string, questionIndex: number): Promise<Game | undefined>;
  updateGameHostId(gameId: string, hostId: string): Promise<Game | undefined>;
  
  // Question operations
  createQuestion(question: InsertQuestion & { gameId: string; questionOrder: number }): Promise<Question>;
  getQuestionsByGameId(gameId: string): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;
  
  // Player operations
  createPlayer(player: InsertPlayer & { gameId: string }): Promise<Player>;
  getPlayersByGameId(gameId: string): Promise<Player[]>;
  getPlayerById(id: string): Promise<Player | undefined>;
  updatePlayerScore(playerId: string, score: number): Promise<Player | undefined>;
  updatePlayerAsHost(playerId: string): Promise<Player | undefined>;
  
  // Answer operations
  createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer>;
  getPlayerAnswersByQuestionId(questionId: string): Promise<PlayerAnswer[]>;
  getPlayerAnswersByPlayerId(playerId: string): Promise<PlayerAnswer[]>;
}

export class MemStorage implements IStorage {
  private games: Map<string, Game>;
  private questions: Map<string, Question>;
  private players: Map<string, Player>;
  private playerAnswers: Map<string, PlayerAnswer>;
  private currentGameId: number;
  private currentQuestionId: number;
  private currentPlayerId: number;
  private currentAnswerId: number;

  constructor() {
    this.games = new Map();
    this.questions = new Map();
    this.players = new Map();
    this.playerAnswers = new Map();
    this.currentGameId = 1;
    this.currentQuestionId = 1;
    this.currentPlayerId = 1;
    this.currentAnswerId = 1;
  }

  async createGame(gameData: InsertGame & { hostId: number | string }): Promise<Game> {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const id = this.currentGameId.toString();
    const game: Game = {
      id,
      hostId: String(gameData.hostId),
      title: gameData.title,
      description: gameData.description || null,
      timePerQuestion: gameData.timePerQuestion || 30,
      pointsPerQuestion: gameData.pointsPerQuestion || 1000,
      roomCode,
      status: "lobby",
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    this.games.set(id, game);
    this.currentGameId++;
    return game;
  }

  async getGameByRoomCode(roomCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.roomCode === roomCode);
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByHostId(hostId: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.hostId === hostId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async updateGameStatus(gameId: string, status: string): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (game) {
      const updatedGame = { ...game, status };
      this.games.set(gameId, updatedGame);
      return updatedGame;
    }
    return undefined;
  }

  async updateCurrentQuestion(gameId: string, questionIndex: number): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (game) {
      const updatedGame = { ...game, currentQuestionIndex: questionIndex };
      this.games.set(gameId, updatedGame);
      return updatedGame;
    }
    return undefined;
  }

  async updateGameHostId(gameId: string, hostId: string): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (game) {
      const updatedGame = { ...game, hostId: String(hostId) };
      this.games.set(gameId, updatedGame);
      return updatedGame;
    }
    return undefined;
  }

  async createQuestion(questionData: InsertQuestion & { gameId: string; questionOrder: number }): Promise<Question> {
    const id = this.currentQuestionId.toString();
    const question: Question = {
      id,
      gameId: questionData.gameId,
      questionText: questionData.questionText,
      questionType: (questionData.questionType as string) || 'multiple_choice',
      answers: questionData.answers,
      correctAnswerIndex: questionData.correctAnswerIndex || null,
      correctAnswerIndices: questionData.correctAnswerIndices || null,
      questionOrder: questionData.questionOrder,
    };
    this.questions.set(id, question);
    this.currentQuestionId++;
    return question;
  }

  async getQuestionsByGameId(gameId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.gameId === gameId)
      .sort((a, b) => a.questionOrder - b.questionOrder);
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createPlayer(playerData: InsertPlayer & { gameId: string }): Promise<Player> {
    const id = this.currentPlayerId.toString();
    const player: Player = {
      id,
      ...playerData,
      score: 0,
      joinedAt: new Date(),
      isHost: false,
    };
    this.players.set(id, player);
    this.currentPlayerId++;
    return player;
  }

  async getPlayersByGameId(gameId: string): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.gameId === gameId)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async updatePlayerScore(playerId: string, score: number): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (player) {
      const updatedPlayer = { ...player, score };
      this.players.set(playerId, updatedPlayer);
      return updatedPlayer;
    }
    return undefined;
  }

  async updatePlayerAsHost(playerId: string): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (player) {
      const updatedPlayer = { ...player, isHost: true };
      this.players.set(playerId, updatedPlayer);
      return updatedPlayer;
    }
    return undefined;
  }

  async createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer> {
    const id = this.currentAnswerId.toString();
    const playerAnswer: PlayerAnswer = {
      id,
      ...answer,
      answeredAt: new Date(),
      pointsEarned: 0,
    };
    this.playerAnswers.set(id, playerAnswer);
    this.currentAnswerId++;
    return playerAnswer;
  }

  async getPlayerAnswersByQuestionId(questionId: string): Promise<PlayerAnswer[]> {
    return Array.from(this.playerAnswers.values())
      .filter(answer => answer.questionId === questionId);
  }

  async getPlayerAnswersByPlayerId(playerId: string): Promise<PlayerAnswer[]> {
    return Array.from(this.playerAnswers.values())
      .filter(answer => answer.playerId === playerId);
  }
}

export class MongoStorage implements IStorage {
  private db: Db;
  constructor(db: Db) {
    this.db = db;
  }

  async createGame(gameData: InsertGame & { hostId: number | string }): Promise<Game> {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const doc = {
      ...gameData,
      roomCode,
      status: "lobby",
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    const result = await this.db.collection("games").insertOne(doc);
    return { ...doc, id: result.insertedId.toString() } as Game;
  }

  async getGameByRoomCode(roomCode: string): Promise<Game | undefined> {
    const doc = await this.db.collection("games").findOne({ roomCode });
    if (!doc) return undefined;
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toString() } as Game;
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const _id = new ObjectId(id);
    const doc = await this.db.collection("games").findOne({ _id });
    if (!doc) return undefined;
    const { _id: docId, ...rest } = doc;
    return { ...rest, id: docId.toString() } as Game;
  }

  async getGamesByHostId(hostId: number): Promise<Game[]> {
    const docs = await this.db.collection("games").find({ hostId }).sort({ createdAt: -1 }).toArray();
    return docs.map(doc => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id.toString() } as Game;
    });
  }

  async updateGameStatus(gameId: string, status: string): Promise<Game | undefined> {
    const _id = new ObjectId(gameId);
    const result = await this.db.collection("games").findOneAndUpdate(
      { _id },
      { $set: { status } },
      { returnDocument: "after" }
    );
    if (!result || !result.value) return undefined;
    const { _id: docId, ...rest } = result.value;
    return { ...rest, id: docId.toString() } as Game;
  }

  async updateCurrentQuestion(gameId: string, questionIndex: number): Promise<Game | undefined> {
    const _id = new ObjectId(gameId);
    const result = await this.db.collection("games").findOneAndUpdate(
      { _id },
      { $set: { currentQuestionIndex: questionIndex } },
      { returnDocument: "after" }
    );
    if (!result || !result.value) return undefined;
    const { _id: docId, ...rest } = result.value;
    return { ...rest, id: docId.toString() } as Game;
  }

  async updateGameHostId(gameId: string, hostId: string): Promise<Game | undefined> {
    const _id = new ObjectId(gameId);
    const result = await this.db.collection("games").findOneAndUpdate(
      { _id },
      { $set: { hostId } },
      { returnDocument: "after" }
    );
    if (!result || !result.value) return undefined;
    const { _id: docId, ...rest } = result.value;
    return { ...rest, id: docId.toString() } as Game;
  }

  async createQuestion(questionData: InsertQuestion & { gameId: string; questionOrder: number }): Promise<Question> {
    const doc = {
      ...questionData,
      gameId: questionData.gameId,
      questionOrder: questionData.questionOrder,
    };
    const result = await this.db.collection("questions").insertOne(doc);
    return { ...doc, id: result.insertedId.toString() } as Question;
  }

  async getQuestionsByGameId(gameId: string): Promise<Question[]> {
    const docs = await this.db.collection("questions").find({ gameId }).sort({ questionOrder: 1 }).toArray();
    return docs.map(doc => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id.toString(), gameId: rest.gameId } as Question;
    });
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const _id = new ObjectId(id);
    const doc = await this.db.collection("questions").findOne({ _id });
    if (!doc) return undefined;
    const { _id: docId, ...rest } = doc;
    return { ...rest, id: docId.toString(), gameId: rest.gameId } as Question;
  }

  async createPlayer(playerData: InsertPlayer & { gameId: string }): Promise<Player> {
    const doc = {
      ...playerData,
      gameId: playerData.gameId,
      score: 0,
      joinedAt: new Date(),
      isHost: false,
    };
    const result = await this.db.collection("players").insertOne(doc);
    return { ...doc, id: result.insertedId.toString(), gameId: doc.gameId } as Player;
  }

  async getPlayersByGameId(gameId: string): Promise<Player[]> {
    const docs = await this.db.collection("players").find({ gameId }).sort({ score: -1 }).toArray();
    return docs.map(doc => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id.toString(), gameId: rest.gameId } as Player;
    });
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    const _id = new ObjectId(id);
    const doc = await this.db.collection("players").findOne({ _id });
    if (!doc) return undefined;
    const { _id: docId, ...rest } = doc;
    return { ...rest, id: docId.toString(), gameId: rest.gameId } as Player;
  }

  async updatePlayerScore(playerId: string, score: number): Promise<Player | undefined> {
    const _id = new ObjectId(playerId);
    const result = await this.db.collection("players").findOneAndUpdate(
      { _id },
      { $set: { score } },
      { returnDocument: "after" }
    );
    if (!result || !result.value) return undefined;
    return { ...result.value, id: result.value._id.toString(), gameId: result.value.gameId } as Player;
  }

  async updatePlayerAsHost(playerId: string): Promise<Player | undefined> {
    const _id = new ObjectId(playerId);
    const result = await this.db.collection("players").findOneAndUpdate(
      { _id },
      { $set: { isHost: true } },
      { returnDocument: "after" }
    );
    if (!result || !result.value) return undefined;
    return { ...result.value, id: result.value._id.toString(), gameId: result.value.gameId } as Player;
  }

  async createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer> {
    const doc = {
      ...answer,
      answeredAt: new Date(),
      pointsEarned: 0,
    };
    const result = await this.db.collection("playerAnswers").insertOne(doc);
    return { ...doc, id: result.insertedId.toString(), playerId: doc.playerId, questionId: doc.questionId } as PlayerAnswer;
  }

  async getPlayerAnswersByQuestionId(questionId: string): Promise<PlayerAnswer[]> {
    const docs = await this.db.collection("playerAnswers").find({ questionId }).toArray();
    return docs.map(doc => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id.toString(), playerId: rest.playerId, questionId: rest.questionId } as PlayerAnswer;
    });
  }

  async getPlayerAnswersByPlayerId(playerId: string): Promise<PlayerAnswer[]> {
    const docs = await this.db.collection("playerAnswers").find({ playerId }).toArray();
    return docs.map(doc => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id.toString(), playerId: rest.playerId, questionId: rest.questionId } as PlayerAnswer;
    });
  }
}

export async function createMongoStorage(mongoUri: string, dbName: string): Promise<MongoStorage> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  return new MongoStorage(db);
}
