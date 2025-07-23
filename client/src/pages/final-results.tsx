import * as React from 'react';
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { GameState, PlayerData, WebSocketMessage } from "@/lib/game-types";
import { Crown, Home, Medal, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";

interface FinalResultsProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function FinalResults({
  gameState,
  onNavigate,
}: FinalResultsProps) {
  const { theme } = useTheme();
  const [players, setPlayers] = useState<PlayerData[]>([]);

  const { connect, addMessageHandler, removeMessageHandler, disconnect } = useWebSocket();

  useEffect(() => {
    // Initialize with data passed from previous screen
    if (gameState.players) {
      const nonHostPlayers = gameState.players.filter(
        (player) => !player.isHost
      );
      const sortedPlayers = [...nonHostPlayers].sort(
        (a, b) => b.score - a.score
      );
      setPlayers(sortedPlayers);
    }
  }, []); // Run only once

  useEffect(() => {
    const handler = (message: WebSocketMessage) => {
      switch (message.type) {
        case "game_state":
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

  const playAgain = () => {
    disconnect();
    onNavigate({ type: "home" });
  };

  const goHome = () => {
    disconnect();
    onNavigate({ type: "home" });
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThree = sortedPlayers.slice(0, 3);
  const otherPlayers = sortedPlayers.slice(3);

  const podiumSlots = [
    { rank: 2, height: "h-48", color: "bg-slate-400", icon: <Trophy className="w-8 h-8 text-white"/> },
    { rank: 1, height: "h-64", color: "bg-yellow-400", icon: <Crown className="w-10 h-10 text-white"/> },
    { rank: 3, height: "h-32", color: "bg-yellow-600", icon: <Medal className="w-8 h-8 text-white"/> },
  ];

  const getBackgroundClass = () => {
    if (theme === "original") {
      return "bg-gradient-to-br from-[hsl(271,81%,66%)] to-indigo-900";
    }
    return "bg-background";
  };
  
  const getTextColorClass = (baseClass = 'text-white') => {
    if (theme === "original") {
      return baseClass;
    }
    return "text-foreground";
  };
  
  const getMutedTextColorClass = (baseClass = 'text-white opacity-90') => {
    if (theme === "original") {
      return baseClass;
    }
    return "text-muted-foreground";
  };

  return (
    <div className={`${getBackgroundClass()} min-h-screen flex flex-col items-center justify-center p-4`}>
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitcher />
      </div>
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="mb-8">
          <h2 className={`text-4xl md:text-6xl font-bold ${getTextColorClass()} mb-4`}>
            🎉 Game Complete! 🎉
          </h2>
          <p className={`${getMutedTextColorClass()} text-xl`}>
            Thanks for playing Brain Bash!
          </p>
        </div>

        {/* Podium */}
        <div className="flex justify-center items-end gap-2 sm:gap-4 md:gap-8 mb-12 mt-20 sm:mt-32">
            {podiumSlots.map(slot => {
                const player = sortedPlayers[slot.rank - 1];
                
                if (!player) {
                    return <div key={`placeholder-${slot.rank}`} className="w-24 sm:w-32 md:w-36" />;
                }
                
                return (
                    <div key={slot.rank} className="relative w-24 sm:w-32 md:w-36">
                        <div className="absolute bottom-full left-0 right-0 flex flex-col items-center gap-1 pb-4">
                            <div className="text-5xl">{player.avatar}</div>
                            <h3 className={`text-xl font-bold ${getTextColorClass()} text-center w-full break-words`}>{player.name}</h3>
                            <p className="text-lg text-yellow-300 font-semibold">{player.score.toLocaleString()} pts</p>
                        </div>
                        <div className={`
                            ${slot.color}
                            ${slot.height}
                            w-full rounded-t-lg flex flex-col items-center justify-center p-2 sm:p-4 shadow-2xl
                        `}>
                            {slot.icon}
                            <span className="text-4xl sm:text-5xl font-extrabold text-white mt-2">{slot.rank}</span>
                        </div>
                    </div>
                )
            })}
        </div>

        {/* Other Players */}
        {otherPlayers.length > 0 && (
          <div className={`${theme === 'original' ? 'bg-white bg-opacity-20 backdrop-blur-sm' : 'bg-card'} rounded-3xl p-6 mb-8 max-w-lg mx-auto`}>
            <h4 className={`text-2xl font-bold ${getTextColorClass()} mb-6`}>Final Standings</h4>
            <div className="space-y-3">
              {otherPlayers.map((player, index) => {
                const rank = index + 4;
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between ${theme === 'original' ? 'bg-white bg-opacity-10' : 'bg-muted'} rounded-xl p-3`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="bg-muted-foreground text-secondary w-8 h-8 rounded-full flex items-center justify-center font-bold text-md">
                        {rank}
                      </div>
                      <div className="text-2xl">{player.avatar}</div>
                      <span className={`${getTextColorClass('text-white')} font-semibold text-lg`}>
                        {player.name}
                      </span>
                    </div>
                    <span className={`${getTextColorClass('text-white')} font-bold text-xl`}>
                      {player.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={playAgain}
            className="bg-green-500 text-white px-8 py-4 text-lg font-bold rounded-full transition-all duration-200 hover:bg-green-600 active:translate-y-1 border-b-4 border-green-700 active:border-b-0"
          >
            <RotateCcw className="w-5 h-5 mr-3" />
            Play Again
          </Button>
          <Button
            onClick={goHome}
            variant="outline"
            className="px-8 py-4 text-lg font-bold rounded-full transition-all duration-200"
          >
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
