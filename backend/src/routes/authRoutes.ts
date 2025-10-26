import { Router, Request, Response } from 'express';
import { LitProtocolService } from '../services/litProtocolService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';
import { authenticateToken } from '../middleware/authMiddleware';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { cacheGet, cacheSet } from '../config/redis';
import { ethers } from 'ethers';
import crypto from 'crypto';

const router = Router();
const litProtocolService = new LitProtocolService();

// POST /api/auth/challenge - Generate authentication challenge
router.post('/challenge', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Valid wallet address is required'
    });
  }

  try {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const message = `Welcome to ChainMind!

Please sign this message to authenticate your wallet.

Wallet Address: ${walletAddress}
Nonce: ${nonce}
Timestamp: ${timestamp}

This request will not trigger a blockchain transaction or cost any gas fees.`;

    // Store nonce in cache for verification (expires in 5 minutes)
    await cacheSet(`auth_nonce:${walletAddress.toLowerCase()}`, { nonce, timestamp }, 300);

    res.json({
      success: true,
      data: {
        message,
        nonce,
        timestamp
      }
    });

  } catch (error) {
    logger.error('Authentication challenge error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication challenge'
    });
  }
}));

// POST /api/auth/verify - Verify signature and generate JWT tokens
router.post('/verify', asyncHandler(async (req: Request, res: Response) => {
  const { address, signature, message } = req.body;

  if (!address || !signature || !message) {
    return res.status(400).json({
      success: false,
      error: 'Address, signature, and message are required'
    });
  }

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    // Verify the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        error: 'Signature verification failed'
      });
    }

    // Verify nonce (optional but recommended)
    const cachedNonce = await cacheGet(`auth_nonce:${address.toLowerCase()}`);
    if (cachedNonce && message.includes(cachedNonce.nonce)) {
      // Clear used nonce
      await cacheSet(`auth_nonce:${address.toLowerCase()}`, null, 1);
    }

    // Initialize Lit Protocol session (async, don't block response)
    litProtocolService.authenticateUser(address, signature, message)
      .then(authSession => {
        logger.info(`Lit Protocol session created for ${address}`);
      })
      .catch(error => {
        logger.error('Lit Protocol auth failed:', error);
      });

    // Generate JWT tokens
    const sessionId = `session_${Date.now()}_${address.slice(0, 8)}`;
    const accessToken = generateAccessToken(address, sessionId);
    const refreshToken = generateRefreshToken(address);

    // Store refresh token in cache
    await cacheSet(`refresh_token:${address.toLowerCase()}`, refreshToken, 30 * 24 * 60 * 60); // 30 days

    res.json({
      success: true,
      data: {
        user: {
          address: address.toLowerCase(),
          sessionId
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      }
    });

  } catch (error: any) {
    logger.error('Authentication verification error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Authentication failed'
    });
  }
}));

// POST /api/auth/refresh - Refresh access token using refresh token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      error: 'Refresh token is required'
    });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const address = payload.address;

    // Verify refresh token is still valid in cache
    const cachedToken = await cacheGet(`refresh_token:${address}`);
    if (cachedToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked refresh token'
      });
    }

    // Generate new access token
    const sessionId = `session_${Date.now()}_${address.slice(0, 8)}`;
    const newAccessToken = generateAccessToken(address, sessionId);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    });

  } catch (error: any) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Token refresh failed'
    });
  }
}));

// POST /api/auth/logout - Revoke tokens and Lit Protocol session
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const address = req.user?.address;

  if (!address) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    // Revoke refresh token
    await cacheSet(`refresh_token:${address}`, null, 1);
    
    // Revoke Lit Protocol session
    await litProtocolService.revokeSession(address);

    logger.info(`User logged out: ${address}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
}));

// GET /api/auth/me - Get current user info (requires authentication)
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const address = req.user?.address;

  if (!address) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  try {
    const litStatus = litProtocolService.getClientStatus();
    const hasRefreshToken = !!(await cacheGet(`refresh_token:${address}`));

    res.json({
      success: true,
      data: {
        address,
        sessionId: req.user?.sessionId,
        authenticated: true,
        hasRefreshToken,
        litProtocolStatus: litStatus
      }
    });

  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information'
    });
  }
}));

// POST /api/auth/encrypt - Encrypt data with Lit Protocol
router.post('/encrypt', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, data, accessType = 'user' } = req.body;

  if (!walletAddress || !data) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address and data are required'
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    let accessControlConditions;
    
    switch (accessType) {
      case 'user':
        accessControlConditions = await litProtocolService.createAccessControlConditions(walletAddress);
        break;
      case 'token':
        const { tokenAddress, minBalance } = req.body;
        if (!tokenAddress || !minBalance) {
          return res.status(400).json({
            success: false,
            error: 'Token address and minimum balance are required for token-gated access'
          });
        }
        accessControlConditions = await litProtocolService.createTokenGatedConditions(tokenAddress, minBalance);
        break;
      case 'nft':
        const { nftAddress } = req.body;
        if (!nftAddress) {
          return res.status(400).json({
            success: false,
            error: 'NFT address is required for NFT-gated access'
          });
        }
        accessControlConditions = await litProtocolService.createNFTGatedConditions(nftAddress);
        break;
      default:
        accessControlConditions = await litProtocolService.createAccessControlConditions(walletAddress);
    }

    // Get auth session (this would need to be implemented to retrieve from cache)
    const authSession = await litProtocolService.authenticateUser(walletAddress, '', '');
    const encryptedData = await litProtocolService.encryptData(data, accessControlConditions, authSession);

    res.json({
      success: true,
      data: encryptedData
    });

  } catch (error) {
    logger.error('Encryption error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt data'
    });
  }
}));

// POST /api/auth/decrypt - Decrypt data with Lit Protocol
router.post('/decrypt', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress, encryptedData } = req.body;

  if (!walletAddress || !encryptedData) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address and encrypted data are required'
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    // Get auth session (this would need to be implemented to retrieve from cache)
    const authSession = await litProtocolService.authenticateUser(walletAddress, '', '');
    const decryptedData = await litProtocolService.decryptData(encryptedData, authSession);

    res.json({
      success: true,
      data: {
        decryptedData
      }
    });

  } catch (error) {
    logger.error('Decryption error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decrypt data'
    });
  }
}));

export default router;
