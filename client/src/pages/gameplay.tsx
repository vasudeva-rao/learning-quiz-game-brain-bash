import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { GameState, QuestionData, WebSocketMessage, ANSWER_COLORS, ANSWER_TEXT_COLORS } from "@/lib/game-types";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

interface GameplayProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function Gameplay({ gameState, onNavigate }: GameplayProps) {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const { connect, sendMessage, addMessageHandler, removeMessageHandler } = useWebSocket();

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'question_started':
          setCurrentQuestion({
            id: message.payload.question.id,
            questionText: message.payload.question.questionText,
            answers: message.payload.question.answers,
            questionOrder: message.payload.question.questionOrder,
            questionType: message.payload.question.questionType,
          });
          setTimeLimit(Math.floor(message.payload.timeLimit / 1000));
          setTimeLeft(Math.floor(message.payload.timeLimit / 1000));
          setCurrentQuestionIndex(message.payload.currentQuestionIndex);
          setTotalQuestions(message.payload.totalQuestions);
          setSelectedAnswer(null);
          setHasAnswered(false);
          break;
        case 'answer_submitted':
          setHasAnswered(true);
          toast({
            title: message.payload.isCorrect ? "Correct!" : "Incorrect",
            description: `You earned ${message.payload.pointsEarned} points`,
          });
          break;
        case 'question_ended':
          onNavigate({ type: 'question-results' });
          break;
        case 'game_completed':
          onNavigate({ type: 'final-results' });
          break;
        case 'error':
          toast({
            title: "Error",
            description: message.payload.error,
            variant: "destructive",
          });
          break;
      }
    };
    addMessageHandler(handler);
    return () => removeMessageHandler(handler);
  }, [addMessageHandler, removeMessageHandler, onNavigate, toast]);

  useEffect(() => {
    connect();
  }, [connect]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !hasAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, hasAnswered]);

  const selectAnswer = (answerIndex: number) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(answerIndex);

    sendMessage({
      type: 'submit_answer',
      payload: {
        questionId: currentQuestion.id,
        answerIndex,
      },
    });
  };

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] flex items-center justify-center">
        <div className="text-white text-xl">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Question Header */}
        <div className="text-center mb-8">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-white text-lg font-semibold">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <div className="bg-white text-quiz-purple px-4 py-2 rounded-full font-bold text-lg">
                <Clock className="inline w-5 h-5 mr-2" />
                <span>{timeLeft}s</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="bg-white bg-opacity-30 rounded-full h-2 mb-4">
              <div 
                className="bg-quiz-yellow h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* Answer Choices */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {currentQuestion.answers.map((answer, index) => (
            <Button
              key={index}
              onClick={() => selectAnswer(index)}
              disabled={hasAnswered}
              className={`
                ${ANSWER_COLORS[index]} text-white p-8 rounded-3xl text-xl font-bold 
                transform transition-all shadow-2xl h-auto min-h-[120px]
                ${selectedAnswer === index ? 'ring-4 ring-white scale-105' : 'hover:scale-105'}
                ${hasAnswered ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center justify-center space-x-4">
                <div className={`bg-white ${ANSWER_TEXT_COLORS[index]} w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl`}>
                  {String.fromCharCode(65 + index)}
                </div>
                <span className="text-left flex-1">{answer}</span>
              </div>
            </Button>
          ))}
        </div>

        {/* Players Status */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 text-center">
          <span className="text-white text-lg font-semibold">
            {hasAnswered ? "Answer submitted!" : "Choose your answer"}
          </span>
        </div>
      </div>
    </div>
  );
}
