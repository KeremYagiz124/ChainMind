import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ChainMind Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic API routes
app.get('/api/status', (req, res) => {
  res.json({
    service: 'ChainMind API',
    status: 'active',
    features: [
      'AI Chatbot (ASI Alliance)',
      'Real-time Market Data (Pyth Network)',
      'Blockchain Analysis (Blockscout)',
      'Multi-chain Indexing (Envio)',
      'Secure Authentication (Lit Protocol)'
    ]
  });
});

// Chat endpoint placeholder
app.post('/api/chat/message', (req, res) => {
  const { message, userId } = req.body;
  
  res.json({
    response: `Hello! I'm ChainMind AI. You said: "${message}". I'm ready to help with DeFi analysis and crypto insights!`,
    userId,
    timestamp: new Date().toISOString(),
    conversationId: `conv_${Date.now()}`
  });
});

// Market data endpoint placeholder
app.get('/api/market/overview', (req, res) => {
  res.json({
    totalMarketCap: 2500000000000,
    totalVolume24h: 85000000000,
    btcDominance: 52.3,
    ethDominance: 17.8,
    topGainers: [
      { symbol: 'ETH', price: 2650, change24h: 5.2 },
      { symbol: 'BTC', price: 67500, change24h: 3.1 }
    ],
    topLosers: [
      { symbol: 'ADA', price: 0.45, change24h: -2.8 }
    ],
    lastUpdated: new Date().toISOString()
  });
});

// Portfolio endpoint placeholder
app.get('/api/portfolio/:address/analysis', (req, res) => {
  const { address } = req.params;
  
  res.json({
    address,
    totalValue: 15750.50,
    holdings: [
      { symbol: 'ETH', amount: 5.2, value: 13780 },
      { symbol: 'USDC', amount: 1970.50, value: 1970.50 }
    ],
    chains: ['ethereum', 'polygon', 'arbitrum'],
    lastUpdated: new Date().toISOString()
  });
});

// Security analysis endpoint placeholder
app.get('/api/security/protocol/:protocol', (req, res) => {
  const { protocol } = req.params;
  
  res.json({
    protocol,
    riskScore: 85,
    riskLevel: 'LOW',
    analysis: {
      smartContractSecurity: 'VERIFIED',
      auditStatus: 'AUDITED',
      tvl: 2500000000,
      timeInMarket: '3+ years'
    },
    recommendations: [
      'Protocol has strong security track record',
      'Multiple audits completed',
      'High TVL indicates market confidence'
    ],
    lastUpdated: new Date().toISOString()
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: 'Something went wrong on our end'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ChainMind Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 API Status: http://localhost:${PORT}/api/status`);
  console.log(`💬 Chat API: POST http://localhost:${PORT}/api/chat/message`);
  console.log(`📈 Market API: http://localhost:${PORT}/api/market/overview`);
  console.log(`\n🎯 ETHOnline 2025 - ChainMind AI-Powered DeFi Chatbot`);
  console.log(`🏆 Sponsor Technologies:`);
  console.log(`   • ASI Alliance: AI Conversational Engine`);
  console.log(`   • Pyth Network: Real-time Price Feeds`);
  console.log(`   • Blockscout: Blockchain Analysis`);
  console.log(`   • Envio: Multi-chain Data Indexing`);
  console.log(`   • Lit Protocol: Secure Authentication`);
});
