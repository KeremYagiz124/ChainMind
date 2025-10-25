import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  RefreshCw,
  AlertTriangle,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: string;
  price?: number;
  value?: number;
  change24h?: number;
}

interface PortfolioData {
  address: string;
  totalValue: number;
  totalChange24h: number;
  tokens: TokenBalance[];
  lastUpdated: Date;
}

interface PortfolioAnalysis {
  diversificationScore: number;
  riskScore: number;
  recommendations: string[];
  topHoldings: TokenBalance[];
  allocation: { [category: string]: number };
}

const Portfolio: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolioData = async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const [portfolioResponse, analysisResponse] = await Promise.all([
        fetch(`/api/portfolio/${address}`),
        fetch(`/api/portfolio/${address}/analysis`)
      ]);

      if (!portfolioResponse.ok) {
        throw new Error('Failed to fetch portfolio data');
      }

      const portfolioResult = await portfolioResponse.json();
      let analysisResult = null;
      
      if (analysisResponse.ok) {
        analysisResult = await analysisResponse.json();
      }

      if (portfolioResult.success) {
        const data = portfolioResult.data;
        // Calculate total change 24h from token data
        const totalChange24h = data.tokens.reduce((acc: number, token: any) => {
          return acc + (token.change24h || 0);
        }, 0) / data.tokens.length;
        
        setPortfolioData({
          ...data,
          totalChange24h: totalChange24h,
          lastUpdated: new Date(data.lastUpdated)
        });
      }

      if (analysisResult && analysisResult.success) {
        setAnalysis(analysisResult.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchPortfolioData();
    }
  }, [address, isConnected]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Wallet className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600 max-w-md">
          Connect your wallet to view your portfolio, analyze your holdings, and get personalized DeFi insights.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading portfolio data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Error Loading Portfolio
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchPortfolioData}
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
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-gray-600">
            Track and analyze your crypto holdings across multiple chains
          </p>
        </div>
        <button
          onClick={fetchPortfolioData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {portfolioData && (
        <>
          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(portfolioData.totalValue)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  portfolioData.totalChange24h >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {portfolioData.totalChange24h >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">24h Change</p>
                  <p className={`text-2xl font-bold ${
                    portfolioData.totalChange24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercentage(portfolioData.totalChange24h)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assets</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portfolioData.tokens.length}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Holdings Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      24h Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolioData.tokens.map((token, index) => (
                    <tr key={token.address} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-bold">
                              {token.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {token.symbol}
                            </div>
                            <div className="text-sm text-gray-500">
                              {token.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(token.balance).toLocaleString(undefined, { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6
                        })} {token.symbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {token.price ? formatCurrency(token.price) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {token.value ? formatCurrency(token.value) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {token.change24h !== undefined ? (
                          <span className={`${
                            token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(token.change24h)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Analysis */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Portfolio Analysis
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Diversification Score</span>
                    <span className="text-sm font-medium text-gray-900">
                      {analysis.diversificationScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysis.diversificationScore}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className="text-sm font-medium text-gray-900">
                      {analysis.riskScore}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        analysis.riskScore < 30 ? 'bg-green-500' :
                        analysis.riskScore < 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysis.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {analysis.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-blue-500" />
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default Portfolio;
