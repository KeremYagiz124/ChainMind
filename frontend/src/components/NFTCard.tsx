import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

interface NFTData {
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

interface NFTCardProps {
  nft: NFTData;
  onClick?: () => void;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const openExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://opensea.io/assets/ethereum/${nft.contractAddress}/${nft.tokenId}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer shadow-sm hover:shadow-lg"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-gray-400" />
          </div>
        ) : (
          <img
            src={nft.image || '/placeholder-nft.png'}
            alt={nft.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        {/* External Link Button */}
        <button
          onClick={openExternalLink}
          className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-800"
        >
          <ExternalLink className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* NFT Info */}
      <div className="p-4">
        <div className="mb-2">
          {nft.collection && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
              {nft.collection}
            </p>
          )}
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {nft.name || `#${nft.tokenId}`}
          </h3>
        </div>

        {nft.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {nft.description}
          </p>
        )}

        {/* Price Info */}
        <div className="flex items-center justify-between text-sm">
          {nft.lastPrice && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Price</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {nft.lastPrice.toFixed(3)} ETH
              </p>
            </div>
          )}
          {nft.floorPrice && (
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Floor</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {nft.floorPrice.toFixed(3)} ETH
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NFTCard;
