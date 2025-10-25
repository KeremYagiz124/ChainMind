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

  constructor() {
    this.initializeLitClient();
  }

  private async initializeLitClient(): Promise<void> {
    try {
      this.litNodeClient = new LitJsSdk.LitNodeClient({
        litNetwork: 'cayenne', // Use testnet for development
        debug: process.env.NODE_ENV === 'development'
      });

      await this.litNodeClient.connect();
      this.isInitialized = true;
      logger.info('Lit Protocol client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Lit Protocol client:', error);
      throw new Error('Lit Protocol initialization failed');
    }
  }

  async authenticateUser(walletAddress: string, signature: string, message: string): Promise<LitAuthSession> {
    if (!this.isInitialized) {
      await this.initializeLitClient();
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

      const resourceAbilityRequests = [
        {
          resource: new LitJsSdk.LitAccessControlConditionResource('*'),
          ability: LitJsSdk.LitAbility.AccessControlConditionDecryption
        }
      ];

      const sessionSigs = await this.litNodeClient.getSessionSigs({
        chain: 'ethereum',
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
        resourceAbilityRequests,
        authSig
      });

      const authSession: LitAuthSession = {
        sessionSigs,
        resourceAbilityRequests,
        expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        walletAddress
      };

      // Cache for 23 hours (slightly less than expiration)
      await cacheSet(cacheKey, authSession, 23 * 60 * 60);

      logger.info(`User authenticated with Lit Protocol: ${walletAddress}`);
      return authSession;

    } catch (error) {
      logger.error('Lit Protocol authentication error:', error);
      throw new Error('Authentication failed');
    }
  }

  async encryptData(data: string, accessControlConditions: any[], authSession: LitAuthSession): Promise<EncryptedData> {
    if (!this.isInitialized) {
      await this.initializeLitClient();
    }

    try {
      const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
        {
          accessControlConditions,
          dataToEncrypt: data
        },
        this.litNodeClient
      );

      const encryptedSymmetricKey = await this.litNodeClient.saveEncryptionKey({
        accessControlConditions,
        symmetricKey,
        authSig: authSession.sessionSigs,
        chain: 'ethereum'
      });

      return {
        encryptedString,
        encryptedSymmetricKey: LitJsSdk.uint8arrayToString(encryptedSymmetricKey, 'base16'),
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
      const symmetricKey = await this.litNodeClient.getEncryptionKey({
        accessControlConditions: encryptedData.accessControlConditions,
        toDecrypt: encryptedData.encryptedSymmetricKey,
        chain: 'ethereum',
        authSig: authSession.sessionSigs
      });

      const decryptedString = await LitJsSdk.decryptToString(
        {
          accessControlConditions: encryptedData.accessControlConditions,
          encryptedSymmetricKey: symmetricKey,
          encryptedString: encryptedData.encryptedString
        },
        this.litNodeClient
      );

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
