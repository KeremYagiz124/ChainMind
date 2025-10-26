/**
 * Rate limiting middleware
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const redisClient = getRedisClient();
const ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING !== 'false';

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENABLE_RATE_LIMITING,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:api:',
    }),
  }),
});

// Strict limiter for authentication endpoints - 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5'),
  message: { success: false, error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => !ENABLE_RATE_LIMITING,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, address: ${req.body?.address || 'unknown'}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts from this IP. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:auth:',
    }),
  }),
});

// Limiter for AI chat endpoints - 10 requests per minute
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { success: false, error: 'Too many chat requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENABLE_RATE_LIMITING,
  handler: (req, res) => {
    logger.warn(`Chat rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many chat requests. Please wait a moment before sending another message.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:chat:',
    }),
  }),
});

// Limiter for expensive operations (portfolio analysis, security scans) - 3 per minute
export const heavyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { success: false, error: 'Too many requests for this resource, please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENABLE_RATE_LIMITING,
  handler: (req, res) => {
    logger.warn(`Heavy operation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'This operation is rate-limited. Please wait before trying again.',
      retryAfter: res.getHeader('Retry-After')
    });
  },
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:heavy:',
    }),
  }),
});

// WebSocket connection limiter
export const wsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_WS_CONNECTIONS || '10'),
  message: { success: false, error: 'Too many WebSocket connection attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => !ENABLE_RATE_LIMITING,
  ...(redisClient && {
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'rl:ws:',
    }),
  }),
});
