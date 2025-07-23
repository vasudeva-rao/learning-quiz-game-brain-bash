import * as React from 'react';
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
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import {
  Brain,
  Clock,
  LogOut,
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
  const { user, isAuthenticated, login, logout } = useAuth();

  useEffect(() => {
    document.title = "Brain Bash";
  }, []);

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
              {isAuthenticated ? (
                <Button
                  onClick={async () => {
                    await logout();
                  }}
                  className={`${
                    theme === 'original' 
                      ? 'bg-white text-purple-700 hover:bg-gray-100 border-2 border-white shadow-lg' 
                      : theme === 'light'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-400 shadow-lg'
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-2 border-gray-500 shadow-lg'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-400 shadow-lg'
                  } hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium`}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              ) : (
                <Button
                  onClick={login}
                  className={`${
                    theme === 'original' 
                      ? 'bg-white text-purple-700 hover:bg-gray-100 border-2 border-white shadow-lg' 
                      : theme === 'light'
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-400 shadow-lg'
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-2 border-gray-500 shadow-lg'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700 border-2 border-gray-400 shadow-lg'
                  } hover:shadow-xl transition-all duration-300 hover:scale-105 font-medium`}
                >
                  <UserCheck className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-12 animate-in fade-in duration-1000 ease-out">
            <h1 className={`text-5xl font-bold mb-4 ${theme === 'original' ? 'text-white' : 'text-foreground'} animate-in slide-in-from-top duration-1200 ease-out`}>
              Make Learning Fun!
            </h1>
            <p className={`text-xl mb-8 ${theme === 'original' ? 'text-white/90' : theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'} animate-in slide-in-from-bottom duration-1200 delay-300 ease-out`}>
              Create engaging quizzes and compete with friends in real-time
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Host Card */}
            <Card className="p-8 shadow-2xl transform hover:scale-[1.02] transition-all duration-700 ease-out bg-card flex flex-col animate-in slide-in-from-left duration-1000 delay-500 ease-out hover:shadow-3xl">
              <div className="text-center flex-grow">
                <div className={`${
                  theme === 'light' 
                    ? 'bg-gray-400 text-white' 
                    : theme === 'dark'
                    ? 'bg-gray-600 text-gray-200'
                    : 'bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white shadow-xl'
                } w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ease-out hover:scale-110 hover:rotate-12`}>
                  <UserCheck className="text-2xl transition-transform duration-500 ease-out" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 transition-colors duration-500 ease-out">
                  I'm a Host
                </h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'} mb-6 transition-colors duration-500 ease-out`}>
                  Create and manage quiz games for your students or team
                </p>
              </div>
              <div className="mt-auto">
                <Button
                  onClick={async () => {
                    if (isAuthenticated) {
                      onNavigate({ type: "host-dashboard" });
                    } else {
                      await login();
                      // After login redirect, the user will be redirected back and can try again
                    }
                  }}
                  className={`w-full ${
                    theme === 'light' 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300' 
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                      : 'bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-400 hover:via-red-400 hover:to-orange-400 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                  } hover:shadow-lg transition-all duration-500 ease-out text-lg py-3 hover:-translate-y-2`}
                >
                  Create Game
                </Button>
              </div>
            </Card>

            {/* Player Card */}
            <Card className="p-8 shadow-2xl transform hover:scale-[1.02] transition-all duration-700 ease-out bg-card flex flex-col animate-in slide-in-from-right duration-1000 delay-500 ease-out hover:shadow-3xl">
              <div className="text-center flex-grow">
                <div className={`${
                  theme === 'light' 
                    ? 'bg-gray-400 text-white' 
                    : theme === 'dark'
                    ? 'bg-gray-600 text-gray-200'
                    : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl'
                } w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-500 ease-out hover:scale-110 hover:rotate-12`}>
                  <Users className="text-2xl transition-transform duration-500 ease-out" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4 transition-colors duration-500 ease-out">
                  I'm a Player
                </h3>
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'} mb-6 transition-colors duration-500 ease-out`}>
                  Join an existing game with a room code
                </p>
              </div>
              <div className="mt-auto">
                <Button
                  onClick={() => onNavigate({ type: "join-game" })}
                  className={`w-full ${
                    theme === 'light' 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300' 
                      : theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 hover:from-emerald-400 hover:via-teal-400 hover:to-blue-400 text-white shadow-xl hover:shadow-2xl transform hover:scale-105'
                  } hover:shadow-lg transition-all duration-500 ease-out text-lg py-3 hover:-translate-y-2`}
                >
                  Join Game
                </Button>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className={`text-center p-8 rounded-2xl ${
              theme === 'original' 
                ? 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl hover:bg-white/15 hover:shadow-2xl' 
                : theme === 'dark'
                ? 'bg-gray-800/50 border border-gray-600/30 shadow-xl hover:bg-gray-700/50'
                : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
            } transition-all duration-700 ease-out hover:scale-[1.03] animate-in slide-in-from-bottom duration-1200 delay-700 ease-out hover:-translate-y-3`}>
              <Clock className={`text-5xl mb-6 mx-auto ${
                theme === 'original' ? 'text-yellow-300' : 'text-yellow-400'
              } transition-all duration-600 ease-out hover:scale-125 hover:rotate-[15deg]`} />
              <h4 className={`text-xl font-semibold mb-4 ${theme === 'original' ? 'text-white' : 'text-foreground'} transition-colors duration-500 ease-out`}>
                Real-time Competition
              </h4>
              <p className={`${theme === 'original' ? 'text-white/90' : theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'} transition-colors duration-500 ease-out`}>
                Compete against others with timed questions and live scoring
              </p>
            </div>
            <div className={`text-center p-8 rounded-2xl ${
              theme === 'original' 
                ? 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl hover:bg-white/15 hover:shadow-2xl' 
                : theme === 'dark'
                ? 'bg-gray-800/50 border border-gray-600/30 shadow-xl hover:bg-gray-700/50'
                : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
            } transition-all duration-700 ease-out hover:scale-[1.03] animate-in slide-in-from-bottom duration-1200 delay-900 ease-out hover:-translate-y-3`}>
              <Smartphone className={`text-5xl mb-6 mx-auto ${
                theme === 'original' ? 'text-blue-300' : 'text-blue-400'
              } transition-all duration-600 ease-out hover:scale-125 hover:rotate-[15deg]`} />
              <h4 className={`text-xl font-semibold mb-4 ${theme === 'original' ? 'text-white' : 'text-foreground'} transition-colors duration-500 ease-out`}>Mobile Friendly</h4>
              <p className={`${theme === 'original' ? 'text-white/90' : theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'} transition-colors duration-500 ease-out`}>
                Play seamlessly on any device - desktop, tablet, or phone
              </p>
            </div>
            <div className={`text-center p-8 rounded-2xl ${
              theme === 'original' 
                ? 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl hover:bg-white/15 hover:shadow-2xl' 
                : theme === 'dark'
                ? 'bg-gray-800/50 border border-gray-600/30 shadow-xl hover:bg-gray-700/50'
                : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl'
            } transition-all duration-700 ease-out hover:scale-[1.03] animate-in slide-in-from-bottom duration-1200 delay-1100 ease-out hover:-translate-y-3`}>
              <Trophy className={`text-5xl mb-6 mx-auto ${
                theme === 'original' ? 'text-purple-300' : 'text-purple-400'
              } transition-all duration-600 ease-out hover:scale-125 hover:rotate-[15deg]`} />
              <h4 className={`text-xl font-semibold mb-4 ${theme === 'original' ? 'text-white' : 'text-foreground'} transition-colors duration-500 ease-out`}>Engaging Gameplay</h4>
              <p className={`${theme === 'original' ? 'text-white/90' : theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'} transition-colors duration-500 ease-out`}>
                Points for correct answers and speed with live leaderboards
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}