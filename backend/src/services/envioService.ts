import axios from 'axios';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';

export interface EnvioTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  blockNumber: number;
  chainId: number;
  status: 'success' | 'failed';
  methodId?: string;
  contractAddress?: string;
}

export interface EnvioTokenTransfer {
  hash: string;
  from: string;
  to: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  value: string;
  decimals: number;
  timestamp: number;
  blockNumber: number;
  chainId: number;
}

export interface EnvioNFTTransfer {
  hash: string;
  from: string;
  to: string;
  contractAddress: string;
  tokenId: string;
  tokenName?: string;
  collectionName?: string;
  timestamp: number;
  blockNumber: number;
  chainId: number;
}

export interface EnvioProtocolInteraction {
  hash: string;
  userAddress: string;
  protocolAddress: string;
  protocolName: string;
  action: string;
  tokens: Array<{
    address: string;
    symbol: string;
    amount: string;
  }>;
  timestamp: number;
  blockNumber: number;
  chainId: number;
}

export class EnvioService {
  private readonly ENVIO_API_URL = process.env.ENVIO_API_URL || 'https://api.envio.dev';
  private readonly API_KEY = process.env.ENVIO_API_KEY;

  // Supported chain configurations
  private readonly CHAINS = {
    ethereum: { id: 1, name: 'ethereum' },
    polygon: { id: 137, name: 'polygon' },
    arbitrum: { id: 42161, name: 'arbitrum' },
    optimism: { id: 10, name: 'optimism' },
    base: { id: 8453, name: 'base' }
  };

  // Known DeFi protocol addresses
  private readonly PROTOCOLS = {
    ethereum: {
      uniswap_v3: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      aave_v3: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      compound_v3: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
      curve: '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5',
      sushiswap: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'
    },
    polygon: {
      uniswap_v3: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      aave_v3: '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
      curve: '0x445FE580eF8d70FF569aB36e80c647af338db351'
    }
  };

  async getTransactionHistory(
    address: string, 
    chainId: number = 1, 
    limit: number = 50,
    offset: number = 0
  ): Promise<EnvioTransaction[]> {
    const cacheKey = `envio_txs:${address}:${chainId}:${limit}:${offset}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      logger.debug('Returning cached transaction history');
      return cached;
    }

    try {
      const response = await this.makeEnvioRequest('/graphql', {
        query: `
          query GetTransactions($address: String!, $chainId: Int!, $limit: Int!, $offset: Int!) {
            transactions(
              where: {
                or: [
                  { from: { _eq: $address } },
                  { to: { _eq: $address } }
                ],
                chainId: { _eq: $chainId }
              },
              limit: $limit,
              offset: $offset,
              order_by: { timestamp: desc }
            ) {
              hash
              from
              to
              value
              gasUsed
              gasPrice
              timestamp
              blockNumber
              status
              methodId
              contractAddress
            }
          }
        `,
        variables: { address, chainId, limit, offset }
      });

      const transactions: EnvioTransaction[] = response.data.transactions.map((tx: any) => ({
        ...tx,
        chainId,
        timestamp: parseInt(tx.timestamp),
        blockNumber: parseInt(tx.blockNumber)
      }));

      // Cache for 2 minutes
      await cacheSet(cacheKey, transactions, 120);

      return transactions;
    } catch (error) {
      logger.error('Envio transaction history error:', error);
      return [];
    }
  }

  async getTokenTransfers(
    address: string,
    chainId: number = 1,
    limit: number = 50
  ): Promise<EnvioTokenTransfer[]> {
    const cacheKey = `envio_tokens:${address}:${chainId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeEnvioRequest('/graphql', {
        query: `
          query GetTokenTransfers($address: String!, $chainId: Int!, $limit: Int!) {
            tokenTransfers(
              where: {
                or: [
                  { from: { _eq: $address } },
                  { to: { _eq: $address } }
                ],
                chainId: { _eq: $chainId }
              },
              limit: $limit,
              order_by: { timestamp: desc }
            ) {
              hash
              from
              to
              tokenAddress
              tokenSymbol
              tokenName
              value
              decimals
              timestamp
              blockNumber
            }
          }
        `,
        variables: { address, chainId, limit }
      });

      const transfers: EnvioTokenTransfer[] = response.data.tokenTransfers.map((transfer: any) => ({
        ...transfer,
        chainId,
        timestamp: parseInt(transfer.timestamp),
        blockNumber: parseInt(transfer.blockNumber),
        decimals: parseInt(transfer.decimals)
      }));

      await cacheSet(cacheKey, transfers, 120);
      return transfers;
    } catch (error) {
      logger.error('Envio token transfers error:', error);
      return [];
    }
  }

