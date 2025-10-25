import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TokenPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: Date;
}

interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  topGainers: TokenPrice[];
  topLosers: TokenPrice[];
}

const Analytics: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketOverview | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<TokenPrice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Top tokens to display by default (when no search)
  const defaultTokens = ['BTC', 'ETH', 'USDC', 'USDT', 'SOL'];
  
  // All available tokens for search
  const allTokens = ['BTC', 'ETH', 'USDC', 'USDT', 'MATIC', 'LINK', 'UNI', 'AAVE', 'SOL', 'AVAX', 'DOT', 'ADA', 'ATOM', 'NEAR', 'FTM', 'ALGO', 'XRP', 'DOGE', 'SHIB', 'LTC', 'BCH', 'XLM', 'VET', 'ICP', 'FIL', 'SAND', 'MANA', 'AXS', 'THETA', 'EOS', 'CRV', 'MKR', 'COMP', 'SNX', 'YFI', 'SUSHI', 'BAL', 'ZRX', 'ENJ', 'CHZ', 'HOT', 'ZIL', 'WAVES', 'ONT', 'QTUM', 'ICX', 'ZEN', 'DASH', 'DCR', 'XTZ', 'KAVA'];

  const fetchMarketData = async (tokensToFetch?: string[]) => {
    setLoading(true);
    setError(null);

    // Use search tokens if provided, otherwise use default tokens
    const symbols = tokensToFetch || defaultTokens;

    try {
      const [overviewResponse, pricesResponse] = await Promise.all([
        fetch('http://localhost:3001/api/market/overview'),
        fetch(`http://localhost:3001/api/market/prices?symbols=${symbols.join(',')}`)
      ]);

      if (!overviewResponse.ok || !pricesResponse.ok) {
        throw new Error('Failed to fetch market data');
      }

      const overviewResult = await overviewResponse.json();
      const pricesResult = await pricesResponse.json();

      if (overviewResult.success) {
        setMarketData(overviewResult.data);
      }

      if (pricesResult.success) {
        // Filter out tokens with invalid volume data
        const validTokens = pricesResult.data.map((token: TokenPrice) => ({
          ...token,
          volume24h: token.volume24h || 0,
          marketCap: token.marketCap || 0
        }));
        setSelectedTokens(validTokens);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  // Handle search - fetch all tokens when searching
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      // When searching, fetch all tokens
      fetchMarketData(allTokens);
    } else {
      // When search is cleared, fetch only default tokens
      fetchMarketData(defaultTokens);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    }
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading && !marketData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-600">Loading market data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Analytics</h1>
          <p className="text-gray-600">
            Real-time cryptocurrency market data and insights
          </p>
        </div>
        <button
          onClick={() => fetchMarketData()}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {marketData && (
        <>
          {/* Market Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <p className="text-sm text-gray-600">Total Market Cap</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(marketData.totalMarketCap)}
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">24h Volume</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(marketData.totalVolume24h)}
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
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-orange-600 font-bold text-sm">₿</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">BTC Dominance</p>
                  <p className="text-xl font-bold text-gray-900">
                    {marketData.btcDominance.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl border border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 font-bold text-sm">Ξ</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ETH Dominance</p>
                  <p className="text-xl font-bold text-gray-900">
                    {marketData.ethDominance.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Top Gainers and Losers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Top Gainers (24h)
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {marketData.topGainers.slice(0, 5).map((token, index) => (
                  <div key={token.symbol} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{token.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(token.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 font-medium">
                        {formatPercentage(token.change24h)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Vol: {formatCurrency(token.volume24h)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                  Top Losers (24h)
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {marketData.topLosers.slice(0, 5).map((token, index) => (
                  <div key={token.symbol} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{token.symbol}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(token.price)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-medium">
                        {formatPercentage(token.change24h)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Vol: {formatCurrency(token.volume24h)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Token Prices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Token Prices</h2>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  24h Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Volume (24h)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Cap
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedTokens
                .filter(token => 
                  token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((token, index) => (
                <tr key={token.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {token.symbol}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(token.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`${
                      token.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(token.change24h)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(token.volume24h)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {token.marketCap ? formatCurrency(token.marketCap) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
