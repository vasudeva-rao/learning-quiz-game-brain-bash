import { useState, useCallback } from 'react';

interface Player {
  id: string;
  name: string;
  score: number;
  status: 'active' | 'left-early' | 'joined-late';
  hasAnswered: boolean;
  isCorrect?: boolean;
}

interface GameState {
  phase: 'lobby' | 'question' | 'results' | 'final';
  currentQuestionIndex: number;
  timeLeft: number;
  players: Player[];
  gameCode: string;
}

export const useMultiplayerGame = (isHost: boolean, playerName: string) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    currentQuestionIndex: 0,
    timeLeft: 10,
    players: [
      { id: '1', name: playerName, score: 0, status: 'active', hasAnswered: false },
    ],
    gameCode: 'QUIZ123'
  });

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'question',
      timeLeft: 10,
      players: prev.players.map(p => ({ ...p, hasAnswered: false, isCorrect: undefined }))
    }));
  }, []);

  const submitAnswer = useCallback((answer: string, isCorrect: boolean) => {
    const points = isCorrect ? 100 + (gameState.timeLeft * 10) : 0;
    
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p && p.name === playerName 
          ? { ...p, hasAnswered: true, isCorrect, score: p.score + points }
          : p
      )
    }));

    // Move to results after a short delay
    setTimeout(() => {
      setGameState(prev => ({ ...prev, phase: 'results', timeLeft: 5 }));
    }, 1000);
  }, [gameState.timeLeft, playerName]);

  const nextQuestion = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'question',
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      timeLeft: 10,
      players: prev.players.map(p => ({ ...p, hasAnswered: false, isCorrect: undefined }))
    }));
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'final' }));
  }, []);

  return {
    gameState,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame,
    setGamePhase: (phase: GameState['phase']) => setGameState(prev => ({ ...prev, phase }))
  };
};
