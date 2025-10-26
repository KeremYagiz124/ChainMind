import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { TransactionRequest } from '../components/TransactionModal';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

interface UseTransactionReturn {
  sendTransaction: (tx: TransactionRequest) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
}

export const useTransaction = (): UseTransactionReturn => {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const sendTransaction = async (tx: TransactionRequest): Promise<string> => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Estimate gas if not provided
      let gasLimit = tx.gasLimit;
      if (!gasLimit && publicClient) {
        try {
          gasLimit = await publicClient.estimateGas({
            to: tx.to as `0x${string}`,
            value: tx.value,
            data: tx.data as `0x${string}`,
          });
        } catch (gasError) {
          // Gas estimation failed, will use default - this is expected behavior
        }
      }

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: tx.to as `0x${string}`,
        value: tx.value,
        data: tx.data as `0x${string}`,
        gas: gasLimit,
      });

      setTxHash(hash);
      
      // Wait for confirmation
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          showSuccessToast('Transaction confirmed!');
        } else {
          throw new Error('Transaction reverted');
        }
      }

      return hash;
    } catch (err: any) {
      const errorMsg = err.message || 'Transaction failed';
      setError(errorMsg);
      showErrorToast(err, 'Transaction failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendTransaction,
    isLoading,
    error,
    txHash,
  };
};
