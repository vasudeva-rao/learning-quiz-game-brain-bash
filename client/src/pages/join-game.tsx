import * as React from 'react';
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AVATARS, GameState } from "@/lib/game-types";
import { apiRequest } from "@/lib/queryClient";
import { Users, X } from "lucide-react";
import { useState, useEffect } from "react";

interface JoinGameProps {
  gameState: GameState;
  onNavigate: (state: Partial<GameState>) => void;
}

export default function JoinGame({ gameState, onNavigate }: JoinGameProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    document.title = "Brain Bash";
  }, []);

  const joinGame = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both room code and display name.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await apiRequest(
        "POST",
        `/api/games/${gameCode.toUpperCase()}/join`,
        {
          name: playerName,
          avatar: selectedAvatar,
        }
      );

      const { player, game } = await response.json();

      toast({
        title: "Joined Game!",
        description: `Welcome to ${game.title}`,
      });

      onNavigate({
        type: "game-lobby",
        gameId: game.id,
        gameCode: game.gameCode,
        playerId: player.id,
        isHost: false,
      });
    } catch (error: any) {
      console.error("Error joining game:", error);
      toast({
        title: "Error",
        description:
          error.message ||
          "Failed to join game. Please check the room code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getBackgroundClass = () => {
    if (theme === "original") {
      return "bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]";
    }
    return "bg-background";
  };

  return (
    <div
      className={`min-h-screen ${getBackgroundClass()} flex items-center justify-center px-4`}
    >
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <ThemeSwitcher />
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onNavigate({ type: "home" })}
          className="p-3 hover:bg-background/80 rounded-lg transition-all duration-200"
          aria-label="Close"
        >
          <X className="w-8 h-8 text-foreground" />
        </Button>
      </div>
      <div className="max-w-md mx-auto w-full">
        <Card className="p-8 shadow-2xl text-center relative bg-card">
          {/* Remove the X button from inside the Card */}

          <div className="bg-green-500 text-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-3xl" />
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">Join Game</h2>
          <p className="text-muted-foreground mb-8">
            Enter the room code to join the quiz
          </p>

          <div className="mb-6">
            <Input
              placeholder="Room Code (e.g., ABC123)"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              className="text-center text-2xl font-bold uppercase tracking-widest"
              maxLength={6}
            />
          </div>

          <div className="mb-6">
            <Input
              placeholder="Display Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="text-center text-lg"
            />
          </div>

          {/* Avatar Selection */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-foreground mb-3">
              Choose Your Avatar
            </p>
            <div className="grid grid-cols-6 gap-4 justify-items-center">
              {AVATARS.map((avatar, index) => (
                <Button
                  key={index}
                  variant={selectedAvatar === avatar ? "default" : "outline"}
                  className={`w-12 h-12 text-2xl p-0 transition-transform ${
                    selectedAvatar !== avatar && "hover:scale-110"
                  }`}
                  style={
                    selectedAvatar === avatar && theme === "original"
                      ? { backgroundColor: "#16a34a" }
                      : {}
                  }
                  onClick={() => setSelectedAvatar(avatar)}
                >
                  {avatar}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={joinGame}
            disabled={isJoining}
            className="bg-gradient-to-r from-[hsl(142,76%,36%)] to-[hsl(217,91%,60%)] text-white px-8 py-4 text-lg w-full hover:shadow-lg transition-shadow"
          >
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
