import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FinalResults from './final-results';
import { GameState } from '../lib/game-types';
import { ThemeProvider } from '../components/theme-provider';

Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_BACKEND_HOST: 'localhost',
        VITE_BACKEND_PORT: '5000',
      }
    }
  },
  configurable: true,
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
};

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock useWebSocket hook
const mockUseWebSocket = {
  isConnected: true,
  sendMessage: jest.fn(),
  lastMessage: null as any,
  addMessageHandler: jest.fn(),
  removeMessageHandler: jest.fn(),
  connect: jest.fn(),
};

jest.mock('@/hooks/use-websocket', () => ({
  useWebSocket: () => mockUseWebSocket,
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const defaultGameState: GameState = {
  type: "final-results",
  gameId: 123,
  gameCode: "ABC123",
  playerId: 1,
  isHost: true,
  players: [
    { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
    { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
    { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
  ],
};

const defaultOnNavigate = jest.fn();

describe('Final Results Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render final results with title', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Final Results/i)).toBeInTheDocument();
  });

  it.skip('should render winner announcement', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Winner/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 1/i)).toBeInTheDocument();
  });

  it.skip('should render final player rankings', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Player 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 3/i)).toBeInTheDocument();
  });

  it.skip('should render final scores', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/100/i)).toBeInTheDocument();
    expect(screen.getByText(/80/i)).toBeInTheDocument();
    expect(screen.getByText(/60/i)).toBeInTheDocument();
  });

  it.skip('should render player avatars', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/🥳/i)).toBeInTheDocument();
    expect(screen.getByText(/🤯/i)).toBeInTheDocument();
    expect(screen.getByText(/😎/i)).toBeInTheDocument();
  });

  it.skip('should render play again button for host', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const playAgainButton = screen.getByRole('button', { name: /play again/i });
    expect(playAgainButton).toBeInTheDocument();
  });

  it.skip('should handle play again button click', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const playAgainButton = screen.getByRole('button', { name: /play again/i });
    fireEvent.click(playAgainButton);

    expect(mockUseWebSocket.sendMessage).toHaveBeenCalledWith({
      type: 'play_again',
      gameId: 123,
    });
  });

  it.skip('should render home button', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const homeButton = screen.getByRole('button', { name: /home/i });
    expect(homeButton).toBeInTheDocument();
  });

  it.skip('should handle home button click', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const homeButton = screen.getByRole('button', { name: /home/i });
    fireEvent.click(homeButton);

    expect(defaultOnNavigate).toHaveBeenCalledWith({ type: "home" });
  });

  it.skip('should handle play again response', async () => {
    mockUseWebSocket.lastMessage = {
      type: 'play_again',
      gameId: 123,
    };

    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(defaultOnNavigate).toHaveBeenCalledWith({
        type: "game-lobby",
        gameId: 123,
        gameCode: "ABC123",
        playerId: 1,
        isHost: true,
      });
    });
  });

  it.skip('should render with correct styling classes', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const container = screen.getByText(/Final Results/i).closest('div');
    expect(container).toHaveClass('min-h-screen');
  });

  it.skip('should handle component unmount cleanup', () => {
    const { unmount } = render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(() => unmount()).not.toThrow();
  });

  it.skip('should not show play again button for non-host players', () => {
    const nonHostGameState = {
      ...defaultGameState,
      isHost: false,
    };

    render(<FinalResults gameState={nonHostGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.queryByRole('button', { name: /play again/i })).not.toBeInTheDocument();
  });

  it.skip('should handle empty players list', () => {
    const emptyPlayersGameState = {
      ...defaultGameState,
      players: [],
    };

    render(<FinalResults gameState={emptyPlayersGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/No players/i)).toBeInTheDocument();
  });

  it.skip('should handle connection status when disconnected', () => {
    mockUseWebSocket.isConnected = false;

    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Connecting to server/i)).toBeInTheDocument();
  });

  it.skip('should handle tie for first place', () => {
    const tieGameState = {
      ...defaultGameState,
      players: [
        { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
        { id: 2, name: "Player 2", avatar: "🤯", score: 100, isHost: false },
        { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
      ],
    };

    render(<FinalResults gameState={tieGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Tie/i)).toBeInTheDocument();
  });

  it.skip('should sort players by score in descending order', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const playerElements = screen.getAllByText(/Player \d/i);
    expect(playerElements[0]).toHaveTextContent('Player 1'); // 100 points
    expect(playerElements[1]).toHaveTextContent('Player 2'); // 80 points
    expect(playerElements[2]).toHaveTextContent('Player 3'); // 60 points
  });

  it.skip('should display game statistics', () => {
    render(<FinalResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Game Statistics/i)).toBeInTheDocument();
  });
}); 