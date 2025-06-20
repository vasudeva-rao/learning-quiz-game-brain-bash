import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  hostId: integer("host_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  roomCode: varchar("room_code", { length: 6 }).notNull().unique(),
  timePerQuestion: integer("time_per_question").notNull().default(30),
  pointsPerQuestion: integer("points_per_question").notNull().default(1000),
  status: text("status").notNull().default("lobby"), // lobby, active, completed
  currentQuestionIndex: integer("current_question_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 20 }).notNull().default("multiple_choice"), // multiple_choice, multi_select, true_false
  answers: jsonb("answers").notNull(), // Array of answer strings
  correctAnswerIndex: integer("correct_answer_index"), // For single correct answer
  correctAnswerIndices: jsonb("correct_answer_indices"), // For multiple correct answers (array of indices)
  questionOrder: integer("question_order").notNull(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  score: integer("score").default(0),
  joinedAt: timestamp("joined_at").defaultNow(),
  isHost: boolean("is_host").default(false),
});

export const playerAnswers = pgTable("player_answers", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  questionId: integer("question_id").notNull(),
  selectedAnswerIndex: integer("selected_answer_index").notNull(),
  answeredAt: timestamp("answered_at").defaultNow(),
  timeToAnswer: integer("time_to_answer").notNull(), // milliseconds
  pointsEarned: integer("points_earned").default(0),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  hostId: true,
  roomCode: true,
  status: true,
  currentQuestionIndex: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  gameId: true,
  questionOrder: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  gameId: true,
  score: true,
  joinedAt: true,
  isHost: true,
});

export const insertPlayerAnswerSchema = createInsertSchema(playerAnswers).omit({
  id: true,
  answeredAt: true,
  pointsEarned: true,
});

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type PlayerAnswer = typeof playerAnswers.$inferSelect;
export type InsertPlayerAnswer = z.infer<typeof insertPlayerAnswerSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferSelect;
