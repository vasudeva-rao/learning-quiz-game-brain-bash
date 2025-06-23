import { ThemeSwitcher } from "@/components/theme-switcher";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameState } from "@/lib/game-types";
import {
  Brain,
  Clock,
  Palette,
  Smartphone,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";

interface HomeProps {
  onNavigate: (state: Partial<GameState>) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { theme, setTheme } = useTheme();

  const getBackgroundClass = () => {
    if (theme === "original") {
      return "bg-gradient-to-br from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)]";
    }
    return "bg-background";
  };
  
  const getTextColorClass = (baseClass = 'text-white') => {
    if (theme === "original") {
      return baseClass;
    }
    return "text-foreground";
  };
  
  const getMutedTextColorClass = (baseClass = 'text-purple-100') => {
    if (theme === "original") {
      return baseClass;
    }
    return "text-muted-foreground";
  };

  return (
    <div className={`min-h-screen ${getBackgroundClass()}`}>
      {/* Navigation */}
      <nav className="bg-card shadow-lg border-b-4 border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Brain className="text-primary text-2xl" />
              <span className="text-2xl font-bold text-foreground">
                Brain Bash
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeSwitcher />
              <Button
                onClick={() => onNavigate({ type: "host-dashboard" })}
                className="bg-quiz-green text-white hover:bg-green-600"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Create Game
              </Button>
              <Button
                onClick={() => onNavigate({ type: "join-game" })}
                className="bg-quiz-blue text-white hover:bg-blue-600"
              >
                <Users className="w-4 h-4 mr-2" />
                Join Game
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className={`text-5xl font-bold ${getTextColorClass()} mb-4`}>
              Make Learning Fun!
            </h1>
            <p className={`text-xl ${getMutedTextColorClass()} mb-8`}>
              Create engaging quizzes and compete with friends in real-time
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Host Card */}
            <Card className="p-8 shadow-2xl transform hover:scale-105 transition-transform bg-card">
              <div className="text-center">
                <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  I'm a Host
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create and manage quiz games for your students or team
                </p>
                <Button
                  onClick={() => onNavigate({ type: "host-dashboard" })}
                  className="w-full bg-gradient-to-r from-[hsl(271,81%,66%)] to-[hsl(217,91%,60%)] text-white hover:shadow-lg transition-shadow text-lg py-3"
                >
                  Create Game
                </Button>
              </div>
            </Card>

            {/* Player Card */}
            <Card className="p-8 shadow-2xl transform hover:scale-105 transition-transform bg-card">
              <div className="text-center">
                <div className="bg-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  I'm a Player
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join an existing game with a room code
                </p>
                <Button
                  onClick={() => onNavigate({ type: "join-game" })}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-lg transition-shadow text-lg py-3"
                >
                  Join Game
                </Button>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className={`text-center ${getTextColorClass('text-white')}`}>
              <Clock className="text-4xl text-yellow-400 mb-4 mx-auto" />
              <h4 className="text-xl font-semibold mb-2">
                Real-time Competition
              </h4>
              <p className={getMutedTextColorClass('text-purple-100')}>
                Compete against others with timed questions and live scoring
              </p>
            </div>
            <div className={`text-center ${getTextColorClass('text-white')}`}>
              <Smartphone className="text-4xl text-yellow-400 mb-4 mx-auto" />
              <h4 className="text-xl font-semibold mb-2">Mobile Friendly</h4>
              <p className={getMutedTextColorClass('text-purple-100')}>
                Play seamlessly on any device - desktop, tablet, or phone
              </p>
            </div>
            <div className={`text-center ${getTextColorClass('text-white')}`}>
              <Trophy className="text-4xl text-yellow-400 mb-4 mx-auto" />
              <h4 className="text-xl font-semibold mb-2">Engaging Gameplay</h4>
              <p className={getMutedTextColorClass('text-purple-100')}>
                Points for correct answers and speed with live leaderboards
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
