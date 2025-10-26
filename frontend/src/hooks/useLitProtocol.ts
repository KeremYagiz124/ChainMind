import { useState, useEffect, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { litProtocol } from '../services/litProtocol';
import { logger } from '../utils/logger';

export const useLitProtocol = () => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLitReady, setIsLitReady] = useState(false);
  const [sessionSigs, setSessionSigs] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize Lit Protocol
  useEffect(() => {
    const initLit = async () => {
      try {
        await litProtocol.connect();
        setIsLitReady(true);
        logger.info('Lit Protocol connected');
      } catch (error) {
        logger.error('Failed to connect to Lit Protocol:', error);
      }
    };

    initLit();

    return () => {
      litProtocol.disconnect();
    };
  }, []);

  // Get authentication signature
  const getAuthSig = useCallback(async () => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    const message = `Sign this message to authenticate with ChainMind using Lit Protocol.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;
    
    const signature = await signMessageAsync({ message });

    return {
      sig: signature,
      derivedVia: 'web3.eth.personal.sign',
      signedMessage: message,
      address: address,
    };
  }, [address, isConnected, signMessageAsync]);

  // Create session signatures
  const createSession = useCallback(async () => {
    if (!isLitReady || !address) {
      throw new Error('Lit Protocol not ready or wallet not connected');
    }

    setLoading(true);
    try {
      const authSig = await getAuthSig();
      const sigs = await litProtocol.getSessionSigs(address, authSig);
      setSessionSigs(sigs);
      logger.info('Lit Protocol session created');
      return sigs;
    } catch (error) {
      logger.error('Failed to create Lit session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isLitReady, address, getAuthSig]);

  // Encrypt data with wallet-based access control
  const encryptData = useCallback(async (data: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    const accessControlConditions = litProtocol.createWalletAccessControl(address);
    
    return await litProtocol.encryptData(data, accessControlConditions);
  }, [address]);

  // Decrypt data
  const decryptData = useCallback(async (
    ciphertext: string,
    dataToEncryptHash: string
  ) => {
    if (!address || !sessionSigs) {
      throw new Error('Not authenticated with Lit Protocol');
    }

    const accessControlConditions = litProtocol.createWalletAccessControl(address);
    
    return await litProtocol.decryptData(
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
      sessionSigs
    );
  }, [address, sessionSigs]);

  return {
    isLitReady,
    sessionSigs,
    loading,
    createSession,
    encryptData,
    decryptData,
    getAuthSig,
  };
};
