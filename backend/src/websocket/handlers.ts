import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { AIService, ChatContext } from '../services/aiService';
import { MarketService } from '../services/marketService';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthenticatedSocket extends Socket {
  userAddress?: string;
}

export class WebSocketHandlers {
  private io: Server;
  private aiService: AIService;
  private marketService: MarketService;
  private marketUpdateInterval: NodeJS.Timeout | null = null;

  constructor(io: Server) {
    this.io = io;
    this.aiService = new AIService();
    this.marketService = new MarketService();
  }

  initialize() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
    this.startMarketUpdates();
    logger.info('✓ WebSocket handlers initialized');
  }

  private authenticateSocket(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        // Allow unauthenticated connections but with limited features
        logger.debug(`Unauthenticated socket connection: ${socket.id}`);
        return next();
      }

      const payload = verifyAccessToken(token);
      socket.userAddress = payload.address;
      logger.debug(`Authenticated socket: ${socket.id} for address ${payload.address}`);
      next();
    } catch (error) {
      logger.warn(`Socket authentication failed: ${socket.id}`);
      next(); // Allow connection anyway, but without auth
    }
  }

  private handleConnection(socket: AuthenticatedSocket) {
    logger.info(`Client connected: ${socket.id} ${socket.userAddress ? `(${socket.userAddress})` : '(guest)'}`);

    // Send welcome message
    socket.emit('connected', {
      socketId: socket.id,
      authenticated: !!socket.userAddress,
      timestamp: new Date().toISOString()
    });

    // Chat handlers
    socket.on('join-chat', (data) => this.handleJoinChat(socket, data));
    socket.on('leave-chat', (data) => this.handleLeaveChat(socket, data));
    socket.on('send-message', (data) => this.handleSendMessage(socket, data));
    socket.on('typing', (data) => this.handleTyping(socket, data));

    // Market handlers
    socket.on('subscribe-market', (data) => this.handleSubscribeMarket(socket, data));
    socket.on('unsubscribe-market', (data) => this.handleUnsubscribeMarket(socket, data));

    // Portfolio handlers
    socket.on('subscribe-portfolio', (data) => this.handleSubscribePortfolio(socket, data));
    socket.on('unsubscribe-portfolio', (data) => this.handleUnsubscribePortfolio(socket, data));

    // Disconnect handler
    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  private handleJoinChat(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const { conversationId } = data;
      socket.join(`chat:${conversationId}`);
      logger.info(`Socket ${socket.id} joined chat: ${conversationId}`);
      
      socket.emit('joined-chat', { conversationId, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Join chat error:', error);
      socket.emit('error', { message: 'Failed to join chat' });
    }
  }

  private handleLeaveChat(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const { conversationId } = data;
      socket.leave(`chat:${conversationId}`);
      logger.info(`Socket ${socket.id} left chat: ${conversationId}`);
    } catch (error) {
      logger.error('Leave chat error:', error);
    }
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: { conversationId: string; content: string; userAddress?: string }) {
    try {
      const { conversationId, content, userAddress } = data;

      // Emit user message to all clients in the conversation
      this.io.to(`chat:${conversationId}`).emit('new-message', {
        id: `msg_${Date.now()}_user`,
        content,
        sender: 'user',
        userAddress: socket.userAddress || userAddress,
        timestamp: new Date().toISOString()
      });

      // Show typing indicator
      socket.to(`chat:${conversationId}`).emit('ai-typing', { conversationId, typing: true });

      // Process with AI
      const context: ChatContext = {
        userAddress: socket.userAddress || userAddress || 'anonymous',
        conversationHistory: [],
        userPreferences: {}
      };

      const aiResponse = await this.aiService.processMessage(content, context);

      // Hide typing indicator
      socket.to(`chat:${conversationId}`).emit('ai-typing', { conversationId, typing: false });

      // Emit AI response
      this.io.to(`chat:${conversationId}`).emit('new-message', {
        id: `msg_${Date.now()}_ai`,
        content: aiResponse.content,
        sender: 'assistant',
        metadata: aiResponse.metadata,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      logger.error('Send message error:', error);
      socket.emit('error', { 
        message: error.message || 'Failed to process message',
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleTyping(socket: AuthenticatedSocket, data: { conversationId: string; typing: boolean }) {
    try {
      const { conversationId, typing } = data;
      socket.to(`chat:${conversationId}`).emit('user-typing', {
        conversationId,
        userAddress: socket.userAddress,
        typing,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Typing indicator error:', error);
    }
  }

  private handleSubscribeMarket(socket: AuthenticatedSocket, data: { symbols?: string[] }) {
    try {
      const room = 'market-updates';
      socket.join(room);
      logger.info(`Socket ${socket.id} subscribed to market updates`);
      
      socket.emit('subscribed-market', { 
        symbols: data.symbols || ['ETH', 'BTC', 'USDC'],
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Subscribe market error:', error);
      socket.emit('error', { message: 'Failed to subscribe to market updates' });
    }
  }

  private handleUnsubscribeMarket(socket: AuthenticatedSocket, data: any) {
    try {
      socket.leave('market-updates');
      logger.info(`Socket ${socket.id} unsubscribed from market updates`);
    } catch (error) {
      logger.error('Unsubscribe market error:', error);
    }
  }

  private handleSubscribePortfolio(socket: AuthenticatedSocket, data: { address: string }) {
    try {
      if (!socket.userAddress) {
        socket.emit('error', { message: 'Authentication required for portfolio updates' });
        return;
      }

      const { address } = data;
      const room = `portfolio:${address.toLowerCase()}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} subscribed to portfolio: ${address}`);
      
      socket.emit('subscribed-portfolio', { 
        address,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Subscribe portfolio error:', error);
      socket.emit('error', { message: 'Failed to subscribe to portfolio updates' });
    }
  }

  private handleUnsubscribePortfolio(socket: AuthenticatedSocket, data: { address: string }) {
    try {
      const { address } = data;
      socket.leave(`portfolio:${address.toLowerCase()}`);
      logger.info(`Socket ${socket.id} unsubscribed from portfolio: ${address}`);
    } catch (error) {
      logger.error('Unsubscribe portfolio error:', error);
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    logger.info(`Client disconnected: ${socket.id}`);
  }

  private startMarketUpdates() {
    // Send market updates every 30 seconds
    this.marketUpdateInterval = setInterval(async () => {
      try {
        const symbols = ['ETH', 'BTC', 'USDC', 'USDT', 'BNB', 'SOL'];
        const prices = await this.marketService.getTokenPrices(symbols);
        
        this.io.to('market-updates').emit('market-update', {
          prices,
          timestamp: new Date().toISOString()
        });

        logger.debug(`Market update sent to ${this.io.sockets.adapter.rooms.get('market-updates')?.size || 0} clients`);
      } catch (error) {
        logger.error('Market update error:', error);
      }
    }, 30000); // 30 seconds

    logger.info('✓ Market updates started');
  }

  public broadcastPortfolioUpdate(address: string, data: any) {
    const room = `portfolio:${address.toLowerCase()}`;
    this.io.to(room).emit('portfolio-update', {
      address,
      data,
      timestamp: new Date().toISOString()
    });
    logger.debug(`Portfolio update broadcast to ${address}`);
  }

  public broadcastSecurityAlert(userAddress: string, alert: any) {
    const room = `portfolio:${userAddress.toLowerCase()}`;
    this.io.to(room).emit('security-alert', {
      alert,
      timestamp: new Date().toISOString()
    });
    logger.info(`Security alert sent to ${userAddress}`);
  }

  public cleanup() {
    if (this.marketUpdateInterval) {
      clearInterval(this.marketUpdateInterval);
      this.marketUpdateInterval = null;
      logger.info('Market updates stopped');
    }
  }
}
