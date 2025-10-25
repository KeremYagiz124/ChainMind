import { Router, Request, Response } from 'express';
import { MarketService } from '../services/marketService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const marketService = new MarketService();

// GET /api/market/overview - Get market overview
router.get('/overview', asyncHandler(async (req: Request, res: Response) => {
  try {
    const overview = await marketService.getMarketOverview();

    res.json({
      success: true,
      data: overview
    });

  } catch (error) {
    logger.error('Market overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market overview'
    });
  }
}));

// GET /api/market/prices - Get token prices
router.get('/prices', asyncHandler(async (req: Request, res: Response) => {
  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({
      success: false,
      error: 'Token symbols are required (comma-separated)'
    });
  }

  try {
    const symbolArray = (symbols as string).split(',').map(s => s.trim().toUpperCase());
    const prices = await marketService.getTokenPrices(symbolArray);

    res.json({
      success: true,
      data: prices
    });

  } catch (error) {
    logger.error('Token prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token prices'
    });
  }
}));

// GET /api/market/prices/:symbol - Get single token price
router.get('/prices/:symbol', asyncHandler(async (req: Request, res: Response) => {
  const { symbol } = req.params;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Token symbol is required'
    });
  }

  try {
    const prices = await marketService.getTokenPrices([symbol.toUpperCase()]);
    const tokenPrice = prices.find(p => p.symbol === symbol.toUpperCase());

    if (!tokenPrice) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    res.json({
      success: true,
      data: tokenPrice
    });

  } catch (error) {
    logger.error('Single token price error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token price'
    });
  }
}));

// GET /api/market/historical/:symbol - Get historical prices
router.get('/historical/:symbol', asyncHandler(async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const { days = '7' } = req.query;

  if (!symbol) {
    return res.status(400).json({
      success: false,
      error: 'Token symbol is required'
    });
  }

  try {
    const daysNumber = parseInt(days as string);
    if (isNaN(daysNumber) || daysNumber < 1 || daysNumber > 365) {
      return res.status(400).json({
        success: false,
        error: 'Days must be a number between 1 and 365'
      });
    }

    const historicalPrices = await marketService.getHistoricalPrices(symbol.toUpperCase(), daysNumber);

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        days: daysNumber,
        prices: historicalPrices
      }
    });

  } catch (error) {
    logger.error('Historical prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch historical prices'
    });
  }
}));

// GET /api/market/trending - Get trending tokens
router.get('/trending', asyncHandler(async (req: Request, res: Response) => {
  try {
    const overview = await marketService.getMarketOverview();

    res.json({
      success: true,
      data: {
        topGainers: overview.topGainers,
        topLosers: overview.topLosers
      }
    });

  } catch (error) {
    logger.error('Trending tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending tokens'
    });
  }
}));

// GET /api/market/search - Search for tokens
router.get('/search', asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  try {
    // Simple search implementation - in production, this would use a proper search service
    const commonTokens = [
      { symbol: 'BTC', name: 'Bitcoin', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
      { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8435b662303c0f218C8F8c0c0c' },
      { symbol: 'USDT', name: 'Tether USD', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
      { symbol: 'MATIC', name: 'Polygon', address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0' },
      { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
      { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
      { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9' }
    ];

    const searchQuery = query.toLowerCase();
    const results = commonTokens.filter(token => 
      token.symbol.toLowerCase().includes(searchQuery) || 
      token.name.toLowerCase().includes(searchQuery)
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    logger.error('Token search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tokens'
    });
  }
}));

// GET /api/market/stats - Get market statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const overview = await marketService.getMarketOverview();

    const stats = {
      totalMarketCap: overview.totalMarketCap,
      totalVolume24h: overview.totalVolume24h,
      btcDominance: overview.btcDominance,
      ethDominance: overview.ethDominance,
      fearGreedIndex: overview.fearGreedIndex || null,
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Market stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market statistics'
    });
  }
}));

export default router;
