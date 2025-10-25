# ChainMind Setup Guide

Complete step-by-step guide to get ChainMind running locally or in production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start-docker)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)
6. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software
- **Node.js** 18+ and npm 9+ ([Download](https://nodejs.org/))
- **Docker Desktop** (Recommended) ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

### Required API Keys
Get these before starting:
1. **Google Gemini API Key**: [Get Key](https://makersuite.google.com/app/apikey)
2. **WalletConnect Project ID**: [Create Project](https://cloud.walletconnect.com/)
3. **Alchemy API Key** (Optional): [Sign Up](https://www.alchemy.com/)
4. **MongoDB** (If not using Docker): [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

## Quick Start (Docker)

**Easiest way to get started!**

### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/chainmind.git
cd chainmind
```

### Step 2: Copy Environment Files
```bash
# Copy all example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp contracts/.env.example contracts/.env
```

### Step 3: Edit Environment Variables

**Backend (.env)**
```env
DATABASE_URL="mongodb://admin:devpassword@localhost:27017/chainmind?authSource=admin"
GEMINI_API_KEY="your_gemini_api_key_here"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
CORS_ORIGIN="http://localhost:5173"
```

**Frontend (.env)**
```env
VITE_API_URL="http://localhost:3001"
VITE_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"
```

### Step 4: Start Services
```bash
# Start only databases (recommended for development)
docker-compose -f docker-compose.dev.yml up -d

# Wait for databases to be ready (10 seconds)
sleep 10

# Install dependencies and start backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev

# In another terminal, start frontend
cd frontend
npm install
npm run dev
```

### Step 5: Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017

---

## Manual Setup

### 1. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB
# macOS
brew install mongodb-community

# Ubuntu
sudo apt install mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod --dbpath ~/data/db
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string
4. Update `DATABASE_URL` in backend/.env

### 2. Redis Setup (Optional)

```bash
# macOS
brew install redis
redis-server

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Windows
# Use Docker or WSL
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup Prisma
npx prisma generate
npx prisma db push

# Run migrations (if using migrations)
npx prisma migrate dev

# Start development server
npm run dev

# Or for production
npm run build
npm start
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
npm run preview
```

### 5. Smart Contracts Setup

```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node  # In one terminal
npx hardhat run scripts/deploy.ts --network localhost  # In another
```

---

## Configuration

### Environment Variables Reference

#### Backend Required Variables
```env
# Database
DATABASE_URL="mongodb://..."

# AI Provider
GEMINI_API_KEY="your_key"

# Security
JWT_SECRET="min-32-characters-random-string"

# Server
PORT=3001
NODE_ENV=development
```

#### Backend Optional Variables
```env
# Redis
REDIS_URL="redis://localhost:6379"

# Other AI Providers
OPENAI_API_KEY="your_key"

# Blockchain RPCs
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your_key"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/your_key"

# API Keys
ETHERSCAN_API_KEY="your_key"
POLYGONSCAN_API_KEY="your_key"
```

#### Frontend Variables
```env
VITE_API_URL="http://localhost:3001"
VITE_WALLETCONNECT_PROJECT_ID="your_project_id"
VITE_ALCHEMY_API_KEY="your_key"  # Optional
```

### Generating Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
# Windows
netstat -ano | findstr :3001

# Mac/Linux
lsof -i :3001

# Kill the process or change port in .env
```

#### 2. MongoDB Connection Failed
```bash
# Check if MongoDB is running
# Mac/Linux
ps aux | grep mongod

# Windows
tasklist | findstr mongod

# Test connection
mongosh "your_connection_string"
```

#### 3. Prisma Client Not Generated
```bash
cd backend
npx prisma generate
# If still fails, delete node_modules and reinstall
rm -rf node_modules
npm install
npx prisma generate
```

#### 4. Frontend Build Errors
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules .vite dist
npm install
npm run dev
```

#### 5. Docker Issues
```bash
# Reset Docker completely
docker-compose down -v
docker system prune -a
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Still Having Issues?

1. Check logs:
   - Backend: `backend/logs/`
   - Frontend: Browser console
   - Docker: `docker-compose logs`

2. Verify all environment variables are set

3. Check [GitHub Issues](https://github.com/your-username/chainmind/issues)

4. Join our [Discord](https://discord.gg/chainmind)

---

## Production Deployment

### Using Docker

```bash
# 1. Create production .env files
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production

# 2. Update with production values
# - Use strong passwords
# - Set NODE_ENV=production
# - Use production API keys
# - Set proper CORS origins

# 3. Build and start
docker-compose -f docker-compose.yml --profile production up -d

# 4. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 5. Monitor logs
docker-compose logs -f
```

### Manual Deployment

#### Backend
```bash
cd backend

# Install production dependencies
npm ci --only=production

# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name chainmind-backend

# Or use systemd service
```

#### Frontend
```bash
cd frontend

# Build
npm run build

# Serve with nginx
# Copy dist/ to /var/www/chainmind
sudo cp -r dist/* /var/www/chainmind/
```

### Security Checklist for Production

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring (Sentry, DataDog)
- [ ] Configure backups (MongoDB, Redis)
- [ ] Review CORS settings
- [ ] Use environment-specific API keys
- [ ] Enable security headers
- [ ] Set up log rotation
- [ ] Configure CDN (Cloudflare)

---

## Next Steps

After setup:

1. **Connect Wallet**: Click "Connect Wallet" and select your wallet
2. **Start Chatting**: Ask the AI about DeFi, portfolios, or security
3. **Check Portfolio**: View your token holdings and positions
4. **Explore Features**: Try analytics, security scanning, and history

## 🆘 Need Help?

- 📖 [Full Documentation](./README.md)
- 🏗️ [Architecture Guide](./ARCHITECTURE.md)
- 🤝 [Contributing](./CONTRIBUTING.md)
- 💬 [Discord Community](https://discord.gg/chainmind)
- 🐛 [Report Issues](https://github.com/your-username/chainmind/issues)

---

**Happy Building! 🚀**
