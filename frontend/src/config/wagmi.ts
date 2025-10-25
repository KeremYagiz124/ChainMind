import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { mainnet, polygon, arbitrum } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';

const { chains, publicClient } = configureChains(
  [mainnet, polygon, arbitrum],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_ALCHEMY_API_KEY || process.env.REACT_APP_ALCHEMY_ID || '' }),
    publicProvider()
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'ChainMind',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

export { wagmiConfig, chains };
export const config = wagmiConfig;
