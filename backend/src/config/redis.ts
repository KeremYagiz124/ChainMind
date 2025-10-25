import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const initializeRedis = async (): Promise<void> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        return err.message.includes(targetError);
      }
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis Client Ready');
    });

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected');
    });

    await redisClient.connect();
    
    // Test Redis connection
    await redisClient.ping();
    logger.info('✅ Redis connection successful');

  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    // Don't throw error - Redis is optional for basic functionality
    logger.warn('Continuing without Redis cache');
  }
};

export const getRedisClient = (): Redis | null => {
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient && redisClient.status === 'ready') {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

// Cache utility functions
export const cacheSet = async (key: string, value: any, ttl: number = 3600): Promise<void> => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    }
  } catch (error) {
    // Silent fail - cache is optional
  }
};

export const cacheGet = async (key: string): Promise<any> => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    }
    return null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      await redisClient.del(key);
    }
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
};

export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    if (redisClient && redisClient.status === 'ready') {
      const exists = await redisClient.exists(key);
      return exists === 1;
    }
    return false;
  } catch (error) {
    logger.error('Cache exists error:', error);
    return false;
  }
};
