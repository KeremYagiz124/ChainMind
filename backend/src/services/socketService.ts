import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { AIService, ChatContext } from './aiService';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';

export interface SocketUser {
  id: string;
  address?: string | undefined;
  connectedAt: Date;
}

export class SocketService {
  private io: SocketIOServer;
  private aiService: AIService;
  private db = getDatabase();
  private connectedUsers = new Map<string, SocketUser>();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.aiService = new AIService();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', (data: { address?: string }) => {
        const user: SocketUser = {
          id: socket.id,
          address: data.address,
          connectedAt: new Date()
        };
        
        this.connectedUsers.set(socket.id, user);
        
        socket.emit('authenticated', {
          success: true,
          userId: socket.id,
          timestamp: new Date()
        });

        logger.info(`User authenticated: ${socket.id} (${data.address || 'anonymous'})`);
      });

      // Handle chat messages
      socket.on('chat_message', async (data) => {
        try {
          await this.handleChatMessage(socket, data);
        } catch (error) {
          logger.error('Chat message error:', error);
          socket.emit('error', {
            type: 'chat_error',
            message: 'Failed to process message'
          });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { conversationId: string }) => {
        socket.to(data.conversationId).emit('user_typing', {
          userId: socket.id,
          typing: true
        });
      });

      socket.on('typing_stop', (data: { conversationId: string }) => {
        socket.to(data.conversationId).emit('user_typing', {
          userId: socket.id,
          typing: false
        });
      });

      // Handle conversation joining/leaving
      socket.on('join_conversation', (data: { conversationId: string }) => {
        socket.join(data.conversationId);
        logger.debug(`User ${socket.id} joined conversation ${data.conversationId}`);
      });

      socket.on('leave_conversation', (data: { conversationId: string }) => {
        socket.leave(data.conversationId);
        logger.debug(`User ${socket.id} left conversation ${data.conversationId}`);
      });

      // Handle portfolio updates
      socket.on('subscribe_portfolio', (data: { address: string }) => {
        socket.join(`portfolio:${data.address}`);
        logger.debug(`User ${socket.id} subscribed to portfolio updates for ${data.address}`);
      });

      socket.on('unsubscribe_portfolio', (data: { address: string }) => {
        socket.leave(`portfolio:${data.address}`);
        logger.debug(`User ${socket.id} unsubscribed from portfolio updates for ${data.address}`);
      });

      // Handle market data subscriptions
      socket.on('subscribe_market', (data: { symbols?: string[] }) => {
        const room = data.symbols ? `market:${data.symbols.join(',')}` : 'market:general';
        socket.join(room);
        logger.debug(`User ${socket.id} subscribed to market updates: ${room}`);
      });

      socket.on('unsubscribe_market', (data: { symbols?: string[] }) => {
        const room = data.symbols ? `market:${data.symbols.join(',')}` : 'market:general';
        socket.leave(room);
        logger.debug(`User ${socket.id} unsubscribed from market updates: ${room}`);
      });

      // Handle security alerts
      socket.on('subscribe_security', (data: { address: string }) => {
        socket.join(`security:${data.address}`);
        logger.debug(`User ${socket.id} subscribed to security alerts for ${data.address}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`Client disconnected: ${socket.id} (${reason})`);
        this.connectedUsers.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  private async handleChatMessage(socket: any, data: {
    message: string;
    conversationId?: string;
    userAddress?: string;
  }): Promise<void> {
    const { message, conversationId, userAddress } = data;

    if (!message || typeof message !== 'string') {
      socket.emit('error', {
        type: 'validation_error',
        message: 'Message is required and must be a string'
      });
      return;
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await this.db.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });
    }

    if (!conversation) {
      conversation = await this.db.conversation.create({
        data: {
          userId: socket.data.userId,
          title: `Chat ${new Date().toISOString()}`
        },
        include: {
          messages: true
        }
      });

      // Join the conversation room
      socket.join(conversation.id);
    }

    // Build chat context
    const context: ChatContext = {
      userAddress: socket.data.userAddress || undefined,
      conversationHistory: (conversation as any).messages?.reverse().map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt
      })) || [],
      userPreferences: {}
    }; // TODO: Load user preferences

    // Store user message
    const userMessage = await this.db.message.create({
      data: {
        conversationId: conversation!.id,
        sender: 'user',
        content: message,
        messageType: 'text'
      }
    });

    // Emit user message to conversation room
    socket.to(conversation.id).emit('message_received', {
      id: userMessage.id,
      conversationId: conversation.id,
      role: 'user',
      content: message,
      type: 'text',
      timestamp: userMessage.createdAt
    });

    // Show typing indicator for AI
    socket.emit('ai_typing', { conversationId: conversation.id, typing: true });

    try {
      // Process message with AI
      const aiResponse = await this.aiService.processMessage(message, context);

      // Store AI response
      const aiMessage = await this.db.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'ai',
          content: aiResponse.content,
          messageType: aiResponse.type,
          metadata: aiResponse.metadata
        }
      });

      // Update conversation
      await this.db.conversation.update({
        where: { id: conversation.id },
        data: {
          updatedAt: new Date()
        }
      });

      // Stop typing indicator
      socket.emit('ai_typing', { conversationId: conversation.id, typing: false });

      // Emit AI response
      const responseData = {
        id: aiMessage.id,
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        type: aiResponse.type,
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
        timestamp: aiMessage.createdAt,
        metadata: aiResponse.metadata
      };

      socket.emit('message_received', responseData);
      socket.to(conversation.id).emit('message_received', responseData);

    } catch (error) {
      logger.error('AI processing error:', error);
      
      // Stop typing indicator
      socket.emit('ai_typing', { conversationId: conversation.id, typing: false });
      
      // Send error message
      socket.emit('message_received', {
        id: `error_${Date.now()}`,
        conversationId: conversation.id,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again.',
        type: 'warning',
        confidence: 0,
        timestamp: new Date()
      });
    }
  }

  // Broadcast portfolio updates
  public broadcastPortfolioUpdate(address: string, data: any): void {
    this.io.to(`portfolio:${address}`).emit('portfolio_updated', {
      address,
      data,
      timestamp: new Date()
    });
  }

  // Broadcast market updates
  public broadcastMarketUpdate(symbols: string[], data: any): void {
    const room = `market:${symbols.join(',')}`;
    this.io.to(room).emit('market_updated', {
      symbols,
      data,
      timestamp: new Date()
    });

    // Also broadcast to general market room
    this.io.to('market:general').emit('market_updated', {
      symbols,
      data,
      timestamp: new Date()
    });
  }

  // Broadcast security alerts
  public broadcastSecurityAlert(address: string, alert: any): void {
    this.io.to(`security:${address}`).emit('security_alert', {
      address,
      alert,
      timestamp: new Date()
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users
  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  // Send notification to specific user
  public sendNotificationToUser(socketId: string, notification: any): void {
    this.io.to(socketId).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  }

  // Broadcast system announcement
  public broadcastSystemAnnouncement(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    this.io.emit('system_announcement', {
      message,
      type,
      timestamp: new Date()
    });
  }

  // Get Socket.IO instance for external use
  public getIO(): SocketIOServer {
    return this.io;
  }
}
