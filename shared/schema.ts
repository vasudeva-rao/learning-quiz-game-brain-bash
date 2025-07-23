// Schema definitions for Brain-Bash quiz game (no drizzle, no zod)

export interface Game {
  id: string;
  hostId: string;
  userId: string; // Microsoft/Azure AD user ID
  title: string;
  description?: string;
  gameCode: string;
  timePerQuestion: number;
  pointsPerQuestion: number;
  allowNegativePoints: boolean;
  status: string; // lobby, active, completed
  currentQuestionIndex: number;
  createdAt: Date | string;
  finalResults?: Player[];
}

export interface InsertGame {
  title: string;
  description?: string;
  timePerQuestion: number;
  pointsPerQuestion: number;
  allowNegativePoints: boolean;
  userId?: string; // Optional for backward compatibility during migration
}

export interface Question {
  id: string;
  gameId: string;
  questionText: string;
  questionType: string; // multiple_choice, multi_select, true_false
  answers: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  questionOrder: number;
}

export interface InsertQuestion {
  gameId: string;
  questionText: string;
  questionType: string;
  answers: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  questionOrder: number;
}

export interface Player {
  id: string;
  gameId: string;
  name: string;
  avatar: string;
  score: number;
  joinedAt: Date | string;
  isHost: boolean;
}

export interface InsertPlayer {
  gameId: string;
  name: string;
  avatar: string;
}

export interface PlayerAnswer {
  id: string;
  playerId: string;
  questionId: string;
  selectedAnswerIndex?: number;
  selectedAnswerIndices?: number[];
  answeredAt: Date | string;
  timeToAnswer: number;
  pointsEarned: number;
}

export interface InsertPlayerAnswer {
  playerId: string;
  questionId: string;
  selectedAnswerIndex?: number;
  selectedAnswerIndices?: number[];
  timeToAnswer: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}
