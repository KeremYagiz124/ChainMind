# Security Policy

## 🔒 Security Best Practices

This document outlines security considerations and best practices for ChainMind.

## Environment Variables

**NEVER commit real API keys, secrets, or credentials to version control.**

### Required Environment Variables

All sensitive configuration should be stored in `.env` files (which are gitignored):

#### Backend (.env)
```env
DATABASE_URL="your_mongodb_connection_string"
GEMINI_API_KEY="your_gemini_api_key"
OPENAI_API_KEY="your_openai_api_key"  # Optional
BLOCKSCOUT_API_KEY="your_blockscout_api_key"
ETHEREUM_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY"
ARBITRUM_RPC_URL="https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY"
ETHERSCAN_API_KEY="your_etherscan_api_key"
JWT_SECRET="your_jwt_secret_min_32_characters"
SESSION_SECRET="your_session_secret_min_32_characters"
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
REACT_APP_ALCHEMY_ID=your_alchemy_api_key
```

#### Contracts (.env)
```env
PRIVATE_KEY="your_private_key_for_deployment"
SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
ETHERSCAN_API_KEY="your_etherscan_api_key"
```

## Getting API Keys

### Free API Keys (No Credit Card Required)

1. **Google Gemini AI** (Recommended - Completely Free)
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google account
   - Click "Create API Key"
   - Copy and add to `.env` as `GEMINI_API_KEY`

2. **Hugging Face** (Optional - For higher rate limits)
   - Visit: https://huggingface.co/settings/tokens
   - Create account (free)
   - Generate new token
   - Add to `.env` as `HUGGINGFACE_API_KEY`

3. **Alchemy** (Free tier: 300M compute units/month)
   - Visit: https://www.alchemy.com/
   - Sign up for free account
   - Create new app
   - Copy API key

4. **Etherscan/Polygonscan/Arbiscan** (Free)
   - Visit respective scanner website
   - Create free account
   - Generate API key from account settings

5. **WalletConnect** (Free)
   - Visit: https://cloud.walletconnect.com/
   - Create project
   - Copy Project ID

### Paid API Keys (Optional)

1. **OpenAI** ($5 free credits initially)
   - Visit: https://platform.openai.com/api-keys
   - Create account
   - Add payment method (required after free credits)
   - Generate API key

## Security Checklist Before Deployment

- [ ] All `.env` files are in `.gitignore`
- [ ] No hardcoded API keys in source code
- [ ] All `.env.example` files contain only placeholder values
- [ ] JWT_SECRET and SESSION_SECRET are strong random strings (32+ characters)
- [ ] Database credentials are secure and not default values
- [ ] Private keys for contract deployment are never committed
- [ ] CORS is properly configured for production domains
- [ ] Rate limiting is enabled in production
- [ ] Helmet security headers are enabled
- [ ] All dependencies are up to date
- [ ] MongoDB connection uses authentication
- [ ] Redis is password-protected in production

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email: security@chainmind.ai

**Do NOT create public GitHub issues for security vulnerabilities.**

## Smart Contract Security

- All contracts use OpenZeppelin's audited libraries
- ReentrancyGuard is implemented on state-changing functions
- Access control via Ownable pattern
- Input validation on all public functions
- Events emitted for all state changes

## API Security

- Rate limiting: 100 requests per 15 minutes per IP
- JWT-based authentication with expiration
- Helmet.js for security headers
- CORS configured for specific origins only
- Input validation and sanitization
- SQL injection prevention via Prisma ORM
- XSS protection via React's built-in escaping

## Best Practices for Users

1. **Never share your private keys**
2. **Use hardware wallets for large amounts**
3. **Verify contract addresses before interacting**
4. **Start with small test transactions**
5. **Keep your wallet software updated**
6. **Be cautious of phishing attempts**
7. **Use strong, unique passwords**
8. **Enable 2FA where available**

## Disclaimer

ChainMind is provided "as is" without warranties. Users are responsible for:
- Securing their own private keys and credentials
- Verifying all transactions before signing
- Understanding the risks of DeFi protocols
- Complying with local regulations

**ChainMind does not provide financial advice. All information is educational only.**

## License

This project is licensed under the MIT License - see LICENSE file for details.
