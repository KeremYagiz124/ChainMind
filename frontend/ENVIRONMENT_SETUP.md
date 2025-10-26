# 🔧 Environment Setup Guide

## Frontend Environment Variables

### Quick Setup

1. **Copy the example file:**
```bash
cd frontend
cp .env.example .env
```

2. **Required Variables:**

#### API Configuration
```bash
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

#### Wallet Configuration
Get these from their respective platforms:

**WalletConnect Project ID:**
- Visit: https://cloud.walletconnect.com/
- Create a new project
- Copy the Project ID
```bash
VITE_WALLETCONNECT_PROJECT_ID=abc123...
```

**Alchemy API Key:**
- Visit: https://dashboard.alchemy.com/
- Create an app
- Copy the API key
```bash
VITE_ALCHEMY_API_KEY=xyz789...
```

### 3. Start the Development Server

```bash
npm install
npm run dev
```

The app will be available at http://localhost:3000

---

## Backend Environment Variables

### Quick Setup

1. **Copy the example file:**
```bash
cd backend
cp .env.example .env
```

2. **Required Variables:**

#### Database (MongoDB)
```bash
DATABASE_URL="mongodb://localhost:27017/chainmind"
# Or use MongoDB Atlas:
# DATABASE_URL="mongodb+srv://user:pass@cluster.mongodb.net/chainmind"
```

#### Redis (Caching)
```bash
REDIS_URL="redis://localhost:6379"
```

#### JWT Secret (Min 32 characters)
```bash
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
SESSION_SECRET="your-session-secret-key-min-32-chars"
```

#### AI Provider (Choose one)
```bash
# Option 1: Gemini (Recommended)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key

# Option 2: OpenAI
# AI_PROVIDER=openai
# OPENAI_API_KEY=your_openai_api_key

# Option 3: HuggingFace (Free tier)
# AI_PROVIDER=huggingface
# HUGGINGFACE_API_KEY=optional_for_higher_limits
```

#### Blockchain RPC URLs
```bash
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
```

### 3. Run Database Migrations

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Start the Backend Server

```bash
npm install
npm run dev
```

The API will be available at http://localhost:3001

---

## Docker Setup (Alternative)

### Using Docker Compose

```bash
# Start all services (Frontend, Backend, MongoDB, Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Troubleshooting

### Port Already in Use

**Frontend (3000):**
```bash
# Change in vite.config.ts
server: {
  port: 3001
}
```

**Backend (3001):**
```bash
# Change in .env
PORT=3002
```

### Database Connection Issues

1. Check MongoDB is running:
```bash
# Local MongoDB
mongosh

# Or check Docker container
docker ps | grep mongo
```

2. Verify connection string in `.env`

### Redis Connection Issues

1. Check Redis is running:
```bash
redis-cli ping
# Should respond: PONG
```

2. Start Redis if needed:
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

---

## Production Deployment

### Frontend

Update `.env`:
```bash
VITE_API_URL=https://api.your-domain.com
VITE_SOCKET_URL=https://api.your-domain.com
VITE_DEBUG=false
GENERATE_SOURCEMAP=false
```

Build:
```bash
npm run build
```

### Backend

Update `.env`:
```bash
NODE_ENV=production
DATABASE_URL=your_production_mongodb_url
REDIS_URL=your_production_redis_url
```

Run migrations and start:
```bash
npx prisma migrate deploy
npm run start
```

---

## Security Best Practices

1. ✅ Never commit `.env` files
2. ✅ Use strong JWT secrets (min 32 characters)
3. ✅ Rotate API keys regularly
4. ✅ Use environment-specific configs
5. ✅ Enable HTTPS in production
6. ✅ Use secure database connections

---

## Getting API Keys

### Alchemy (Free Tier)
1. Visit: https://dashboard.alchemy.com/
2. Sign up and create an app
3. Copy the API key

### WalletConnect (Free)
1. Visit: https://cloud.walletconnect.com/
2. Create a project
3. Copy the Project ID

### Gemini AI (Free Tier Available)
1. Visit: https://makersuite.google.com/app/apikey
2. Create an API key
3. Copy the key

### MongoDB Atlas (Free Tier)
1. Visit: https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string

---

## Support

Need help? Check:
- 📖 [Main README](../README.md)
- 🏗️ [Architecture Guide](../ARCHITECTURE.md)
- 🚀 [Deployment Guide](../DEPLOYMENT.md)
