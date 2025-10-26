import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid3x3, List, Search, Filter } from 'lucide-react';
import NFTCard from './NFTCard';

interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  collection?: string;
  owner?: string;
  lastPrice?: number;
  floorPrice?: number;
}

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  onNFTClick?: (nft: NFT) => void;
}

const NFTGrid: React.FC<NFTGridProps> = ({ nfts, loading = false, onNFTClick }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollection, setFilterCollection] = useState<string>('all');

  // Get unique collections
  const collections = ['all', ...Array.from(new Set(nfts.map(nft => nft.collection).filter(Boolean)))];

  // Filter NFTs
  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = nft.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.tokenId.includes(searchQuery);
    const matchesCollection = filterCollection === 'all' || nft.collection === filterCollection;
    return matchesSearch && matchesCollection;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Grid3x3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No NFTs Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your wallet to see your NFT collection
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search NFTs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Collection Filter */}
          {collections.length > 1 && (
            <select
              value={filterCollection}
              onChange={(e) => setFilterCollection(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {collections.map(collection => (
                <option key={collection} value={collection}>
                  {collection === 'all' ? 'All Collections' : collection}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Grid3x3 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredNFTs.length} of {nfts.length} NFTs
      </p>

      {/* NFT Grid/List */}
      <AnimatePresence mode="wait">
        {filteredNFTs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <p className="text-gray-600 dark:text-gray-400">
              No NFTs match your search criteria
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            {filteredNFTs.map((nft) => (
              <NFTCard
                key={nft.id}
                nft={nft}
                onClick={() => onNFTClick?.(nft)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NFTGrid;
