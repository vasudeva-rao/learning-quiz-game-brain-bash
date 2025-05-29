
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Clock, Users, CheckCircle, XCircle, ArrowLeft, Crown } from "lucide-react";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";

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

interface MultiplayerGameRoomProps {
  gameSettings: GameSettings;
  questions: Question[];
  isHost: boolean;
  playerName: string;
  onEndGame: () => void;
}

const MultiplayerGameRoom = ({ gameSettings, questions, isHost, playerName, onEndGame }: MultiplayerGameRoomProps) => {
  const { gameState, startGame, submitAnswer, nextQuestion, endGame } = useMultiplayerGame(isHost, playerName);
  
  const currentQuestion = questions[gameState.currentQuestionIndex];
  const currentPlayer = gameState.players.find(p => p && p.name === playerName);
  const sortedPlayers = [...gameState.players].filter(p => p && p.name).sort((a, b) => b.score - a.score);

  // Auto advance when time runs out
  useEffect(() => {
    if (gameState.phase === 'question' && gameState.timeLeft === 0) {
      setTimeout(() => {
        if (gameState.currentQuestionIndex < questions.length - 1) {
          nextQuestion();
        } else {
          endGame();
        }
      }, 3000);
    } else if (gameState.phase === 'results' && gameState.timeLeft === 0) {
      if (gameState.currentQuestionIndex < questions.length - 1) {
        nextQuestion();
      } else {
        endGame();
      }
    }
  }, [gameState.phase, gameState.timeLeft, gameState.currentQuestionIndex, questions.length, nextQuestion, endGame]);

  const handleAnswerSubmit = (answer: string) => {
    if (currentPlayer?.hasAnswered) return;
    
    const isCorrect = currentQuestion.correctAnswers.includes(answer);
    submitAnswer(answer, isCorrect);
  };

  if (gameState.phase === 'lobby') {
    const playerCount = gameState.players.filter(p => p && p.name).length;
    const showAutoStart = playerCount >= 2 && gameState.autoStartTimer > 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
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
              <p className="text-white/80">Game Code: <span className="font-mono text-2xl">{gameState.gameCode}</span></p>
            </div>
            <div className="w-20" />
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
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
                  <span className="text-white/80">Players Connected:</span>
                  <Badge variant="secondary">{playerCount}</Badge>
                </div>
                
                {showAutoStart && (
                  <div className="text-center py-4">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                      <h3 className="text-white font-bold text-lg mb-2">Game Starting Soon!</h3>
                      <div className="text-3xl font-bold text-green-400 mb-2">{gameState.autoStartTimer}</div>
                      <p className="text-white/80 text-sm">seconds remaining</p>
                    </div>
                  </div>
                )}
                
                {isHost && !showAutoStart && (
                  <Button 
                    onClick={startGame}
                    className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                    disabled={playerCount < 2}
                  >
                    Start Game
                  </Button>
                )}
                {!isHost && !showAutoStart && (
                  <div className="text-center text-white/80">
                    {playerCount < 2 ? 'Waiting for more players...' : 'Waiting for host to start the game...'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players ({playerCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {gameState.players.filter(p => p && p.name).map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Crown className="w-4 h-4 text-yellow-400" />}
                        <span className="text-white font-medium">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={player.name === playerName ? "default" : "secondary"}>
                          {player.name === playerName ? "You" : `${player.score} pts`}
                        </Badge>
                      </div>
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

  if (gameState.phase === 'question') {
    const answeredCount = gameState.players.filter(p => p && p.hasAnswered).length;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Question {gameState.currentQuestionIndex + 1} of {questions.length}
              </Badge>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-xl">{gameState.timeLeft}s</span>
              </div>
              <Badge variant="outline" className="text-white border-white/30">
                {answeredCount}/{gameState.players.filter(p => p && p.name).length} answered
              </Badge>
            </div>
            <Progress 
              value={(gameState.timeLeft / (currentQuestion?.timeLimit || 10)) * 100} 
              className="w-full max-w-md mx-auto mb-6"
            />
          </div>

          <Card className="mb-8 bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold text-white text-center leading-relaxed">
                {currentQuestion?.question}
              </h2>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion?.type === 'true-false' ? (
              <>
                <Button
                  onClick={() => handleAnswerSubmit('True')}
                  disabled={currentPlayer?.hasAnswered}
                  className={`h-20 text-xl font-bold ${
                    currentPlayer?.hasAnswered
                      ? 'bg-gray-500 hover:bg-gray-500'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <CheckCircle className="w-8 h-8 mr-4" />
                  True
                </Button>
                <Button
                  onClick={() => handleAnswerSubmit('False')}
                  disabled={currentPlayer?.hasAnswered}
                  className={`h-20 text-xl font-bold ${
                    currentPlayer?.hasAnswered
                      ? 'bg-gray-500 hover:bg-gray-500'
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
                  onClick={() => handleAnswerSubmit(option)}
                  disabled={currentPlayer?.hasAnswered}
                  className={`h-20 text-lg font-bold ${
                    currentPlayer?.hasAnswered
                      ? 'bg-gray-500 hover:bg-gray-500'
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

          {currentPlayer?.hasAnswered && (
            <div className="text-center mt-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                currentPlayer.isCorrect ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {currentPlayer.isCorrect ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>Answer submitted! {currentPlayer.isCorrect ? 'Correct!' : 'Incorrect'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState.phase === 'results') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">Question Results</h2>
            <p className="text-white/80 text-xl">
              Correct answer: {currentQuestion?.correctAnswers.join(', ')}
            </p>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
            <CardHeader>
              <CardTitle className="text-white text-center flex items-center justify-center gap-2">
                <Trophy className="w-6 h-6" />
                Live Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      player.name === playerName ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-orange-400 text-black' :
                        'bg-white/20 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{player.name}</span>
                        {player.hasAnswered && (
                          player.isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )
                        )}
                      </div>
                    </div>
                    <span className="text-white font-bold text-lg">{player.score}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-white/60 mb-4">
              {gameState.currentQuestionIndex < questions.length - 1 
                ? `Next question in ${gameState.timeLeft} seconds...`
                : `Game ending in ${gameState.timeLeft} seconds...`
              }
            </p>
            {isHost && (
              <Button 
                onClick={() => {
                  if (gameState.currentQuestionIndex < questions.length - 1) {
                    nextQuestion();
                  } else {
                    endGame();
                  }
                }}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                Skip Timer
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'final') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
            <p className="text-white/80 text-xl">Final Results for {gameSettings.title}</p>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-center text-2xl">Final Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.id} 
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

export default MultiplayerGameRoom;
