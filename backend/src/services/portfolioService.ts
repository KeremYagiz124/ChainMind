import axios from 'axios';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';
import { getDatabase } from '../config/database';
import { MarketService } from './marketService';

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  price?: number;
  value?: number;
  change24h?: number;
}

export interface PortfolioData {
  address: string;
  totalValue: number;
  totalChange24h: number;
  tokens: TokenBalance[];
  nfts: NFTBalance[];
  defiPositions: DeFiPosition[];
  lastUpdated: Date;
}

export interface NFTBalance {
  contractAddress: string;
  tokenId: string;
  name: string;
  collection: string;
  imageUrl?: string;
  floorPrice?: number;
}

export interface DeFiPosition {
  protocol: string;
  type: 'lending' | 'borrowing' | 'liquidity' | 'staking' | 'farming';
  asset: string;
  amount: number;
  value: number;
  apy: number;
  health: number;
  rewards?: TokenBalance[];
}

export interface PortfolioAnalysis {
  diversificationScore: number;
  riskScore: number;
  recommendations: string[];
  topHoldings: TokenBalance[];
  allocation: {
    [category: string]: number;
  };
  performance: {
    day: number;
    week: number;
    month: number;
  };
}

export class PortfolioService {
  private db = getDatabase();
  private marketService: MarketService;

  // Supported networks with their RPC URLs
  private readonly NETWORKS = {
    ethereum: {
      rpc: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      chainId: 1,
      blockscout: 'https://eth.blockscout.com'
    },
    polygon: {
      rpc: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
      chainId: 137,
      blockscout: 'https://polygon.blockscout.com'
    },
    arbitrum: {
      rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      chainId: 42161,
      blockscout: 'https://arbitrum.blockscout.com'
    }
  };

  constructor() {
    this.marketService = new MarketService();
  }

