import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Gameplay from './gameplay';
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
  type: "gameplay",
  gameId: 123,
  gameCode: "ABC123",
  playerId: 1,
  isHost: true,
  currentQuestionIndex: 0,
  totalQuestions: 10,
  timeLimit: 30,
  question: {
    id: 1,
    questionText: "What is 2 + 2?",
    questionType: "multiple_choice" as const,
    answers: ["3", "4", "5", "6"],
    correctAnswerIndex: 1,
    questionOrder: 1,
  },
};

const defaultOnNavigate = jest.fn();

describe('Gameplay Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render gameplay with question', () => {
    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('What is 2 + 2?')))).toBeInTheDocument();
  });

  it.skip('should render answer options', () => {
    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/3/i)).toBeInTheDocument();
    expect(screen.getByText(/4/i)).toBeInTheDocument();
    expect(screen.getByText(/5/i)).toBeInTheDocument();
    expect(screen.getByText(/6/i)).toBeInTheDocument();
  });

  it.skip('should handle answer selection', () => {
    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const answerButton = screen.getByText(/4/i);
    fireEvent.click(answerButton);

    expect(mockUseWebSocket.sendMessage).toHaveBeenCalledWith({
      type: 'submit_answer',
      gameId: 123,
      playerId: 1,
      answerIndex: 1,
    });
  });

  it.skip('should render timer', () => {
    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/30/i)).toBeInTheDocument();
  });

  it.skip('should render question progress', () => {
    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Question 1 of 10/i)).toBeInTheDocument();
  });

  it.skip('should handle question timeout', async () => {
    jest.useFakeTimers();

    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    // Fast-forward time to trigger timeout
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(mockUseWebSocket.sendMessage).toHaveBeenCalledWith({
        type: 'question_timeout',
        gameId: 123,
        playerId: 1,
      });
    });

    jest.useRealTimers();
  });

  it.skip('should handle next question response', async () => {
    mockUseWebSocket.lastMessage = {
      type: 'next_question',
      question: {
        id: 2,
        questionText: "What is 3 + 3?",
        questionType: "multiple_choice" as const,
        answers: ["5", "6", "7", "8"],
        correctAnswerIndex: 1,
        questionOrder: 2,
      },
      currentQuestionIndex: 1,
    };

    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('What is 3 + 3?')))).toBeInTheDocument();
    });
  });

  it.skip('should handle game end response', async () => {
    mockUseWebSocket.lastMessage = {
      type: 'game_end',
      gameId: 123,
    };

    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(defaultOnNavigate).toHaveBeenCalledWith({
        type: "final-results",
        gameId: 123,
        gameCode: "ABC123",
        playerId: 1,
        isHost: true,
      });
    });
  });

  it.skip('should render with correct styling classes', () => {
    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const container = screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('What is 2 + 2?'))).closest('div');
    expect(container).toHaveClass('min-h-screen');
  });

  it.skip('should handle component unmount cleanup', () => {
    const { unmount } = render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(() => unmount()).not.toThrow();
  });

  it.skip('should handle true/false question type', () => {
    const trueFalseGameState = {
      ...defaultGameState,
      question: {
        id: 1,
        questionText: "Is the sky blue?",
        questionType: "true_false" as const,
        answers: ["True", "False"],
        correctAnswerIndex: 0,
        questionOrder: 1,
      },
    };

    render(<Gameplay gameState={trueFalseGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/True/i)).toBeInTheDocument();
    expect(screen.getByText(/False/i)).toBeInTheDocument();
  });

  it.skip('should handle multi-select question type', () => {
    const multiSelectGameState = {
      ...defaultGameState,
      question: {
        id: 1,
        questionText: "Select all even numbers",
        questionType: "multi_select" as const,
        answers: ["2", "3", "4", "5"],
        correctAnswerIndices: [0, 2],
        questionOrder: 1,
      },
    };

    render(<Gameplay gameState={multiSelectGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/2/i)).toBeInTheDocument();
    expect(screen.getByText(/3/i)).toBeInTheDocument();
    expect(screen.getByText(/4/i)).toBeInTheDocument();
    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });

  it.skip('should handle connection status when disconnected', () => {
    mockUseWebSocket.isConnected = false;

    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Connecting to server/i)).toBeInTheDocument();
  });

  it.skip('should handle answer submission error', async () => {
    mockUseWebSocket.sendMessage.mockRejectedValueOnce(new Error('Network error'));

    render(<Gameplay gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const answerButton = screen.getByText(/4/i);
    fireEvent.click(answerButton);

    await waitFor(() => {
      expect(mockUseWebSocket.sendMessage).toHaveBeenCalled();
    });
  });
}); 