import { Router } from 'express';
import chatRoutes from './chatRoutes';
import portfolioRoutes from './portfolioRoutes';
import marketRoutes from './marketRoutes';
import securityRoutes from './securityRoutes';
import authRoutes from './authRoutes';
import envioRoutes from './envioRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ChainMind API is running',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// API routes
router.use('/chat', chatRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/market', marketRoutes);
router.use('/security', securityRoutes);
router.use('/auth', authRoutes);
router.use('/envio', envioRoutes);

export default router;
