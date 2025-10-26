import jwt from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-min-32-characters-long-please-change';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-min-32-characters';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

export interface JWTPayload {
  address: string;
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (address: string, sessionId?: string): string => {
  try {
    const payload: JWTPayload = {
      address: address.toLowerCase(),
      sessionId,
      type: 'access'
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'chainmind',
      audience: 'chainmind-api'
    });
  } catch (error) {
    logger.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

export const generateRefreshToken = (address: string): string => {
  try {
    const payload: JWTPayload = {
      address: address.toLowerCase(),
      type: 'refresh'
    };

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'chainmind',
      audience: 'chainmind-api'
    });
  } catch (error) {
    logger.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'chainmind',
      audience: 'chainmind-api'
    }) as JWTPayload;

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      logger.error('Error verifying access token:', error);
      throw new Error('Token verification failed');
    }
  }
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'chainmind',
      audience: 'chainmind-api'
    }) as JWTPayload;

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    } else {
      logger.error('Error verifying refresh token:', error);
      throw new Error('Refresh token verification failed');
    }
  }
};

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    logger.error('Error decoding token:', error);
    return null;
  }
};

export const getTokenExpirationTime = (token: string): number | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return decoded.exp ? decoded.exp * 1000 : null;
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const exp = getTokenExpirationTime(token);
  if (!exp) return true;
  return Date.now() >= exp;
};
