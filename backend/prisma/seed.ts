import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting database seeding...');

  // Seed popular tokens
  const tokens = [
    {
      address: '0xA0b86991c431e803859c33c4B531E0E5B0cD6Eb8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chain: 'ethereum',
      coingeckoId: 'usd-coin'
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chain: 'ethereum',
      coingeckoId: 'tether'
    },
    {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chain: 'ethereum',
      coingeckoId: 'dai'
    },
    {
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      symbol: 'LINK',
      name: 'Chainlink',
      decimals: 18,
      chain: 'ethereum',
      coingeckoId: 'chainlink'
    },
    {
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      symbol: 'UNI',
      name: 'Uniswap',
      decimals: 18,
      chain: 'ethereum',
      coingeckoId: 'uniswap'
    }
  ];

  for (const token of tokens) {
    await prisma.token.upsert({
      where: {
        address_chain: {
          address: token.address,
          chain: token.chain
        }
      },
      update: {},
      create: token
    });
  }

  // Seed DeFi protocols
  const protocols = [
    {
      name: 'Uniswap V3',
      slug: 'uniswap-v3',
      description: 'Decentralized exchange with concentrated liquidity',
      website: 'https://uniswap.org',
      chain: 'ethereum',
      category: 'dex',
      auditStatus: 'audited',
      auditFirms: ['Trail of Bits', 'ABDK'],
      riskScore: 25
    },
    {
      name: 'Aave V3',
      slug: 'aave-v3',
      description: 'Decentralized lending and borrowing protocol',
      website: 'https://aave.com',
      chain: 'ethereum',
      category: 'lending',
      auditStatus: 'audited',
      auditFirms: ['OpenZeppelin', 'Consensys Diligence'],
      riskScore: 20
    },
    {
      name: 'Compound V3',
      slug: 'compound-v3',
      description: 'Algorithmic money market protocol',
      website: 'https://compound.finance',
      chain: 'ethereum',
      category: 'lending',
      auditStatus: 'audited',
      auditFirms: ['OpenZeppelin', 'ChainSecurity'],
      riskScore: 30
    }
  ];

  for (const protocol of protocols) {
    await prisma.protocol.upsert({
      where: { slug: protocol.slug },
      update: {},
      create: protocol
    });
  }

  // Seed system configuration
  const systemConfigs = [
    {
      key: 'ai_model_version',
      value: { model: 'gpt-4', version: '1.0.0' }
    },
    {
      key: 'supported_chains',
      value: { chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'base'] }
    },
    {
      key: 'cache_ttl',
      value: { 
        market_data: 300,
        portfolio_data: 600,
        security_analysis: 3600
      }
    }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config
    });
  }

  logger.info('✅ Database seeding completed successfully');
}

main()
  .catch((e) => {
    logger.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
