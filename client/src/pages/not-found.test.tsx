import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import NotFound from './not-found';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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

describe('NotFound Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render 404 page with title', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
  });

  it.skip('should render error message', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    expect(screen.getByText(/The page you're looking for doesn't exist/i)).toBeInTheDocument();
  });

  it.skip('should render go home button', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    const goHomeButton = screen.getByRole('button', { name: /go home/i });
    expect(goHomeButton).toBeInTheDocument();
  });

  it.skip('should navigate to home when go home button is clicked', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    const goHomeButton = screen.getByRole('button', { name: /go home/i });
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it.skip('should render with correct styling classes', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    const container = screen.getByRole('main');
    expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
  });

  it.skip('should render with proper accessibility', () => {
    render(<NotFound />, { wrapper: TestWrapper });

    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it.skip('should handle component unmount cleanup', () => {
    const { unmount } = render(<NotFound />, { wrapper: TestWrapper });

    expect(() => unmount()).not.toThrow();
  });
}); 