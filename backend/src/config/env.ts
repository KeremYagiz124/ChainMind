/**
 * Environment variables validation and configuration
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // AI Providers
  AI_PROVIDER: z.enum(['openai', 'gemini', 'huggingface']).default('gemini'),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  HUGGINGFACE_API_KEY: z.string().optional(),
  
  // Blockchain RPCs
  ETHEREUM_RPC_URL: z.string().url().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  ARBITRUM_RPC_URL: z.string().url().optional(),
  OPTIMISM_RPC_URL: z.string().url().optional(),
  BASE_RPC_URL: z.string().url().optional(),
  
  // External APIs
  PYTH_NETWORK_URL: z.string().url().default('https://hermes.pyth.network'),
  BLOCKSCOUT_API_URL: z.string().url().default('https://eth.blockscout.com/api'),
  ENVIO_API_KEY: z.string().optional(),
  ETHERSCAN_API_KEY: z.string().optional(),
  POLYGONSCAN_API_KEY: z.string().optional(),
  ARBISCAN_API_KEY: z.string().optional(),
  
  // Security
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // Features
  ENABLE_RATE_LIMITING: z.string().default('true').transform((val) => val === 'true'),
  ENABLE_CACHING: z.string().default('true').transform((val) => val === 'true'),
  ENABLE_WEBSOCKET: z.string().default('false').transform((val) => val === 'true'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Export validated config
export const config = {
  // Server
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Database
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
  },
  
  // AI
  ai: {
    provider: env.AI_PROVIDER,
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
    },
    huggingface: {
      apiKey: env.HUGGINGFACE_API_KEY,
    },
  },
  
  // Blockchain
  blockchain: {
    ethereum: {
      rpcUrl: env.ETHEREUM_RPC_URL,
    },
    polygon: {
      rpcUrl: env.POLYGON_RPC_URL,
    },
    arbitrum: {
      rpcUrl: env.ARBITRUM_RPC_URL,
    },
    optimism: {
      rpcUrl: env.OPTIMISM_RPC_URL,
    },
    base: {
      rpcUrl: env.BASE_RPC_URL,
    },
  },
  
  // External APIs
  externalApis: {
    pyth: {
      url: env.PYTH_NETWORK_URL,
    },
    blockscout: {
      url: env.BLOCKSCOUT_API_URL,
    },
    envio: {
      apiKey: env.ENVIO_API_KEY,
    },
    etherscan: {
      apiKey: env.ETHERSCAN_API_KEY,
    },
    polygonscan: {
      apiKey: env.POLYGONSCAN_API_KEY,
    },
    arbiscan: {
      apiKey: env.ARBISCAN_API_KEY,
    },
  },
  
  // Security
  security: {
    corsOrigin: env.CORS_ORIGIN,
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },
  },
  
  // Features
  features: {
    rateLimiting: env.ENABLE_RATE_LIMITING,
    caching: env.ENABLE_CACHING,
    websocket: env.ENABLE_WEBSOCKET,
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
  },
};

export default config;
