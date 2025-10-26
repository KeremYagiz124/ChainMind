import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../utils/jwt';
import { logger } from '../utils/logger';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    logger.error('Authentication error:', error.message);
    res.status(403).json({
      success: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token invalid but don't fail the request
        logger.debug('Optional auth token invalid');
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireWalletAddress = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.address) {
    res.status(401).json({
      success: false,
      error: 'Wallet address required'
    });
    return;
  }
  next();
};

export const validateWalletOwnership = (req: Request, res: Response, next: NextFunction): void => {
  const { address } = req.params;
  const userAddress = req.user?.address;

  if (!userAddress) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  if (address.toLowerCase() !== userAddress.toLowerCase()) {
    res.status(403).json({
      success: false,
      error: 'Access denied: wallet address mismatch'
    });
    return;
  }

  next();
};
