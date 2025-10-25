import { Router, Request, Response } from 'express';
import { LitProtocolService } from '../services/litProtocolService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';
import { ethers } from 'ethers';

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
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const message = `Welcome to ChainMind!\n\nPlease sign this message to authenticate your wallet.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;

    res.json({
      success: true,
      data: {
        message,
        nonce
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

// POST /api/auth/connect - Verify signature and create Lit Protocol session
router.post('/connect', asyncHandler(async (req: Request, res: Response) => {
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
    const authSession = await litProtocolService.authenticateUser(address, signature, message);

    res.json({
      success: true,
      user: {
        address,
        sessionId: authSession.sessionId
      },
      authSession
    });

  } catch (error) {
    logger.error('Authentication verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}));

// POST /api/auth/logout - Revoke Lit Protocol session
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Valid wallet address is required'
    });
  }

  try {
    await litProtocolService.revokeSession(walletAddress);

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

// GET /api/auth/status - Check authentication status
router.get('/status/:walletAddress', asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      success: false,
      error: 'Valid wallet address is required'
    });
  }

  try {
    // This would check if there's a valid session in cache
    const litStatus = litProtocolService.getClientStatus();

    res.json({
      success: true,
      data: {
        walletAddress,
        authenticated: litStatus.connected && litStatus.initialized,
        litProtocolStatus: litStatus
      }
    });

  } catch (error) {
    logger.error('Authentication status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check authentication status'
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
