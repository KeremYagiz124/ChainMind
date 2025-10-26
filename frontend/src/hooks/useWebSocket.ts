import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL as API_SOCKET_URL } from '../config/api';
import { showErrorToast, showInfoToast } from '../utils/errorHandler';
import { websocketLogger } from '../utils/logger';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  userAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
}

interface MarketUpdate {
  prices: PriceData[];
  timestamp: string;
}

interface PortfolioUpdate {
  address: string;
  data: {
    totalValue: number;
    totalChange24h: number;
    tokens: Array<{
      symbol: string;
      balance: string;
      value: number;
    }>;
  };
  timestamp: string;
}

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string, userAddress?: string) => void;
  joinChat: (conversationId: string) => void;
  leaveChat: (conversationId: string) => void;
  subscribeToMarket: (symbols?: string[]) => void;
  unsubscribeFromMarket: () => void;
  subscribeToPortfolio: (address: string) => void;
  unsubscribeFromPortfolio: (address: string) => void;
  onNewMessage: (callback: (message: Message) => void) => () => void;
  onMarketUpdate: (callback: (data: MarketUpdate) => void) => () => void;
  onPortfolioUpdate: (callback: (data: PortfolioUpdate) => void) => () => void;
  onAiTyping: (callback: (data: { conversationId: string; typing: boolean }) => void) => () => void;
}

export const useWebSocket = (token?: string): WebSocketHookReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  useEffect(() => {
    const socketInstance = io(API_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      websocketLogger.success('WebSocket connected successfully');
    });

    socketInstance.on('connected', (data) => {
      websocketLogger.info('WebSocket session established:', data);
      if (data.authenticated) {
        showInfoToast('Connected to real-time updates');
      }
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      websocketLogger.warn('WebSocket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socketInstance.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      websocketLogger.error('WebSocket connection error:', error);
      reconnectAttemptsRef.current++;
      
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        showErrorToast('Failed to connect to real-time server');
      }
    });

    socketInstance.on('error', (error) => {
      websocketLogger.error('WebSocket error:', error);
      showErrorToast(error, 'WebSocket error occurred');
    });

    setSocket(socketInstance);

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketInstance.disconnect();
    };
  }, [token]);

  const sendMessage = useCallback((conversationId: string, content: string, userAddress?: string) => {
    if (!socket) {
      showErrorToast('Not connected to server');
      return;
    }

    socket.emit('send-message', {
      conversationId,
      content,
      userAddress
    });
  }, [socket]);

  const joinChat = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('join-chat', { conversationId });
  }, [socket]);

  const leaveChat = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('leave-chat', { conversationId });
  }, [socket]);

  const subscribeToMarket = useCallback((symbols?: string[]) => {
    if (!socket) return;
    socket.emit('subscribe-market', { symbols });
  }, [socket]);

  const unsubscribeFromMarket = useCallback(() => {
    if (!socket) return;
    socket.emit('unsubscribe-market', {});
  }, [socket]);

  const subscribeToPortfolio = useCallback((address: string) => {
    if (!socket) return;
    socket.emit('subscribe-portfolio', { address });
  }, [socket]);

  const unsubscribeFromPortfolio = useCallback((address: string) => {
    if (!socket) return;
    socket.emit('unsubscribe-portfolio', { address });
  }, [socket]);

  const onNewMessage = useCallback((callback: (message: Message) => void) => {
    if (!socket) return () => {};
    
    // Listen for both event names
    socket.on('new-message', callback);
    socket.on('ai-message', callback);
    return () => {
      socket.off('new-message', callback);
      socket.off('ai-message', callback);
    };
  }, [socket]);

  const onMarketUpdate = useCallback((callback: (data: MarketUpdate) => void) => {
    if (!socket) return () => {};
    
    socket.on('market-update', callback);
    return () => {
      socket.off('market-update', callback);
    };
  }, [socket]);

  const onPortfolioUpdate = useCallback((callback: (data: PortfolioUpdate) => void) => {
    if (!socket) return () => {};
    
    socket.on('portfolio-update', callback);
    return () => {
      socket.off('portfolio-update', callback);
    };
  }, [socket]);

  const onAiTyping = useCallback((callback: (data: { conversationId: string; typing: boolean }) => void) => {
    if (!socket) return () => {};
    
    socket.on('ai-typing', callback);
    return () => {
      socket.off('ai-typing', callback);
    };
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    joinChat,
    leaveChat,
    subscribeToMarket,
    unsubscribeFromMarket,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
    onNewMessage,
    onMarketUpdate,
    onPortfolioUpdate,
    onAiTyping
  };
};
