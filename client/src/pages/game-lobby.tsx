import * as React from 'react';
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  GameData,
  GameState,
  PlayerData,
  WebSocketMessage,
} from "@/lib/game-types";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Play, X, Clipboard } from "lucide-react";
import { useEffect, useState } from "react";

interface GameLobbyProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function GameLobby({ gameState, onNavigate }: GameLobbyProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [game, setGame] = useState<GameData | null>(null);

  // Fetch initial game data
  const { data: gameData } = useQuery<{
    game: GameData;
    players: PlayerData[];
  }>({
    queryKey: [`/api/games/${gameState.gameCode}`],
    enabled: !!gameState.gameCode,
  });

  useEffect(() => {
    if (gameData) {
      setGame(gameData.game);
      setPlayers(gameData.players);
    }
  }, [gameData]);

  useEffect(() => {
    if (gameState.isHost) {
      document.title = "Brain Bash - Host";
    } else if (players && players.length > 0) {
      const me = players.find((p) => p.id === gameState.playerId);
      document.title = me ? `Brain Bash - ${me.name}` : "Brain Bash - Player";
    } else {
      document.title = "Brain Bash";
    }
  }, [gameState.isHost, players, gameState.playerId]);

  const {
    connect,
    sendMessage,
    isConnected,
    connectionState,
    addMessageHandler,
    removeMessageHandler,
  } = useWebSocket();

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      console.log("Received WebSocket message:", message.type);
      switch (message.type) {
        case "connection_established":
          // Send join/host message after connection is confirmed
          if (gameState.isHost) {
            if (!gameState.playerId || !gameState.gameId) {
              toast({
                title: "Error",
                description:
                  "Host identifiers are missing. Please refresh or recreate the game.",
                variant: "destructive",
              });
              return;
            }
            sendMessage({
              type: "host_game",
              payload: {
                gameId: String(gameState.gameId),
                hostId: String(gameState.playerId),
              },
            });
          } else {
            sendMessage({
              type: "join_game",
              payload: {
                gameCode: gameState.gameCode,
                playerId: gameState.playerId,
              },
            });
          }
          break;
        case "game_state":
          setGame(message.payload.game);
          setPlayers(message.payload.players);
          break;
        case "joined_game":
          setGame(message.payload.game);
          setPlayers(message.payload.players);
          break;
        case "host_connected":
          setGame(message.payload.game);
          break;
        case "question_started":
          onNavigate({ type: "gameplay", ...message.payload });
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
  }, [
    addMessageHandler,
    removeMessageHandler,
    gameState,
    onNavigate,
    sendMessage,
    toast,
  ]);

  useEffect(() => {
    connect();
  }, [connect]);

  const startGame = () => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description:
          "Not connected to game server. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }

    sendMessage({
      type: "start_game",
      payload: {
        gameCode: gameState.gameCode,
      },
    });
  };

  const cancelGame = async () => {
    try {
      if (!gameState.gameId) {
        toast({
          title: "Error",
          description: "Game ID not found",
          variant: "destructive",
        });
        return;
      }

      await apiRequest("POST", `/api/games/${gameState.gameId}/cancel`);

      toast({
        title: "Game Cancelled",
        description: "The game has been cancelled successfully",
      });

      // Navigate back to host dashboard
      onNavigate({ type: "host-dashboard" });
    } catch (error) {
      console.error("Error cancelling game:", error);
      toast({
        title: "Error",
        description: "Failed to cancel the game. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlayerColors = (index: number) => {
    const colors = [
      "bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]",
      "bg-gradient-to-br from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)]",
      "bg-gradient-to-br from-[hsl(43,96%,56%)] to-[hsl(24,95%,53%)]",
      "bg-gradient-to-br from-[hsl(0,84%,60%)] to-pink-500",
    ];
    return colors[index % colors.length];
  };

  const getPlayerTextColor = (index: number) => {
    if (theme === "original") {
      return "text-white";
    }
    return "text-muted-foreground";
  };

  const getBackgroundClass = () => {
    if (theme === "original") {
      return "bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]";
    }
    return "bg-background";
  };

  const getLoadingTextColorClass = () => {
    if (theme === "original") {
      return "text-white";
    }
    return "text-foreground";
  };

  if (!game) {
    return (
      <div
        className={`${getBackgroundClass()} min-h-screen flex items-center justify-center`}
      >
        <div className={`${getLoadingTextColorClass()} text-xl`}>
          Loading game...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${getBackgroundClass()}`}>
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 shadow-2xl bg-card">
            {/* Cancel Button for Host */}
            {gameState.isHost && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={cancelGame}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}

            <div className="text-center mb-8">
              <div
                className={`
                ${
                  theme === "original"
                    ? "bg-gradient-to-r from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] text-white"
                    : "bg-primary text-primary-foreground"
                }
                px-6 py-3 rounded-full inline-block mb-4
              `}
              >
                <span className="text-2xl font-bold align-middle">
                  Room: {game.gameCode}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(game.gameCode);
                    toast({
                      title: "Room code copied!",
                      description: "",
                      duration: 1000,
                    });
                  }}
                  className="ml-3 align-middle inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                  title="Copy room code"
                  type="button"
                >
                  <Clipboard className="w-5 h-5" />
                </button>
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {game.title}
              </h2>
              <p className="text-muted-foreground">
                {gameState.isHost
                  ? "Waiting for players to join..."
                  : "Waiting for host to start the game..."}
              </p>
              <div className="mt-2 text-sm text-muted-foreground">
                Status:{" "}
                <span
                  className={
                    connectionState === "connected"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {connectionState}
                </span>
              </div>
            </div>

            {/* Players Grid */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Players : {players.length - 1}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className={`${getPlayerColors(
                      index
                    )} p-4 rounded-xl text-center transform hover:scale-105 transition-transform`}
                  >
                    <div
                      className={`text-2xl mb-2 ${
                        theme === "original" ? "text-white" : "text-foreground"
                      }`}
                    >
                      {player.avatar}
                    </div>
                    <div
                      className={`font-semibold ${
                        theme === "original" ? "text-white" : "text-foreground"
                      }`}
                    >
                      {player.name}
                    </div>
                    <div
                      className={`text-xs ${
                        theme === "original" ? "text-white" : "text-foreground"
                      } opacity-75`}
                    >
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
                  disabled={
                    !isConnected ||
                    players.filter((p) => !p.isHost).length === 0
                  }
                  className="bg-gradient-to-r from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)] text-white px-12 py-4 text-xl font-bold hover:shadow-lg transition-shadow"
                >
                  <Play className="w-6 h-6 mr-3" />
                  Start Quiz!
                </Button>
                {players.filter((p) => !p.isHost).length === 0 && (
                  <p className="text-muted-foreground text-sm mt-2">
                    Need at least 1 player to start the game
                  </p>
                )}
              </div>
            )}

            {/* Player Status */}
            {!gameState.isHost && (
              <div className="text-center">
                <div className="text-muted-foreground">
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
