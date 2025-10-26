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
  private readonly ENVIO_API_URL = process.env.ENVIO_API_URL || 'https://indexer.envio.dev/graphql';
  private readonly ENVIO_API_KEY = process.env.ENVIO_API_KEY;
  
  private readonly CHAIN_NAMES: { [key: number]: string } = {
    1: 'ethereum',
    137: 'polygon',
    42161: 'arbitrum',
    10: 'optimism',
    8453: 'base'
  };

  async getUserTransactions(
    address: string,
    chainId: number = 1,
    limit: number = 50
  ): Promise<EnvioTransaction[]> {
    const cacheKey = `envio_txs:${address}:${chainId}:${limit}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached) {
      logger.debug('Returning cached Envio transactions');
      return cached;
    }

    if (!this.ENVIO_API_KEY) {
      logger.warn('Envio API key not configured');
      return [];
    }

    try {
      const chainName = this.CHAIN_NAMES[chainId] || 'ethereum';
      const query = `
        query GetUserTransactions($address: String!, $chainId: Int!, $limit: Int!) {
          transactions(
            where: {
              or: [
                { from: { _ilike: $address } }
                { to: { _ilike: $address } }
              ]
              chainId: { _eq: $chainId }
            }
            limit: $limit
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
            chainId
            status
            input
            contractAddress
          }
        }
      `;

      logger.debug(`Fetching transactions from Envio for ${address} on chain ${chainId}`);
      
      const response = await axios.post(
        this.ENVIO_API_URL,
        {
          query,
          variables: { 
            address: address.toLowerCase(), 
            chainId,
            limit 
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.ENVIO_API_KEY}`
          },
          timeout: parseInt(process.env.API_TIMEOUT || '30000')
        }
      );

      if (response.data.errors) {
        logger.error('Envio GraphQL errors:', response.data.errors);
        return [];
      }

      const transactions: EnvioTransaction[] = (response.data.data?.transactions || []).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value || '0',
        gasUsed: tx.gasUsed || '0',
        gasPrice: tx.gasPrice || '0',
        timestamp: parseInt(tx.timestamp),
        blockNumber: parseInt(tx.blockNumber),
        chainId: tx.chainId || chainId,
        status: tx.status || 'success',
        methodId: tx.input?.slice(0, 10),
        contractAddress: tx.contractAddress
      }));
      
      logger.info(`✓ Fetched ${transactions.length} transactions from Envio`);
      
      // Cache for 5 minutes
      await cacheSet(cacheKey, transactions, 300);
      
      return transactions;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('Envio API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        logger.error('Envio API rate limit exceeded');
      } else {
        logger.error('Envio API error:', error.message);
      }
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
      const chainName = this.CHAIN_NAMES[chainId] || 'ethereum';
      const query = `
        query GetTokenTransfers($address: String!, $chainId: Int!, $limit: Int!) {
          tokenTransfers(
            where: {
              or: [
                { from: { _ilike: $address } }
                { to: { _ilike: $address } }
              ]
              chainId: { _eq: $chainId }
            }
            limit: $limit
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
      `;

      logger.debug(`Fetching token transfers from Envio for ${address} on chain ${chainId}`);
      
      const response = await axios.post(
        this.ENVIO_API_URL,
        {
          query,
          variables: { 
            address: address.toLowerCase(), 
            chainId,
            limit 
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.ENVIO_API_KEY}`
          },
          timeout: parseInt(process.env.API_TIMEOUT || '30000')
        }
      );

      if (response.data.errors) {
        logger.error('Envio GraphQL errors:', response.data.errors);
        return [];
      }

      const transfers: EnvioTokenTransfer[] = (response.data.data?.tokenTransfers || []).map((transfer: any) => ({
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to || '',
        tokenAddress: transfer.tokenAddress,
        tokenSymbol: transfer.tokenSymbol,
        tokenName: transfer.tokenName,
        value: transfer.value || '0',
        decimals: parseInt(transfer.decimals),
        timestamp: parseInt(transfer.timestamp),
        blockNumber: parseInt(transfer.blockNumber),
        chainId: transfer.chainId || chainId
      }));
      
      logger.info(`✓ Fetched ${transfers.length} token transfers from Envio`);
      
      // Cache for 5 minutes
      await cacheSet(cacheKey, transfers, 300);
      
      return transfers;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('Envio API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        logger.error('Envio API rate limit exceeded');
      } else {
        logger.error('Envio API error:', error.message);
      }
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
      const chainName = this.CHAIN_NAMES[chainId] || 'ethereum';
      const query = `
        query GetNFTTransfers($address: String!, $chainId: Int!, $limit: Int!) {
          nftTransfers(
            where: {
              or: [
                { from: { _ilike: $address } }
                { to: { _ilike: $address } }
              ]
              chainId: { _eq: $chainId }
            }
            limit: $limit
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
      `;

      logger.debug(`Fetching NFT transfers from Envio for ${address} on chain ${chainId}`);
      
      const response = await axios.post(
        this.ENVIO_API_URL,
        {
          query,
          variables: { 
            address: address.toLowerCase(), 
            chainId,
            limit 
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.ENVIO_API_KEY}`
          },
          timeout: parseInt(process.env.API_TIMEOUT || '30000')
        }
      );

      if (response.data.errors) {
        logger.error('Envio GraphQL errors:', response.data.errors);
        return [];
      }

      const transfers: EnvioNFTTransfer[] = (response.data.data?.nftTransfers || []).map((transfer: any) => ({
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to || '',
        contractAddress: transfer.contractAddress,
        tokenId: transfer.tokenId,
        tokenName: transfer.tokenName,
        collectionName: transfer.collectionName,
        timestamp: parseInt(transfer.timestamp),
        blockNumber: parseInt(transfer.blockNumber),
        chainId: transfer.chainId || chainId
      }));
      
      logger.info(`✓ Fetched ${transfers.length} NFT transfers from Envio`);
      
      // Cache for 5 minutes
      await cacheSet(cacheKey, transfers, 300);
      
      return transfers;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('Envio API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        logger.error('Envio API rate limit exceeded');
      } else {
        logger.error('Envio API error:', error.message);
      }
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
      const chainName = this.CHAIN_NAMES[chainId] || 'ethereum';
      const query = `
        query GetDeFiInteractions($address: String!, $chainId: Int!, $limit: Int!) {
          protocolInteractions(
            where: {
              userAddress: { _ilike: $address }
              chainId: { _eq: $chainId }
            }
            limit: $limit
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
      `;

      logger.debug(`Fetching DeFi interactions from Envio for ${address} on chain ${chainId}`);
      
      const response = await axios.post(
        this.ENVIO_API_URL,
        {
          query,
          variables: { 
            address: address.toLowerCase(), 
            chainId,
            limit 
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.ENVIO_API_KEY}`
          },
          timeout: parseInt(process.env.API_TIMEOUT || '30000')
        }
      );

      if (response.data.errors) {
        logger.error('Envio GraphQL errors:', response.data.errors);
        return [];
      }

      const interactions: EnvioProtocolInteraction[] = (response.data.data?.protocolInteractions || []).map((interaction: any) => ({
        hash: interaction.hash,
        userAddress: interaction.userAddress,
        protocolAddress: interaction.protocolAddress,
        protocolName: interaction.protocolName,
        action: interaction.action,
        tokens: interaction.tokens,
        timestamp: parseInt(interaction.timestamp),
        blockNumber: parseInt(interaction.blockNumber),
        chainId: interaction.chainId || chainId
      }));
      
      logger.info(`✓ Fetched ${interactions.length} DeFi interactions from Envio`);
      
      // Cache for 5 minutes
      await cacheSet(cacheKey, interactions, 300);
      
      return interactions;
    } catch (error: any) {
      if (error.response?.status === 401) {
        logger.error('Envio API authentication failed - check API key');
      } else if (error.response?.status === 429) {
        logger.error('Envio API rate limit exceeded');
      } else {
        logger.error('Envio API error:', error.message);
      }
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
        ...chains.map(chainId => this.getUserTransactions(address, chainId, 20)),
        ...chains.map(chainId => this.getTokenTransfers(address, chainId, 20)),
        ...chains.map(chainId => this.getNFTTransfers(address, chainId, 10)),
        ...chains.map(chainId => this.getDeFiInteractions(address, chainId, 15))
      ]);

      const transactions: EnvioTransaction[] = [];
      const tokenTransfers: EnvioTokenTransfer[] = [];
      const nftTransfers: EnvioNFTTransfer[] = [];
      const defiInteractions: EnvioProtocolInteraction[] = [];

      // Process results - separate by type
      const txResults = results.slice(0, chains.length);
      const tokenResults = results.slice(chains.length, chains.length * 2);
      const nftResults = results.slice(chains.length * 2, chains.length * 3);
      const defiResults = results.slice(chains.length * 3);

      txResults.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          transactions.push(...(result.value as EnvioTransaction[]));
        }
      });

      tokenResults.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          tokenTransfers.push(...(result.value as EnvioTokenTransfer[]));
        }
      });

      nftResults.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          nftTransfers.push(...(result.value as EnvioNFTTransfer[]));
        }
      });

      defiResults.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          defiInteractions.push(...(result.value as EnvioProtocolInteraction[]));
        }
      });

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
      const chainName = this.CHAIN_NAMES[chainId] || 'ethereum';
      const query = `
        query GetProtocolStats($protocolAddress: String!, $chainId: Int!) {
          protocolStats(
            where: {
              protocolAddress: { _eq: $protocolAddress }
              chainId: { _eq: $chainId }
            }
          ) {
            totalUsers
            totalVolume
            totalTransactions
            activeUsers24h
          }
        }
      `;

      logger.debug(`Fetching protocol stats from Envio for ${protocolAddress} on chain ${chainId}`);
      
      const response = await axios.post(
        this.ENVIO_API_URL,
        {
          query,
          variables: { 
            protocolAddress: protocolAddress.toLowerCase(), 
            chainId
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.ENVIO_API_KEY}`
          },
          timeout: parseInt(process.env.API_TIMEOUT || '30000')
        }
      );

      if (response.data.errors) {
        logger.error('Envio GraphQL errors:', response.data.errors);
        return {
          totalUsers: 0,
          totalVolume: '0',
          totalTransactions: 0,
          activeUsers24h: 0
        };
      }

      const stats = response.data.data?.protocolStats[0] || {
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

    if (this.ENVIO_API_KEY) {
      headers['Authorization'] = `Bearer ${this.ENVIO_API_KEY}`;
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

  getSupportedChains(): Array<{ id: number; name: string }> {
    return Object.entries(this.CHAIN_NAMES).map(([id, name]) => ({
      id: parseInt(id),
      name
    }));
  }

  getChainName(chainId: number): string {
    return this.CHAIN_NAMES[chainId] || 'ethereum';
  }
}
