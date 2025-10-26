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
import authRoutes from './routes/authRoutes';

// Import WebSocket handlers
import { WebSocketHandlers } from './websocket/handlers';
import { apiLimiter } from './middleware/rateLimiter';

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

// API Routes with rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/chat', apiLimiter, chatRoutes);
app.use('/api/portfolio', apiLimiter, portfolioRoutes);
app.use('/api/market', apiLimiter, marketRoutes);
app.use('/api/security', apiLimiter, securityRoutes);

// Initialize WebSocket handlers
const wsHandlers = new WebSocketHandlers(io);
wsHandlers.initialize();

// Expose WebSocket handlers for broadcasting
app.set('wsHandlers', wsHandlers);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
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

    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('Received shutdown signal, closing server gracefully...');
      
      wsHandlers.cleanup();
      
      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Start server
    initializeDatabase()
      .then(() => {
        server.listen(PORT, () => {
          logger.info('🚀 ChainMind Backend Server Started');
          logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          logger.info(`📡 Server: http://localhost:${PORT}`);
          logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
          logger.info(`🔗 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
          logger.info(`🔌 WebSocket: Ready`);
          logger.info(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'gemini'}`);
          logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });
      })
      .catch((error) => {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
      });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
