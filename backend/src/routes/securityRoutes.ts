import { Router, Request, Response } from 'express';
import { SecurityService } from '../services/securityService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const securityService = new SecurityService();

// POST /api/security/analyze - Analyze protocol or contract security
router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { protocol, contractAddress } = req.body;

  if (!protocol && !contractAddress) {
    return res.status(400).json({
      success: false,
      error: 'Either protocol name or contract address is required'
    });
  }

  try {
    const identifier = contractAddress || protocol;
    const analysis = await securityService.analyzeProtocol(identifier);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Security analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze protocol security'
    });
  }
}));

// GET /api/security/protocol/:name - Get protocol security info
router.get('/protocol/:name', asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Protocol name is required'
    });
  }

  try {
    const analysis = await securityService.analyzeProtocol(name);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Protocol security error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protocol security information'
    });
  }
}));

// GET /api/security/contract/:address - Get contract security info
router.get('/contract/:address', asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;

  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Contract address is required'
    });
  }

  try {
    const analysis = await securityService.analyzeProtocol(address);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    logger.error('Contract security error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract security information'
    });
  }
}));

// GET /api/security/risk-score/:protocol - Get protocol risk score only
router.get('/risk-score/:protocol', asyncHandler(async (req: Request, res: Response) => {
  const { protocol } = req.params;

  if (!protocol) {
    return res.status(400).json({
      success: false,
      error: 'Protocol name is required'
    });
  }

  try {
    const riskScore = await securityService.getProtocolRiskScore(protocol);

    res.json({
      success: true,
      data: {
        protocol,
        riskScore,
        riskLevel: riskScore >= 80 ? 'critical' : 
                  riskScore >= 60 ? 'high' : 
                  riskScore >= 30 ? 'medium' : 'low'
      }
    });

  } catch (error) {
    logger.error('Risk score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch protocol risk score'
    });
  }
}));

// GET /api/security/alerts/:userAddress - Get security alerts for user
router.get('/alerts/:userAddress', asyncHandler(async (req: Request, res: Response) => {
  const { userAddress } = req.params;

  if (!userAddress) {
    return res.status(400).json({
      success: false,
      error: 'User address is required'
    });
  }

  try {
    const alerts = await securityService.getSecurityAlerts(userAddress);

    res.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    logger.error('Security alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security alerts'
    });
  }
}));

// GET /api/security/protocols - Get list of known protocols
router.get('/protocols', asyncHandler(async (req: Request, res: Response) => {
  try {
    const knownProtocols = [
      {
        name: 'Uniswap V3',
        slug: 'uniswap',
        category: 'dex',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Leading decentralized exchange protocol'
      },
      {
        name: 'Aave V3',
        slug: 'aave',
        category: 'lending',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Decentralized lending and borrowing protocol'
      },
      {
        name: 'Compound V3',
        slug: 'compound',
        category: 'lending',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Algorithmic money market protocol'
      },
      {
        name: 'Curve Finance',
        slug: 'curve',
        category: 'dex',
        riskLevel: 'medium',
        auditStatus: 'audited',
        description: 'Stablecoin and similar asset exchange'
      },
      {
        name: 'SushiSwap',
        slug: 'sushiswap',
        category: 'dex',
        riskLevel: 'medium',
        auditStatus: 'audited',
        description: 'Community-driven DEX and DeFi platform'
      }
    ];

    res.json({
      success: true,
      data: knownProtocols
    });

  } catch (error) {
    logger.error('Known protocols error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch known protocols'
    });
  }
}));

// POST /api/security/report - Report security issue
router.post('/report', asyncHandler(async (req: Request, res: Response) => {
  const { protocol, contractAddress, issueType, description, userAddress } = req.body;

  if (!protocol && !contractAddress) {
    return res.status(400).json({
      success: false,
      error: 'Either protocol name or contract address is required'
    });
  }

  if (!issueType || !description) {
    return res.status(400).json({
      success: false,
      error: 'Issue type and description are required'
    });
  }

  try {
    // In a real implementation, this would store the report in the database
    // and potentially trigger alerts or notifications
    
    logger.info('Security issue reported:', {
      protocol,
      contractAddress,
      issueType,
      description,
      userAddress,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Security issue reported successfully',
      data: {
        reportId: `report_${Date.now()}`,
        status: 'submitted',
        timestamp: new Date()
      }
    });

  } catch (error) {
    logger.error('Security report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit security report'
    });
  }
}));

export default router;
