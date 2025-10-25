import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { wagmiConfig, chains } from './config/wagmi';
import ChatInterface from './components/ChatInterface';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Security from './pages/Security';
import Settings from './pages/Settings';
import History from './pages/History';

const queryClient = new QueryClient();

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <Router>
            <div className="min-h-screen bg-gray-50 flex">
              <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
              
              <div className="flex-1 flex flex-col">
                <Header onMenuToggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />
                
                {/* Disclaimer Banner */}
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
                  <p className="text-xs text-amber-800 text-center">
                    ⚠️ <strong>Disclaimer:</strong> ChainMind provides educational information only. This is not financial, investment, or legal advice. Always do your own research (DYOR) and consult with qualified professionals before making any investment decisions.
                  </p>
                </div>
                
                <main className="flex-1 p-6 lg:ml-0">
                  <Routes>
                    <Route path="/" element={<ChatInterface />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </main>
              </div>
              
              <Toaster position="top-right" />
            </div>
          </Router>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}

export default App;
