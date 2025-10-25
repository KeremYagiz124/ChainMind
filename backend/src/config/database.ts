import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export const initializeDatabase = async (): Promise<void> => {
  try {
    prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    prisma.$on('error', (e) => {
      logger.error('Database error:', e);
    });

    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      logger.info('Running database migrations...');
      // Note: In production, migrations should be run separately
      // This is just for development convenience
    }

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const getDatabase = (): PrismaClient => {
  if (!prisma) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return prisma;
};

export const closeDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
};

export { prisma };
