/**
 * Rate limiting middleware
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { config } from '../config/env';

// Create Redis client if caching is enabled
let redisClient: ReturnType<typeof createClient> | undefined;

if (config.features.caching && config.redis.url) {
  redisClient = createClient({
    url: config.redis.url,
  });

  redisClient.connect().catch((err) => {
    console.error('Redis connection failed:', err);
  });
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.security.rateLimit.windowMs,
  max: config.security.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:api:',
    }),
  }),
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:auth:',
    }),
  }),
});

// Limiter for AI chat endpoints
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many chat requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:chat:',
    }),
  }),
});

// Limiter for expensive operations
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: 'Too many requests for this resource, please wait.',
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:heavy:',
    }),
  }),
});
