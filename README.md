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
- MongoDB database (MongoDB Atlas for cloud or local MongoDB)
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

## 🐳 Docker Setup (Recommended)

### Quick Start with Docker Compose

**Development Environment:**
```bash
# Clone the repository
git clone https://github.com/your-username/chainmind.git
cd chainmind

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp contracts/.env.example contracts/.env

# Edit .env files with your API keys
# Important: Add your MongoDB URI, API keys, etc.

# Start only MongoDB and Redis for development
docker-compose -f docker-compose.dev.yml up -d

# Then run frontend and backend locally for hot-reload
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

**Full Stack with Docker:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Individual Service Commands
```bash
# Start only database services
docker-compose up -d mongodb redis

# Restart a specific service
docker-compose restart backend

# View service logs
docker-compose logs -f backend

# Execute commands in a container
docker-compose exec backend npm run prisma:migrate
docker-compose exec backend npm test
```

### Docker Environment Variables
Create a `.env` file in the root directory:
```env
# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=your_secure_password
MONGO_DATABASE=chainmind

# Redis
REDIS_PASSWORD=your_redis_password

# Backend
BACKEND_PORT=3001
NODE_ENV=development

# API Keys (add your own)
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Production Deployment
```bash
# Build production images
docker-compose -f docker-compose.yml --profile production build

# Start with nginx reverse proxy
docker-compose --profile production up -d
```

### Troubleshooting Docker

**Port conflicts:**
```bash
# Check if ports are in use
lsof -i :3001  # Backend
lsof -i :5173  # Frontend
lsof -i :27017 # MongoDB

# Stop conflicting services
docker-compose down
```

**Reset everything:**
```bash
# Remove all containers, networks, and volumes
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

**View container status:**
```bash
docker-compose ps
docker stats
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="mongodb+srv://username:password@your-cluster.mongodb.net/?retryWrites=true&w=majority&appName=ChainMind"

# APIs
OPENAI_API_KEY="your_openai_api_key"
GEMINI_API_KEY="your_gemini_api_key"
PYTH_NETWORK_URL="https://hermes.pyth.network"
BLOCKSCOUT_API_URL="https://eth.blockscout.com/api"

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
REACT_APP_ENVIO_ENDPOINT="https://indexer.bigdevenergy.link/YOUR_INDEXER_ID/v1/graphql"
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

### Envio Indexer Deployment
See [ENVIO_DEPLOYMENT.md](ENVIO_DEPLOYMENT.md) for detailed instructions.

**Quick Steps:**
1. Deploy smart contracts to desired chains
2. Update contract addresses in `envio/config.yaml`
3. Go to https://envio.dev/app and create indexer
4. Upload config files from `envio/` folder
5. Deploy and copy GraphQL endpoint
6. Update `REACT_APP_ENVIO_ENDPOINT` in frontend `.env`

**Note:** Envio CLI has Windows compatibility issues. Use web dashboard for deployment.

## 🛠️ Technology Stack

### Core Technologies
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Database**: MongoDB with Redis caching
- **Blockchain**: ethers.js, Hardhat, OpenZeppelin

### Sponsor Integrations
- **ASI Alliance ($10,000)**: Gemini AI for conversational agent with natural language processing
- **Pyth Network ($5,000)**: Real-time price feeds and market data across multiple chains
- **Lit Protocol ($5,000)**: Decentralized authentication, session signing, and encrypted data storage
- **Envio ($5,000)**: Multi-chain blockchain indexing with GraphQL API (see [ENVIO_DEPLOYMENT.md](ENVIO_DEPLOYMENT.md))
- **Blockscout ($10,000)**: Blockchain explorer API for smart contract verification and analysis
- **Hardhat ($5,000)**: Smart contract development, testing, and deployment framework

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
