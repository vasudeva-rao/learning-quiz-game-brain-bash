import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useState } from "react";
import { GameState } from "@/lib/game-types";

import Home from "@/pages/home";
import HostDashboard from "@/pages/host-dashboard";
import JoinGame from "@/pages/join-game";
import GameLobby from "@/pages/game-lobby";
import Gameplay from "@/pages/gameplay";
import QuestionResults from "@/pages/question-results";
import Scoreboard from "@/pages/scoreboard";
import FinalResults from "@/pages/final-results";
import NotFound from "@/pages/not-found";

function Router() {
  const [gameState, setGameState] = useState<GameState>({ type: 'home' });

  const updateGameState = (newState: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...newState }));
  };

  switch (gameState.type) {
    case 'home':
      return <Home onNavigate={updateGameState} />;
    case 'host-dashboard':
      return <HostDashboard gameState={gameState} onNavigate={updateGameState} />;
    case 'join-game':
      return <JoinGame gameState={gameState} onNavigate={updateGameState} />;
    case 'game-lobby':
      return <GameLobby gameState={gameState} onNavigate={updateGameState} />;
    case 'gameplay':
      return <Gameplay gameState={gameState} onNavigate={updateGameState} />;
    case 'question-results':
      return <QuestionResults gameState={gameState} onNavigate={updateGameState} />;
    case 'scoreboard':
      return <Scoreboard gameState={gameState} onNavigate={updateGameState} />;
    case 'final-results':
      return <FinalResults gameState={gameState} onNavigate={updateGameState} />;
    default:
      return <NotFound />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
