import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, Users, Clock, CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  type: 'true-false' | 'multiple-choice' | 'multiple-select';
  question: string;
  options?: string[];
  correctAnswers: string[];
  timeLimit: number;
}

interface GameSettings {
  title: string;
  passcode: string;
  requirePasscode: boolean;
  negativePoints: boolean;
  timeLimit: number;
}

interface Player {
  name: string;
  score: number;
  answers: string[];
}

interface GameRoomProps {
  gameSettings: GameSettings;
  questions: Question[];
  isHost: boolean;
  playerName: string;
  onEndGame: () => void;
}

const GameRoom = ({ gameSettings, questions, isHost, playerName, onEndGame }: GameRoomProps) => {
  const [currentPhase, setCurrentPhase] = useState<'lobby' | 'question' | 'results' | 'final'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [players, setPlayers] = useState<Player[]>([
    { name: playerName, score: 0, answers: [] }
  ]);

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (currentPhase === 'question' && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentPhase, currentQuestionIndex]);

  const handleTimeUp = () => {
    if (currentPhase === 'question') {
      setCurrentPhase('results');
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setCurrentPhase('question');
        } else {
          setCurrentPhase('final');
        }
      }, 3000);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswers.length === 0) return;

    const isCorrect = selectedAnswers.every(answer => 
      currentQuestion.correctAnswers.includes(answer)
    );

    setPlayers(prev => prev.map(player => 
      player.name === playerName
        ? {
            ...player,
            score: isCorrect ? player.score + 1 : player.score,
            answers: [...player.answers, ...selectedAnswers]
          }
        : player
    ));

    setCurrentPhase('results');
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setCurrentPhase('question');
      } else {
        setCurrentPhase('final');
      }
    }, 3000);
  };

  const startGame = () => {
    setCurrentPhase('question');
  };

  if (currentPhase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              onClick={onEndGame}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Leave Game
            </Button>
            <h1 className="text-4xl font-bold text-white">{gameSettings.title}</h1>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players ({players.length})
                </div>
                {isHost && (
                  <Button
                    onClick={startGame}
                    className="bg-white text-purple-600 hover:bg-white/90"
                  >
                    Start Game
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players.map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-white font-medium">{index + 1}</span>
                      </div>
                      <span className="text-white">{player.name}</span>
                    </div>
                    {player.name === playerName && (
                      <span className="text-white/60 text-sm">(You)</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentPhase === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={onEndGame}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Leave Game
              </Button>
              <h1 className="text-2xl font-bold text-white">
                Question {currentQuestionIndex + 1} of {questions.length}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-white font-medium">{timeLeft}s</span>
            </div>
          </div>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion.type === 'true-false' ? (
                <RadioGroup
                  value={selectedAnswers[0] || ''}
                  onValueChange={(value) => setSelectedAnswers([value])}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg">
                    <RadioGroupItem value="True" id="true" className="border-white/40" />
                    <Label htmlFor="true" className="text-white flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg">
                    <RadioGroupItem value="False" id="false" className="border-white/40" />
                    <Label htmlFor="false" className="text-white flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      False
                    </Label>
                  </div>
                </RadioGroup>
              ) : currentQuestion.type === 'multiple-select' ? (
                <div className="space-y-4">
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg">
                      <Checkbox
                        id={`option-${index}`}
                        checked={selectedAnswers.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAnswers([...selectedAnswers, option]);
                          } else {
                            setSelectedAnswers(selectedAnswers.filter(ans => ans !== option));
                          }
                        }}
                        className="border-white/40"
                      />
                      <Label htmlFor={`option-${index}`} className="text-white">
                        {String.fromCharCode(65 + index)}. {option}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={selectedAnswers[0] || ''}
                  onValueChange={(value) => setSelectedAnswers([value])}
                  className="space-y-4"
                >
                  {currentQuestion.options?.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white/5 p-4 rounded-lg">
                      <RadioGroupItem value={option} id={`option-${index}`} className="border-white/40" />
                      <Label htmlFor={`option-${index}`} className="text-white">
                        {String.fromCharCode(65 + index)}. {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              <Button
                onClick={handleAnswerSubmit}
                className="w-full bg-white text-purple-600 hover:bg-white/90"
                disabled={selectedAnswers.length === 0}
              >
                Submit Answer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (currentPhase === 'results') {
    const currentPlayer = players.find(p => p.name === playerName);
    const isCorrect = currentPlayer?.answers[currentQuestionIndex] === currentQuestion.correctAnswers[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-white/60 mb-4">
                The correct answer was: {currentQuestion.correctAnswers.join(', ')}
              </div>
              <Progress value={100} className="w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={onEndGame}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Leave Game
          </Button>
          <h1 className="text-4xl font-bold text-white">Game Over!</h1>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Final Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-white font-medium">{index + 1}</span>
                      </div>
                      <span className="text-white">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{player.score}</span>
                      <span className="text-white/60">points</span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GameRoom;
