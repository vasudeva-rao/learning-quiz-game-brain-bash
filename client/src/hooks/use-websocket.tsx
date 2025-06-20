import React, { createContext, useContext, useEffect, useRef, useCallback, useState, ReactNode } from 'react';
import { WebSocketMessage } from '@/lib/game-types';

interface WebSocketContextType {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => boolean;
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'error';
  addMessageHandler: (handler: (message: WebSocketMessage) => void) => void;
  removeMessageHandler: (handler: (message: WebSocketMessage) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const messageHandlers = useRef(new Set<(message: WebSocketMessage) => void>());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    setConnectionState('connecting');
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      setIsConnected(true);
      setConnectionState('connected');
      reconnectAttempts.current = 0;
    };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        messageHandlers.current.forEach((handler) => handler(message));
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
    ws.onclose = (event) => {
      setIsConnected(false);
      setConnectionState('disconnected');
      // Attempt reconnection if not a clean close
      if (!event.wasClean && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };
    ws.onerror = () => {
      setConnectionState('error');
    };
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;
    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping', payload: {} });
    }, 30000);
    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const addMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current.add(handler);
  }, []);

  const removeMessageHandler = useCallback((handler: (message: WebSocketMessage) => void) => {
    messageHandlers.current.delete(handler);
  }, []);

  return (<WebSocketContext.Provider value={{ connect, disconnect, sendMessage, isConnected, connectionState, addMessageHandler, removeMessageHandler }}>{children}</WebSocketContext.Provider>);
};

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
