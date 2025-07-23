import * as React from "react";
import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from './theme-provider';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    remove: jest.fn(),
    add: jest.fn(),
  },
};
Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset classList methods
    mockDocumentElement.classList.remove.mockClear();
    mockDocumentElement.classList.add.mockClear();
  });

  describe('ThemeProvider component', () => {
    it('should provide theme context', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current.theme).toBe('original');
      expect(result.current.setTheme).toBeInstanceOf(Function);
    });

    it('should load theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith('quiz-theme');
      expect(result.current.theme).toBe('dark');
    });

    it('should ignore invalid theme from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');

      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current.theme).toBe('original');
    });

    it('should save theme to localStorage when changed', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('quiz-theme', 'light');
    });

    it('should update document classes when theme changes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith(
        'theme-original',
        'theme-light',
        'theme-dark'
      );
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-dark');
    });

    it('should handle all valid themes', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      const themes = ['original', 'light', 'dark'] as const;

      themes.forEach(theme => {
        act(() => {
          result.current.setTheme(theme);
        });

        expect(result.current.theme).toBe(theme);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('quiz-theme', theme);
        expect(mockDocumentElement.classList.add).toHaveBeenCalledWith(`theme-${theme}`);
      });
    });
  });

  describe('useTheme hook', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useTheme());
      }).toThrow('useTheme must be used within a ThemeProvider');
    });

    it('should return current theme and setTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(typeof result.current.theme).toBe('string');
      expect(typeof result.current.setTheme).toBe('function');
    });
  });

  describe('theme persistence', () => {
    it('should persist theme across sessions', () => {
      // Simulate stored theme
      localStorageMock.getItem.mockReturnValue('light');

      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current.theme).toBe('light');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-light');
    });

    it('should handle missing localStorage theme', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      expect(result.current.theme).toBe('original');
    });
  });

  describe('document class management', () => {
    it('should remove all theme classes before adding new one', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setTheme('light');
      });

      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith(
        'theme-original',
        'theme-light',
        'theme-dark'
      );
    });

    it('should add correct theme class', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: TestWrapper,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('theme-dark');
    });
  });
}); 