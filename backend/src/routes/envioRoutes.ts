import { Router, Request, Response } from 'express';
import { EnvioService } from '../services/envioService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';
import { ethers } from 'ethers';

const router = Router();
const envioService = new EnvioService();

// GET /api/envio/transactions/:address - Get transaction history
router.get('/transactions/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chainId = '1', limit = '50', offset = '0' } = req.query;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    const transactions = await envioService.getTransactionHistory(
      address,
      parseInt(chainId as string),
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: {
        address,
        chainId: parseInt(chainId as string),
        transactions,
        count: transactions.length
      }
    });

  } catch (error) {
    logger.error('Envio transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction history'
    });
  }
}));

// GET /api/envio/tokens/:address - Get token transfers
router.get('/tokens/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chainId = '1', limit = '50' } = req.query;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    const tokenTransfers = await envioService.getTokenTransfers(
      address,
      parseInt(chainId as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        address,
        chainId: parseInt(chainId as string),
        tokenTransfers,
        count: tokenTransfers.length
      }
    });

  } catch (error) {
    logger.error('Envio token transfers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token transfers'
    });
  }
}));

// GET /api/envio/nfts/:address - Get NFT transfers
router.get('/nfts/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chainId = '1', limit = '20' } = req.query;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    const nftTransfers = await envioService.getNFTTransfers(
      address,
      parseInt(chainId as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        address,
        chainId: parseInt(chainId as string),
        nftTransfers,
        count: nftTransfers.length
      }
    });

  } catch (error) {
    logger.error('Envio NFT transfers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT transfers'
    });
  }
}));

// GET /api/envio/defi/:address - Get DeFi interactions
router.get('/defi/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chainId = '1', limit = '30' } = req.query;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    const defiInteractions = await envioService.getDeFiInteractions(
      address,
      parseInt(chainId as string),
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: {
        address,
        chainId: parseInt(chainId as string),
        defiInteractions,
        count: defiInteractions.length
      }
    });

  } catch (error) {
    logger.error('Envio DeFi interactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DeFi interactions'
    });
  }
}));

// GET /api/envio/multichain/:address - Get multi-chain activity
router.get('/multichain/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chains } = req.query;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid wallet address'
    });
  }

  try {
    let chainIds = [1, 137, 42161]; // Default: Ethereum, Polygon, Arbitrum
    
    if (chains && typeof chains === 'string') {
      chainIds = chains.split(',').map(id => parseInt(id.trim()));
    }

    const activity = await envioService.getMultiChainActivity(address, chainIds);

    res.json({
      success: true,
      data: {
        address,
        chains: chainIds,
        ...activity,
        summary: {
          totalTransactions: activity.transactions.length,
          totalTokenTransfers: activity.tokenTransfers.length,
          totalNFTTransfers: activity.nftTransfers.length,
          totalDeFiInteractions: activity.defiInteractions.length
        }
      }
    });

  } catch (error) {
    logger.error('Envio multi-chain activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch multi-chain activity'
    });
  }
}));

// GET /api/envio/protocol/:address/stats - Get protocol statistics
router.get('/protocol/:address/stats', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chainId = '1' } = req.query;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid protocol address'
    });
  }

  try {
    const stats = await envioService.getProtocolStats(
      address,
      parseInt(chainId as string)
    );

    res.json({
      success: true,
      data: {
        protocolAddress: address,
        chainId: parseInt(chainId as string),
        stats
      }
    });

  } catch (error) {
    logger.error('Envio protocol stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protocol statistics'
    });
  }
}));

// GET /api/envio/chains - Get supported chains
router.get('/chains', asyncHandler(async (req: Request, res: Response) => {
  try {
    const chains = envioService.getSupportedChains();

    res.json({
      success: true,
      data: chains
    });

  } catch (error) {
    logger.error('Envio supported chains error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch supported chains'
    });
  }
}));

// GET /api/envio/protocols - Get known protocols
router.get('/protocols', asyncHandler(async (req: Request, res: Response) => {
  const { chainId = '1' } = req.query;

  try {
    const protocols = envioService.getKnownProtocols(parseInt(chainId as string));

    res.json({
      success: true,
      data: {
        chainId: parseInt(chainId as string),
        protocols
      }
    });

  } catch (error) {
    logger.error('Envio known protocols error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch known protocols'
    });
  }
}));

export default router;
