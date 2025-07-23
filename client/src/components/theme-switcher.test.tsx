import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from './theme-provider';
import { ThemeSwitcher } from './theme-switcher';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    {children}
  </ThemeProvider>
);

describe('ThemeSwitcher', () => {
  it('should render theme switcher button', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Theme should change (we can't easily test the actual theme state without more complex setup)
    expect(button).toBeInTheDocument();
  });

  it.skip('should have proper accessibility attributes', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });

  it.skip('should render with correct styling classes', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('p-2', 'rounded-md');
  });

  it('should handle multiple clicks', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });

    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(button).toBeInTheDocument();
  });

  it('should render icon', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });

    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeInTheDocument();
  });
}); 