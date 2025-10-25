# ChainMind Architecture

## 🏗️ System Architecture

ChainMind is built with a modern, scalable microservices architecture optimized for Web3 applications.

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend Layer                       │
│  React + TypeScript + Tailwind + RainbowKit + Wagmi    │
└────────────────────┬────────────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────┴────────────────────────────────────┐
│                    Backend Layer                         │
│         Node.js + Express + Prisma + TypeScript         │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   AI Service │  │  Blockchain  │  │   Security   │ │
│  │    (Gemini)  │  │   Service    │  │   Scanner    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────┐
│                  Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   MongoDB    │  │    Redis     │  │  Blockchain  │ │
│  │   Database   │  │    Cache     │  │    Nodes     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 📦 Component Overview

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ChatInterface.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx
│   │
│   ├── pages/            # Route components
│   │   ├── Portfolio.tsx
│   │   ├── Analytics.tsx
│   │   ├── Security.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/            # Custom React hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useClickOutside.ts
│   │   ├── useCopyToClipboard.ts
│   │   ├── useAsync.ts
│   │   └── useWindowSize.ts
│   │
│   ├── contexts/         # React Context providers
│   │   └── ThemeContext.tsx
│   │
│   ├── services/         # API services
│   │   └── api.ts
│   │
│   ├── utils/            # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   ├── constants/        # App constants
│   │   ├── chains.ts
│   │   ├── routes.ts
│   │   └── index.ts
│   │
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   │
│   └── config/           # Configuration
│       └── wagmi.ts
```

### Backend Architecture

```
backend/
├── src/
│   ├── config/           # Configuration
│   │   └── env.ts       # Environment validation
│   │
│   ├── middleware/       # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── cors.ts
│   │
│   ├── routes/           # API routes
│   │   ├── chat.ts
│   │   ├── portfolio.ts
│   │   ├── analytics.ts
│   │   └── security.ts
│   │
│   ├── services/         # Business logic
│   │   ├── aiService.ts
│   │   ├── blockchainService.ts
│   │   └── securityService.ts
│   │
│   ├── utils/            # Utility functions
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   │
│   ├── models/           # Data models (Prisma)
│   │   └── prisma/
│   │
│   └── simple-start.js   # Development server
```

## 🔄 Data Flow

### 1. Chat Message Flow

```
User Input → Frontend
    ↓
ChatInterface validates input
    ↓
API request to /api/chat/message
    ↓
Backend receives & validates
    ↓
AI Service (Gemini) processes
    ↓
Blockchain data enrichment
    ↓
Response formatted & returned
    ↓
Frontend updates UI
    ↓
Message saved to MongoDB
```

### 2. Portfolio Analysis Flow

```
Wallet Connection (RainbowKit)
    ↓
Address validation
    ↓
API request to /api/portfolio
    ↓
Parallel data fetching:
  - Token balances (RPC)
  - DeFi positions (Subgraphs)
  - Price data (Pyth/CoinGecko)
    ↓
Data aggregation & calculation
    ↓
Cache in Redis (15 min)
    ↓
Response to frontend
    ↓
UI visualization
```

### 3. Security Scanning Flow

```
Protocol address input
    ↓
API request to /api/security/scan
    ↓
Rate limiting check
    ↓
Parallel security checks:
  - Contract verification
  - Audit report lookup
  - Historical exploit checks
  - Liquidity analysis
    ↓
Risk score calculation
    ↓
AI-powered insights
    ↓
Results cached & returned
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Web3**: Wagmi + RainbowKit + Viem
- **State**: React Context + Local Storage
- **Routing**: React Router v6
- **HTTP**: Fetch API with custom wrapper
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MongoDB
- **Cache**: Redis
- **Validation**: Zod
- **AI**: Google Gemini API
- **Blockchain**: Ethers.js

### Smart Contracts
- **Language**: Solidity 0.8.19
- **Framework**: Hardhat
- **Testing**: Hardhat Chai Matchers
- **Libraries**: OpenZeppelin Contracts
- **Networks**: Ethereum, Polygon, Arbitrum, Base

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Prettier
- **Security**: CodeQL + Trivy
- **Monitoring**: Winston Logger

## 🔐 Security Architecture

### Authentication & Authorization
- Wallet-based authentication (Sign-In with Ethereum)
- JWT tokens for session management
- Rate limiting per IP and user
- CORS configuration

### API Security
- Input validation (Zod schemas)
- SQL injection prevention (Prisma ORM)
- XSS protection (sanitization)
- Rate limiting (Redis-backed)
- Request timeout handling

### Smart Contract Security
- OpenZeppelin audited contracts
- Reentrancy guards
- Access control (Ownable)
- Pausable functionality
- Emergency withdrawal

### Data Security
- Sensitive data encryption
- Environment variable validation
- Secure cookie handling
- HTTPS enforcement (production)

## 📊 Scalability Considerations

### Horizontal Scaling
- Stateless backend design
- Redis for shared session storage
- Load balancer ready
- Database connection pooling

### Caching Strategy
- Redis for API responses (15 min TTL)
- Browser caching for static assets
- CDN for frontend assets
- GraphQL query caching

### Performance Optimization
- Database indexing
- Query optimization
- Lazy loading components
- Code splitting
- Image optimization

## 🔄 Development Workflow

### Local Development
1. Start MongoDB + Redis (Docker)
2. Run backend (`npm run dev`)
3. Run frontend (`npm run dev`)
4. Hot reload enabled

### Testing
- Unit tests (Jest)
- Integration tests
- Contract tests (Hardhat)
- E2E tests (planned)

### Deployment
- Development: Docker Compose
- Staging: Docker Swarm
- Production: Kubernetes (planned)

## 📈 Monitoring & Logging

### Application Logs
- Winston logger with levels
- Structured JSON logs
- Log aggregation ready
- Error tracking

### Metrics
- API response times
- Error rates
- User activity
- Blockchain data freshness

### Alerts
- High error rate
- API downtime
- Database connection issues
- Smart contract events

## 🚀 Future Enhancements

### Phase 1 (Current)
- ✅ Core chat functionality
- ✅ Portfolio tracking
- ✅ Security scanning
- ✅ Dark mode

### Phase 2 (Planned)
- [ ] WebSocket real-time updates
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Multi-chain support expansion

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Browser extension
- [ ] API marketplace

## 📚 API Documentation

API documentation available at:
- Development: `http://localhost:3001/api-docs`
- Production: `https://api.chainmind.ai/api-docs`

Swagger/OpenAPI specification included.

---

For more details, see individual component documentation in their respective directories.
