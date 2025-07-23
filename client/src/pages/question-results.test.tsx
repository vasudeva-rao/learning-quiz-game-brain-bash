import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuestionResults from './question-results';
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
  type: "question-results",
  gameId: 123,
  gameCode: "ABC123",
  playerId: 1,
  isHost: true,
  currentQuestionIndex: 0,
  totalQuestions: 10,
  question: {
    id: 1,
    questionText: "What is 2 + 2?",
    questionType: "multiple_choice",
    answers: ["3", "4", "5", "6"],
    correctAnswerIndex: 1,
    questionOrder: 1,
  },
  answerBreakdown: [
    { answerIndex: 0, count: 2 },
    { answerIndex: 1, count: 8 },
    { answerIndex: 2, count: 1 },
    { answerIndex: 3, count: 0 },
  ],
};

const defaultOnNavigate = jest.fn();

describe('Question Results Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render question results with title', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Question Results')))).toBeInTheDocument();
  });

  it.skip('should render question text', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/What is 2 \+ 2\?/i)).toBeInTheDocument();
  });

  it.skip('should render answer breakdown', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/3/i)).toBeInTheDocument();
    expect(screen.getByText(/4/i)).toBeInTheDocument();
    expect(screen.getByText(/5/i)).toBeInTheDocument();
    expect(screen.getByText(/6/i)).toBeInTheDocument();
  });

  it.skip('should render answer counts', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/2/i)).toBeInTheDocument();
    expect(screen.getByText(/8/i)).toBeInTheDocument();
    expect(screen.getByText(/1/i)).toBeInTheDocument();
    expect(screen.getByText(/0/i)).toBeInTheDocument();
  });

  it.skip('should render correct answer indicator', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    // The correct answer (index 1 = "4") should be highlighted
    const correctAnswer = screen.getByText(/4/i);
    expect(correctAnswer).toBeInTheDocument();
  });

  it.skip('should render next question button for host', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const nextButton = screen.getByRole('button', { name: /next question/i });
    expect(nextButton).toBeInTheDocument();
  });

  it.skip('should handle next question button click', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const nextButton = screen.getByRole('button', { name: /next question/i });
    fireEvent.click(nextButton);

    expect(mockUseWebSocket.sendMessage).toHaveBeenCalledWith({
      type: 'next_question',
      gameId: 123,
    });
  });

  it.skip('should render back button', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).toBeInTheDocument();
  });

  it.skip('should handle back button click', () => {
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const backButton = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backButton);

    expect(defaultOnNavigate).toHaveBeenCalledWith({ type: "home" });
  });

  it.skip('should handle next question response', async () => {
    mockUseWebSocket.lastMessage = {
      type: 'next_question',
      question: {
        id: 2,
        questionText: "What is 3 + 3?",
        questionType: "multiple_choice",
        answers: ["5", "6", "7", "8"],
        correctAnswerIndex: 1,
        questionOrder: 2,
      },
      currentQuestionIndex: 1,
    };

    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(defaultOnNavigate).toHaveBeenCalledWith({
        type: "gameplay",
        gameId: 123,
        gameCode: "ABC123",
        playerId: 1,
        isHost: true,
        currentQuestionIndex: 1,
        totalQuestions: 10,
        question: {
          id: 2,
          questionText: "What is 3 + 3?",
          questionType: "multiple_choice",
          answers: ["5", "6", "7", "8"],
          correctAnswerIndex: 1,
          questionOrder: 2,
        },
      });
    });
  });

  it.skip('should handle game end response', async () => {
    mockUseWebSocket.lastMessage = {
      type: 'game_end',
      gameId: 123,
    };

    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

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
    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const container = screen.getByText((content, node) => Boolean(node && node.textContent && node.textContent.includes('Question Results'))).closest('div');
    expect(container).toHaveClass('min-h-screen');
  });

  it.skip('should handle component unmount cleanup', () => {
    const { unmount } = render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(() => unmount()).not.toThrow();
  });

  it.skip('should not show next button for non-host players', () => {
    const nonHostGameState = {
      ...defaultGameState,
      isHost: false,
    };

    render(<QuestionResults gameState={nonHostGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.queryByRole('button', { name: /next question/i })).not.toBeInTheDocument();
  });

  it.skip('should handle empty answer breakdown', () => {
    const emptyBreakdownGameState = {
      ...defaultGameState,
      answerBreakdown: [],
    };

    render(<QuestionResults gameState={emptyBreakdownGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/No answers submitted/i)).toBeInTheDocument();
  });

  it.skip('should handle connection status when disconnected', () => {
    mockUseWebSocket.isConnected = false;

    render(<QuestionResults gameState={defaultGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    expect(screen.getByText(/Connecting to server/i)).toBeInTheDocument();
  });

  it.skip('should handle last question scenario', () => {
    const lastQuestionGameState = {
      ...defaultGameState,
      currentQuestionIndex: 9,
      totalQuestions: 10,
    };

    render(<QuestionResults gameState={lastQuestionGameState} onNavigate={defaultOnNavigate} />, { wrapper: TestWrapper });

    const nextButton = screen.getByRole('button', { name: /finish game/i });
    expect(nextButton).toBeInTheDocument();
  });
}); 