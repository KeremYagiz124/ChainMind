import * as LitJsSdk from '@lit-protocol/lit-node-client';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';

export interface LitAuthSession {
  sessionId?: string;
  authSig: any;
  pkpPublicKey?: string;
  controllerAuthSig?: any;
  id?: string;
  expiration: string;
  walletAddress: string;
}

export interface EncryptedData {
  encryptedString: string;
  encryptedSymmetricKey: string;
  accessControlConditions: any[];
}

export class LitProtocolService {
  private litNodeClient: any;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly LIT_NETWORK = (process.env.LIT_NETWORK as any) || 'cayenne';
  private readonly LIT_CHAIN = process.env.LIT_CHAIN || 'ethereum';
  private readonly LIT_DEBUG = process.env.LIT_DEBUG === 'true';

  constructor() {
    // Don't initialize in constructor - do it lazily
    // this.initializeLitClient();
  }

  private async initializeLitClient(): Promise<void> {
    // Prevent multiple initialization attempts
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.isInitialized) {
      return Promise.resolve();
    }

    this.initPromise = (async () => {
      try {
        logger.info(`Initializing Lit Protocol client on network: ${this.LIT_NETWORK}`);
        
        this.litNodeClient = new LitJsSdk.LitNodeClient({
          litNetwork: this.LIT_NETWORK,
          debug: this.LIT_DEBUG || process.env.NODE_ENV === 'development'
        });

        await this.litNodeClient.connect();
        this.isInitialized = true;
        logger.info('✓ Lit Protocol client initialized successfully');
      } catch (error: any) {
        logger.error('Failed to initialize Lit Protocol client:', error.message);
        this.isInitialized = false;
        this.initPromise = null;
        throw new Error(`Lit Protocol initialization failed: ${error.message}`);
      }
    })();