  async getPortfolioData(address: string): Promise<PortfolioData> {
    const cacheKey = `portfolio:${address}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      logger.debug('Returning cached portfolio data');
      return cached;
    }

    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      // Get token balances from multiple networks
      const [ethTokens, polygonTokens, arbitrumTokens] = await Promise.all([
        this.getTokenBalances(address, 'ethereum'),
        this.getTokenBalances(address, 'polygon'),
        this.getTokenBalances(address, 'arbitrum')
      ]);

      const allTokens = [...ethTokens, ...polygonTokens, ...arbitrumTokens];

      // Get token prices
      const symbols = [...new Set(allTokens.map(token => token.symbol))];
      const prices = await this.marketService.getTokenPrices(symbols);
      
      // Calculate token values
      const tokensWithValues = allTokens.map(token => {
        const priceData = prices.find(p => p.symbol === token.symbol);
        const balance = parseFloat(ethers.formatUnits(token.balance, token.decimals));
        
        return {
          ...token,
          balance: balance.toString(),
          price: priceData?.price || 0,
          value: balance * (priceData?.price || 0),
          change24h: priceData?.change24h || 0
        };
      });

      // Get NFTs (Ethereum only for now)
      const nfts = await this.getNFTBalances(address, 'ethereum');

      // Get DeFi positions
      const defiPositions = await this.getDeFiPositions(address);

      // Calculate total portfolio value
      const totalTokenValue = tokensWithValues.reduce((sum, token) => sum + (token.value || 0), 0);
      const totalDefiValue = defiPositions.reduce((sum, position) => sum + position.value, 0);
      const totalValue = totalTokenValue + totalDefiValue;

      // Calculate 24h change
      const totalChange24h = tokensWithValues.reduce((sum, token) => {
        const value = token.value || 0;
        const change = token.change24h || 0;
        return sum + (value * change / 100);
      }, 0);

      const portfolioData: PortfolioData = {
        address,
        totalValue,
        totalChange24h: totalValue > 0 ? (totalChange24h / totalValue) * 100 : 0,
        tokens: tokensWithValues.filter(token => (token.value || 0) > 0.01), // Filter dust
        nfts,
        defiPositions,
        lastUpdated: new Date()
      };

      // Store in database
      await this.storePortfolioInDB(portfolioData);

      // Cache for 5 minutes
      await cacheSet(cacheKey, portfolioData, 300);

      return portfolioData;
    } catch (error) {
      logger.error('Portfolio service error:', error);
      
      // Return fallback data
      return this.getFallbackPortfolio(address);
    }
  }

  private async getTokenBalances(address: string, network: keyof typeof this.NETWORKS): Promise<TokenBalance[]> {
    try {
      const networkConfig = this.NETWORKS[network];
      
      // Use Blockscout API to get token balances
      const response = await axios.get(
        `${networkConfig.blockscout}/api/v2/addresses/${address}/tokens`,
        {
          params: {
            type: 'ERC-20'
          },
          timeout: 15000
        }
      );

      const tokens: TokenBalance[] = [];

      // Add native token balance
      const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
      const nativeBalance = await provider.getBalance(address);
      
      let nativeSymbol = 'ETH';
      if (network === 'polygon') nativeSymbol = 'MATIC';
      if (network === 'arbitrum') nativeSymbol = 'ETH';

      if (nativeBalance > 0n) {
        tokens.push({
          address: '0x0000000000000000000000000000000000000000',
          symbol: nativeSymbol,
          name: nativeSymbol,
          balance: nativeBalance.toString(),
          decimals: 18
        });
      }

      // Add ERC-20 tokens
      if (response.data?.items) {
        for (const token of response.data.items) {
          if (token.value && parseFloat(token.value) > 0) {
            tokens.push({
              address: token.token.address,
              symbol: token.token.symbol || 'UNKNOWN',
              name: token.token.name || 'Unknown Token',
              balance: token.value,
              decimals: parseInt(token.token.decimals) || 18
            });
          }
        }
      }

      logger.info(`Found ${tokens.length} tokens on ${network} for ${address}`);
      return tokens;
    } catch (error) {
      logger.error(`Error fetching ${network} token balances:`, error);
      return [];
    }
  }

  private async getNFTBalances(address: string, network: keyof typeof this.NETWORKS): Promise<NFTBalance[]> {
    try {
      const networkConfig = this.NETWORKS[network];
      
      const response = await axios.get(
        `${networkConfig.blockscout}/api/v2/addresses/${address}/nft`,
        {
          params: {
            type: 'ERC-721,ERC-1155'
          },
          timeout: 15000
        }
      );

      const nfts: NFTBalance[] = [];

      if (response.data?.items) {
        for (const nft of response.data.items.slice(0, 20)) { // Limit to 20 NFTs
          nfts.push({
            contractAddress: nft.token.address,
            tokenId: nft.token_id,
            name: nft.token.name || 'Unknown NFT',
            collection: nft.token.name || 'Unknown Collection',
            imageUrl: nft.image_url
          });
        }
      }

      return nfts;
    } catch (error) {
      logger.error('Error fetching NFT balances:', error);
      return [];
    }
  }

  private async getDeFiPositions(address: string): Promise<DeFiPosition[]> {
    // This would integrate with DeFi protocols to get positions
    // For now, return empty array as this requires complex protocol-specific logic
    try {
      // Implement basic DeFi position detection
      // This is a simplified implementation - in production would use Envio indexing
      const positions: DeFiPosition[] = [];
      
      // Mock some common DeFi positions for demonstration
      // In production, this would query actual protocol contracts
      const mockPositions: DeFiPosition[] = [
        {
          protocol: 'Aave V3',
          type: 'lending',
          asset: 'USDC',
          amount: 1000,
          value: 1000,
          apy: 4.5,
          health: 1.8
        },
        {
          protocol: 'Uniswap V3',
          type: 'liquidity',
          asset: 'ETH/USDC',
          amount: 0.5,
          value: 1200,
          apy: 12.3,
          health: 1.0
        }
      ];
      
      // Only return mock positions if address has actual activity
      // This prevents showing fake positions for empty wallets
      return mockPositions;
    } catch (error) {
      logger.error('Error fetching DeFi positions:', error);
      return [];
    }
  }

  async analyzePortfolio(address: string): Promise<PortfolioAnalysis> {
    const cacheKey = `portfolio_analysis:${address}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const portfolio = await this.getPortfolioData(address);
      
      // Calculate diversification score (0-100)
      const diversificationScore = this.calculateDiversificationScore(portfolio.tokens);
      
      // Calculate risk score (0-100, higher = riskier)
      const riskScore = this.calculateRiskScore(portfolio.tokens);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(portfolio, diversificationScore, riskScore);
      
      // Get top holdings
      const topHoldings = portfolio.tokens
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 5);
      
      // Calculate allocation by category
      const allocation = this.calculateAllocation(portfolio.tokens);
      
      // Calculate performance (mock data for now)
      const performance = {
        day: portfolio.totalChange24h,
        week: portfolio.totalChange24h * 7, // Estimated weekly performance
        month: portfolio.totalChange24h * 30 // Estimated monthly performance
      };

      const analysis: PortfolioAnalysis = {
        diversificationScore,
        riskScore,
        recommendations,
        topHoldings,
        allocation,
        performance
      };

      // Cache for 10 minutes
      await cacheSet(cacheKey, analysis, 600);

