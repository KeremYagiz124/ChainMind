import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config, chains } from '../../config/wagmi';
import Header from '../../components/Header';

// Mock wagmi hooks
jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </BrowserRouter>
);

describe('Header Component', () => {
  const mockProps = {
    isSidebarOpen: false,
    toggleSidebar: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with logo and title', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByText('ChainMind')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered DeFi Assistant')).toBeInTheDocument();
  });

  it('displays menu toggle button', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} />
      </TestWrapper>
    );

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    expect(menuButton).toBeInTheDocument();
  });

  it('calls toggleSidebar when menu button is clicked', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} />
      </TestWrapper>
    );

    const menuButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(menuButton);

    expect(mockProps.toggleSidebar).toHaveBeenCalledTimes(1);
  });

  it('displays notifications button', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} />
      </TestWrapper>
    );

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
  });

  it('displays settings button', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} />
      </TestWrapper>
    );

    const settingsButton = screen.getByRole('button', { name: /settings/i });
    expect(settingsButton).toBeInTheDocument();
  });

  it('shows connect wallet button when not connected', () => {
    // Mock disconnected state
    jest.doMock('wagmi', () => ({
      ...jest.requireActual('wagmi'),
      useAccount: () => ({
        address: undefined,
        isConnected: false,
      }),
    }));

    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} />
      </TestWrapper>
    );

    expect(screen.getByText(/connect wallet/i)).toBeInTheDocument();
  });

  it('applies correct styling when sidebar is open', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} isSidebarOpen={true} />
      </TestWrapper>
    );

    const header = screen.getByRole('banner');
    expect(header).toHaveClass('ml-64'); // Assuming this is the class for open sidebar
  });

  it('applies correct styling when sidebar is closed', () => {
    render(
      <TestWrapper>
        <Header {...mockProps} onMenuToggle={mockProps.toggleSidebar} isSidebarOpen={false} />
      </TestWrapper>
    );

    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('ml-64');
  });
});
