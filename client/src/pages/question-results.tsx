import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  ANSWER_TEXT_COLORS,
  GameState,
  PlayerData,
  QuestionData,
  WebSocketMessage,
} from "@/lib/game-types";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface QuestionResultsProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

interface AnswerBreakdown {
  answerIndex: number;
  count: number;
}

export default function QuestionResults({
  gameState,
  onNavigate,
}: QuestionResultsProps) {
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [answerBreakdown, setAnswerBreakdown] = useState<AnswerBreakdown[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);

  const { connect, sendMessage, addMessageHandler, removeMessageHandler } =
    useWebSocket();

  useEffect(() => {
    // Initialize with data passed from previous screen
    if (gameState.question && gameState.answerBreakdown && gameState.players) {
      setQuestion(gameState.question as any); // The 'as any' is a temporary workaround for the type
      setAnswerBreakdown(gameState.answerBreakdown);
      setPlayers(gameState.players);
    }
  }, []); // Run only once

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      switch (message.type) {
        case "question_ended":
          setQuestion({
            ...message.payload.question,
            answers: message.payload.question.answers,
          });
          setAnswerBreakdown(message.payload.answerBreakdown);
          setPlayers(message.payload.players);
          break;
        case "question_started":
          onNavigate({ type: "gameplay", ...message.payload });
          break;
        case "game_completed":
          onNavigate({ type: "final-results", ...message.payload });
          break;
      }
    };
    addMessageHandler(handler);
    return () => removeMessageHandler(handler);
  }, [addMessageHandler, removeMessageHandler, onNavigate]);

  useEffect(() => {
    connect();
  }, [connect]);

  const nextQuestion = () => {
    sendMessage({
      type: "next_question",
      payload: { gameCode: gameState.gameCode },
    });
  };

  const getAnswerColor = (index: number) => {
    const colors = [
      "bg-quiz-red",
      "bg-quiz-blue",
      "bg-quiz-yellow",
      "bg-quiz-green",
    ];
    return colors[index] || "bg-gray-500";
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  const isMultiSelect = question.questionType === 'multi_select';
  const correctIndices: number[] = isMultiSelect 
    ? (question.correctAnswerIndices ?? []) 
    : (question.correctAnswerIndex !== undefined ? [question.correctAnswerIndex] : []);

  const totalCount = answerBreakdown.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-indigo-900 flex flex-col justify-center items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            {isMultiSelect ? 'Correct Answers' : 'Correct Answer'}
          </h1>
          <p className="text-gray-200 mt-2 text-lg">
            Here's how everyone did.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{question.questionText}</h2>
          <div className="space-y-4">
            {question.answers.map((answer, index) => {
              const isCorrect = correctIndices.includes(index);
              const breakdown = answerBreakdown.find(b => b.answerIndex === index);
              const count = breakdown?.count || 0;
              const percentage = totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : 0;

              return (
                <div key={index} className={`p-4 rounded-lg flex items-center justify-between transition-all duration-300 ${isCorrect ? 'bg-green-100' : 'bg-gray-50'}`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-white ${isCorrect ? 'bg-green-500' : 'bg-gray-400'}`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-gray-700'}`}>{answer}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-4 mr-4">
                      <div 
                        className={`h-4 rounded-full ${isCorrect ? 'bg-green-400' : 'bg-gray-400'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-600 w-24 text-right">{count} player{count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {gameState.isHost ? (
          <div className="text-center">
            <Button
              onClick={nextQuestion}
              className="bg-white text-indigo-600 px-12 py-4 text-xl font-bold hover:bg-gray-100 transition-all rounded-full shadow-lg"
            >
              Next Question
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        ) : (
          <p className="text-center text-gray-200 text-xl">
            Waiting for the host to continue...
          </p>
        )}
      </div>
    </div>
  );
}
