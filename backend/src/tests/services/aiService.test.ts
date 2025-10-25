import { AIService } from '../../services/aiService';
import { MarketService } from '../../services/marketService';
import { PortfolioService } from '../../services/portfolioService';
import { SecurityService } from '../../services/securityService';

// Mock the services
jest.mock('../../services/marketService');
jest.mock('../../services/portfolioService');
jest.mock('../../services/securityService');
jest.mock('openai');

describe('AIService', () => {
  let aiService: AIService;
  let mockMarketService: jest.Mocked<MarketService>;
  let mockPortfolioService: jest.Mocked<PortfolioService>;
  let mockSecurityService: jest.Mocked<SecurityService>;

  beforeEach(() => {
    mockMarketService = new MarketService() as jest.Mocked<MarketService>;
    mockPortfolioService = new PortfolioService() as jest.Mocked<PortfolioService>;
    mockSecurityService = new SecurityService() as jest.Mocked<SecurityService>;
    
    aiService = new AIService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeIntent', () => {
    it('should identify portfolio intent', () => {
      const result = aiService.analyzeIntent('Show me my portfolio balance');
      expect(result.intent).toBe('portfolio');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify market intent', () => {
      const result = aiService.analyzeIntent('What is the price of Bitcoin?');
      expect(result.intent).toBe('market');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify security intent', () => {
      const result = aiService.analyzeIntent('Is Uniswap protocol safe?');
      expect(result.intent).toBe('security');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should identify general intent for unclear queries', () => {
      const result = aiService.analyzeIntent('Hello there');
      expect(result.intent).toBe('general');
    });
  });

  describe('extractTokens', () => {
    it('should extract token symbols from text', () => {
      const tokens = aiService.extractTokens('I want to buy ETH and BTC');
      expect(tokens).toContain('ETH');
      expect(tokens).toContain('BTC');
    });

    it('should extract token names from text', () => {
      const tokens = aiService.extractTokens('What about Ethereum and Bitcoin prices?');
      expect(tokens).toContain('ethereum');
      expect(tokens).toContain('bitcoin');
    });

    it('should return empty array for text without tokens', () => {
      const tokens = aiService.extractTokens('Hello how are you?');
      expect(tokens).toEqual([]);
    });
  });

  describe('extractProtocols', () => {
    it('should extract protocol names from text', () => {
      const protocols = aiService.extractProtocols('Is Uniswap and Aave safe to use?');
      expect(protocols).toContain('uniswap');
      expect(protocols).toContain('aave');
    });

    it('should return empty array for text without protocols', () => {
      const protocols = aiService.extractProtocols('What is the weather today?');
      expect(protocols).toEqual([]);
    });
  });

  describe('processMessage', () => {
    const mockUserId = 'user123';
    const mockConversationId = 'conv123';

    it('should process portfolio query', async () => {
      const mockPortfolioData = {
        totalValue: '1000',
        tokens: [],
        nfts: [],
        defiPositions: []
      };

      mockPortfolioService.getPortfolio.mockResolvedValue(mockPortfolioData);

      const result = await aiService.processMessage(
        'Show me my portfolio',
        mockUserId,
        mockConversationId
      );

      expect(result.response).toContain('portfolio');
      expect(result.intent).toBe('portfolio');
      expect(mockPortfolioService.getPortfolio).toHaveBeenCalledWith(mockUserId);
    });

    it('should process market query', async () => {
      const mockMarketData = {
        symbol: 'ETH',
        price: 2000,
        change24h: 5.5
      };

      mockMarketService.getTokenPrice.mockResolvedValue(mockMarketData);

      const result = await aiService.processMessage(
        'What is ETH price?',
        mockUserId,
        mockConversationId
      );

      expect(result.response).toContain('ETH');
      expect(result.intent).toBe('market');
    });

    it('should process security query', async () => {
      const mockSecurityData = {
        protocol: 'uniswap',
        riskScore: 25,
        isAudited: true,
        vulnerabilities: []
      };

      mockSecurityService.analyzeProtocol.mockResolvedValue(mockSecurityData);

      const result = await aiService.processMessage(
        'Is Uniswap safe?',
        mockUserId,
        mockConversationId
      );

      expect(result.response).toContain('Uniswap');
      expect(result.intent).toBe('security');
    });

    it('should handle general conversation', async () => {
      const result = await aiService.processMessage(
        'Hello, how are you?',
        mockUserId,
        mockConversationId
      );

      expect(result.response).toBeTruthy();
      expect(result.intent).toBe('general');
    });

    it('should handle errors gracefully', async () => {
      mockPortfolioService.getPortfolio.mockRejectedValue(new Error('Service error'));

      const result = await aiService.processMessage(
        'Show me my portfolio',
        mockUserId,
        mockConversationId
      );

      expect(result.response).toContain('error');
      expect(result.intent).toBe('portfolio');
    });
  });

  describe('generateQuickActions', () => {
    it('should generate portfolio quick actions', () => {
      const actions = aiService.generateQuickActions('portfolio');
      expect(actions).toContain('View Portfolio');
      expect(actions).toContain('Refresh Data');
    });

    it('should generate market quick actions', () => {
      const actions = aiService.generateQuickActions('market');
      expect(actions).toContain('Market Overview');
      expect(actions).toContain('Top Gainers');
    });

    it('should generate security quick actions', () => {
      const actions = aiService.generateQuickActions('security');
      expect(actions).toContain('Protocol Analysis');
      expect(actions).toContain('Security Alerts');
    });

    it('should generate default quick actions for unknown intent', () => {
      const actions = aiService.generateQuickActions('unknown');
      expect(actions).toContain('Help');
      expect(actions.length).toBeGreaterThan(0);
    });
  });
});
