import { Router, Request, Response } from 'express';
import { AIService, ChatContext } from '../services/aiService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorMiddleware';

const router = Router();
const aiService = new AIService();

// Database is optional
let db: any = null;
try {
  const { getDatabase } = require('../config/database');
  db = getDatabase();
} catch (err) {
  logger.warn('Database not available for chat routes');
}

// POST /api/chat/message - Send a message to the AI
router.post('/message', asyncHandler(async (req: Request, res: Response) => {
  const { message, userAddress, conversationId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Message is required and must be a string'
    });
  }

  try {
    // Get conversation context
    const context: ChatContext = {
      userAddress: userAddress || 'anonymous',
      conversationHistory: [],
      userPreferences: {}
    };

    // Get AI response first (works without DB)
    const aiResponse = await aiService.processMessage(message, context);

    // Try to store in database if available
    let conversation, userMessage, aiMessage;
    if (db) {
      try {
        // Get or create conversation
        if (conversationId) {
          conversation = await db.conversation.findUnique({
            where: { id: conversationId },
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 10
              }
            }
          });
        } else {
          // Create new conversation
          conversation = await db.conversation.create({
            data: {
              userAddress: userAddress || 'anonymous',
              title: message.substring(0, 50) + '...',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }

        // Create user message
        userMessage = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: message,
            sender: 'user',
            type: 'text',
            metadata: {},
            createdAt: new Date()
          }
        });

        // Create AI message
        aiMessage = await db.message.create({
          data: {
            conversationId: conversation.id,
            content: aiResponse.content,
            role: 'assistant',
            metadata: aiResponse.metadata || {},
            createdAt: new Date()
          }
        });
      } catch (dbError) {
        logger.error('Database error in chat, continuing without persistence:', dbError);
      }
    }

    res.json({
      success: true,
      message: aiResponse.content,
      metadata: aiResponse.metadata,
      userMessage,
      aiMessage,
      conversation,
      stored: !!conversation
    });

  } catch (error: any) {
    logger.error('Chat message error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to process message' 
    });
  }
}));

// GET /api/chat/conversations/:userAddress - Get conversation messages
router.get('/conversations/:userAddress', asyncHandler(async (req: Request, res: Response) => {
  const { userAddress } = req.params;
  
  if (!db) {
    return res.status(503).json({
      success: false,
      error: 'Database not available'
    });
  }
  
  try {
    const conversations = await db.conversation.findMany({
      where: { userAddress },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 5 // Last 5 messages for preview
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: conversations });
  } catch (error: any) {
    logger.error('Get conversations error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to get conversations' 
    });
  }
}));

// DELETE /api/chat/conversation/:id - Delete conversation
router.delete('/conversation/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!db) {
    return res.status(503).json({
      success: false,
      error: 'Database not available'
    });
  }
  
  try {
    // Delete messages first (cascade should handle this, but being explicit)
    await db.message.deleteMany({
      where: { conversationId: id }
    });

    // Delete conversation
    await db.conversation.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Conversation deleted' });

  } catch (error) {
    logger.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
}));

// POST /api/chat/conversations/:id/title - Update conversation title
router.post('/conversations/:id/title', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, userAddress } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Title is required and must be a string'
    });
  }

  if (!db) {
    return res.status(503).json({
      success: false,
      error: 'Database not available'
    });
  }

  try {
    const conversation = await db.conversation.findFirst({
      where: {
        id,
        userId: userAddress || undefined
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    await db.conversation.update({
      where: { id },
      data: { title: title.slice(0, 100) } // Limit title length
    });

    res.json({
      success: true,
      message: 'Conversation title updated successfully'
    });

  } catch (error: any) {
    logger.error('Update conversation title error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update conversation title'
    });
  }
}));

// GET /api/chat/quick-actions - Get available quick actions
router.get('/quick-actions', asyncHandler(async (req: Request, res: Response) => {
  const quickActions = [
    {
      id: 'portfolio',
      label: 'Analyze My Portfolio',
      description: 'Get insights about your crypto holdings',
      icon: '📊',
      prompt: 'Analyze my portfolio and give me insights about my holdings'
    },
    {
      id: 'market',
      label: 'Market Overview',
      description: 'Get current market trends and analysis',
      icon: '📈',
      prompt: 'Give me an overview of the current crypto market'
    },
    {
      id: 'security',
      label: 'Security Check',
      description: 'Check the security of DeFi protocols',
      icon: '🔒',
      prompt: 'Help me check the security of a DeFi protocol'
    },
    {
      id: 'education',
      label: 'Learn DeFi',
      description: 'Learn about DeFi concepts and strategies',
      icon: '🎓',
      prompt: 'Teach me about DeFi and how to get started'
    },
    {
      id: 'prices',
      label: 'Token Prices',
      description: 'Get real-time cryptocurrency prices',
      icon: '💰',
      prompt: 'Show me the current prices of major cryptocurrencies'
    },
    {
      id: 'news',
      label: 'Crypto News',
      description: 'Get latest cryptocurrency and DeFi news',
      icon: '📰',
      prompt: 'What are the latest developments in crypto and DeFi?'
    }
  ];

  res.json({
    success: true,
    data: quickActions
  });
}));

export default router;
