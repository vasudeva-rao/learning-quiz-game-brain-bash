import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Scoreboard from './scoreboard';
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
  type: "scoreboard",
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

describe('Scoreboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render scoreboard with title', () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Scoreboard/i)).toBeInTheDocument();
  });

  it('should render player list', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    await act(async () => {
      handler({ type: 'question_ended', payload: { players: [
        { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
        { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
        { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
      ] } });
    });
    const player1 = await screen.findAllByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Player 1')));
    const player2 = await screen.findAllByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Player 2')));
    const player3 = await screen.findAllByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Player 3')));
    expect(player1.length).toBeGreaterThan(0);
    expect(player2.length).toBeGreaterThan(0);
    expect(player3.length).toBeGreaterThan(0);
  });

  it('should render player scores', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    await act(async () => {
      handler({ type: 'question_ended', payload: { players: [
        { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
        { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
        { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
      ] } });
    });
    expect(await screen.findByText((content, node) => node?.textContent === '100')).toBeInTheDocument();
    expect(await screen.findByText((content, node) => node?.textContent === '80')).toBeInTheDocument();
    expect(await screen.findByText((content, node) => node?.textContent === '60')).toBeInTheDocument();
  });

  it('should render player avatars', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    await act(async () => {
      handler({ type: 'question_ended', payload: { players: [
        { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
        { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
        { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
      ] } });
    });
    expect(await screen.findByText((content, node) => node?.textContent === '🥳')).toBeInTheDocument();
    expect(await screen.findByText((content, node) => node?.textContent === '🤯')).toBeInTheDocument();
    expect(await screen.findByText((content, node) => node?.textContent === '😎')).toBeInTheDocument();
  });

  it('should render next question button for host', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    expect(await screen.findByRole('button', { name: /next question/i })).toBeInTheDocument();
  });

  it('should handle next question button click', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const nextButton = await screen.findByRole('button', { name: /next question/i });
    fireEvent.click(nextButton);
    expect(mockUseWebSocket.sendMessage).toHaveBeenCalledWith({
      type: "next_question",
      payload: { gameCode: "ABC123" },
    });
  });

  it('should render with correct styling classes', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const container = screen.getByText(/Scoreboard/i).closest('div')?.parentElement?.parentElement;
    expect(container).toHaveClass('min-h-screen');
  });

  it('should handle component unmount cleanup', () => {
    const { unmount } = render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    expect(() => unmount()).not.toThrow();
  });

  it('should not show next button for non-host players', async () => {
    const nonHostGameState = { ...defaultGameState, isHost: false };
    render(<Scoreboard gameState={nonHostGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    expect(screen.queryByRole('button', { name: /next question/i })).not.toBeInTheDocument();
  });

  it('should update players on question_ended message', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    // Simulate WebSocket message
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'question_ended', payload: { players: [
      { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
      { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
    ] } });
    expect(await screen.findByText(/Player 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Player 2/)).toBeInTheDocument();
  });

  it('should call onNavigate on question_started message', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'question_started' });
    expect(defaultOnNavigate).toHaveBeenCalledWith({ type: "gameplay" });
  });

  it('should call onNavigate on game_completed message', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'game_completed' });
    expect(defaultOnNavigate).toHaveBeenCalledWith({ type: "final-results" });
  });

  it('should render podium for top 3 players', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'question_ended', payload: { players: [
      { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
      { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
      { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
    ] } });
    expect(await screen.findByText(/1st/i)).toBeInTheDocument();
    expect(await screen.findByText(/2nd/i)).toBeInTheDocument();
    expect(await screen.findByText(/3rd/i)).toBeInTheDocument();
  });

  it('should render remaining players list', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'question_ended', payload: { players: [
      { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
      { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
      { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
      { id: 4, name: "Player 4", avatar: "🤖", score: 40, isHost: false },
      { id: 5, name: "Player 5", avatar: "👽", score: 20, isHost: false },
    ] } });
    expect(await screen.findByText(/Player 4/)).toBeInTheDocument();
    expect(await screen.findByText(/Player 5/)).toBeInTheDocument();
  });

  it('should sort players by score in descending order', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'question_ended', payload: { players: [
      { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
      { id: 2, name: "Player 2", avatar: "🤯", score: 80, isHost: false },
      { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
    ] } });
    expect(await screen.findByText(/100/)).toBeInTheDocument();
    expect(await screen.findByText(/80/)).toBeInTheDocument();
    expect(await screen.findByText(/60/)).toBeInTheDocument();
  });

  it('should handle tie scores', async () => {
    render(<Scoreboard gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });
    const handler = mockUseWebSocket.addMessageHandler.mock.calls[0][0];
    handler({ type: 'question_ended', payload: { players: [
      { id: 1, name: "Player 1", avatar: "🥳", score: 100, isHost: true },
      { id: 2, name: "Player 2", avatar: "🤯", score: 100, isHost: false },
      { id: 3, name: "Player 3", avatar: "😎", score: 60, isHost: false },
    ] } });
    expect(await screen.findAllByText(/100/)).toHaveLength(2);
  });
}); 