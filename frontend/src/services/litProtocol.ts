import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { AuthCallbackParams } from '@lit-protocol/types';

export class LitProtocolService {
  private litNodeClient: LitNodeClient | null = null;
  private chain = 'ethereum';

  async connect() {
    if (this.litNodeClient) {
      return this.litNodeClient;
    }

    this.litNodeClient = new LitNodeClient({
      litNetwork: 'cayenne', // Use 'cayenne' testnet for development
      debug: false,
    });

    await this.litNodeClient.connect();
    return this.litNodeClient;
  }

  async getSessionSigs(walletAddress: string, authSig: any) {
    const client = await this.connect();

    // Simplified session creation for Lit Protocol v3
    const sessionSigs = await client.getSessionSigs({
      chain: this.chain,
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
      resourceAbilityRequests: [],
      authNeededCallback: async (params: AuthCallbackParams) => {
        return authSig;
      },
    });

    return sessionSigs;
  }

  async encryptData(data: string, accessControlConditions: any[]) {
    const client = await this.connect();

    // Convert string to Uint8Array
    const encoder = new TextEncoder();
    const dataToEncrypt = encoder.encode(data);

    const { ciphertext, dataToEncryptHash } = await client.encrypt({
      accessControlConditions,
      dataToEncrypt,
      chain: this.chain,
    });

    return {
      ciphertext,
      dataToEncryptHash,
    };
  }

  async decryptData(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: any[],
    sessionSigs: any
  ) {
    const client = await this.connect();

    const decryptedString = await client.decrypt({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      sessionSigs,
      chain: this.chain,
    });

    return decryptedString;
  }

  // Create access control conditions for wallet-based encryption
  createWalletAccessControl(walletAddress: string) {
    return [
      {
        contractAddress: '',
        standardContractType: '',
        chain: this.chain,
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: walletAddress,
        },
      },
    ];
  }

  disconnect() {
    // Lit Protocol v3 doesn't have a disconnect method
    // Just clear the reference
    this.litNodeClient = null;
  }
}

export const litProtocol = new LitProtocolService();
