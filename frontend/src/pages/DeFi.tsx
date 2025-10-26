import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  RefreshCw,
  AlertTriangle,
  PieChart as PieChartIcon
} from 'lucide-react';
import DeFiPositionCard, { DeFiPosition } from '../components/DeFiPositionCard';
import { API_ENDPOINTS } from '../config/api';
import { showErrorToast, showLoadingToast, dismissToast, showSuccessToast } from '../utils/errorHandler';
import BarChartComponent from '../components/charts/BarChartComponent';
import TransactionModal, { TransactionRequest } from '../components/TransactionModal';
import { useTransaction } from '../hooks/useTransaction';
import { logger } from '../utils/logger';

const DeFi: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'lending' | 'staking' | 'liquidity' | 'farming'>('all');
  const [showTxModal, setShowTxModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<TransactionRequest | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<DeFiPosition | null>(null);
  
  const { sendTransaction, isLoading: txLoading } = useTransaction();

  const fetchDeFiPositions = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);
    const toastId = showLoadingToast('Loading DeFi positions...');

    try {
      // Mock data - replace with actual API call
      const mockPositions: DeFiPosition[] = [
        {
          id: '1',
          protocol: 'Aave',
          type: 'lending',
          asset: 'USDC',
          amount: 5000,
          value: 5000,
          apy: 3.25,
          rewards: 12.5,
          chain: 'Ethereum',
          status: 'active',
          earnedToDate: 125
        },
        {
          id: '2',
          protocol: 'Lido',
          type: 'staking',
          asset: 'ETH',
          amount: 2.5,
          value: 6250,
          apy: 4.8,
          rewards: 0.025,
          chain: 'Ethereum',
          status: 'active',
          earnedToDate: 180
        },
        {
          id: '3',
          protocol: 'Uniswap',
          type: 'liquidity',
          asset: 'ETH-USDC',
          amount: 1500,
          value: 3000,
          apy: 15.5,
          rewards: 45,
          chain: 'Ethereum',
          status: 'active',
          earnedToDate: 220
        },
        {
          id: '4',
          protocol: 'Compound',
          type: 'lending',
          asset: 'DAI',
          amount: 8000,
          value: 8000,
          apy: 2.8,
          rewards: 18,
          chain: 'Ethereum',
          status: 'active',
          earnedToDate: 95
        }
      ];

      setPositions(mockPositions);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      showErrorToast(err, 'Failed to load DeFi positions');
    } finally {
      dismissToast(toastId);
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (isConnected && address && isMounted) {
        await fetchDeFiPositions();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  const handleClaimRewards = (position: DeFiPosition) => {
    setSelectedPosition(position);
    
    // Create a mock transaction for claiming rewards
    const tx: TransactionRequest = {
      to: '0x1234567890123456789012345678901234567890', // Mock protocol contract
      data: '0x', // This would be the actual claim function call data
      gasLimit: BigInt(150000)
    };
    
    setPendingTransaction(tx);
    setShowTxModal(true);
  };

  const handleConfirmTransaction = async () => {
    if (!pendingTransaction) return;

    try {
      const hash = await sendTransaction(pendingTransaction);
      showSuccessToast(`Rewards claimed! Tx: ${hash.slice(0, 10)}...`);
      setShowTxModal(false);
      
      // Refresh positions after successful claim
      await fetchDeFiPositions();
    } catch (error) {
      logger.error('Transaction failed:', error);
      // Error already shown by useTransaction hook
    }
  };

  const filteredPositions = filter === 'all' 
    ? positions 
    : positions.filter(p => p.type === filter);

  const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
  const totalRewards = positions.reduce((sum, p) => sum + (p.rewards || 0), 0);
  const totalEarned = positions.reduce((sum, p) => sum + (p.earnedToDate || 0), 0);
  const avgApy = positions.length > 0 
    ? positions.reduce((sum, p) => sum + p.apy, 0) / positions.length 
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Wallet className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          Connect your wallet to view your DeFi positions across multiple protocols
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600 dark:text-gray-400">Loading DeFi positions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Error Loading Positions
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchDeFiPositions}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">DeFi Positions</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your lending, staking, and liquidity positions
          </p>
        </div>
        <button
          onClick={fetchDeFiPositions}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalValue)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg APY</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {avgApy.toFixed(2)}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unclaimed Rewards</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalRewards)}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <PieChartIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Earned</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totalEarned)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      {positions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <BarChartComponent
            data={positions.map(p => ({
              name: p.protocol,
              value: p.value
            }))}
            title="Position Value by Protocol"
            valueFormatter={(value) => formatCurrency(value)}
            color="#3B82F6"
          />
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(['all', 'lending', 'staking', 'liquidity', 'farming'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {type === 'all' ? ` (${positions.length})` : ` (${positions.filter(p => p.type === type).length})`}
          </button>
        ))}
      </div>

      {/* Positions Grid */}
      {filteredPositions.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400">
            No {filter !== 'all' ? filter : ''} positions found
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredPositions.map((position) => (
            <div key={position.id} className="relative">
              <DeFiPositionCard position={position} />
              {position.rewards && position.rewards > 0 && (
                <button
                  onClick={() => handleClaimRewards(position)}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors shadow-lg"
                >
                  Claim ${position.rewards.toFixed(2)}
                </button>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTxModal}
        onClose={() => setShowTxModal(false)}
        transaction={pendingTransaction}
        onConfirm={handleConfirmTransaction}
        title="Claim Rewards"
        description={selectedPosition ? `Claim rewards from ${selectedPosition.protocol}` : 'Claim your DeFi rewards'}
      />
    </div>
  );
};

export default DeFi;
