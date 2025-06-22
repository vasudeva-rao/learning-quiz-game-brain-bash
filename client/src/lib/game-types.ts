export interface GameState {
  type:
    | "home"
    | "host-dashboard"
    | "join-game"
    | "game-lobby"
    | "gameplay"
    | "question-results"
    | "scoreboard"
    | "final-results";
  gameId?: number;
  gameCode?: string;
  playerId?: number;
  isHost?: boolean;
  question?: QuestionData;
  timeLimit?: number;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  answerBreakdown?: { answerIndex: number; count: number }[];
  players?: PlayerData[];
}

export interface WebSocketMessage {
  type: string;
  payload: any;
}

export interface QuestionData {
  id: number;
  questionText: string;
  questionType: "multiple_choice" | "multi_select" | "true_false";
  answers: string[];
  correctAnswerIndex?: number;
  correctAnswerIndices?: number[];
  questionOrder: number;
}

export interface PlayerData {
  id: number;
  name: string;
  avatar: string;
  score: number;
  isHost: boolean;
}

export interface GameData {
  id: number;
  title: string;
  description?: string;
  gameCode: string;
  timePerQuestion: number;
  pointsPerQuestion: number;
  status: string;
  currentQuestionIndex: number;
}

export const AVATARS = ["🐱", "🐶", "🦊", "🐸", "🐨", "🦁", "🐯", "🐼"];

export const ANSWER_COLORS = [
  "bg-quiz-red hover:bg-red-600",
  "bg-quiz-blue hover:bg-blue-600",
  "bg-quiz-yellow hover:bg-yellow-600",
  "bg-quiz-green hover:bg-green-600",
];

export const ANSWER_TEXT_COLORS = [
  "text-quiz-red",
  "text-quiz-blue",
  "text-quiz-yellow",
  "text-quiz-green",
];
