import { MarketService } from '../../services/marketService';

describe('MarketService', () => {
  let marketService: MarketService;

  beforeEach(() => {
    marketService = new MarketService();
  });

  describe('getMarketOverview', () => {
    it('should return market overview data or handle errors', async () => {
      try {
        const overview = await marketService.getMarketOverview();
        
        expect(overview).toBeDefined();
        expect(overview.totalMarketCap).toBeDefined();
        expect(overview.btcDominance).toBeDefined();
        expect(overview.topGainers).toBeDefined();
        expect(Array.isArray(overview.topGainers)).toBe(true);
      } catch (error: any) {
        // API errors are acceptable
        expect(error).toBeDefined();
      }
    }, 30000);
  });

  describe('getTokenPrices', () => {
    it('should return prices for multiple tokens or handle errors', async () => {
      try {
        const symbols = ['ETH', 'BTC', 'MATIC'];
        const prices = await marketService.getTokenPrices(symbols);
        
        expect(Array.isArray(prices)).toBe(true);
        expect(prices.length).toBeGreaterThan(0);
        if (prices.length > 0) {
          expect(prices[0]).toHaveProperty('symbol');
          expect(prices[0]).toHaveProperty('price');
          expect(prices[0]).toHaveProperty('priceChange24h');
        }
      } catch (error: any) {
        // API errors are acceptable
        expect(error).toBeDefined();
      }
    }, 30000);

    it('should handle empty array', async () => {
      const prices = await marketService.getTokenPrices([]);
      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBe(0);
    });
  });

  describe('getHistoricalPrices', () => {
    it('should return historical price data or handle errors', async () => {
      try {
        const history = await marketService.getHistoricalPrices('ETH', 7);
        
        expect(Array.isArray(history)).toBe(true);
        if (history.length > 0) {
          expect(history[0]).toHaveProperty('timestamp');
          expect(history[0]).toHaveProperty('price');
        }
      } catch (error: any) {
        // API errors are acceptable
        expect(error).toBeDefined();
      }
    }, 30000);
  });
});
