import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Lock, User, QrCode } from "lucide-react";
import GameRoom from "@/components/GameRoom";
import MultiplayerGameRoom from "@/components/MultiplayerGameRoom";

interface PlayerJoinProps {
  onBack: () => void;
}

const PlayerJoin = ({ onBack }: PlayerJoinProps) => {
  const [joined, setJoined] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [requiresPasscode, setRequiresPasscode] = useState(false);
  const [step, setStep] = useState<'code' | 'name' | 'passcode'>('code');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const checkGameCode = () => {
    if (!gameCode.trim()) return;
    
    // Simulate checking if game exists and requires passcode
    // In real implementation, this would be an API call
    const gameExists = gameCode.length >= 4;
    const needsPasscode = gameCode.toLowerCase().includes('p'); // Simple simulation
    
    if (gameExists) {
      setRequiresPasscode(needsPasscode);
      setStep(needsPasscode ? 'passcode' : 'name');
    } else {
      alert('Game not found! Please check the code.');
    }
  };

  const joinGame = () => {
    if (!playerName.trim()) return;
    if (requiresPasscode && !passcode.trim()) return;
    
    // Simulate joining game
    setJoined(true);
  };

  const handleQRCodeScan = () => {
    setShowQRScanner(!showQRScanner);
    // In a real implementation, this would trigger the device camera
    // and scan a QR code, then set the game code accordingly
    if (!showQRScanner) {
      // Simulate scanning after a delay
      setTimeout(() => {
        const mockScannedCode = "QUIZ01";
        setGameCode(mockScannedCode);
        setShowQRScanner(false);
        checkGameCode();
      }, 2000);
    }
  };

  const mockGameSettings = {
    title: 'Sample Quiz Game',
    passcode: passcode,
    requirePasscode: requiresPasscode,
    negativePoints: false,
    timeLimit: 10
  };

  const mockQuestions = [
    {
      id: '1',
      type: 'multiple-choice' as const,
      question: 'What is the capital of France?',
      options: ['London', 'Berlin', 'Paris', 'Madrid'],
      correctAnswers: ['Paris'],
      timeLimit: 10
    },
    {
      id: '2',
      type: 'true-false' as const,
      question: 'The sky is blue',
      correctAnswers: ['True'],
      timeLimit: 8
    },
    {
      id: '3',
      type: 'multiple-choice' as const,
      question: 'Which planet is closest to the sun?',
      options: ['Venus', 'Earth', 'Mercury', 'Mars'],
      correctAnswers: ['Mercury'],
      timeLimit: 10
    },
    {
      id: '4',
      type: 'multiple-select' as const,
      question: 'Which of these are mammals?',
      options: ['Dolphin', 'Shark', 'Bat', 'Snake'],
      correctAnswers: ['Dolphin', 'Bat'],
      timeLimit: 15
    },
    {
      id: '5',
      type: 'multiple-choice' as const,
      question: 'What is the largest ocean on Earth?',
      options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
      correctAnswers: ['Pacific'],
      timeLimit: 10
    }
  ];

  if (joined) {
    return (
      <MultiplayerGameRoom 
        gameSettings={mockGameSettings} 
        questions={mockQuestions} 
        isHost={false}
        playerName={playerName}
        onEndGame={() => setJoined(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-white mb-2">Join Game</h1>
          <p className="text-white/80">Enter the game code to join the fun!</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-center flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              {step === 'code' && 'Enter Game Code'}
              {step === 'passcode' && 'Enter Passcode'}
              {step === 'name' && 'Choose Your Name'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 'code' && (
              <>
                <div>
                  <Label htmlFor="gameCode" className="text-white">Game Code</Label>
                  <Input
                    id="gameCode"
                    value={gameCode}
                    onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-center text-2xl font-mono tracking-wider"
                    maxLength={6}
                  />
                  <p className="text-white/60 text-sm mt-2 text-center">
                    Get the code from your quiz host
                  </p>
                </div>
                <Button 
                  onClick={checkGameCode}
                  className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                  disabled={gameCode.length < 4}
                >
                  Find Game
                </Button>
              </>
            )}

            {step === 'passcode' && (
              <>
                <div className="text-center">
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                    <Lock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <p className="text-white text-sm">This game is protected with a passcode</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="passcode" className="text-white">Passcode</Label>
                  <Input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter passcode"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setStep('code')}
                    className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setStep('name')}
                    className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                    disabled={!passcode.trim()}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}

            {step === 'name' && (
              <>
                <div className="text-center">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                    <User className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-white text-sm">Game found! Choose your player name</p>
                  </div>
                </div>
                <div>
                  <Label htmlFor="playerName" className="text-white">Your Name</Label>
                  <Input
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    maxLength={20}
                  />
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setStep(requiresPasscode ? 'passcode' : 'code')}
                    className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={joinGame}
                    className="flex-1 bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                    disabled={!playerName.trim()}
                  >
                    Join Game!
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Code Entry */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm mb-3">Or scan QR code from host</p>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            {showQRScanner ? (
              <div className="animate-pulse">
                <div className="bg-white/20 h-40 w-40 mx-auto rounded-lg flex items-center justify-center">
                  <p className="text-white">Scanning...</p>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleQRCodeScan}
                className="bg-white/10 border-white/20 text-white flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Scan QR Code
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerJoin;
