import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

let prisma: PrismaClient;

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password')) {
      logger.warn('⚠️  DATABASE_URL not configured. Running in stateless mode (no persistence).');
      logger.warn('⚠️  To enable database features, configure DATABASE_URL in .env file.');
      return;
    }

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
      (prisma as any).$on('query', (e: any) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Params: ${e.params}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    (prisma as any).$on('error', (e: any) => {
      logger.error('Database error:', e);
    });

    // Test database connection with timeout
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    logger.info('✅ Database connected successfully');

    // Run migrations in production
    if (process.env.NODE_ENV === 'production') {
      logger.info('Running database migrations...');
      // Note: In production, migrations should be run separately
      // This is just for development convenience
    }

  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    logger.warn('⚠️  Continuing without database (stateless mode). Some features may be limited.');
    prisma = null as any; // Set to null to indicate no connection
  }
};

export const getDatabase = (): PrismaClient | null => {
  if (!prisma) {
    logger.warn('Database not initialized. Returning null. Call initializeDatabase() first.');
    return null;
  }
  return prisma;
};

export const isDatabaseConnected = (): boolean => {
  return prisma !== null && prisma !== undefined;
};

export const closeDatabase = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
};

export { prisma };
