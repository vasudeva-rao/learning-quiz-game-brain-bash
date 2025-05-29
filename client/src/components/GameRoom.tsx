import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Users, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

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
  status: 'active' | 'left-early' | 'joined-late';
}

interface GameRoomProps {
  gameSettings: GameSettings;
  questions: Question[];
  isHost: boolean;
  playerName?: string;
  onEndGame: () => void;
}

const GameRoom = ({ gameSettings, questions, isHost, playerName = "Player", onEndGame }: GameRoomProps) => {
  const [gameState, setGameState] = useState<'lobby' | 'question' | 'results' | 'final'>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [hasAnswered, setHasAnswered] = useState(false);
  // Only include the current player instead of mock players
  const [players, setPlayers] = useState<Player[]>([
    { name: playerName, score: 0, status: 'active' }
  ]);
  const [gameCode] = useState('QUIZ123');
  const [isCorrect, setIsCorrect] = useState(false); // New state for tracking correct answers

  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect - Fixed to properly advance questions
  useEffect(() => {
    if (gameState === 'question' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'question' && timeLeft === 0) {
      // When time runs out, move to results
      checkAnswer();
      setGameState('results');
      setTimeLeft(5); // 5 seconds to show results
    } else if (gameState === 'results' && timeLeft > 0) {
      // Countdown on the results screen
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'results' && timeLeft === 0) {
      // When results time is up, move to next question
      nextQuestion();
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    setGameState('question');
    setTimeLeft(currentQuestion?.timeLimit || 10);
  };

  // Helper function to check answers
  const checkAnswer = () => {
    if (!hasAnswered && selectedAnswers.length > 0) {
      let correct = false;
      
      if (currentQuestion.type === 'multiple-select') {
        // For multiple-select, all selected answers must match exactly with correct answers
        const selectedSet = new Set(selectedAnswers);
        const correctSet = new Set(currentQuestion.correctAnswers);
        
        correct = selectedSet.size === correctSet.size && 
                 [...selectedSet].every(answer => correctSet.has(answer));
      } else {
        // For single-answer questions (multiple-choice or true-false)
        correct = currentQuestion.correctAnswers.includes(selectedAnswers[0]);
      }
      
      setIsCorrect(correct);
      
      // Calculate score
      if (correct) {
        const speedBonus = Math.max(0, timeLeft * 10);
        const basePoints = 100;
        const totalPoints = basePoints + speedBonus;
        
        setPlayers(prev => prev.map(p => 
          p.name === playerName 
            ? { ...p, score: p.score + totalPoints }
            : p
        ));
      } else if (gameSettings.negativePoints) {
        setPlayers(prev => prev.map(p => 
          p.name === playerName 
            ? { ...p, score: Math.max(0, p.score - 50) }
            : p
        ));
      }
      
      setHasAnswered(true);
    }
  };

  const submitAnswer = (answer: string) => {
    if (hasAnswered) return;
    
    if (currentQuestion.type === 'multiple-select') {
      if (selectedAnswers.includes(answer)) {
        setSelectedAnswers(selectedAnswers.filter(a => a !== answer));
      } else {
        setSelectedAnswers([...selectedAnswers, answer]);
      }
    } else {
      setSelectedAnswers([answer]);
      setHasAnswered(true);
      
      // Check answer immediately
      const correct = currentQuestion.correctAnswers.includes(answer);
      setIsCorrect(correct);
      
      // Calculate score
      if (correct) {
        const speedBonus = Math.max(0, timeLeft * 10);
        const basePoints = 100;
        const totalPoints = basePoints + speedBonus;
        
        setPlayers(prev => prev.map(p => 
          p.name === playerName 
            ? { ...p, score: p.score + totalPoints }
            : p
        ));
      } else if (gameSettings.negativePoints) {
        setPlayers(prev => prev.map(p => 
          p.name === playerName 
            ? { ...p, score: Math.max(0, p.score - 50) }
            : p
        ));
      }
      
      // Immediately show results when answered
      setGameState('results');
      setTimeLeft(5); // 5 seconds to show results
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setGameState('question');
      setTimeLeft(questions[currentQuestionIndex + 1]?.timeLimit || 10);
      setSelectedAnswers([]);
      setHasAnswered(false);
    } else {
      setGameState('final');
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const playerRank = sortedPlayers.findIndex(p => p.name === playerName) + 1;

  if (gameState === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={onEndGame}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Leave Game
            </Button>
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white">{gameSettings.title}</h1>
              <p className="text-white/80">Game Code: <span className="font-mono text-2xl">{gameCode}</span></p>
            </div>
            <div className="w-20" /> {/* Spacer */}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Game Info */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Game Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Questions:</span>
                  <Badge variant="secondary">{questions.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Time per question:</span>
                  <Badge variant="secondary">{gameSettings.timeLimit}s</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/80">Negative points:</span>
                  <Badge variant={gameSettings.negativePoints ? "destructive" : "secondary"}>
                    {gameSettings.negativePoints ? "Yes" : "No"}
                  </Badge>
                </div>
                {isHost && (
                  <Button 
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                    disabled={players.length < 1}
                  >
                    Start Game
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Players List */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players ({players.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {players.map((player, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <span className="text-white font-medium">{player.name}</span>
                      <Badge variant={player.name === playerName ? "default" : "secondary"}>
                        {player.name === playerName ? "You" : "Player"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'question') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Question Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-xl">{timeLeft}s</span>
              </div>
            </div>
            <Progress 
              value={(timeLeft / (currentQuestion?.timeLimit || 10)) * 100} 
              className="w-full max-w-md mx-auto mb-6"
            />
          </div>

          {/* Question */}
          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white text-center leading-relaxed">
                {currentQuestion?.question}
              </h2>
            </CardContent>
          </Card>

          {/* Answer Options */}
          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion?.type === 'true-false' ? (
              <>
                <Button
                  onClick={() => submitAnswer('True')}
                  disabled={hasAnswered}
                  className={`h-20 text-xl font-bold ${
                    selectedAnswers.includes('True')
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <CheckCircle className="w-8 h-8 mr-4" />
                  True
                </Button>
                <Button
                  onClick={() => submitAnswer('False')}
                  disabled={hasAnswered}
                  className={`h-20 text-xl font-bold ${
                    selectedAnswers.includes('False')
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <XCircle className="w-8 h-8 mr-4" />
                  False
                </Button>
              </>
            ) : (
              currentQuestion?.options?.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => submitAnswer(option)}
                  disabled={hasAnswered && currentQuestion.type !== 'multiple-select'}
                  className={`h-20 text-lg font-bold ${
                    selectedAnswers.includes(option)
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center mr-4 text-sm font-bold">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option}
                </Button>
              ))
            )}
          </div>

          {/* Submit button for multiple select */}
          {currentQuestion?.type === 'multiple-select' && !hasAnswered && (
            <div className="text-center mt-6">
              <Button
                onClick={() => {
                  setHasAnswered(true);
                  checkAnswer();
                  setGameState('results');
                  setTimeLeft(5);
                }}
                disabled={selectedAnswers.length === 0}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 px-8 py-3 text-lg"
              >
                Submit Answers
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Results */}
          <div className="text-center mb-8">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {isCorrect ? (
                <CheckCircle className="w-12 h-12 text-white" />
              ) : (
                <XCircle className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h2>
            <p className="text-white/80 text-xl">
              Correct answer{currentQuestion?.correctAnswers.length > 1 ? 's' : ''}: {currentQuestion?.correctAnswers.join(', ')}
            </p>
          </div>

          {/* Scoreboard */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6" />
                Your Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-white">Your score:</span>
                  <span className="text-white font-bold text-2xl">
                    {players.find(p => p.name === playerName)?.score || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <p className="text-white/60">Next question in {timeLeft} seconds...</p>
            {isHost && (
              <Button 
                onClick={nextQuestion}
                className="mt-4 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                Skip Timer
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Final Results */}
          <div className="text-center mb-8">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
            <p className="text-white/80 text-xl">Thanks for playing {gameSettings.title}</p>
          </div>

          {/* Final Scoreboard */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">Final Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-6 rounded-lg ${
                      player.name === playerName ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5'
                    } ${index < 3 ? 'border-2 border-yellow-400/50' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-orange-400 text-black' :
                        'bg-white/20 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">{player.name}</span>
                          {player.name === playerName && (
                            <Badge variant="default">You</Badge>
                          )}
                        </div>
                        {index < 3 && (
                          <span className="text-yellow-400 text-sm font-medium">
                            {index === 0 ? '🏆 Winner!' : index === 1 ? '🥈 Runner-up' : '🥉 Third place'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-white font-bold text-2xl">{player.score}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              onClick={onEndGame}
              className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 px-8 py-3 text-lg"
            >
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GameRoom;
