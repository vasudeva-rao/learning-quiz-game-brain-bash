import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy } from "lucide-react";
import { GameState, QuestionData, PlayerData, WebSocketMessage, ANSWER_TEXT_COLORS } from "@/lib/game-types";
import { useWebSocket } from "@/hooks/use-websocket";

interface QuestionResultsProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

interface AnswerBreakdown {
  answerIndex: number;
  count: number;
}

export default function QuestionResults({ gameState, onNavigate }: QuestionResultsProps) {
  const [question, setQuestion] = useState<QuestionData & { correctAnswerIndex: number } | null>(null);
  const [answerBreakdown, setAnswerBreakdown] = useState<AnswerBreakdown[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);

  const { connect, sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();

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
        case 'question_ended':
          setQuestion({
            ...message.payload.question,
            answers: message.payload.question.answers,
          });
          setAnswerBreakdown(message.payload.answerBreakdown);
          setPlayers(message.payload.players);
          break;
        case 'question_started':
          onNavigate({ type: 'gameplay', ...message.payload });
          break;
        case 'game_completed':
          onNavigate({ type: 'final-results', ...message.payload });
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
      type: 'next_question',
      payload: { gameCode: gameState.gameCode },
    });
  };

  const getAnswerColor = (index: number) => {
    const colors = [
      'bg-quiz-red',
      'bg-quiz-blue', 
      'bg-quiz-yellow',
      'bg-quiz-green'
    ];
    return colors[index] || 'bg-gray-500';
  };

  if (!question) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)] flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  const correctCount = answerBreakdown.find(b => b.answerIndex === question.correctAnswerIndex)?.count || 0;
  const totalCount = answerBreakdown.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)] flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto w-full text-center">
        
        {/* Correct Answer Display */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">Correct Answer!</h2>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 mb-6">
            <div className={`${getAnswerColor(question.correctAnswerIndex)} text-white p-6 rounded-2xl inline-block`}>
              <div className="flex items-center justify-center space-x-4">
                <div className={`bg-white ${ANSWER_TEXT_COLORS[question.correctAnswerIndex]} w-16 h-16 rounded-full flex items-center justify-center font-black text-3xl`}>
                  {String.fromCharCode(65 + question.correctAnswerIndex)}
                </div>
                <span className="text-2xl font-bold">
                  {question.answers[question.correctAnswerIndex]}
                </span>
              </div>
            </div>
          </div>
          <p className="text-white text-xl opacity-90">
            {correctCount} out of {totalCount} players got it right!
          </p>
        </div>

        {/* Answer Breakdown */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {answerBreakdown.map((breakdown, index) => {
            const isCorrect = index === question.correctAnswerIndex;
            return (
              <div 
                key={index}
                className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 ${
                  isCorrect ? 'bg-opacity-30 border-2 border-white' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`${getAnswerColor(index)} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-white font-semibold">
                      {question.answers[index]} {isCorrect ? '✓' : ''}
                    </span>
                  </div>
                  <span className="text-white font-bold">
                    {breakdown.count} player{breakdown.count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Button */}
        {gameState.isHost ? (
          <Button 
            onClick={nextQuestion}
            className="bg-white text-quiz-purple px-12 py-4 text-xl font-bold hover:shadow-lg transition-shadow"
          >
            Next Question
            <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        ) : (
          <p className="text-white text-xl">Waiting for the host to continue...</p>
        )}
      </div>
    </div>
  );
}
