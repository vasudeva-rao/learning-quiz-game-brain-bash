import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import GameRoom from "@/components/GameRoom";

interface PlayerJoinProps {
  onBack: () => void;
}

const PlayerJoin = ({ onBack }: PlayerJoinProps) => {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [gameCode, setGameCode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [requirePasscode, setRequirePasscode] = useState(false);

  const joinGame = () => {
    if (!playerName.trim() || !gameCode.trim()) return;
    if (requirePasscode && !passcode.trim()) return;
    setGameStarted(true);
  };

  if (gameStarted) {
    return (
      <GameRoom 
        gameSettings={{
          title: "Quiz Game",
          passcode: passcode,
          requirePasscode: requirePasscode,
          negativePoints: false,
          timeLimit: 10
        }}
        questions={[]}
        isHost={false}
        playerName={playerName}
        onEndGame={() => setGameStarted(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-white">Join Game</h1>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Enter Game Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="playerName" className="text-white">Your Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label htmlFor="gameCode" className="text-white">Game Code</Label>
              <Input
                id="gameCode"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                placeholder="Enter game code..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div>
              <Label htmlFor="passcode" className="text-white">Passcode (if required)</Label>
              <Input
                id="passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <Button
              onClick={joinGame}
              className="w-full bg-white text-purple-600 hover:bg-white/90"
              disabled={!playerName.trim() || !gameCode.trim()}
            >
              Join Game
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerJoin;
