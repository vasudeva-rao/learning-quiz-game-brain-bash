import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";
import { GameState, PlayerData, GameData, WebSocketMessage } from "@/lib/game-types";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface GameLobbyProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function GameLobby({ gameState, onNavigate }: GameLobbyProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [game, setGame] = useState<GameData | null>(null);

  // Fetch initial game data
  const { data: gameData } = useQuery<{game: GameData, players: PlayerData[]}>({
    queryKey: [`/api/games/${gameState.roomCode}`],
    enabled: !!gameState.roomCode,
  });

  useEffect(() => {
    if (gameData) {
      setGame(gameData.game);
      setPlayers(gameData.players);
    }
  }, [gameData]);

  const { connect, sendMessage, isConnected, connectionState } = useWebSocket({
    onMessage: (message: WebSocketMessage) => {
      console.log('Received WebSocket message:', message.type);
      switch (message.type) {
        case 'connection_established':
          // Send join/host message after connection is confirmed
          if (gameState.isHost) {
            sendMessage({
              type: 'host_game',
              payload: {
                gameId: gameState.gameId,
                hostId: gameState.playerId || 1,
              },
            });
          } else {
            sendMessage({
              type: 'join_game',
              payload: {
                roomCode: gameState.roomCode,
                playerId: gameState.playerId,
              },
            });
          }
          break;
        case 'game_state':
          setGame(message.payload.game);
          setPlayers(message.payload.players);
          break;
        case 'joined_game':
          setGame(message.payload.game);
          setPlayers(message.payload.players);
          break;
        case 'host_connected':
          setGame(message.payload.game);
          break;
        case 'question_started':
          onNavigate({ type: 'gameplay' });
          break;
        case 'error':
          toast({
            title: "Error",
            description: message.payload.error,
            variant: "destructive",
          });
          break;
      }
    },
  });

  useEffect(() => {
    connect();
  }, [connect]);

  const startGame = () => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to game server. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: 'start_game',
      payload: {
        roomCode: gameState.roomCode,
      },
    });
  };

  const getPlayerColors = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]',
      'bg-gradient-to-br from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)]',
      'bg-gradient-to-br from-[hsl(43,96%,56%)] to-[hsl(24,95%,53%)]',
      'bg-gradient-to-br from-[hsl(0,84%,60%)] to-pink-500',
    ];
    return colors[index % colors.length];
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]">
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] text-white px-6 py-3 rounded-full inline-block mb-4">
                <span className="text-2xl font-bold">Room: {game.roomCode}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{game.title}</h2>
              <p className="text-gray-600">
                {gameState.isHost ? "Waiting for players to join..." : "Waiting for host to start the game..."}
              </p>
              <div className="mt-2 text-sm text-gray-500">
                Connection: <span className={connectionState === 'connected' ? 'text-green-600' : 'text-red-600'}>
                  {connectionState}
                </span>
              </div>
            </div>

            {/* Players Grid */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Players ({players.length}/20)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {players.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`${getPlayerColors(index)} text-white p-4 rounded-xl text-center transform hover:scale-105 transition-transform`}
                  >
                    <div className="text-2xl mb-2">{player.avatar}</div>
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-xs opacity-75">
                      {player.isHost ? "Host" : "Ready"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Controls */}
            {gameState.isHost && (
              <div className="text-center">
                <Button 
                  onClick={startGame}
                  disabled={!isConnected || players.filter(p => !p.isHost).length === 0}
                  className="bg-gradient-to-r from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)] text-white px-12 py-4 text-xl font-bold hover:shadow-lg transition-shadow"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Start Quiz!
                </Button>
                {players.filter(p => !p.isHost).length === 0 && (
                  <p className="text-gray-500 text-sm mt-2">
                    Need at least 1 player to start the game
                  </p>
                )}
              </div>
            )}

            {/* Player Status */}
            {!gameState.isHost && (
              <div className="text-center">
                <div className="text-gray-600">
                  Waiting for host to start the game...
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>
    </div>
  );
}