  async getNFTTransfers(
    address: string,
    chainId: number = 1,
    limit: number = 20
  ): Promise<EnvioNFTTransfer[]> {
    const cacheKey = `envio_nfts:${address}:${chainId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeEnvioRequest('/graphql', {
        query: `
          query GetNFTTransfers($address: String!, $chainId: Int!, $limit: Int!) {
            nftTransfers(
              where: {
                or: [
                  { from: { _eq: $address } },
                  { to: { _eq: $address } }
                ],
                chainId: { _eq: $chainId }
              },
              limit: $limit,
              order_by: { timestamp: desc }
            ) {
              hash
              from
              to
              contractAddress
              tokenId
              tokenName
              collectionName
              timestamp
              blockNumber
            }
          }
        `,
        variables: { address, chainId, limit }
      });

      const transfers: EnvioNFTTransfer[] = response.data.nftTransfers.map((transfer: any) => ({
        ...transfer,
        chainId,
        timestamp: parseInt(transfer.timestamp),
        blockNumber: parseInt(transfer.blockNumber)
      }));

      await cacheSet(cacheKey, transfers, 300);
      return transfers;
    } catch (error) {
      logger.error('Envio NFT transfers error:', error);
      return [];
    }
  }

  async getDeFiInteractions(
    address: string,
    chainId: number = 1,
    limit: number = 30
  ): Promise<EnvioProtocolInteraction[]> {
    const cacheKey = `envio_defi:${address}:${chainId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const chainName = this.getChainName(chainId);
      const protocolAddresses = this.PROTOCOLS[chainName as keyof typeof this.PROTOCOLS] || {};
      
      if (Object.keys(protocolAddresses).length === 0) {
        return [];
      }

      const response = await this.makeEnvioRequest('/graphql', {
        query: `
          query GetDeFiInteractions($address: String!, $chainId: Int!, $protocols: [String!]!, $limit: Int!) {
            protocolInteractions(
              where: {
                userAddress: { _eq: $address },
                protocolAddress: { _in: $protocols },
                chainId: { _eq: $chainId }
              },
              limit: $limit,
              order_by: { timestamp: desc }
            ) {
              hash
              userAddress
              protocolAddress
              protocolName
              action
              tokens
              timestamp
              blockNumber
            }
          }
        `,
        variables: { 
          address, 
          chainId, 
          protocols: Object.values(protocolAddresses),
          limit 
        }
      });

      const interactions: EnvioProtocolInteraction[] = response.data.protocolInteractions.map((interaction: any) => ({
        ...interaction,
        chainId,
        timestamp: parseInt(interaction.timestamp),
        blockNumber: parseInt(interaction.blockNumber)
      }));

      await cacheSet(cacheKey, interactions, 180);
      return interactions;
    } catch (error) {
      logger.error('Envio DeFi interactions error:', error);
      return [];
    }
  }

