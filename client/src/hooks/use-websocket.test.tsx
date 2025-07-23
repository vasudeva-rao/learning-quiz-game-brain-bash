import * as React from 'react';
import { render, renderHook, act } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from './use-websocket';
import { WebSocketMessage } from '@/lib/game-types';

// Mock WebSocket
const mockWebSocket = {
  readyState: WebSocket.CONNECTING,
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.WebSocket = jest.fn(() => mockWebSocket) as unknown as jest.Mock & typeof WebSocket;

// Mock console methods
const originalConsole = { ...console };
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

describe('WebSocket Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.WebSocket as unknown as jest.Mock).mockClear();
  });

  describe('WebSocketProvider', () => {
    it('should provide WebSocket context', () => {
      const TestComponent = () => {
        const { isConnected, sendMessage } = useWebSocket();
        return (
          <div>
            <span data-testid="connected">{isConnected.toString()}</span>
            <button onClick={() => sendMessage({ type: 'test', payload: {} })}>Send</button>
          </div>
        );
      };

      const { getByTestId } = render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(getByTestId('connected')).toHaveTextContent('false');
    });
  });

  describe('useWebSocket', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');
    });

    it('should return WebSocket state and methods', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      expect(result.current).toHaveProperty('isConnected');
      expect(result.current).toHaveProperty('sendMessage');
      expect(typeof result.current.isConnected).toBe('boolean');
      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      expect(result.current.isConnected).toBe(false);
    });

    it('should connect to WebSocket on mount', () => {
      renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:5000');
    });

    it('should handle connection open', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      // Simulate connection open
      const openEvent = new Event('open');
      mockWebSocket.addEventListener.mock.calls
        .find(([event]) => event === 'open')?.[1](openEvent);

      expect(result.current.isConnected).toBe(true);
    });

    it('should handle connection close', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      // First connect
      const openEvent = new Event('open');
      mockWebSocket.addEventListener.mock.calls
        .find(([event]) => event === 'open')?.[1](openEvent);

      expect(result.current.isConnected).toBe(true);

      // Then disconnect
      const closeEvent = new Event('close');
      mockWebSocket.addEventListener.mock.calls
        .find(([event]) => event === 'close')?.[1](closeEvent);

      expect(result.current.isConnected).toBe(false);
    });

    it('should handle incoming messages', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      const testMessage: WebSocketMessage = { type: 'test', payload: 'hello' };
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(testMessage),
      });

      mockWebSocket.addEventListener.mock.calls
        .find(([event]) => event === 'message')?.[1](messageEvent);

      expect(result.current.isConnected).toBe(true);
    });

    it('should send messages', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      const testMessage: WebSocketMessage = { type: 'test', payload: 'hello' };

      act(() => {
        result.current.sendMessage(testMessage);
      });

      expect(mockWebSocket.send).toHaveBeenCalledWith(JSON.stringify(testMessage));
    });

    it('should handle connection errors', () => {
      renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      const errorEvent = new Event('error');
      mockWebSocket.addEventListener.mock.calls
        .find(([event]) => event === 'error')?.[1](errorEvent);

      expect(console.error).toHaveBeenCalledWith('WebSocket error:', errorEvent);
    });

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      unmount();

      expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('should handle invalid JSON messages', () => {
      const { result } = renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      const messageEvent = new MessageEvent('message', {
        data: 'invalid json',
      });

      mockWebSocket.addEventListener.mock.calls
        .find(([event]) => event === 'message')?.[1](messageEvent);

      expect(result.current.isConnected).toBe(true);
      expect(console.error).toHaveBeenCalledWith('Failed to parse WebSocket message:', expect.any(Error));
    });

    it('should handle missing environment variables', () => {
      // Temporarily clear environment variables
      const originalHost = process.env.VITE_BACKEND_HOST;
      const originalPort = process.env.VITE_BACKEND_PORT;
      delete process.env.VITE_BACKEND_HOST;
      delete process.env.VITE_BACKEND_PORT;

      renderHook(() => useWebSocket(), {
        wrapper: WebSocketProvider,
      });

      // Should use fallback values
      expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:5000');

      // Restore environment variables
      process.env.VITE_BACKEND_HOST = originalHost;
      process.env.VITE_BACKEND_PORT = originalPort;
    });
  });
}); 