
import { useState, useEffect, useCallback } from 'react';

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
  autoStartTimer: number;
}

export const useMultiplayerGame = (isHost: boolean, playerName: string) => {
  const [gameState, setGameState] = useState<GameState>({
    phase: 'lobby',
    currentQuestionIndex: 0,
    timeLeft: 10,
    players: [
      { id: '1', name: playerName, score: 0, status: 'active', hasAnswered: false },
    ],
    gameCode: 'QUIZ123',
    autoStartTimer: 10
  });

  // Simulate other players joining
  useEffect(() => {
    if (gameState.phase === 'lobby') {
      const mockPlayers = [
        { id: '2', name: 'Alice', score: 0, status: 'active' as const, hasAnswered: false },
        { id: '3', name: 'Bob', score: 0, status: 'active' as const, hasAnswered: false },
        { id: '4', name: 'Charlie', score: 0, status: 'active' as const, hasAnswered: false },
        { id: '5', name: 'Diana', score: 0, status: 'active' as const, hasAnswered: false },
      ];

      let playerIndex = 0;
      const interval = setInterval(() => {
        if (playerIndex < mockPlayers.length) {
          setGameState(prev => ({
            ...prev,
            players: [...prev.players, mockPlayers[playerIndex]]
          }));
          playerIndex++;
        } else {
          clearInterval(interval);
          // Start auto countdown when all players have joined
          const autoStartInterval = setInterval(() => {
            setGameState(prev => {
              if (prev.autoStartTimer <= 1) {
                clearInterval(autoStartInterval);
                return {
                  ...prev,
                  phase: 'question',
                  timeLeft: 10,
                  autoStartTimer: 0,
                  players: prev.players.map(p => ({ ...p, hasAnswered: false, isCorrect: undefined }))
                };
              }
              return {
                ...prev,
                autoStartTimer: prev.autoStartTimer - 1
              };
            });
          }, 1000);
        }
      }, 1500);

      return () => clearInterval(interval);
    }
  }, [gameState.phase]);

  // Handle question timer and auto-advance
  useEffect(() => {
    if (gameState.phase === 'question' && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);

      // Simulate random players answering
      if (Math.random() < 0.3) {
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => {
            if (p && p.name !== playerName && !p.hasAnswered && Math.random() < 0.4) {
              const isCorrect = Math.random() < 0.6;
              const points = isCorrect ? 100 + Math.floor(Math.random() * 50) : 0;
              return {
                ...p,
                hasAnswered: true,
                isCorrect,
                score: p.score + points
              };
            }
            return p;
          })
        }));
      }

      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.timeLeft, playerName]);

  // Handle results timer
  useEffect(() => {
    if (gameState.phase === 'results' && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [gameState.phase, gameState.timeLeft]);

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
