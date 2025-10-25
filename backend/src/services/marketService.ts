import axios from 'axios';
// Pyth Network integration will use HTTP API directly
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';
import { getDatabase } from '../config/database';

export interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: Date;
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex?: number;
  topGainers: TokenPrice[];
  topLosers: TokenPrice[];
}

export class MarketService {
  private db = getDatabase();

  // Pyth price feed IDs for major tokens
  private readonly PRICE_FEED_IDS = {
    'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    'MATIC': '0x5de33a9112c2b700b8d30b8a3402c103578ccfa2765696471cc672bd5cf6ac52',
    'AVAX': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
    'LINK': '0x8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221',
    'UNI': '0x78d185a741d07edb3412b09008b7c5cfb9bbbd7d568bf00ba737b456ba171501'
  };

  constructor() {
    // Pyth Network integration via HTTP API
  }

  async getTokenPrices(symbols: string[]): Promise<TokenPrice[]> {
    const cacheKey = `token_prices:${symbols.sort().join(',')}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      logger.debug('Returning cached token prices');
      return cached;
    }

    try {
      const prices: TokenPrice[] = [];
      
      // Get prices from Pyth Network
      const pythPrices = await this.getPythPrices(symbols);
      prices.push(...pythPrices);

      // Fallback to CoinGecko for tokens not available on Pyth
      const missingSymbols = symbols.filter(
        symbol => !prices.find(p => p.symbol === symbol)
      );
      
      if (missingSymbols.length > 0) {
        const coingeckoPrices = await this.getCoingeckoPrices(missingSymbols);
        prices.push(...coingeckoPrices);
      }

      // Store in database
      await this.storePricesInDB(prices);

      // Cache for 1 minute
      await cacheSet(cacheKey, prices, 60);

      return prices;
    } catch (error) {
      logger.error('Error fetching token prices:', error);
      
      // Fallback to database
      return await this.getPricesFromDB(symbols);
    }
  }

  private async getPythPrices(symbols: string[]): Promise<TokenPrice[]> {
    try {
      const priceIds = symbols
        .map(symbol => this.PRICE_FEED_IDS[symbol as keyof typeof this.PRICE_FEED_IDS])
        .filter(Boolean);

      if (priceIds.length === 0) return [];

      // Use Pyth HTTP API directly
      const response = await axios.get(`https://hermes.pyth.network/api/latest_price_feeds`, {
        params: { ids: priceIds },
        timeout: 10000
      });
      const priceFeeds = response.data;
      const prices: TokenPrice[] = [];

      for (const priceFeed of priceFeeds || []) {
        const price = priceFeed.price;
        const symbol = this.getSymbolFromPriceId(priceFeed.id);
        
        if (price && symbol && price.publish_time) {
          prices.push({
            symbol,
            price: parseFloat(price.price) * Math.pow(10, price.expo),
            change24h: 0, // Pyth doesn't provide 24h change directly
            volume24h: 0,
            lastUpdated: new Date(price.publish_time * 1000)
          });
        }
      }

      logger.info(`Fetched ${prices.length} prices from Pyth Network`);
      return prices;
    } catch (error) {
      logger.error('Pyth Network error:', error);
      return [];
    }
  }

  private async getCoingeckoPrices(symbols: string[]): Promise<TokenPrice[]> {
    try {
      const symbolsString = symbols.join(',');
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: symbolsString.toLowerCase(),
            vs_currencies: 'usd',
            include_24hr_change: true,
            include_24hr_vol: true,
            include_market_cap: true
          },
          timeout: 10000
        }
      );

      const prices: TokenPrice[] = [];
      
      for (const [id, data] of Object.entries(response.data)) {
        const priceData = data as any;
        prices.push({
          symbol: id.toUpperCase(),
          price: priceData.usd || 0,
          change24h: priceData.usd_24h_change || 0,
          volume24h: priceData.usd_24h_vol || 0,
          marketCap: priceData.usd_market_cap,
          lastUpdated: new Date()
        });
      }

      logger.info(`Fetched ${prices.length} prices from CoinGecko`);
      return prices;
    } catch (error) {
      logger.error('CoinGecko API error:', error);
      return [];
    }
  }

  async getMarketOverview(): Promise<MarketOverview> {
    const cacheKey = 'market_overview';
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get global market data from CoinGecko
      const globalResponse = await axios.get(
        'https://api.coingecko.com/api/v3/global',
        { timeout: 10000 }
      );

      const globalData = globalResponse.data.data;

      // Get top gainers and losers
      const marketsResponse = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: 100,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h'
          },
          timeout: 10000
        }
      );

      const markets = marketsResponse.data;
      
      // Sort by 24h change
      const sortedByChange = markets
        .filter((coin: any) => coin.price_change_percentage_24h !== null)
        .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h);

      const topGainers = sortedByChange.slice(0, 5).map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        lastUpdated: new Date()
      }));

      const topLosers = sortedByChange.slice(-5).reverse().map((coin: any) => ({
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        lastUpdated: new Date()
      }));

      const overview: MarketOverview = {
        totalMarketCap: globalData.total_market_cap.usd,
        totalVolume24h: globalData.total_volume.usd,
        btcDominance: globalData.market_cap_percentage.btc,
        ethDominance: globalData.market_cap_percentage.eth,
        topGainers,
        topLosers
      };

      // Cache for 5 minutes
      await cacheSet(cacheKey, overview, 300);

      return overview;
    } catch (error) {
      logger.error('Error fetching market overview:', error);
      
      // Return default overview
      return {
        totalMarketCap: 0,
        totalVolume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        topGainers: [],
        topLosers: []
      };
    }
  }

  private async storePricesInDB(prices: TokenPrice[]): Promise<void> {
    try {
      for (const price of prices) {
        await this.db.marketData.create({
          data: {
            symbol: price.symbol,
            price: price.price.toString(),
            change24h: price.change24h.toString(),
            volume24h: price.volume24h.toString(),
            marketCap: (price.marketCap || 0).toString(),
            source: 'chainmind',
            timestamp: price.lastUpdated
          }
        });
      }
    } catch (error) {
      logger.error('Error storing prices in database:', error);
    }
  }

  private async getPricesFromDB(symbols: string[]): Promise<TokenPrice[]> {
    try {
      const prices = await this.db.marketData.findMany({
        where: {
          symbol: { in: symbols },
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        orderBy: { timestamp: 'desc' },
        distinct: ['symbol']
      });

      return prices.map((price: any) => ({
        symbol: price.symbol,
        price: parseFloat(price.price.toString()),
        change24h: parseFloat(price.change24h?.toString() || '0'),
        volume24h: parseFloat(price.volume24h?.toString() || '0'),
        marketCap: parseFloat(price.marketCap?.toString() || '0'),
        lastUpdated: price.timestamp
      }));
    } catch (error) {
      logger.error('Error fetching prices from database:', error);
      return [];
    }
  }

  private getSymbolFromPriceId(priceId: string): string | null {
    for (const [symbol, id] of Object.entries(this.PRICE_FEED_IDS)) {
      if (id === priceId) return symbol;
    }
    return null;
  }

  async getHistoricalPrices(symbol: string, days: number = 7): Promise<Array<{timestamp: Date, price: number}>> {
    const cacheKey = `historical_prices:${symbol}:${days}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Get from database first
      const dbPrices = await this.db.marketData.findMany({
        where: {
          symbol,
          timestamp: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { timestamp: 'asc' }
      });

      const historicalPrices = dbPrices.map((price: any) => ({
        timestamp: price.timestamp,
        price: parseFloat(price.price.toString())
      }));

      // Cache for 1 hour
      await cacheSet(cacheKey, historicalPrices, 3600);

      return historicalPrices;
    } catch (error) {
      logger.error('Error fetching historical prices:', error);
      return [];
    }
  }
}
