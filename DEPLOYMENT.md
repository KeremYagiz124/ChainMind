# ChainMind Deployment Guide

This guide covers deploying ChainMind to various environments, from local development to production.

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Redis 7+
- Git

### 1. Clone and Setup
```bash
git clone https://github.com/your-username/chainmind.git
cd chainmind
npm run setup
```

### 2. Environment Configuration
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp contracts/.env.example contracts/.env

# Edit the .env files with your API keys and configuration
```

### 3. Database Setup
```bash
# Start PostgreSQL and Redis (or use Docker)
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
docker run -d --name redis -p 6379:6379 redis:7

# Run database migrations
npm run prisma:migrate
```

### 4. Start Development
```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend    # Backend on http://localhost:3001
npm run dev:frontend   # Frontend on http://localhost:3000
```

## 🐳 Docker Deployment

### Development with Docker
```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production with Docker
```bash
# Copy production environment
cp .env.example .env
# Edit .env with production values

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3 --scale frontend=2
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)
1. **Build and Push Images**
```bash
# Build images
docker build -t chainmind-backend ./backend
docker build -t chainmind-frontend ./frontend

# Tag for ECR
docker tag chainmind-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/chainmind-backend:latest
docker tag chainmind-frontend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/chainmind-frontend:latest

# Push to ECR
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/chainmind-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/chainmind-frontend:latest
```

2. **Create ECS Task Definitions**
```json
{
  "family": "chainmind-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/chainmind-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

#### Using Lambda (Serverless)
```bash
# Install Serverless Framework
npm install -g serverless

# Deploy backend as Lambda functions
cd backend
serverless deploy

# Deploy frontend to S3 + CloudFront
cd ../frontend
npm run build
aws s3 sync build/ s3://chainmind-frontend-bucket
```

### Google Cloud Platform

#### Using Cloud Run
```bash
# Build and deploy backend
gcloud builds submit --tag gcr.io/PROJECT-ID/chainmind-backend ./backend
gcloud run deploy chainmind-backend --image gcr.io/PROJECT-ID/chainmind-backend --platform managed

# Build and deploy frontend
gcloud builds submit --tag gcr.io/PROJECT-ID/chainmind-frontend ./frontend
gcloud run deploy chainmind-frontend --image gcr.io/PROJECT-ID/chainmind-frontend --platform managed
```

#### Using GKE (Kubernetes)
```bash
# Create cluster
gcloud container clusters create chainmind-cluster --num-nodes=3

# Deploy using kubectl
kubectl apply -f k8s/
```

### Microsoft Azure

#### Using Container Instances
```bash
# Create resource group
az group create --name chainmind-rg --location eastus

# Deploy backend
az container create \
  --resource-group chainmind-rg \
  --name chainmind-backend \
  --image chainmind-backend:latest \
  --ports 3001

# Deploy frontend
az container create \
  --resource-group chainmind-rg \
  --name chainmind-frontend \
  --image chainmind-frontend:latest \
  --ports 3000
```

## 🔧 Environment Configuration

### Backend Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/chainmind"
REDIS_URL="redis://host:6379"

# APIs
OPENAI_API_KEY="sk-..."
PYTH_NETWORK_URL="https://hermes.pyth.network"
BLOCKSCOUT_API_URL="https://eth.blockscout.com/api"
ENVIO_API_KEY="..."

# Blockchain
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/..."
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/..."
ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/..."

# Security
JWT_SECRET="your-secret-key"
LIT_NETWORK="cayenne"
```

### Frontend Environment Variables
```bash
REACT_APP_API_URL="https://api.chainmind.ai"
REACT_APP_WALLETCONNECT_PROJECT_ID="..."
REACT_APP_ALCHEMY_API_KEY="..."
```

## 📊 Monitoring and Logging

### Production Monitoring
```bash
# Start monitoring stack
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# Access dashboards
# Grafana: http://localhost:3001 (admin/password)
# Prometheus: http://localhost:9090
```

### Log Management
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Export logs
docker-compose logs backend > backend.log
```

## 🔒 Security Considerations

### SSL/TLS Configuration
1. **Obtain SSL Certificate**
```bash
# Using Let's Encrypt
certbot certonly --webroot -w /var/www/html -d chainmind.ai -d api.chainmind.ai
```

2. **Configure Nginx**
```nginx
server {
    listen 443 ssl http2;
    server_name chainmind.ai;
    
    ssl_certificate /etc/letsencrypt/live/chainmind.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chainmind.ai/privkey.pem;
    
    # SSL configuration...
}
```

### Security Headers
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## 🧪 Testing Deployment

### Health Checks
```bash
# Backend health check
curl http://localhost:3001/health

# Frontend health check
curl http://localhost:3000

# Database connectivity
curl http://localhost:3001/api/health/db

# Redis connectivity
curl http://localhost:3001/api/health/redis
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load tests
artillery run load-test.yml
```

## 🔄 CI/CD Pipeline

### GitHub Actions
The project includes a comprehensive CI/CD pipeline that:
- Runs tests on all components
- Builds Docker images
- Deploys to staging/production
- Runs security scans
- Monitors deployment health

### Manual Deployment
```bash
# Build production images
npm run build

# Deploy to staging
./scripts/deploy-staging.sh

# Deploy to production (after approval)
./scripts/deploy-production.sh
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=5

# Scale with Kubernetes
kubectl scale deployment chainmind-backend --replicas=5
```

### Database Scaling
```bash
# PostgreSQL read replicas
# Redis cluster mode
# Connection pooling with PgBouncer
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Issues**
```bash
# Check database connectivity
docker-compose exec backend npx prisma db pull
```

2. **Memory Issues**
```bash
# Monitor memory usage
docker stats
```

3. **API Rate Limits**
```bash
# Check rate limit headers
curl -I http://localhost:3001/api/chat/message
```

### Performance Optimization
- Enable Redis caching
- Configure CDN for static assets
- Optimize database queries
- Use connection pooling
- Enable gzip compression

## 📞 Support

For deployment issues:
- Check the logs: `docker-compose logs -f`
- Review environment variables
- Verify API keys and credentials
- Check network connectivity
- Monitor resource usage

---

**ChainMind Deployment Guide** - Ready for ETHOnline 2025! 🚀
