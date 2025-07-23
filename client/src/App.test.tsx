import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { GameState } from '@/lib/game-types';

// Mock all page components
jest.mock('@/pages/home', () => {
  return function MockHome({ onNavigate }: { onNavigate: (state: Partial<GameState>) => void }) {
    return (
      <div data-testid="home-page">
        <button onClick={() => onNavigate({ type: 'host-dashboard' })}>
          Go to Host Dashboard
        </button>
        <button onClick={() => onNavigate({ type: 'join-game' })}>
          Join Game
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/host-dashboard', () => {
  return function MockHostDashboard({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="host-dashboard">
        <span>Game ID: {gameState.gameId}</span>
        <button onClick={() => onNavigate({ type: 'game-lobby', gameId: 123 })}>
          Start Game
        </button>
        <button onClick={() => onNavigate({ type: 'home' })}>
          Back to Home
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/join-game', () => {
  return function MockJoinGame({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="join-game">
        <button onClick={() => onNavigate({ type: 'game-lobby', gameCode: 'ABC123' })}>
          Join with Code
        </button>
        <button onClick={() => onNavigate({ type: 'home' })}>
          Back to Home
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/game-lobby', () => {
  return function MockGameLobby({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="game-lobby">
        <span>Game Code: {gameState.gameCode}</span>
        <span>Game ID: {gameState.gameId}</span>
        <button onClick={() => onNavigate({ type: 'gameplay', currentQuestionIndex: 0 })}>
          Start Gameplay
        </button>
        <button onClick={() => onNavigate({ type: 'home' })}>
          Leave Game
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/gameplay', () => {
  return function MockGameplay({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="gameplay">
        <span>Question Index: {gameState.currentQuestionIndex}</span>
        <button onClick={() => onNavigate({ type: 'question-results' })}>
          Show Results
        </button>
        <button onClick={() => onNavigate({ type: 'scoreboard' })}>
          Show Scoreboard
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/question-results', () => {
  return function MockQuestionResults({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="question-results">
        <button onClick={() => onNavigate({ type: 'gameplay', currentQuestionIndex: (gameState.currentQuestionIndex || 0) + 1 })}>
          Next Question
        </button>
        <button onClick={() => onNavigate({ type: 'final-results' })}>
          End Game
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/scoreboard', () => {
  return function MockScoreboard({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="scoreboard">
        <button onClick={() => onNavigate({ type: 'gameplay' })}>
          Continue Game
        </button>
        <button onClick={() => onNavigate({ type: 'final-results' })}>
          End Game
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/final-results', () => {
  return function MockFinalResults({ 
    gameState, 
    onNavigate 
  }: { 
    gameState: GameState; 
    onNavigate: (state: Partial<GameState>) => void 
  }) {
    return (
      <div data-testid="final-results">
        <button onClick={() => onNavigate({ type: 'home' })}>
          Back to Home
        </button>
      </div>
    );
  };
});

jest.mock('@/pages/not-found', () => {
  return function MockNotFound() {
    return <div data-testid="not-found">Page Not Found</div>;
  };
});

// Mock providers
jest.mock('@/hooks/use-auth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>,
}));

jest.mock('@/hooks/use-websocket', () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="websocket-provider">{children}</div>,
}));

jest.mock('@/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
}));

jest.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-client-provider">{children}</div>,
  QueryClient: function QueryClient() { return {}; },
}));

describe('App', () => {
  it('should render with all providers', () => {
    render(<App />);

    expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-provider')).toBeInTheDocument();
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  it('should start with home page', () => {
    render(<App />);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('should navigate from home to host dashboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);

    expect(screen.getByTestId('host-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('should navigate from home to join game', async () => {
    const user = userEvent.setup();
    render(<App />);

    const joinButton = screen.getByText('Join Game');
    await user.click(joinButton);

    expect(screen.getByTestId('join-game')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });

  it('should navigate from host dashboard to game lobby', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to host dashboard first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);

    // Navigate to game lobby
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);

    expect(screen.getByTestId('game-lobby')).toBeInTheDocument();
    expect(screen.getByText('Game ID: 123')).toBeInTheDocument();
    expect(screen.queryByTestId('host-dashboard')).not.toBeInTheDocument();
  });

  it('should navigate from host dashboard back to home', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to host dashboard first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);

    // Navigate back to home
    const backButton = screen.getByText('Back to Home');
    await user.click(backButton);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('host-dashboard')).not.toBeInTheDocument();
  });

  it('should navigate from join game to game lobby', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to join game first
    const joinButton = screen.getByText('Join Game');
    await user.click(joinButton);

    // Navigate to game lobby
    const joinCodeButton = screen.getByText('Join with Code');
    await user.click(joinCodeButton);

    expect(screen.getByTestId('game-lobby')).toBeInTheDocument();
    expect(screen.getByText('Game Code: ABC123')).toBeInTheDocument();
    expect(screen.queryByTestId('join-game')).not.toBeInTheDocument();
  });

  it('should navigate from join game back to home', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to join game first
    const joinButton = screen.getByText('Join Game');
    await user.click(joinButton);

    // Navigate back to home
    const backButton = screen.getByText('Back to Home');
    await user.click(backButton);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('join-game')).not.toBeInTheDocument();
  });

  it('should navigate from game lobby to gameplay', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to game lobby first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);

    // Navigate to gameplay
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);

    expect(screen.getByTestId('gameplay')).toBeInTheDocument();
    expect(screen.getByText('Question Index: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('game-lobby')).not.toBeInTheDocument();
  });

  it('should navigate from game lobby back to home', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to game lobby first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);

    // Navigate back to home
    const leaveButton = screen.getByText('Leave Game');
    await user.click(leaveButton);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('game-lobby')).not.toBeInTheDocument();
  });

  it('should navigate from gameplay to question results', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to gameplay first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);

    // Navigate to question results
    const resultsButton = screen.getByText('Show Results');
    await user.click(resultsButton);

    expect(screen.getByTestId('question-results')).toBeInTheDocument();
    expect(screen.queryByTestId('gameplay')).not.toBeInTheDocument();
  });

  it('should navigate from gameplay to scoreboard', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to gameplay first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);

    // Navigate to scoreboard
    const scoreboardButton = screen.getByText('Show Scoreboard');
    await user.click(scoreboardButton);

    expect(screen.getByTestId('scoreboard')).toBeInTheDocument();
    expect(screen.queryByTestId('gameplay')).not.toBeInTheDocument();
  });

  it('should navigate from question results to next question', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to question results first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);
    const resultsButton = screen.getByText('Show Results');
    await user.click(resultsButton);

    // Navigate to next question
    const nextButton = screen.getByText('Next Question');
    await user.click(nextButton);

    expect(screen.getByTestId('gameplay')).toBeInTheDocument();
    expect(screen.getByText('Question Index: 1')).toBeInTheDocument();
    expect(screen.queryByTestId('question-results')).not.toBeInTheDocument();
  });

  it('should navigate from question results to final results', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to question results first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);
    const resultsButton = screen.getByText('Show Results');
    await user.click(resultsButton);

    // Navigate to final results
    const endButton = screen.getByText('End Game');
    await user.click(endButton);

    expect(screen.getByTestId('final-results')).toBeInTheDocument();
    expect(screen.queryByTestId('question-results')).not.toBeInTheDocument();
  });

  it('should navigate from scoreboard to gameplay', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to scoreboard first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);
    const scoreboardButton = screen.getByText('Show Scoreboard');
    await user.click(scoreboardButton);

    // Navigate back to gameplay
    const continueButton = screen.getByText('Continue Game');
    await user.click(continueButton);

    expect(screen.getByTestId('gameplay')).toBeInTheDocument();
    expect(screen.queryByTestId('scoreboard')).not.toBeInTheDocument();
  });

  it('should navigate from scoreboard to final results', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to scoreboard first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);
    const scoreboardButton = screen.getByText('Show Scoreboard');
    await user.click(scoreboardButton);

    // Navigate to final results
    const endButton = screen.getByText('End Game');
    await user.click(endButton);

    expect(screen.getByTestId('final-results')).toBeInTheDocument();
    expect(screen.queryByTestId('scoreboard')).not.toBeInTheDocument();
  });

  it('should navigate from final results back to home', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to final results first
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);
    const resultsButton = screen.getByText('Show Results');
    await user.click(resultsButton);
    const endButton = screen.getByText('End Game');
    await user.click(endButton);

    // Navigate back to home
    const homeButton = screen.getByText('Back to Home');
    await user.click(homeButton);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('final-results')).not.toBeInTheDocument();
  });

  it('should preserve state when navigating between pages', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Navigate to host dashboard and set game ID
    const hostButton = screen.getByText('Go to Host Dashboard');
    await user.click(hostButton);
    const startButton = screen.getByText('Start Game');
    await user.click(startButton);

    // Verify game ID is preserved
    expect(screen.getByText('Game ID: 123')).toBeInTheDocument();

    // Navigate to gameplay and verify question index
    const gameplayButton = screen.getByText('Start Gameplay');
    await user.click(gameplayButton);
    expect(screen.getByText('Question Index: 0')).toBeInTheDocument();

    // Navigate to question results and back to verify state is preserved
    const resultsButton = screen.getByText('Show Results');
    await user.click(resultsButton);
    const nextButton = screen.getByText('Next Question');
    await user.click(nextButton);

    expect(screen.getByText('Question Index: 1')).toBeInTheDocument();
  });
}); 