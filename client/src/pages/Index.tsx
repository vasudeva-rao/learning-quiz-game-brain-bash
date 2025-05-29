import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trophy, Clock, Star, Settings } from "lucide-react";
import HostDashboard from "@/components/HostDashboard";
import PlayerJoin from "@/components/PlayerJoin";

const Index = () => {
  const [mode, setMode] = useState<"home" | "host" | "player">("home");

  if (mode === "host") {
    return <HostDashboard onBack={() => setMode("home")} />;
  }

  if (mode === "player") {
    return <PlayerJoin onBack={() => setMode("home")} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Brain Bash
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Create engaging quizzes and compete with friends! Test your
            knowledge in real-time battles.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Host a Game */}
          <Card
            className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
            onClick={() => setMode("host")}
          >
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-orange-400 to-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Host a Game
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Create custom quizzes with multiple question types. Control the
                pace and watch players compete in real-time.
              </p>
              <Button className="mt-6 bg-white/20 hover:bg-white/30 text-white">
                Create Quiz
              </Button>
            </CardContent>
          </Card>

          {/* Join a Game */}
          <Card
            className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20"
            onClick={() => setMode("player")}
          >
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-to-r from-green-400 to-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Join a Game
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Enter a game code to join the fun! Compete against other players
                and climb the leaderboard.
              </p>
              <Button className="mt-6 bg-white/20 hover:bg-white/30 text-white">
                Join Now
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Competitive Scoring
            </h3>
            <p className="text-white/70">
              Points for correct answers plus speed bonuses!
            </p>
          </div>
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Real-time Sync
            </h3>
            <p className="text-white/70">
              All players see questions simultaneously
            </p>
          </div>
          <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300">
            <Users className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Multiplayer Fun
            </h3>
            <p className="text-white/70">
              Support for 100+ players in one game
            </p>
          </div>
        </div>

        {/* New Call to Action */}
        <div className="mt-12 text-center animate-fade-in">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
            <Star className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-white/80 text-lg mb-6 max-w-lg mx-auto">
              Create your first quiz or join an existing game. It's free and
              takes only a minute!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setMode("host")}
                className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600"
              >
                <Settings className="w-5 h-5 mr-2" />
                Create Quiz
              </Button>
              <Button
                size="lg"
                onClick={() => setMode("player")}
                className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
              >
                <Users className="w-5 h-5 mr-2" />
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
