import {
  Game,
  InsertGame,
  InsertPlayer,
  InsertPlayerAnswer,
  InsertQuestion,
  Player,
  PlayerAnswer,
  Question,
} from "@shared/schema";
import { Collection, Db, MongoClient, ObjectId } from "mongodb";

// The IStorage interface defines the contract for all storage operations.
export interface IStorage {
  createGame(game: InsertGame & { hostId: string }): Promise<Game>;
  getGameByGameCode(gameCode: string): Promise<Game | undefined>;
  getGameById(id: string): Promise<Game | undefined>;
  getGamesByHostId(hostId: string): Promise<Game[]>;
  getGamesByIds(ids: string[]): Promise<Game[]>;
  updateGameStatus(gameId: string, status: string): Promise<Game | undefined>;
  updateCurrentQuestion(
    gameId: string,
    questionIndex: number
  ): Promise<Game | undefined>;
  updateGameHostId(gameId: string, hostId: string): Promise<Game | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByGameId(gameId: string): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayersByGameId(gameId: string): Promise<Player[]>;
  getPlayerById(id: string): Promise<Player | undefined>;
  updatePlayerScore(
    playerId: string,
    score: number
  ): Promise<Player | undefined>;
  updatePlayerAsHost(playerId: string): Promise<Player | undefined>;
  createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer>;
  getPlayerAnswersByQuestionId(questionId: string): Promise<PlayerAnswer[]>;
  getPlayerAnswersByPlayerId(playerId: string): Promise<PlayerAnswer[]>;
}

// Define types that represent the shape of documents in the database
type DbGame = Omit<Game, "id" | "createdAt"> & { createdAt: Date };
type DbQuestion = Omit<Question, "id">;
type DbPlayer = Omit<Player, "id" | "joinedAt"> & { joinedAt: Date };
type DbPlayerAnswer = Omit<PlayerAnswer, "id" | "answeredAt"> & {
  answeredAt: Date;
};

// MongoStorage provides a concrete implementation of IStorage using MongoDB.
export class MongoStorage implements IStorage {
  private games: Collection<DbGame>;
  private questions: Collection<DbQuestion>;
  private players: Collection<DbPlayer>;
  private playerAnswers: Collection<DbPlayerAnswer>;

  constructor(db: Db) {
    this.games = db.collection<DbGame>("games");
    this.questions = db.collection<DbQuestion>("questions");
    this.players = db.collection<DbPlayer>("players");
    this.playerAnswers = db.collection<DbPlayerAnswer>("playerAnswers");
  }

  // --- Game Operations ---

  async createGame(gameData: InsertGame & { hostId: string }): Promise<Game> {
    const gameCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const docToInsert = {
      ...gameData,
      gameCode,
      status: "lobby" as const,
      currentQuestionIndex: 0,
      createdAt: new Date(),
    };
    const result = await this.games.insertOne(docToInsert);
    const { _id, createdAt, ...rest } = {
      ...docToInsert,
      _id: result.insertedId,
    };
    return { ...rest, id: _id.toString(), createdAt: createdAt.toISOString() };
  }

  async getGameByGameCode(gameCode: string): Promise<Game | undefined> {
    const doc = await this.games.findOne({ gameCode });
    if (!doc) return undefined;
    const { _id, createdAt, ...rest } = doc;
    return { ...rest, id: _id.toString(), createdAt: createdAt.toISOString() };
  }

  async getGameById(id: string): Promise<Game | undefined> {
    if (!ObjectId.isValid(id)) return undefined;
    const doc = await this.games.findOne({ _id: new ObjectId(id) as any });
    if (!doc) return undefined;
    const { _id, createdAt, ...rest } = doc;
    return { ...rest, id: _id.toString(), createdAt: createdAt.toISOString() };
  }

  async getGamesByHostId(hostId: string): Promise<Game[]> {
    const docs = await this.games
      .find({ hostId })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((doc) => {
      const { _id, createdAt, ...rest } = doc;
      return {
        ...rest,
        id: _id.toString(),
        createdAt: createdAt.toISOString(),
      };
    });
  }

