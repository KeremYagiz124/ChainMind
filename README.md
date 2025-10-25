# ChainMind - AI-Powered DeFi Chatbot

![ChainMind Logo](https://via.placeholder.com/400x200/1f2937/ffffff?text=ChainMind)

## 🧠 Overview

ChainMind is an intelligent AI-powered DeFi chatbot built for ETHOnline 2025. It combines conversational AI with comprehensive blockchain analysis to provide users with real-time insights, portfolio management, security assessments, and market intelligence across multiple chains.

## 🏆 Prize Eligibility

This project is designed to compete for multiple sponsor prizes:

- **ASI Alliance ($10,000)**: AI-powered conversational agent with natural language processing
- **Pyth Network ($5,000)**: Real-time price feeds integration
- **Lit Protocol ($5,000)**: Decentralized authentication and key management
- **Envio ($5,000)**: Multi-chain blockchain indexing and data aggregation
- **Blockscout ($10,000)**: Blockchain explorer API integration
- **Hardhat ($5,000)**: Smart contract development and deployment

**Total Prize Pool Eligibility: $40,000+**

## ✨ Features

### 🤖 AI Chatbot
- **Natural Language Processing**: Powered by OpenAI GPT-4 for intelligent conversations
- **Intent Recognition**: Understands user queries about DeFi, portfolios, and market data
- **Real-time Responses**: WebSocket-powered instant messaging
- **Context Awareness**: Maintains conversation history and user preferences

### 📊 Portfolio Management
- **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Optimism, Base
- **Token Balances**: Real-time tracking of ERC-20 tokens and native assets
- **NFT Collections**: Complete NFT portfolio visualization
- **DeFi Positions**: Automated detection of lending, staking, and LP positions
- **Risk Analysis**: Portfolio diversification and risk scoring
- **Performance Metrics**: Historical performance and ROI calculations

### 🔒 Security Analysis
- **Smart Contract Auditing**: Automated security assessments using Blockscout
- **Risk Scoring**: Protocol safety ratings and vulnerability detection
- **Audit Reports**: Integration with known audit providers
- **Security Alerts**: Real-time notifications for protocol risks

### 📈 Market Intelligence
- **Real-time Prices**: Pyth Network integration for accurate price feeds
- **Market Overview**: Trending tokens, gainers, and losers
- **Historical Data**: Price charts and market analysis
- **Token Search**: Comprehensive token database with metadata

### 🔐 Authentication
- **Wallet Connection**: Seamless Web3 wallet integration via RainbowKit
- **Lit Protocol**: Decentralized key management and encryption
- **Session Management**: Secure user sessions with Redis caching
- **Multi-wallet Support**: MetaMask, WalletConnect, Coinbase Wallet, and more

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
```
backend/
├── src/
│   ├── config/          # Database and Redis configuration
│   ├── middleware/      # Express middleware (auth, error handling)
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions and logging
├── prisma/              # Database schema and migrations
└── package.json
```

### Frontend (React + TypeScript)
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Main application pages
│   ├── config/          # Wagmi and Web3 configuration
│   └── utils/           # Frontend utilities
├── public/              # Static assets
└── package.json
```

### Smart Contracts (Solidity + Hardhat)
```
contracts/
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment scripts
├── test/                # Contract tests
└── hardhat.config.ts    # Hardhat configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database
- Redis server
- Git

### 1. Clone Repository
```bash
git clone https://github.com/your-username/chainmind.git
cd chainmind
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure your environment variables
npm run prisma:migrate
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure your environment variables
npm start
```

### 4. Smart Contracts Setup
```bash
cd contracts
npm install
npm run compile
npm run deploy:local
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chainmind"

# APIs
OPENAI_API_KEY="your_openai_api_key"
PYTH_NETWORK_URL="https://hermes.pyth.network"
BLOCKSCOUT_API_URL="https://eth.blockscout.com/api"
ENVIO_API_KEY="your_envio_api_key"

# Blockchain RPCs
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your_key"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/your_key"
ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/your_key"

# Redis
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your_jwt_secret"
LIT_NETWORK="cayenne"
```

#### Frontend (.env)
```env
REACT_APP_API_URL="http://localhost:3001"
REACT_APP_WALLETCONNECT_PROJECT_ID="your_project_id"
REACT_APP_ALCHEMY_API_KEY="your_alchemy_key"
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Smart Contract Tests
```bash
cd contracts
npm test
npm run coverage
```

## 📦 Deployment

### Backend Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting provider
```

### Smart Contract Deployment
```bash
cd contracts
# Sepolia testnet
npm run deploy:sepolia

# Polygon mainnet
npm run deploy:polygon

# Arbitrum mainnet
npm run deploy:arbitrum
```

## 🛠️ Technology Stack

### Core Technologies
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Redis caching
- **Blockchain**: ethers.js, Hardhat, OpenZeppelin

### Sponsor Integrations
- **ASI Alliance**: OpenAI GPT-4 for conversational AI
- **Pyth Network**: Real-time price feeds and market data
- **Lit Protocol**: Decentralized authentication and encryption
- **Envio**: Multi-chain blockchain indexing and GraphQL API
- **Blockscout**: Blockchain explorer API for contract analysis
- **Hardhat**: Smart contract development and testing framework

### Web3 Stack
- **Wallet Integration**: RainbowKit, wagmi, viem
- **Multi-chain**: Ethereum, Polygon, Arbitrum, Optimism, Base
- **Standards**: ERC-20, ERC-721, ERC-1155

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏅 ETHOnline 2025

Built with ❤️ for ETHOnline 2025 hackathon. ChainMind represents the future of AI-powered DeFi interactions, combining cutting-edge AI with comprehensive blockchain analysis to create an intelligent assistant for the decentralized finance ecosystem.

## 📞 Support

- **Documentation**: [docs.chainmind.ai](https://docs.chainmind.ai)
- **Discord**: [Join our community](https://discord.gg/chainmind)
- **Twitter**: [@ChainMindAI](https://twitter.com/ChainMindAI)
- **Email**: support@chainmind.ai

---

**ChainMind - Your AI-Powered DeFi Companion** 🧠⛓️
