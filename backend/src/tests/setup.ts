import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/chainmind_test';
process.env.REDIS_URL = 'redis://localhost:6379/1';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock external services
jest.mock('../services/aiService');
jest.mock('../services/marketService');
jest.mock('../services/portfolioService');
jest.mock('../services/securityService');
jest.mock('../services/litProtocolService');
jest.mock('../services/envioService');

// Mock Redis
jest.mock('../config/redis', () => ({
  initializeRedis: jest.fn(),
  cacheGet: jest.fn(),
  cacheSet: jest.fn(),
  cacheDel: jest.fn(),
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    portfolio: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    marketData: {
      create: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    securityAnalysis: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

// Increase timeout for async operations
jest.setTimeout(10000);