  async getGamesByIds(ids: string[]): Promise<Game[]> {
    const validIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));
    const docs = await this.games
      .find({ _id: { $in: validIds as any[] } })
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map((doc) => {
      const { _id, createdAt, ...rest } = doc;
      return {
        ...rest,
        id: _id.toString(),
        createdAt: createdAt.toISOString(),
      };
    });
  }

  async updateGameStatus(
    gameId: string,
    status: string
  ): Promise<Game | undefined> {
    if (!ObjectId.isValid(gameId)) return undefined;
    const result = await this.games.findOneAndUpdate(
      { _id: new ObjectId(gameId) as any },
      { $set: { status } },
      { returnDocument: "after" }
    );
    if (!result) return undefined;
    const { _id, createdAt, ...rest } = result;
    return { ...rest, id: _id.toString(), createdAt: createdAt.toISOString() };
  }

  async updateCurrentQuestion(
    gameId: string,
    questionIndex: number
  ): Promise<Game | undefined> {
    if (!ObjectId.isValid(gameId)) return undefined;
    const result = await this.games.findOneAndUpdate(
      { _id: new ObjectId(gameId) as any },
      { $set: { currentQuestionIndex: questionIndex } },
      { returnDocument: "after" }
    );
    if (!result) return undefined;
    const { _id, createdAt, ...rest } = result;
    return { ...rest, id: _id.toString(), createdAt: createdAt.toISOString() };
  }

  async updateGameHostId(
    gameId: string,
    hostId: string
  ): Promise<Game | undefined> {
    if (!ObjectId.isValid(gameId)) return undefined;
    const result = await this.games.findOneAndUpdate(
      { _id: new ObjectId(gameId) as any },
      { $set: { hostId } },
      { returnDocument: "after" }
    );
    if (!result) return undefined;
    const { _id, createdAt, ...rest } = result;
    return { ...rest, id: _id.toString(), createdAt: createdAt.toISOString() };
  }

  // --- Question Operations ---

  async createQuestion(questionData: InsertQuestion): Promise<Question> {
    const result = await this.questions.insertOne(questionData);
    const { _id, ...rest } = { ...questionData, _id: result.insertedId };
    return { ...rest, id: _id.toString() };
  }

  async getQuestionsByGameId(gameId: string): Promise<Question[]> {
    const docs = await this.questions
      .find({ gameId })
      .sort({ questionOrder: 1 })
      .toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc;
      return { ...rest, id: _id.toString() };
    });
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    if (!ObjectId.isValid(id)) return undefined;
    const doc = await this.questions.findOne({ _id: new ObjectId(id) as any });
    if (!doc) return undefined;
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toString() };
  }

  // --- Player Operations ---

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const docToInsert = {
      ...playerData,
      score: 0,
      joinedAt: new Date(),
      isHost: false,
    };
    const result = await this.players.insertOne(docToInsert);
    const { _id, joinedAt, ...rest } = {
      ...docToInsert,
      _id: result.insertedId,
    };
    return { ...rest, id: _id.toString(), joinedAt: joinedAt.toISOString() };
  }

  async getPlayersByGameId(gameId: string): Promise<Player[]> {
    const docs = await this.players
      .find({ gameId })
      .sort({ score: -1 })
      .toArray();
    return docs.map((doc) => {
      const { _id, joinedAt, ...rest } = doc;
      return { ...rest, id: _id.toString(), joinedAt: joinedAt.toISOString() };
    });
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    if (!ObjectId.isValid(id)) return undefined;
    const doc = await this.players.findOne({ _id: new ObjectId(id) as any });
    if (!doc) return undefined;
    const { _id, joinedAt, ...rest } = doc;
    return { ...rest, id: _id.toString(), joinedAt: joinedAt.toISOString() };
  }

  async updatePlayerScore(
    playerId: string,
    score: number
  ): Promise<Player | undefined> {
    if (!ObjectId.isValid(playerId)) return undefined;
    const result = await this.players.findOneAndUpdate(
      { _id: new ObjectId(playerId) as any },
      { $set: { score } },
      { returnDocument: "after" }
    );
    if (!result) return undefined;
    const { _id, joinedAt, ...rest } = result;
    return { ...rest, id: _id.toString(), joinedAt: joinedAt.toISOString() };
  }

  async updatePlayerAsHost(playerId: string): Promise<Player | undefined> {
    if (!ObjectId.isValid(playerId)) return undefined;
    const result = await this.players.findOneAndUpdate(
      { _id: new ObjectId(playerId) as any },
      { $set: { isHost: true } },
      { returnDocument: "after" }
    );
    if (!result) return undefined;
    const { _id, joinedAt, ...rest } = result;
    return { ...rest, id: _id.toString(), joinedAt: joinedAt.toISOString() };
  }

  // --- Answer Operations ---

  async createPlayerAnswer(answer: InsertPlayerAnswer): Promise<PlayerAnswer> {
    const docToInsert = {
      ...answer,
      answeredAt: new Date(),
      pointsEarned: 0,
    };
    const result = await this.playerAnswers.insertOne(docToInsert);
    const { _id, answeredAt, ...rest } = {
      ...docToInsert,
      _id: result.insertedId,
    };
    return {
      ...rest,
      id: _id.toString(),
      answeredAt: answeredAt.toISOString(),
    };
  }

  async getPlayerAnswersByQuestionId(
    questionId: string
  ): Promise<PlayerAnswer[]> {
    if (!ObjectId.isValid(questionId)) return [];
    const docs = await this.playerAnswers.find({ questionId }).toArray();
    return docs.map((doc) => {
      const { _id, answeredAt, ...rest } = doc;
      return {
        ...rest,
        id: _id.toString(),
        answeredAt: answeredAt.toISOString(),
      };
    });
  }

  async getPlayerAnswersByPlayerId(playerId: string): Promise<PlayerAnswer[]> {
    if (!ObjectId.isValid(playerId)) return [];
    const docs = await this.playerAnswers.find({ playerId }).toArray();
    return docs.map((doc) => {
      const { _id, answeredAt, ...rest } = doc;
      return {
        ...rest,
        id: _id.toString(),
        answeredAt: answeredAt.toISOString(),
      };
    });
  }
}

// Factory function to create and connect a MongoStorage instance.
export async function createMongoStorage(
  mongoUri: string,
  dbName: string
): Promise<MongoStorage> {
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);
  console.log("Successfully connected to MongoDB.");
  return new MongoStorage(db);
}
