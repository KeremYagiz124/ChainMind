/**
 * Blockchain network constants
 */

export const CHAIN_IDS = {
  ETHEREUM: 1,
  POLYGON: 137,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  SEPOLIA: 11155111,
  POLYGON_MUMBAI: 80001,
} as const;

export const CHAIN_NAMES = {
  [CHAIN_IDS.ETHEREUM]: 'Ethereum',
  [CHAIN_IDS.POLYGON]: 'Polygon',
  [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
  [CHAIN_IDS.OPTIMISM]: 'Optimism',
  [CHAIN_IDS.BASE]: 'Base',
  [CHAIN_IDS.SEPOLIA]: 'Sepolia',
  [CHAIN_IDS.POLYGON_MUMBAI]: 'Polygon Mumbai',
} as const;

export const CHAIN_EXPLORERS = {
  [CHAIN_IDS.ETHEREUM]: 'https://etherscan.io',
  [CHAIN_IDS.POLYGON]: 'https://polygonscan.com',
  [CHAIN_IDS.ARBITRUM]: 'https://arbiscan.io',
  [CHAIN_IDS.OPTIMISM]: 'https://optimistic.etherscan.io',
  [CHAIN_IDS.BASE]: 'https://basescan.org',
  [CHAIN_IDS.SEPOLIA]: 'https://sepolia.etherscan.io',
  [CHAIN_IDS.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
} as const;

export const NATIVE_TOKENS = {
  [CHAIN_IDS.ETHEREUM]: { symbol: 'ETH', name: 'Ether', decimals: 18 },
  [CHAIN_IDS.POLYGON]: { symbol: 'MATIC', name: 'Polygon', decimals: 18 },
  [CHAIN_IDS.ARBITRUM]: { symbol: 'ETH', name: 'Ether', decimals: 18 },
  [CHAIN_IDS.OPTIMISM]: { symbol: 'ETH', name: 'Ether', decimals: 18 },
  [CHAIN_IDS.BASE]: { symbol: 'ETH', name: 'Ether', decimals: 18 },
  [CHAIN_IDS.SEPOLIA]: { symbol: 'ETH', name: 'Sepolia Ether', decimals: 18 },
  [CHAIN_IDS.POLYGON_MUMBAI]: { symbol: 'MATIC', name: 'Mumbai MATIC', decimals: 18 },
} as const;

export type ChainId = typeof CHAIN_IDS[keyof typeof CHAIN_IDS];
