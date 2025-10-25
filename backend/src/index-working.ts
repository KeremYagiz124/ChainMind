// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

// Then import everything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/database';

// Import routes
import chatRoutes from './routes/chatRoutes';
import portfolioRoutes from './routes/portfolioRoutes';
import marketRoutes from './routes/marketRoutes';
import securityRoutes from './routes/securityRoutes';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/security', securityRoutes);

// Basic Socket.IO for real-time chat
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-chat', (data) => {
    socket.join(data.conversationId);
    logger.info(`Client ${socket.id} joined conversation ${data.conversationId}`);
  });

  socket.on('send-message', async (data) => {
    try {
      // Echo the message back for now
      io.to(data.conversationId).emit('new-message', {
        id: Date.now().toString(),
        content: data.content,
        sender: 'user',
        timestamp: new Date().toISOString()
      });

      // Send AI response
      setTimeout(() => {
        io.to(data.conversationId).emit('new-message', {
          id: (Date.now() + 1).toString(),
          content: `I received your message: "${data.content}". This is a simplified response for testing.`,
          sender: 'assistant',
          timestamp: new Date().toISOString()
        });
      }, 1000);
    } catch (error) {
      logger.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database (optional - will continue if fails)
    try {
      await initializeDatabase();
    } catch (dbError) {
      logger.warn('⚠️ Database initialization failed, continuing without DB:', dbError);
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`🚀 ChainMind Backend running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
