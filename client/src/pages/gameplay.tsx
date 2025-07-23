import * as React from 'react';
import { useTheme } from "@/components/theme-provider";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  ANSWER_COLORS,
  ANSWER_TEXT_COLORS,
  GameState,
  QuestionData,
  WebSocketMessage,
} from "@/lib/game-types";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface GameplayProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function Gameplay({ gameState, onNavigate }: GameplayProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeLimit, setTimeLimit] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalPlayers, setTotalPlayers] = useState(0);

  const { connect, sendMessage, addMessageHandler, removeMessageHandler } =
    useWebSocket();

  useEffect(() => {
    // Initialize with data passed from lobby
    if (
      gameState.question &&
      gameState.timeLimit !== undefined &&
      gameState.currentQuestionIndex !== undefined &&
      gameState.totalQuestions !== undefined
    ) {
      setCurrentQuestion({
        id: gameState.question.id,
        questionText: gameState.question.questionText,
        answers: gameState.question.answers,
        questionOrder: gameState.question.questionOrder,
        questionType: gameState.question.questionType,
      });
      setTimeLimit(Math.floor(gameState.timeLimit / 1000));
      setTimeLeft(Math.floor(gameState.timeLimit / 1000));
      setCurrentQuestionIndex(gameState.currentQuestionIndex);
      setTotalQuestions(gameState.totalQuestions);
    }
  }, []); // Run only once on mount

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      switch (message.type) {
        case "question_started":
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
          setSelectedAnswers([]);
          setHasAnswered(false);
          break;
        case "answer_submitted":
          setHasAnswered(true);
          toast({
            title: message.payload.isCorrect ? "Correct!" : "Incorrect",
            description: `You earned ${message.payload.pointsEarned} points`,
          });
          break;
        case "question_ended":
          onNavigate({ type: "question-results", ...message.payload });
          break;
        case "game_completed":
          onNavigate({ type: "final-results", ...message.payload });
          break;
        case "error":
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

  useEffect(() => {
    if (gameState.isHost) {
      document.title = "Brain Bash - Host";
    } else {
      document.title = "Brain Bash - Player";
    }
  }, [gameState.isHost]);

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
    if (hasAnswered || !currentQuestion || gameState.isHost) return;

    // For single choice questions, submit immediately
    if (currentQuestion.questionType !== 'multi_select') {
      setSelectedAnswer(answerIndex);
      sendMessage({
        type: "submit_answer",
        payload: {
          questionId: currentQuestion.id,
          answerIndex,
        },
      });
    }
  };

  const toggleAnswer = (answerIndex: number) => {
    if (hasAnswered || !currentQuestion || gameState.isHost) return;

    setSelectedAnswers(prev => 
      prev.includes(answerIndex) 
        ? prev.filter(i => i !== answerIndex) 
        : [...prev, answerIndex]
    );
  };
  
  const submitMultiAnswer = () => {
    if (hasAnswered || !currentQuestion || gameState.isHost) return;
    
    sendMessage({
      type: 'submit_answer',
      payload: {
        questionId: currentQuestion.id,
        answerIndices: selectedAnswers,
      },
    });
  };

  const timeProgress = (timeLeft / timeLimit) * 100;

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const getBackgroundClass = () => {
    if (theme === "original") {
      return "bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]";
    }
    return "bg-background";
  };
  
  const getTextColorClass = (baseClass = 'text-white') => {
    if (theme === "original") {
      return baseClass;
    }
    return "text-foreground";
  };

  if (!currentQuestion) {
    return (
      <div className={`${getBackgroundClass()} min-h-screen flex items-center justify-center`}>
        <div className={`${getTextColorClass()} text-xl`}>Loading question...</div>
      </div>
    );
  }

  return (
    <div className={`${getBackgroundClass()} min-h-screen flex items-center justify-center px-4`}>
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      <div className="max-w-4xl mx-auto w-full">
        {/* Question Header */}
        <div className="text-center mb-8">
          <div className={`${theme === 'original' ? 'bg-white bg-opacity-20 backdrop-blur-sm' : 'bg-card'} rounded-2xl p-6 mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <span className={`${getTextColorClass('text-white')} text-lg font-semibold`}>
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
              <div className="bg-primary-foreground text-primary px-4 py-2 rounded-full font-bold text-lg">
                <Clock className="inline w-5 h-5 mr-2" />
                <span>{timeLeft}s</span>
              </div>
            </div>
            {/* Progress Bar */}
            <div className={`${theme === 'original' ? 'bg-white bg-opacity-30' : 'bg-secondary'} rounded-full h-2 mb-4`}>
              <div
                className={`${theme === 'original' ? 'bg-quiz-yellow' : 'bg-primary'} h-2 rounded-full transition-all`}
                style={{ 
                  width: `${timeProgress}%`,
                  transition: 'width 1s linear'
                }}
              ></div>
            </div>
          </div>

          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${getTextColorClass()} mb-4`}>
            {currentQuestion.questionText}
          </h2>
        </div>

        {/* Answer Choices */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {currentQuestion.answers.map((answer, index) => {
            const isSelected = currentQuestion.questionType === 'multi_select'
              ? selectedAnswers.includes(index)
              : selectedAnswer === index;

            return (
              <Button
                key={index}
                onClick={() => currentQuestion.questionType === 'multi_select' ? toggleAnswer(index) : selectAnswer(index)}
                disabled={hasAnswered || gameState.isHost}
                className={`
                  ${ANSWER_COLORS[index]} text-white p-8 rounded-3xl text-xl font-bold 
                  transform transition-all shadow-2xl h-auto min-h-[120px]
                  ${isSelected ? "ring-4 ring-primary scale-105" : "hover:scale-105"}
                  ${hasAnswered ? "opacity-50" : ""}
                `}
              >
                <div className="flex items-center justify-center space-x-4">
                  <div
                    className={`bg-white ${ANSWER_TEXT_COLORS[index]} w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-left flex-1">{answer}</span>
                </div>
              </Button>
            );
          })}
        </div>
        
        {/* Multi-select Submit Button */}
        {currentQuestion.questionType === 'multi_select' && !hasAnswered && !gameState.isHost && (
          <div className="text-center mb-8">
            <Button
              onClick={submitMultiAnswer}
              disabled={selectedAnswers.length === 0}
              className="bg-secondary text-secondary-foreground px-12 py-4 text-xl font-bold hover:bg-secondary/90 transition-all rounded-full shadow-lg"
            >
              Submit Answer
            </Button>
          </div>
        )}

        {/* Players Status */}
        <div className={`${theme === 'original' ? 'bg-white bg-opacity-10 backdrop-blur-sm' : 'bg-card'} rounded-full p-4 text-center`}>
          <span className={`${getTextColorClass('text-white')} text-lg font-semibold tracking-wider`}>
            {hasAnswered ? "Answer Submitted!" : "Choose your answer"}
          </span>
        </div>
      </div>
    </div>
  );
}
