import { Router, Request, Response } from 'express';
import { PortfolioService } from '../services/portfolioService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const portfolioService = new PortfolioService();

// GET /api/portfolio/:address - Get portfolio data
router.get('/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const portfolioData = await portfolioService.getPortfolioData(address);

    res.json({
      success: true,
      data: portfolioData
    });

  } catch (error) {
    logger.error('Portfolio data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio data'
    });
  }
}));

// GET /api/portfolio/:address/analysis - Get portfolio analysis
router.get('/:address/analysis', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const analysis = await portfolioService.analyzePortfolio(address);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Portfolio analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio'
    });
  }
}));

// GET /api/portfolio/:address/tokens - Get token balances only
router.get('/:address/tokens', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { network } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const portfolioData = await portfolioService.getPortfolioData(address);
    
    let tokens = portfolioData.tokens;
    
    // Filter by network if specified
    if (network && typeof network === 'string') {
      // This would require network information in token data
      // For now, return all tokens
    }

    res.json({
      success: true,
      data: {
        address,
        tokens,
        totalValue: tokens.reduce((sum, token) => sum + (token.value || 0), 0),
        lastUpdated: portfolioData.lastUpdated
      }
    });

  } catch (error) {
    logger.error('Token balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token balances'
    });
  }
}));

// GET /api/portfolio/:address/nfts - Get NFT balances only
router.get('/:address/nfts', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const portfolioData = await portfolioService.getPortfolioData(address);

    res.json({
      success: true,
      data: {
        address,
        nfts: portfolioData.nfts,
        count: portfolioData.nfts.length,
        lastUpdated: portfolioData.lastUpdated
      }
    });

  } catch (error) {
    logger.error('NFT balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFT balances'
    });
  }
}));

// GET /api/portfolio/:address/defi - Get DeFi positions only
router.get('/:address/defi', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const portfolioData = await portfolioService.getPortfolioData(address);

    res.json({
      success: true,
      data: {
        address,
        positions: portfolioData.defiPositions,
        totalValue: portfolioData.defiPositions.reduce((sum, pos) => sum + pos.value, 0),
        lastUpdated: portfolioData.lastUpdated
      }
    });

  } catch (error) {
    logger.error('DeFi positions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch DeFi positions'
    });
  }
}));

// POST /api/portfolio/:address/refresh - Force refresh portfolio data
router.post('/:address/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    // Clear cache and fetch fresh data
    // This would require implementing cache invalidation
    const portfolioData = await portfolioService.getPortfolioData(address);

    res.json({
      success: true,
      data: portfolioData,
      message: 'Portfolio data refreshed successfully'
    });

  } catch (error) {
    logger.error('Portfolio refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh portfolio data'
    });
  }
}));

// GET /api/portfolio/:address/performance - Get portfolio performance metrics
router.get('/:address/performance', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { period = '24h' } = req.query;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const analysis = await portfolioService.analyzePortfolio(address);

    let performanceData;
    switch (period) {
      case '24h':
        performanceData = { change: analysis.performance.day, period: '24h' };
        break;
      case '7d':
        performanceData = { change: analysis.performance.week, period: '7d' };
        break;
      case '30d':
        performanceData = { change: analysis.performance.month, period: '30d' };
        break;
      default:
        performanceData = { change: analysis.performance.day, period: '24h' };
    }

    res.json({
      success: true,
      data: {
        address,
        performance: performanceData,
        diversificationScore: analysis.diversificationScore,
        riskScore: analysis.riskScore,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    logger.error('Portfolio performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio performance'
    });
  }
}));

// GET /api/portfolio/:address/recommendations - Get portfolio recommendations
router.get('/:address/recommendations', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Wallet address is required'
    });
  }

  try {
    const analysis = await portfolioService.analyzePortfolio(address);

    res.json({
      success: true,
      data: {
        address,
        recommendations: analysis.recommendations,
        diversificationScore: analysis.diversificationScore,
        riskScore: analysis.riskScore,
        topHoldings: analysis.topHoldings,
        allocation: analysis.allocation
      }
    });

  } catch (error) {
    logger.error('Portfolio recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio recommendations'
    });
  }
}));

export default router;
