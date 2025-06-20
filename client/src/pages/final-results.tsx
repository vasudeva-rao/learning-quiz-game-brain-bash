import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, RotateCcw, Crown, Trophy, Medal, Award } from "lucide-react";
import { GameState, PlayerData, WebSocketMessage } from "@/lib/game-types";
import { useWebSocket } from "@/hooks/use-websocket";

interface FinalResultsProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function FinalResults({ gameState, onNavigate }: FinalResultsProps) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [winner, setWinner] = useState<PlayerData | null>(null);

  const { connect, addMessageHandler, removeMessageHandler } = useWebSocket();

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      switch (message.type) {
        case 'game_state':
          setPlayers(message.payload.players);
          break;
      }
    };
    addMessageHandler(handler);
    return () => removeMessageHandler(handler);
  }, [addMessageHandler, removeMessageHandler]);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (players.length > 0) {
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
      setWinner(sortedPlayers[0]);
    }
  }, [players]);

  const playAgain = () => {
    onNavigate({ type: 'home' });
  };

  const goHome = () => {
    onNavigate({ type: 'home' });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6" />;
      case 2:
        return <Trophy className="w-6 h-6" />;
      case 3:
        return <Medal className="w-6 h-6" />;
      default:
        return <Award className="w-6 h-6" />;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-quiz-yellow';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-yellow-600';
      default:
        return 'bg-gray-500';
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto w-full text-center">
        
        <div className="mb-8">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            🎉 Game Complete! 🎉
          </h2>
          <p className="text-white text-xl opacity-90">Thanks for playing QuizMaster!</p>
        </div>

        {/* Winner Celebration */}
        {winner && (
          <div className="bg-gradient-to-br from-[hsl(43,96%,56%)] to-yellow-600 rounded-3xl p-8 mb-8 shadow-2xl">
            <div className="text-6xl mb-4">👑</div>
            <h3 className="text-3xl font-bold text-white mb-2">Winner!</h3>
            <div className="text-white">
              <div className="text-4xl mb-2">{winner.avatar}</div>
              <div className="text-2xl font-bold">{winner.name}</div>
              <div className="text-4xl font-bold">{winner.score.toLocaleString()} points</div>
            </div>
          </div>
        )}

        {/* Final Leaderboard */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-6 mb-8">
          <h4 className="text-2xl font-bold text-white mb-6">Final Results</h4>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const rank = index + 1;
              return (
                <div 
                  key={player.id}
                  className="flex items-center justify-between bg-white bg-opacity-20 rounded-xl p-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`${getRankColor(rank)} text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg`}>
                      {rank}
                    </div>
                    <div className="text-3xl">{player.avatar}</div>
                    <div>
                      <span className="text-white font-semibold text-lg">{player.name}</span>
                      <div className="text-gray-300 text-sm">
                        {/* Placeholder for correct answers - would need to track this */}
                        High scorer
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getRankIcon(rank)}
                    <span className="text-white font-bold text-2xl">
                      {player.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={playAgain}
            className="bg-quiz-green text-white px-8 py-4 text-lg font-bold hover:shadow-lg transition-shadow"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Play Again
          </Button>
          <Button 
            onClick={goHome}
            className="bg-white text-quiz-purple px-8 py-4 text-lg font-bold hover:shadow-lg transition-shadow"
          >
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
