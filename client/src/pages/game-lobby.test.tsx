import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GameLobby from './game-lobby';
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
  type: "game-lobby",
  gameId: 123,
  gameCode: "ABC123",
  playerId: 1,
  isHost: true,
  players: [
    { id: 1, name: "Player 1", avatar: "🥳", score: 0, isHost: true },
    { id: 2, name: "Player 2", avatar: "🤯", score: 0, isHost: false },
  ],
};

const defaultOnNavigate = jest.fn();

describe('Game Lobby Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render game lobby with title', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Game Lobby')))).toBeInTheDocument();
  });

  it.skip('should render game code', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/ABC123/i)).toBeInTheDocument();
  });

  it.skip('should render players list', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Player 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Player 2/i)).toBeInTheDocument();
  });

  it.skip('should render start game button for host', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const startButton = screen.getByRole('button', { name: /start game/i });
    expect(startButton).toBeInTheDocument();
  });

  it.skip('should handle start game button click', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const startButton = screen.getByRole('button', { name: /start game/i });
    fireEvent.click(startButton);

    expect(mockUseWebSocket.sendMessage).toHaveBeenCalledWith({
      type: 'start_game',
      gameId: 123,
    });
  });

  it.skip('should render back button', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it.skip('should handle back button click', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(defaultOnNavigate).toHaveBeenCalledWith({ type: "home" });
  });

  it.skip('should handle game started response', async () => {
    mockUseWebSocket.lastMessage = {
      type: 'game_started',
      gameId: 123,
    };

    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(defaultOnNavigate).toHaveBeenCalledWith({
        type: "gameplay",
        gameId: 123,
        gameCode: "ABC123",
        playerId: 1,
        isHost: true,
        currentQuestionIndex: 0,
        totalQuestions: 10,
        timeLimit: 30,
      });
    });
  });

  it.skip('should render with correct styling classes', () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const container = screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Game Lobby'))).closest('div');
    expect(container).toHaveClass('min-h-screen');
  });

  it.skip('should handle component unmount cleanup', () => {
    const { unmount } = render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(() => unmount()).not.toThrow();
  });

  it.skip('should not show start button for non-host players', () => {
    const nonHostGameState = {
      ...defaultGameState,
      isHost: false,
    };

    render(<GameLobby gameState={nonHostGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument();
  });

  it.skip('should handle empty players list', () => {
    const emptyPlayersGameState = {
      ...defaultGameState,
      players: [],
    };

    render(<GameLobby gameState={emptyPlayersGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/No players joined yet/i)).toBeInTheDocument();
  });

  it.skip('should handle connection status when disconnected', () => {
    mockUseWebSocket.isConnected = false;

    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Connecting to server/i)).toBeInTheDocument();
  });

  it.skip('should handle multiple start game attempts', async () => {
    render(<GameLobby gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const startButton = screen.getByRole('button', { name: /start game/i });
    
    fireEvent.click(startButton);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(mockUseWebSocket.sendMessage).toHaveBeenCalledTimes(2);
    });
  });
}); 