  async getMultiChainActivity(
    address: string,
    chains: number[] = [1, 137, 42161]
  ): Promise<{
    transactions: EnvioTransaction[];
    tokenTransfers: EnvioTokenTransfer[];
    nftTransfers: EnvioNFTTransfer[];
    defiInteractions: EnvioProtocolInteraction[];
  }> {
    const cacheKey = `envio_multichain:${address}:${chains.join(',')}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const results = await Promise.allSettled([
        ...chains.map(chainId => this.getTransactionHistory(address, chainId, 20)),
        ...chains.map(chainId => this.getTokenTransfers(address, chainId, 20)),
        ...chains.map(chainId => this.getNFTTransfers(address, chainId, 10)),
        ...chains.map(chainId => this.getDeFiInteractions(address, chainId, 15))
      ]);

      const transactions: EnvioTransaction[] = [];
      const tokenTransfers: EnvioTokenTransfer[] = [];
      const nftTransfers: EnvioNFTTransfer[] = [];
      const defiInteractions: EnvioProtocolInteraction[] = [];

      // Process results
      for (let i = 0; i < chains.length; i++) {
        const txResult = results[i];
        const tokenResult = results[i + chains.length];
        const nftResult = results[i + 2 * chains.length];
        const defiResult = results[i + 3 * chains.length];

        if (txResult.status === 'fulfilled') {
          transactions.push(...txResult.value);
        }
        if (tokenResult.status === 'fulfilled') {
          tokenTransfers.push(...tokenResult.value);
        }
        if (nftResult.status === 'fulfilled') {
          nftTransfers.push(...nftResult.value);
        }
        if (defiResult.status === 'fulfilled') {
          defiInteractions.push(...defiResult.value);
        }
      }

      // Sort by timestamp
      transactions.sort((a, b) => b.timestamp - a.timestamp);
      tokenTransfers.sort((a, b) => b.timestamp - a.timestamp);
      nftTransfers.sort((a, b) => b.timestamp - a.timestamp);
      defiInteractions.sort((a, b) => b.timestamp - a.timestamp);

      const activity = {
        transactions: transactions.slice(0, 50),
        tokenTransfers: tokenTransfers.slice(0, 50),
        nftTransfers: nftTransfers.slice(0, 20),
        defiInteractions: defiInteractions.slice(0, 30)
      };

      await cacheSet(cacheKey, activity, 300);
      return activity;
    } catch (error) {
      logger.error('Envio multi-chain activity error:', error);
      return {
        transactions: [],
        tokenTransfers: [],
        nftTransfers: [],
        defiInteractions: []
      };
    }
  }

  async getProtocolStats(protocolAddress: string, chainId: number = 1): Promise<{
    totalUsers: number;
    totalVolume: string;
    totalTransactions: number;
    activeUsers24h: number;
  }> {
    const cacheKey = `envio_protocol_stats:${protocolAddress}:${chainId}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeEnvioRequest('/graphql', {
        query: `
          query GetProtocolStats($protocolAddress: String!, $chainId: Int!) {
            protocolStats(
              where: {
                protocolAddress: { _eq: $protocolAddress },
                chainId: { _eq: $chainId }
              }
            ) {
              totalUsers
              totalVolume
              totalTransactions
              activeUsers24h
            }
          }
        `,
        variables: { protocolAddress, chainId }
      });

      const stats = response.data.protocolStats[0] || {
        totalUsers: 0,
        totalVolume: '0',
        totalTransactions: 0,
        activeUsers24h: 0
      };

      await cacheSet(cacheKey, stats, 600); // 10 minutes
      return stats;
    } catch (error) {
      logger.error('Envio protocol stats error:', error);
      return {
        totalUsers: 0,
        totalVolume: '0',
        totalTransactions: 0,
        activeUsers24h: 0
      };
    }
  }

  private async makeEnvioRequest(endpoint: string, data: any): Promise<any> {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (this.API_KEY) {
      headers['Authorization'] = `Bearer ${this.API_KEY}`;
    }

    const response = await axios.post(`${this.ENVIO_API_URL}${endpoint}`, data, {
      headers,
      timeout: 10000
    });

    if (response.data.errors) {
      throw new Error(`Envio GraphQL error: ${JSON.stringify(response.data.errors)}`);
    }

    return response.data;
  }

  private getChainName(chainId: number): string {
    const chain = Object.entries(this.CHAINS).find(([_, config]) => config.id === chainId);
    return chain ? chain[0] : 'ethereum';
  }

  getSupportedChains(): Array<{ id: number; name: string }> {
    return Object.values(this.CHAINS);
  }

  getKnownProtocols(chainId: number = 1): Record<string, string> {
    const chainName = this.getChainName(chainId);
    return this.PROTOCOLS[chainName as keyof typeof this.PROTOCOLS] || {};
  }
}
