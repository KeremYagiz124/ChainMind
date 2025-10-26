import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';

export interface TransactionRequest {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionRequest | null;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirm,
  title = 'Confirm Transaction',
  description
}) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setStatus('pending');
    setError(null);

    try {
      await onConfirm();
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Transaction failed');
    }
  };

  const handleClose = () => {
    if (status === 'pending') return;
    setStatus('idle');
    setError(null);
    setTxHash(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {status !== 'pending' && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {description && status === 'idle' && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}

            {/* Transaction Details */}
            {transaction && status === 'idle' && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                    {transaction.to}
                  </p>
                </div>
                {transaction.value && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Value</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {(Number(transaction.value) / 1e18).toFixed(4)} ETH
                    </p>
                  </div>
                )}
                {transaction.data && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data</p>
                    <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all max-h-20 overflow-y-auto">
                      {transaction.data.slice(0, 100)}...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Status Messages */}
            {status === 'pending' && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  Confirm in your wallet
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Please approve the transaction in your wallet extension
                </p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  Transaction Submitted
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                  Your transaction has been submitted successfully
                </p>
                {txHash && (
                  <a
                    href={`https://etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 text-sm"
                  >
                    View on Etherscan
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  Transaction Failed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {error || 'An error occurred while processing your transaction'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            {status === 'idle' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Confirm
                </button>
              </>
            )}
            {(status === 'success' || status === 'error') && (
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Close
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionModal;
