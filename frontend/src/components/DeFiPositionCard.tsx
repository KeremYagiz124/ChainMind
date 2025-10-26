import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink, DollarSign } from 'lucide-react';

export interface DeFiPosition {
  id: string;
  protocol: string;
  protocolIcon?: string;
  type: 'lending' | 'staking' | 'liquidity' | 'farming';
  asset: string;
  amount: number;
  value: number;
  apy: number;
  rewards?: number;
  chain: string;
  status: 'active' | 'inactive';
  earnedToDate?: number;
}

interface DeFiPositionCardProps {
  position: DeFiPosition;
  onClick?: () => void;
}

const DeFiPositionCard: React.FC<DeFiPositionCardProps> = ({ position, onClick }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'staking':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'liquidity':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'farming':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {position.protocolIcon ? (
            <img
              src={position.protocolIcon}
              alt={position.protocol}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {position.protocol.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {position.protocol}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {position.chain}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(position.type)}`}>
          {position.type.charAt(0).toUpperCase() + position.type.slice(1)}
        </span>
      </div>

      {/* Position Details */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Asset</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatAmount(position.amount)} {position.asset}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Value</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(position.value)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">APY</span>
          <div className="flex items-center gap-1">
            {position.apy > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`font-semibold ${
              position.apy > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {position.apy.toFixed(2)}%
            </span>
          </div>
        </div>

        {position.rewards !== undefined && position.rewards > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Unclaimed Rewards</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {formatCurrency(position.rewards)}
            </span>
          </div>
        )}

        {position.earnedToDate !== undefined && position.earnedToDate > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Earned to Date</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(position.earnedToDate)}
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            position.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
            {position.status}
          </span>
        </div>
        <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default DeFiPositionCard;