    return this.initPromise;
  }

  async authenticateUser(walletAddress: string, signature: string, message: string): Promise<LitAuthSession> {
    try {
      if (!this.isInitialized) {
        await this.initializeLitClient();
      }
    } catch (error) {
      logger.error('Lit client initialization failed during auth:', error);
      throw new Error('Lit Protocol not available');
    }

    const cacheKey = `lit_auth:${walletAddress}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached && this.isSessionValid(cached)) {
      logger.debug('Returning cached Lit Protocol session');
      return cached;
    }

    try {
      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error('Invalid signature');
      }

      // Create access control conditions
      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: walletAddress
          }
        }
      ];

      // Generate session signatures
      const authSig = {
        sig: signature,
        derivedVia: 'web3.eth.personal.sign',
        signedMessage: message,
        address: walletAddress
      };

      // Store auth signature for future use
      // Note: Full Lit Protocol session management requires additional setup
      // This is a simplified version for development

      const authSession: LitAuthSession = {
        authSig,
        sessionId: `lit_${Date.now()}_${walletAddress.slice(0, 8)}`,
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        walletAddress
      };

      // Cache for 23 hours (slightly less than expiration)
      await cacheSet(cacheKey, authSession, 23 * 60 * 60);

      logger.info(`User authenticated with Lit Protocol: ${walletAddress}`);
      return authSession;

    } catch (error: any) {
      logger.error('Lit Protocol authentication error:', error.message || error);
      throw new Error(`Authentication failed: ${error.message || 'Unknown error'}`);
    }
  }

  async encryptData(data: string, accessControlConditions: any[], authSession: LitAuthSession): Promise<EncryptedData> {
    if (!this.isInitialized) {
      await this.initializeLitClient();
    }

    try {
      // Simplified encryption - store as base64
      const encryptedString = Buffer.from(data).toString('base64');
      const encryptedSymmetricKey = Buffer.from(JSON.stringify(accessControlConditions)).toString('base64');

      logger.info('Data encrypted (simplified mode)');

      return {
        encryptedString,
        encryptedSymmetricKey,
        accessControlConditions
      };

    } catch (error) {
      logger.error('Lit Protocol encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  async decryptData(encryptedData: EncryptedData, authSession: LitAuthSession): Promise<string> {
    if (!this.isInitialized) {
      await this.initializeLitClient();
    }

    try {
      // Simplified decryption - decode from base64
      const decryptedString = Buffer.from(encryptedData.encryptedString, 'base64').toString('utf-8');

      logger.info('Data decrypted (simplified mode)');

      return decryptedString;

    } catch (error) {
      logger.error('Lit Protocol decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  async createAccessControlConditions(walletAddress: string, additionalConditions?: any[]): Promise<any[]> {
    const baseConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: walletAddress
        }
      }
    ];

    if (additionalConditions && additionalConditions.length > 0) {
      return [
        ...baseConditions,
        { operator: 'and' },
        ...additionalConditions
      ];
    }

    return baseConditions;
  }

  async createTokenGatedConditions(tokenAddress: string, minBalance: string, chain = 'ethereum'): Promise<any[]> {
    return [
      {
        contractAddress: tokenAddress,
        standardContractType: 'ERC20',
        chain,
        method: 'balanceOf',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>=',
          value: minBalance
        }
      }
    ];
  }

  async createNFTGatedConditions(nftAddress: string, chain = 'ethereum'): Promise<any[]> {
    return [
      {
        contractAddress: nftAddress,
        standardContractType: 'ERC721',
        chain,
        method: 'balanceOf',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '>',
          value: '0'
        }
      }
    ];
  }

  private isSessionValid(session: LitAuthSession): boolean {
    const now = new Date();
    const expiration = new Date(session.expiration);
    return expiration > now;
  }

  async revokeSession(walletAddress: string): Promise<void> {
    const cacheKey = `lit_auth:${walletAddress}`;
    await cacheSet(cacheKey, null, 1); // Expire immediately
    logger.info(`Lit Protocol session revoked for: ${walletAddress}`);
  }

  async encryptConversation(conversationData: any, walletAddress: string): Promise<EncryptedData> {
    const authSession = await this.getValidSession(walletAddress);
    if (!authSession) {
      throw new Error('No valid authentication session');
    }

    const accessControlConditions = await this.createAccessControlConditions(walletAddress);
    return await this.encryptData(JSON.stringify(conversationData), accessControlConditions, authSession);
  }

  async decryptConversation(encryptedData: EncryptedData, walletAddress: string): Promise<any> {
    const authSession = await this.getValidSession(walletAddress);
    if (!authSession) {
      throw new Error('No valid authentication session');
    }

    const decryptedString = await this.decryptData(encryptedData, authSession);
    return JSON.parse(decryptedString);
  }

  private async getValidSession(walletAddress: string): Promise<LitAuthSession | null> {
    const cacheKey = `lit_auth:${walletAddress}`;
    const session = await cacheGet(cacheKey);
    
    if (session && this.isSessionValid(session)) {
      return session;
    }
    
    return null;
  }

  async encryptPortfolioData(portfolioData: any, walletAddress: string, tokenGating?: {
    tokenAddress: string;
    minBalance: string;
  }): Promise<EncryptedData> {
    const authSession = await this.getValidSession(walletAddress);
    if (!authSession) {
      throw new Error('No valid authentication session');
    }

    let accessControlConditions;
    if (tokenGating) {
      const tokenConditions = await this.createTokenGatedConditions(
        tokenGating.tokenAddress, 
        tokenGating.minBalance
      );
      const userConditions = await this.createAccessControlConditions(walletAddress);
      accessControlConditions = [
        ...userConditions,
        { operator: 'and' },
        ...tokenConditions
      ];
    } else {
      accessControlConditions = await this.createAccessControlConditions(walletAddress);
    }

    return await this.encryptData(JSON.stringify(portfolioData), accessControlConditions, authSession);
  }

  getClientStatus(): { initialized: boolean; connected: boolean } {
    return {
      initialized: this.isInitialized,
      connected: this.litNodeClient?.ready || false
    };
  }
}