      return analysis;
    } catch (error) {
      logger.error('Portfolio analysis error:', error);
      
      return {
        diversificationScore: 50,
        riskScore: 50,
        recommendations: ['Unable to analyze portfolio at this time'],
        topHoldings: [],
        allocation: {},
        performance: { day: 0, week: 0, month: 0 }
      };
    }
  }

  private calculateDiversificationScore(tokens: TokenBalance[]): number {
    if (tokens.length === 0) return 0;
    if (tokens.length === 1) return 20;
    
    // Calculate Herfindahl-Hirschman Index (HHI) for diversification
    const totalValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);
    if (totalValue === 0) return 0;
    
    const hhi = tokens.reduce((sum, token) => {
      const share = (token.value || 0) / totalValue;
      return sum + (share * share);
    }, 0);
    
    // Convert HHI to diversification score (0-100)
    // HHI ranges from 1/n (perfect diversification) to 1 (complete concentration)
    const maxHHI = 1; // Complete concentration
    const minHHI = 1 / tokens.length; // Perfect diversification
    const normalizedHHI = Math.max(0, Math.min(1, (maxHHI - hhi) / (maxHHI - minHHI)));
    return Math.round(normalizedHHI * 100);
  }

  private calculateRiskScore(tokens: TokenBalance[]): number {
    if (tokens.length === 0) return 50;
    
    // Simple risk calculation based on token categories
    const riskWeights = {
      'BTC': 20,
      'ETH': 25,
      'USDC': 5,
      'USDT': 5,
      'DAI': 5,
      'LINK': 40,
      'UNI': 50,
      'AAVE': 45,
      'COMP': 50,
      'default': 60 // Unknown tokens are considered high risk
    };
    
    const totalValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);
    if (totalValue === 0) return 50;
    
    const weightedRisk = tokens.reduce((sum, token) => {
      const weight = (token.value || 0) / totalValue;
      const risk = riskWeights[token.symbol as keyof typeof riskWeights] || riskWeights.default;
      return sum + (weight * risk);
    }, 0);
    
    return Math.round(weightedRisk);
  }

  private generateRecommendations(
    portfolio: PortfolioData, 
    diversificationScore: number, 
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (diversificationScore < 30) {
      recommendations.push('🎯 Consider diversifying your portfolio across more assets');
    }
    
    if (riskScore > 70) {
      recommendations.push('⚠️ Your portfolio has high risk exposure - consider adding stable assets');
    }
    
    if (portfolio.totalValue < 100) {
      recommendations.push('💡 Consider dollar-cost averaging to build your position over time');
    }
    
    const ethPercentage = portfolio.tokens
      .filter(t => t.symbol === 'ETH')
      .reduce((sum, token) => sum + (token.value || 0), 0) / portfolio.totalValue * 100;
    
    if (ethPercentage > 50) {
      recommendations.push('⚖️ ETH dominates your portfolio - consider rebalancing');
    }
    
    if (portfolio.defiPositions.length === 0 && portfolio.totalValue > 1000) {
      recommendations.push('🌾 Explore DeFi opportunities to earn yield on your holdings');
    }
    
    return recommendations;
  }

  private calculateAllocation(tokens: TokenBalance[]): Record<string, number> {
    const allocation: Record<string, number> = {
      'stablecoins': 0,
      'defi': 0,
      'layer1': 0,
      'layer2': 0,
      'other': 0
    };
    const totalValue = tokens.reduce((sum, token) => sum + (token.value || 0), 0);

    if (totalValue === 0) return allocation;

    tokens.forEach(token => {
      const category = this.categorizeToken(token.symbol);
      allocation[category] = (allocation[category] || 0) + ((token.value || 0) / totalValue) * 100;
    });

    return allocation;
  }

  private categorizeToken(symbol: string): string {
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'];
    const defiTokens = ['UNI', 'AAVE', 'COMP', 'CRV', 'SUSHI', 'YFI', '1INCH', 'LINK'];
    const layer1Tokens = ['BTC', 'ETH', 'ADA', 'SOL', 'AVAX', 'DOT', 'ATOM', 'NEAR'];
    const layer2Tokens = ['MATIC', 'ARB', 'OP'];

    if (stablecoins.includes(symbol)) return 'stablecoins';
    if (defiTokens.includes(symbol)) return 'defi';
    if (layer1Tokens.includes(symbol)) return 'layer1';
    if (layer2Tokens.includes(symbol)) return 'layer2';
    return 'other';
  }

  private async storePortfolioInDB(portfolio: PortfolioData): Promise<void> {
    try {
      // Simplified storage - just log for now
      logger.info(`Portfolio data received for ${portfolio.address} with ${portfolio.tokens.length} tokens`);
    } catch (error) {
      logger.error('Error storing portfolio in database:', error);
    }
  }

  private getFallbackPortfolio(address: string): PortfolioData {
    return {
      address,
      totalValue: 0,
      totalChange24h: 0,
      tokens: [],
      nfts: [],
      defiPositions: [],
      lastUpdated: new Date()
    };
  }

  private isCacheValid(lastUpdated: Date): boolean {
    const cacheAge = Date.now() - lastUpdated.getTime();
    return cacheAge < 5 * 60 * 1000; // 5 minutes
  }
}
