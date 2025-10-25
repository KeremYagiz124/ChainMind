import request from 'supertest';
import { app } from '../../index';
import { AIService } from '../../services/aiService';

jest.mock('../../services/aiService');

describe('Chat Routes', () => {
  let mockAIService: jest.Mocked<AIService>;

  beforeEach(() => {
    mockAIService = new AIService() as jest.Mocked<AIService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/chat/message', () => {
    const validPayload = {
      message: 'Hello, what is my portfolio balance?',
      userId: 'user123',
      conversationId: 'conv123'
    };

    it('should process chat message successfully', async () => {
      const mockResponse = {
        response: 'Your portfolio balance is $1,000',
        intent: 'portfolio',
        confidence: 0.95,
        quickActions: ['View Portfolio', 'Refresh Data'],
        contextData: {}
      };

      mockAIService.processMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat/message')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(mockResponse.response);
      expect(response.body.data.intent).toBe(mockResponse.intent);
    });

    it('should return 400 for missing message', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .send({ userId: 'user123', conversationId: 'conv123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Message is required');
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/chat/message')
        .send({ message: 'Hello', conversationId: 'conv123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('User ID is required');
    });

    it('should handle AI service errors', async () => {
      mockAIService.processMessage.mockRejectedValue(new Error('AI service error'));

      const response = await request(app)
        .post('/api/chat/message')
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to process message');
    });
  });

  describe('GET /api/chat/conversations/:userId', () => {
    it('should get user conversations', async () => {
      const response = await request(app)
        .get('/api/chat/conversations/user123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 400 for invalid userId', async () => {
      const response = await request(app)
        .get('/api/chat/conversations/');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/chat/quick-action', () => {
    const validActionPayload = {
      action: 'View Portfolio',
      userId: 'user123',
      conversationId: 'conv123'
    };

    it('should execute quick action successfully', async () => {
      const mockResponse = {
        response: 'Here is your portfolio overview',
        intent: 'portfolio',
        confidence: 1.0,
        quickActions: [],
        contextData: { portfolioData: {} }
      };

      mockAIService.processMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat/quick-action')
        .send(validActionPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.response).toBe(mockResponse.response);
    });

    it('should return 400 for missing action', async () => {
      const response = await request(app)
        .post('/api/chat/quick-action')
        .send({ userId: 'user123', conversationId: 'conv123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Action is required');
    });
  });

  describe('GET /api/chat/conversation/:conversationId/messages', () => {
    it('should get conversation messages', async () => {
      const response = await request(app)
        .get('/api/chat/conversation/conv123/messages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/chat/conversation/conv123/messages?limit=10&offset=0');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/chat/conversation/:conversationId', () => {
    it('should delete conversation successfully', async () => {
      const response = await request(app)
        .delete('/api/chat/conversation/conv123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });
  });
});
