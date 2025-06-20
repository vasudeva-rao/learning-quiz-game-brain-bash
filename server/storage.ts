import { games, questions, players, playerAnswers, type Game, type Question, type Player, type PlayerAnswer, type InsertGame, type InsertQuestion, type InsertPlayer, type InsertPlayerAnswer } from "@shared/schema";

export interface IStorage {
  // Game operations
  createGame(game: InsertGame & { hostId: number }): Promise<Game>;
  getGameByRoomCode(roomCode: string): Promise<Game | undefined>;
  getGameById(id: number): Promise<Game | undefined>;
  getGamesByHostId(hostId: number): Promise<Game[]>;
  updateGameStatus(gameId: number, status: string): Promise<Game | undefined>;
  updateCurrentQuestion(gameId: number, questionIndex: number): Promise<Game | undefined>;
  
  // Question operations
  createQuestion(question: InsertQuestion & { gameId: number; questionOrder: number }): Promise<Question>;
  getQuestionsByGameId(gameId: number): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | undefined>;
  
  // Player operations
  createPlayer(player: InsertPlayer & { gameId: number }): Promise<Player>;
  getPlayersByGameId(gameId: number): Promise<Player[]>;
  getPlayerById(id: number): Promise<Player | undefined>;
  updatePlayerScore(playerId: number, score: number): Promise<Player | undefined>;
  updatePlayerAsHost(playerId: number): Promise<Player | undefined>;
  
  // Answer operations
  createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer>;
  getPlayerAnswersByQuestionId(questionId: number): Promise<PlayerAnswer[]>;
  getPlayerAnswersByPlayerId(playerId: number): Promise<PlayerAnswer[]>;
}

export class MemStorage implements IStorage {
  private games: Map<number, Game>;
  private questions: Map<number, Question>;
  private players: Map<number, Player>;
  private playerAnswers: Map<number, PlayerAnswer>;
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

  async createGame(gameData: InsertGame & { hostId: number }): Promise<Game> {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const game: Game = {
      id: this.currentGameId++,
      hostId: gameData.hostId,
      title: gameData.title,
      description: gameData.description || null,
      timePerQuestion: gameData.timePerQuestion || 30,
      pointsPerQuestion: gameData.pointsPerQuestion || 1000,
      roomCode,
      status: "lobby",
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    this.games.set(game.id, game);
    return game;
  }

  async getGameByRoomCode(roomCode: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.roomCode === roomCode);
  }

  async getGameById(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGamesByHostId(hostId: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.hostId === hostId)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async updateGameStatus(gameId: number, status: string): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (game) {
      const updatedGame = { ...game, status };
      this.games.set(gameId, updatedGame);
      return updatedGame;
    }
    return undefined;
  }

  async updateCurrentQuestion(gameId: number, questionIndex: number): Promise<Game | undefined> {
    const game = this.games.get(gameId);
    if (game) {
      const updatedGame = { ...game, currentQuestionIndex: questionIndex };
      this.games.set(gameId, updatedGame);
      return updatedGame;
    }
    return undefined;
  }

  async createQuestion(questionData: InsertQuestion & { gameId: number; questionOrder: number }): Promise<Question> {
    const question: Question = {
      id: this.currentQuestionId++,
      gameId: questionData.gameId,
      questionText: questionData.questionText,
      questionType: (questionData.questionType as string) || 'multiple_choice',
      answers: questionData.answers,
      correctAnswerIndex: questionData.correctAnswerIndex || null,
      correctAnswerIndices: questionData.correctAnswerIndices || null,
      questionOrder: questionData.questionOrder,
    };
    this.questions.set(question.id, question);
    return question;
  }

  async getQuestionsByGameId(gameId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.gameId === gameId)
      .sort((a, b) => a.questionOrder - b.questionOrder);
  }

  async getQuestionById(id: number): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async createPlayer(playerData: InsertPlayer & { gameId: number }): Promise<Player> {
    const player: Player = {
      id: this.currentPlayerId++,
      ...playerData,
      score: 0,
      joinedAt: new Date(),
      isHost: false,
    };
    this.players.set(player.id, player);
    return player;
  }

  async getPlayersByGameId(gameId: number): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.gameId === gameId)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async updatePlayerScore(playerId: number, score: number): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (player) {
      const updatedPlayer = { ...player, score };
      this.players.set(playerId, updatedPlayer);
      return updatedPlayer;
    }
    return undefined;
  }

  async updatePlayerAsHost(playerId: number): Promise<Player | undefined> {
    const player = this.players.get(playerId);
    if (player) {
      const updatedPlayer = { ...player, isHost: true };
      this.players.set(playerId, updatedPlayer);
      return updatedPlayer;
    }
    return undefined;
  }

  async createPlayerAnswer(answerData: InsertPlayerAnswer): Promise<PlayerAnswer> {
    const answer: PlayerAnswer = {
      id: this.currentAnswerId++,
      ...answerData,
      answeredAt: new Date(),
      pointsEarned: 0,
    };
    this.playerAnswers.set(answer.id, answer);
    return answer;
  }

  async getPlayerAnswersByQuestionId(questionId: number): Promise<PlayerAnswer[]> {
    return Array.from(this.playerAnswers.values())
      .filter(answer => answer.questionId === questionId);
  }

  async getPlayerAnswersByPlayerId(playerId: number): Promise<PlayerAnswer[]> {
    return Array.from(this.playerAnswers.values())
      .filter(answer => answer.playerId === playerId);
  }
}

export const storage = new MemStorage();
