const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
  });
});

// Favicon endpoint to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Basic API routes
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working',
    environment: process.env.NODE_ENV || 'development'
  });
});

// In-memory storage for conversations
let conversations = [];
let messageIdCounter = 1;

// --- Lightweight AI helper (uses env to choose provider) ---
let openaiClient = null;
let geminiClient = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (_) {}

try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (err) {
  console.error('Gemini client initialization error:', err?.message);
}

const axios = require('axios');

async function generateAIResponse(prompt) {
  const provider = (process.env.AI_PROVIDER || '').toLowerCase();

  // 1) OpenAI if configured or selected
  if (openaiClient && (provider === 'openai' || !provider)) {
    try {
      const completion = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are ChainMind, an expert AI for DeFi, crypto markets, portfolio analysis, and protocol security. Provide concise, helpful, and actionable responses.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
      });
      const text = completion?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      console.error('OpenAI error:', err?.message || err);
    }
  }

  // 2) Gemini
  if (geminiClient && (provider === 'gemini')) {
    try {
      const model = geminiClient.getGenerativeModel({ 
        model: process.env.GEMINI_MODEL || 'gemini-1.5-pro-latest'
      });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `You are ChainMind, an expert AI for DeFi, crypto markets, portfolio analysis, and protocol security. Provide concise, helpful, and actionable responses.\n\nUser question: ${prompt}` }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });
      const text = result?.response?.text?.();
      if (text) return text.trim();
    } catch (err) {
      console.error('Gemini error:', err?.message || err);
      // Don't fall through - try next provider
    }
  }

  // 3) HuggingFace Inference API
  if ((process.env.AI_PROVIDER || '').toLowerCase() === 'huggingface') {
    try {
      const hfModel = process.env.HF_MODEL || 'mistralai/Mistral-7B-Instruct-v0.2';
      const resp = await axios.post(
        `https://api-inference.huggingface.co/models/${hfModel}`,
        { inputs: prompt },
        {
          headers: process.env.HUGGINGFACE_API_KEY ? { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } : {},
          timeout: 20000,
        }
      );
      const data = resp.data;
      const text = Array.isArray(data) ? (data[0]?.generated_text || '') : (data?.generated_text || '');
      if (text) return text.trim();
    } catch (err) {
      console.error('HuggingFace error:', err?.message || err);
    }
  }

  // 4) Advanced keyword-based AI responses
  const q = prompt.toLowerCase();
  
  // DeFi Protocols
  if (q.includes('uniswap') || q.includes('uni')) {
    if (q.includes('v2') && q.includes('v3')) {
      return 'Uniswap V2 vs V3 comparison:\n\n**V2**: Simple constant product AMM (x*y=k), liquidity spread across entire price range, easier for LPs, lower capital efficiency.\n\n**V3**: Concentrated liquidity - LPs choose price ranges, up to 4000x capital efficiency, multiple fee tiers (0.05%, 0.3%, 1%), more complex but higher returns for active LPs.\n\n**Key difference**: V3 requires active management but offers better returns. V2 is "set and forget" but less efficient.';
    }
    return 'Uniswap is the leading decentralized exchange (DEX) on Ethereum. V3 introduced concentrated liquidity, allowing LPs to provide liquidity within specific price ranges for higher capital efficiency. It supports multiple chains and handles billions in daily volume.';
  }
  
  if (q.includes('aave')) {
    return 'Aave is a leading DeFi lending protocol where users can:\n- Deposit crypto to earn interest\n- Borrow against collateral\n- Use flash loans (uncollateralized loans within one transaction)\n\nKey features: Multi-chain support, isolation mode for new assets, eMode for correlated assets (like stablecoins), and strong security with multiple audits.';
  }
  
  if (q.includes('compound')) {
    return 'Compound is an algorithmic money market protocol for lending and borrowing. Interest rates adjust automatically based on supply/demand. V3 (Comet) focuses on single-asset pools with improved capital efficiency and lower gas costs compared to V2.';
  }
  
  // Cryptocurrencies
  if (q.includes('bitcoin') || q.includes('btc')) {
    if (q.includes('what') || q.includes('nedir')) {
      return 'Bitcoin is the first and largest cryptocurrency, created in 2009 by Satoshi Nakamoto. Key features:\n\n- Decentralized digital currency\n- Limited supply: 21 million BTC\n- Proof-of-Work consensus\n- Store of value ("digital gold")\n- Peer-to-peer transactions without intermediaries\n\nBitcoin pioneered blockchain technology and remains the most secure and decentralized cryptocurrency.';
    }
    return 'Bitcoin (BTC) is the leading cryptocurrency with ~$1.3T market cap. It serves as digital gold and a store of value. Recent developments include Lightning Network for faster payments and growing institutional adoption.';
  }
  
  if (q.includes('ethereum') || q.includes('eth')) {
    if (q.includes('what') || q.includes('nedir')) {
      return 'Ethereum is a decentralized platform for smart contracts and dApps. Key features:\n\n- Smart contract functionality\n- Proof-of-Stake consensus (post-Merge)\n- Native currency: ETH\n- Foundation for DeFi, NFTs, and Web3\n- EVM (Ethereum Virtual Machine)\n\nEthereum enables programmable money and decentralized applications, making it the backbone of DeFi.';
    }
    return 'Ethereum (ETH) is the leading smart contract platform. After the Merge, it uses Proof-of-Stake, reducing energy consumption by 99.95%. It hosts most DeFi protocols and NFT marketplaces.';
  }
  
  if (q.includes('solana') || q.includes('sol')) {
    return 'Solana is a high-performance blockchain known for:\n- Fast transactions (65,000 TPS theoretical)\n- Low fees (~$0.00025 per transaction)\n- Proof-of-History + Proof-of-Stake\n- Growing DeFi ecosystem\n\nTrade-offs: Less decentralized than Ethereum, occasional network outages, but excellent for high-frequency applications.';
  }
  
  // DeFi Concepts
  if (q.includes('defi') && (q.includes('what') || q.includes('nedir'))) {
    return 'DeFi (Decentralized Finance) recreates traditional financial services without intermediaries:\n\n**Key Services**:\n- Lending/Borrowing (Aave, Compound)\n- Trading (Uniswap, Curve)\n- Derivatives (dYdX, GMX)\n- Stablecoins (DAI, USDC)\n\n**Benefits**: Permissionless, transparent, composable, 24/7 access\n**Risks**: Smart contract bugs, impermanent loss, liquidation risk';
  }
  
  if (q.includes('impermanent loss') || q.includes('il')) {
    return 'Impermanent Loss occurs when providing liquidity to AMMs:\n\n**How it works**: When token prices diverge from your entry point, you end up with less value than just holding.\n\n**Example**: Provide ETH/USDC at $2000. If ETH goes to $3000, arbitrageurs rebalance the pool, leaving you with less ETH and more USDC than if you just held.\n\n**Mitigation**: Choose correlated pairs (ETH/WBTC), use concentrated liquidity (Uniswap V3), or stick to stablecoin pairs.';
  }
  
  if (q.includes('staking')) {
    return 'Staking involves locking crypto to support network operations and earn rewards:\n\n**Types**:\n1. **Native staking**: ETH 2.0, Solana, Cardano (~4-10% APY)\n2. **DeFi staking**: Lock tokens in protocols for governance/rewards\n3. **Liquid staking**: Get derivative tokens (stETH) while staking\n\n**Considerations**: Lock-up periods, slashing risks, validator reliability, tax implications';
  }
  
  // Portfolio & Strategy
  if (q.includes('portfolio') || q.includes('diversif')) {
    return 'DeFi Portfolio Strategy:\n\n**Core Holdings (60-70%)**:\n- BTC/ETH: Foundation assets\n- Stablecoins: 15-25% for stability and opportunities\n\n**DeFi Blue Chips (20-30%)**:\n- UNI, AAVE, MKR, CRV: Proven protocols\n\n**Risk Management**:\n- Rebalance quarterly\n- Use stop-losses for volatile positions\n- Keep 10-20% in stablecoins for dip buying\n- Diversify across chains (Ethereum, Arbitrum, Polygon)';
  }
  
  // Security
  if (q.includes('security') || q.includes('safe') || q.includes('risk')) {
    return 'DeFi Security Best Practices:\n\n**Smart Contract Risks**:\n✓ Check for audits (Trail of Bits, OpenZeppelin)\n✓ Review TVL and age (older = more battle-tested)\n✓ Look for bug bounties\n✓ Verify admin controls and timelocks\n\n**Personal Security**:\n✓ Use hardware wallets for large amounts\n✓ Never share seed phrases\n✓ Verify contract addresses\n✓ Start with small amounts\n✓ Revoke unused token approvals\n\n**Red Flags**: Anonymous teams, no audits, unrealistic APYs (>100%), new protocols with high TVL';
  }
  
  // Yield Farming
  if (q.includes('yield') || q.includes('farm') || q.includes('apy')) {
    return 'Yield Farming Strategies:\n\n**Low Risk (5-15% APY)**:\n- Stablecoin lending (Aave, Compound)\n- Stablecoin LPs (USDC/DAI)\n\n**Medium Risk (15-50% APY)**:\n- Blue-chip LPs (ETH/USDC on Uniswap V3)\n- Single-sided staking (AAVE, CRV)\n\n**High Risk (50%+ APY)**:\n- New protocol incentives\n- Volatile pairs\n\n**Warning**: High APYs often come from token emissions. Calculate real yield vs. inflationary rewards.';
  }
  
  // Gas & Fees
  if (q.includes('gas') || q.includes('fee')) {
    return 'Gas Fees Explained:\n\n**Ethereum**: $5-50+ per transaction depending on network congestion\n**L2 Solutions**: 10-100x cheaper\n- Arbitrum: ~$0.50-2\n- Optimism: ~$0.50-2\n- Polygon: ~$0.01-0.10\n\n**Tips to Save**:\n- Use L2s for frequent transactions\n- Batch transactions when possible\n- Trade during low-traffic hours (weekends, late night UTC)\n- Use DEX aggregators (1inch, Matcha) for best routes';
  }
  
  // Investment questions - provide real-time market analysis
  if (q.includes('buy') || q.includes('invest') || q.includes('which coin')) {
    return await analyzeMarketAndRecommend();
  }
  
  // General catch-all with helpful context
  return `I can help you understand: "${prompt}"\n\nHere are some areas I cover:\n\n**DeFi Protocols**: How Uniswap, Aave, Compound work\n**Blockchain Basics**: Bitcoin, Ethereum, Solana fundamentals\n**Strategies**: Portfolio diversification, risk management\n**Concepts**: Staking, yield farming, impermanent loss\n**Security**: Smart contract risks, best practices\n\nWhat would you like to explore?`;
}

// Map common tickers/names to CoinGecko IDs
function detectCoinGeckoIds(text) {
  const map = [
    { keys: ['bitcoin', 'btc'], id: 'bitcoin' },
    { keys: ['ethereum', 'eth'], id: 'ethereum' },
    { keys: ['solana', 'sol'], id: 'solana' },
    { keys: ['polygon', 'matic'], id: 'polygon' },
    { keys: ['avalanche', 'avax'], id: 'avalanche-2' },
    { keys: ['arbitrum', 'arb'], id: 'arbitrum' },
    { keys: ['chainlink', 'link'], id: 'chainlink' },
    { keys: ['aave'], id: 'aave' },
    { keys: ['uniswap', 'uni'], id: 'uniswap' },
    { keys: ['tether', 'usdt'], id: 'tether' },
    { keys: ['usd coin', 'usdc'], id: 'usd-coin' },
  ];
  const found = new Set();
  for (const row of map) {
    if (row.keys.some(k => text.includes(k))) found.add(row.id);
  }
  return Array.from(found);
}

async function fetchCoinGeckoPrices(ids) {
  if (!ids || ids.length === 0) return '';
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids.join(','))}&vs_currencies=usd&include_24hr_change=true`;
  const { data } = await axios.get(url, { timeout: 12000 });
  const lines = [];
  for (const id of ids) {
    const row = data[id];
    if (!row) continue;
    const price = row.usd;
    const change = row.usd_24h_change;
    lines.push(`${id}: $${Number(price).toLocaleString(undefined, { maximumFractionDigits: 8 })} (${change >= 0 ? '+' : ''}${change.toFixed(2)}% 24h)`);
  }
  return lines.length ? `Live prices (CoinGecko):\n- ${lines.join('\n- ')}` : '';
}

// Cache for market data (refresh every 2 minutes)
let marketDataCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 120000; // 2 minutes

// Real-time market analysis and recommendations
async function analyzeMarketAndRecommend() {
  try {
    // Check cache first
    const now = Date.now();
    let coins;
    
    if (marketDataCache.data && (now - marketDataCache.timestamp) < CACHE_DURATION) {
      coins = marketDataCache.data;
      console.log('Using cached market data');
    } else {
      // Fetch fresh data
      const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d';
      const { data } = await axios.get(url, { timeout: 15000 });
      coins = data;
      marketDataCache = { data: coins, timestamp: now };
      console.log('Fetched fresh market data');
    }
    
    // Randomize analysis perspective for variety
    const analysisType = Math.floor(Math.random() * 3);
    
    // Multiple analysis strategies
    const topGainers24h = coins
      .filter(c => c.price_change_percentage_24h > 0)
      .sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 8);
    
    const topGainers7d = coins
      .filter(c => c.price_change_percentage_7d_in_currency > 3)
      .sort((a, b) => b.price_change_percentage_7d_in_currency - a.price_change_percentage_7d_in_currency)
      .slice(0, 8);
    
    const topGainers30d = coins
      .filter(c => c.price_change_percentage_30d_in_currency > 10)
      .sort((a, b) => b.price_change_percentage_30d_in_currency - a.price_change_percentage_30d_in_currency)
      .slice(0, 8);
    
    const highVolume = coins
      .filter(c => c.total_volume > 100000000)
      .sort((a, b) => b.total_volume - a.total_volume)
      .slice(0, 8);
    
    const undervalued = coins
      .filter(c => c.market_cap > 100000000 && c.market_cap < 5000000000 && c.price_change_percentage_7d_in_currency > 0)
      .sort((a, b) => b.price_change_percentage_7d_in_currency - a.price_change_percentage_7d_in_currency)
      .slice(0, 5);
    
    // Market sentiment
    const avgChange24h = coins.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) / coins.length;
    const avgChange7d = coins.reduce((sum, c) => sum + (c.price_change_percentage_7d_in_currency || 0), 0) / coins.length;
    const bullishCount = coins.filter(c => c.price_change_percentage_24h > 0).length;
    const sentiment = avgChange24h > 2 ? 'Bullish 🟢' : avgChange24h < -2 ? 'Bearish 🔴' : 'Neutral 🟡';
    
    // Build response with rotating perspectives
    let response = `**📊 Real-Time Market Analysis** _(${new Date().toLocaleString()})_\n\n`;
    response += `**Market Sentiment**: ${sentiment}\n`;
    response += `- ${bullishCount}/${coins.length} coins in green (24h)\n`;
    response += `- Average change: 24h ${avgChange24h.toFixed(2)}% | 7d ${avgChange7d.toFixed(2)}%\n\n`;
    
    // Rotate between different analysis perspectives
    if (analysisType === 0) {
      // Short-term momentum focus
      response += `**🔥 Short-Term Momentum (24h)**:\n`;
      topGainers24h.slice(0, 5).forEach((c, i) => {
        response += `${i + 1}. **${c.symbol.toUpperCase()}** ($${c.current_price.toLocaleString()}): +${c.price_change_percentage_24h.toFixed(2)}% | Vol: $${(c.total_volume / 1e9).toFixed(2)}B\n`;
      });
      
      response += `\n**💎 High Volume Leaders**:\n`;
      highVolume.slice(0, 4).forEach((c, i) => {
        const change = c.price_change_percentage_24h || 0;
        response += `${i + 1}. **${c.symbol.toUpperCase()}**: $${c.current_price.toLocaleString()} (${change > 0 ? '+' : ''}${change.toFixed(2)}%) | Vol: $${(c.total_volume / 1e9).toFixed(2)}B\n`;
      });
      
      response += `\n**🎯 Strategy**: Focus on momentum and volume. These coins have strong short-term interest.\n`;
      
    } else if (analysisType === 1) {
      // Medium-term trend focus
      response += `**📈 7-Day Trend Leaders**:\n`;
      topGainers7d.slice(0, 5).forEach((c, i) => {
        response += `${i + 1}. **${c.symbol.toUpperCase()}**: +${c.price_change_percentage_7d_in_currency.toFixed(2)}% (7d) | MCap: $${(c.market_cap / 1e9).toFixed(2)}B | 24h: ${c.price_change_percentage_24h > 0 ? '+' : ''}${c.price_change_percentage_24h.toFixed(2)}%\n`;
      });
      
      response += `\n**💰 Mid-Cap Gems** (100M-5B market cap):\n`;
      undervalued.slice(0, 4).forEach((c, i) => {
        response += `${i + 1}. **${c.symbol.toUpperCase()}**: $${c.current_price.toLocaleString()} | MCap: $${(c.market_cap / 1e6).toFixed(0)}M | 7d: +${c.price_change_percentage_7d_in_currency.toFixed(2)}%\n`;
      });
      
      response += `\n**🎯 Strategy**: Sustained trends over 7 days show stronger conviction. Mid-caps offer growth potential.\n`;
      
    } else {
      // Long-term + diversified focus
      response += `**🚀 30-Day Momentum Leaders**:\n`;
      topGainers30d.slice(0, 5).forEach((c, i) => {
        response += `${i + 1}. **${c.symbol.toUpperCase()}**: +${c.price_change_percentage_30d_in_currency.toFixed(2)}% (30d) | Current: $${c.current_price.toLocaleString()} | MCap: $${(c.market_cap / 1e9).toFixed(2)}B\n`;
      });
      
      response += `\n**⚡ Recent Breakouts** (Strong 7d + Volume):\n`;
      const breakouts = coins
        .filter(c => c.price_change_percentage_7d_in_currency > 8 && c.total_volume > 50000000)
        .sort((a, b) => b.price_change_percentage_7d_in_currency - a.price_change_percentage_7d_in_currency)
        .slice(0, 4);
      breakouts.forEach((c, i) => {
        response += `${i + 1}. **${c.symbol.toUpperCase()}**: +${c.price_change_percentage_7d_in_currency.toFixed(2)}% (7d) | Vol: $${(c.total_volume / 1e9).toFixed(2)}B\n`;
      });
      
      response += `\n**🎯 Strategy**: Long-term trends + recent breakouts indicate sustained growth potential.\n`;
    }
    
    // Dynamic market-based recommendations
    response += `\n**💡 Current Market Opportunities** _(Not financial advice - DYOR)_:\n\n`;
    
    const btc = coins.find(c => c.id === 'bitcoin');
    const eth = coins.find(c => c.id === 'ethereum');
    const sol = coins.find(c => c.id === 'solana');
    
    if (avgChange24h > 3) {
      response += `**Bull Market Active** 🟢\n`;
      const topMover = topGainers24h[0];
      response += `- **Hot Pick**: ${topMover.symbol.toUpperCase()} (+${topMover.price_change_percentage_24h.toFixed(2)}% today) - Riding strong momentum\n`;
      response += `- **Layer 2s**: Check ARB, OP for scaling narrative\n`;
      response += `- **Take Profits**: Consider selling 20-30% on strong gains\n`;
    } else if (avgChange24h < -3) {
      response += `**Bear Market - Accumulation Phase** 🔴\n`;
      if (btc && btc.price_change_percentage_24h < -3) response += `- **BTC Dip**: $${btc.current_price.toLocaleString()} (${btc.price_change_percentage_24h.toFixed(2)}%) - Strong accumulation zone\n`;
      if (eth && eth.price_change_percentage_24h < -3) response += `- **ETH Dip**: $${eth.current_price.toLocaleString()} (${eth.price_change_percentage_24h.toFixed(2)}%) - DeFi backbone on sale\n`;
      response += `- **DCA Strategy**: Build positions gradually in blue chips\n`;
      response += `- **Stablecoins**: Increase allocation to 25-30% for opportunities\n`;
    } else {
      response += `**Consolidation Phase** 🟡\n`;
      const strongTrend = topGainers7d[0];
      if (strongTrend) response += `- **Trend Play**: ${strongTrend.symbol.toUpperCase()} (+${strongTrend.price_change_percentage_7d_in_currency.toFixed(2)}% 7d) - Strong weekly momentum\n`;
      response += `- **Wait for Breakouts**: Monitor key resistance levels\n`;
      response += `- **Focus on Fundamentals**: Research projects with strong use cases\n`;
    }
    
    response += `\n**Foundation Assets**:\n`;
    if (btc) response += `- **BTC**: $${btc.current_price.toLocaleString()} (${btc.price_change_percentage_24h > 0 ? '+' : ''}${btc.price_change_percentage_24h.toFixed(2)}% 24h, ${btc.price_change_percentage_7d_in_currency > 0 ? '+' : ''}${btc.price_change_percentage_7d_in_currency.toFixed(2)}% 7d)\n`;
    if (eth) response += `- **ETH**: $${eth.current_price.toLocaleString()} (${eth.price_change_percentage_24h > 0 ? '+' : ''}${eth.price_change_percentage_24h.toFixed(2)}% 24h, ${eth.price_change_percentage_7d_in_currency > 0 ? '+' : ''}${eth.price_change_percentage_7d_in_currency.toFixed(2)}% 7d)\n`;
    if (sol) response += `- **SOL**: $${sol.current_price.toLocaleString()} (${sol.price_change_percentage_24h > 0 ? '+' : ''}${sol.price_change_percentage_24h.toFixed(2)}% 24h, ${sol.price_change_percentage_7d_in_currency > 0 ? '+' : ''}${sol.price_change_percentage_7d_in_currency.toFixed(2)}% 7d)\n`;
    
    response += `\n⚠️ **Risk Management**: Always set stop-losses, take profits at targets, never invest more than you can lose.`;
    
    return response;
    
  } catch (error) {
    console.error('Market analysis error:', error?.message);
    return '**Market Analysis Unavailable**\n\nUnable to fetch real-time data. Here are general guidelines:\n\n**Strong Foundation**: BTC, ETH (40-50% allocation)\n**DeFi Blue Chips**: UNI, AAVE, MKR (20-30%)\n**High Growth**: Layer 2s (ARB, OP), Solana (10-20%)\n**Stability**: Stablecoins (15-25%)\n\nAlways DYOR and consider your risk tolerance.';
  }
}

// Portfolio endpoints - fetch real wallet data
app.get('/api/portfolio/:address', async (req, res) => {
  const { address } = req.params;
  
  try {
    // Fetch token balances from multiple chains using Alchemy/Etherscan APIs
    const ethBalances = await fetchEthereumBalances(address);
    const polygonBalances = await fetchPolygonBalances(address);
    const arbitrumBalances = await fetchArbitrumBalances(address);
    
    const allTokens = [...ethBalances, ...polygonBalances, ...arbitrumBalances];
    const totalValue = allTokens.reduce((sum, token) => sum + (token.value || 0), 0);
    
    res.json({
      success: true,
      data: {
        address,
        totalValue,
        tokens: allTokens,
        nfts: [],
        defiPositions: [],
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Portfolio fetch error:', error?.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio data'
    });
  }
});

app.get('/api/portfolio/:address/analysis', async (req, res) => {
  const { address } = req.params;
  
  try {
    // Fetch portfolio data first
    const ethBalances = await fetchEthereumBalances(address);
    const polygonBalances = await fetchPolygonBalances(address);
    const arbitrumBalances = await fetchArbitrumBalances(address);
    
    const allTokens = [...ethBalances, ...polygonBalances, ...arbitrumBalances];
    
    // Calculate total value
    const totalValue = allTokens.reduce((sum, t) => sum + (t.value || 0), 0);
    
    // Calculate diversification score (0-100)
    const uniqueTokens = new Set(allTokens.map(t => t.symbol)).size;
    let diversificationScore = 0;
    if (uniqueTokens === 1) diversificationScore = 20;
    else if (uniqueTokens === 2) diversificationScore = 40;
    else if (uniqueTokens === 3) diversificationScore = 60;
    else if (uniqueTokens === 4) diversificationScore = 75;
    else if (uniqueTokens >= 5) diversificationScore = Math.min(100, 75 + (uniqueTokens - 5) * 5);
    
    // Calculate risk score based on concentration (0-100, lower is better)
    let riskScore = 0;
    if (totalValue > 0 && allTokens.length > 0) {
      // Sort by value descending
      const sortedTokens = [...allTokens].sort((a, b) => (b.value || 0) - (a.value || 0));
      const topHoldingPercent = (sortedTokens[0]?.value || 0) / totalValue * 100;
      
      // Risk scoring: >80% = very high risk, 50-80% = high, 30-50% = medium, <30% = low
      if (topHoldingPercent > 80) riskScore = 90;
      else if (topHoldingPercent > 60) riskScore = 75;
      else if (topHoldingPercent > 40) riskScore = 50;
      else if (topHoldingPercent > 25) riskScore = 30;
      else riskScore = 15;
    }
    
    // Generate smart recommendations
    const recommendations = [];
    const stablecoins = allTokens.filter(t => ['USDC', 'USDT', 'DAI', 'BUSD'].includes(t.symbol));
    const stableValue = stablecoins.reduce((sum, t) => sum + (t.value || 0), 0);
    const stablePercent = totalValue > 0 ? (stableValue / totalValue * 100) : 0;
    
    const ethTokens = allTokens.filter(t => ['ETH', 'WETH'].includes(t.symbol));
    const ethValue = ethTokens.reduce((sum, t) => sum + (t.value || 0), 0);
    const ethPercent = totalValue > 0 ? (ethValue / totalValue * 100) : 0;
    
    // Diversification recommendations
    if (uniqueTokens < 3) {
      recommendations.push('🎯 Low diversification detected. Consider adding 2-3 more quality assets to reduce risk.');
    } else if (uniqueTokens >= 3 && uniqueTokens < 5) {
      recommendations.push('✅ Good diversification. Consider adding DeFi blue chips (UNI, AAVE) for better balance.');
    } else {
      recommendations.push('🌟 Excellent diversification across multiple assets!');
    }
    
    // Concentration risk
    if (riskScore > 70) {
      recommendations.push('⚠️ High concentration risk! Your largest holding is >60% of portfolio. Rebalance to reduce exposure.');
    } else if (riskScore > 40) {
      recommendations.push('📊 Moderate concentration. Consider rebalancing to spread risk more evenly.');
    }
    
    // Stablecoin allocation
    if (stablePercent < 5) {
      recommendations.push('💵 Add 10-20% stablecoins (USDC/DAI) for stability and buying opportunities during dips.');
    } else if (stablePercent > 40) {
      recommendations.push('💰 High stablecoin allocation. Consider deploying some into yield-generating protocols (Aave, Compound).');
    } else {
      recommendations.push('✅ Healthy stablecoin allocation for risk management.');
    }
    
    // ETH exposure
    if (ethPercent < 20 && totalValue > 100) {
      recommendations.push('🔷 Consider increasing ETH exposure to 20-30% as a core holding.');
    }
    
    // Multi-chain diversification
    const chains = new Set(allTokens.map(t => t.network));
    if (chains.size === 1) {
      recommendations.push('🌐 Diversify across multiple chains (Polygon, Arbitrum) to reduce network risk and gas fees.');
    }
    
    // Calculate allocation by category
    const allocation = {
      'Blue Chips': ethPercent,
      'Stablecoins': stablePercent,
      'DeFi': allTokens.filter(t => ['UNI', 'AAVE', 'CRV', 'MKR'].includes(t.symbol))
        .reduce((sum, t) => sum + (t.value || 0), 0) / totalValue * 100,
      'Other': 100 - ethPercent - stablePercent
    };
    
    res.json({
      success: true,
      data: {
        diversificationScore: Math.round(diversificationScore),
        riskScore: Math.round(riskScore),
        recommendations: recommendations.slice(0, 5), // Limit to 5 recommendations
        topHoldings: allTokens.sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5),
        allocation,
        performance: { day: 0, week: 0, month: 0 }
      }
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error?.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze portfolio'
    });
  }
});

// Helper functions to fetch balances from different chains
async function fetchEthereumBalances(address) {
  try {
    // Use Alchemy API to get token balances
    const alchemyKey = process.env.ETHEREUM_RPC_URL?.split('/').pop() || '';
    if (!alchemyKey || alchemyKey.length < 10) {
      console.log('Ethereum Alchemy key not configured');
      return [];
    }
    
    const url = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    
    // Get ETH balance
    const ethBalanceResponse = await axios.post(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    });
    
    const ethBalance = parseInt(ethBalanceResponse.data.result, 16) / 1e18;
    
    // Get token balances
    const tokenBalancesResponse = await axios.post(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenBalances',
      params: [address]
    });
    
    const tokens = [];
    
    // Add ETH
    if (ethBalance > 0.001) {
      const ethData = await getCoinGeckoPrice('ethereum');
      tokens.push({
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum',
        balance: ethBalance.toFixed(4),
        price: ethData.price,
        value: ethBalance * ethData.price,
        change24h: ethData.change24h,
        network: 'Ethereum'
      });
    }
    
    // Add ERC20 tokens with metadata
    if (tokenBalancesResponse.data.result?.tokenBalances) {
      for (const token of tokenBalancesResponse.data.result.tokenBalances) {
        if (token.tokenBalance && token.tokenBalance !== '0x0' && token.tokenBalance !== '0x') {
          // Get token metadata
          try {
            const metadataResponse = await axios.post(url, {
              jsonrpc: '2.0',
              id: 1,
              method: 'alchemy_getTokenMetadata',
              params: [token.contractAddress]
            });
            
            const metadata = metadataResponse.data.result;
            const decimals = metadata.decimals || 18;
            const balance = parseInt(token.tokenBalance, 16) / Math.pow(10, decimals);
            
            if (balance > 0.0001) {
              // Get price for known tokens
              let priceData = { price: 0, change24h: 0 };
              let coinGeckoId = null;
              
              // Map common tokens to CoinGecko IDs
              const symbol = metadata.symbol?.toUpperCase();
              if (symbol === 'USDC') coinGeckoId = 'usd-coin';
              else if (symbol === 'USDT') coinGeckoId = 'tether';
              else if (symbol === 'DAI') coinGeckoId = 'dai';
              else if (symbol === 'WETH') coinGeckoId = 'weth';
              else if (symbol === 'WBTC') coinGeckoId = 'wrapped-bitcoin';
              else if (symbol === 'UNI') coinGeckoId = 'uniswap';
              else if (symbol === 'AAVE') coinGeckoId = 'aave';
              else if (symbol === 'LINK') coinGeckoId = 'chainlink';
              else if (symbol === 'MKR') coinGeckoId = 'maker';
              else if (symbol === 'CRV') coinGeckoId = 'curve-dao-token';
              
              if (coinGeckoId) {
                priceData = await getCoinGeckoPrice(coinGeckoId);
                // Small delay only if not using cache
                if (!priceCache.has(coinGeckoId)) {
                  await new Promise(resolve => setTimeout(resolve, 200));
                }
              }
              
              tokens.push({
                address: token.contractAddress,
                symbol: metadata.symbol || 'UNKNOWN',
                name: metadata.name || 'Unknown Token',
                balance: balance.toFixed(decimals > 6 ? 6 : decimals),
                price: priceData.price,
                value: balance * priceData.price,
                change24h: priceData.change24h,
                network: 'Ethereum'
              });
            }
          } catch (metadataError) {
            console.error('Token metadata fetch error:', metadataError?.message);
          }
        }
      }
    }
    
    return tokens;
  } catch (error) {
    console.error('Ethereum balance fetch error:', error?.message);
    return [];
  }
}

async function fetchPolygonBalances(address) {
  try {
    const alchemyKey = process.env.POLYGON_RPC_URL?.split('/').pop() || '';
    if (!alchemyKey || alchemyKey.length < 10) {
      return [];
    }
    
    const url = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    
    const maticBalanceResponse = await axios.post(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    }, { timeout: 5000 });
    
    const maticBalance = parseInt(maticBalanceResponse.data.result, 16) / 1e18;
    
    const tokens = [];
    if (maticBalance > 0.1) {
      const maticData = await getCoinGeckoPrice('matic-network');
      tokens.push({
        address: '0x0000000000000000000000000000000000001010',
        symbol: 'MATIC',
        name: 'Polygon',
        balance: maticBalance.toFixed(4),
        price: maticData.price,
        value: maticBalance * maticData.price,
        change24h: maticData.change24h,
        network: 'Polygon'
      });
    }
    
    return tokens;
  } catch (error) {
    // Silently fail for Polygon/Arbitrum if Alchemy key issues
    if (error?.response?.status === 403) {
      return [];
    }
    console.error('Polygon balance fetch error:', error?.message);
    return [];
  }
}

async function fetchArbitrumBalances(address) {
  try {
    const alchemyKey = process.env.ARBITRUM_RPC_URL?.split('/').pop() || '';
    if (!alchemyKey || alchemyKey.length < 10) {
      return [];
    }
    
    const url = `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`;
    
    const ethBalanceResponse = await axios.post(url, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest']
    }, { timeout: 5000 });
    
    const ethBalance = parseInt(ethBalanceResponse.data.result, 16) / 1e18;
    
    const tokens = [];
    if (ethBalance > 0.001) {
      const ethData = await getCoinGeckoPrice('ethereum');
      tokens.push({
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        name: 'Ethereum (Arbitrum)',
        balance: ethBalance.toFixed(4),
        price: ethData.price,
        value: ethBalance * ethData.price,
        change24h: ethData.change24h,
        network: 'Arbitrum'
      });
    }
    
    return tokens;
  } catch (error) {
    // Silently fail for Polygon/Arbitrum if Alchemy key issues
    if (error?.response?.status === 403) {
      return [];
    }
    console.error('Arbitrum balance fetch error:', error?.message);
    return [];
  }
}

// Price cache to avoid rate limiting
const priceCache = new Map();
const PRICE_CACHE_DURATION = 60000; // 1 minute

async function getCoinGeckoPrice(coinId) {
  // Check cache first
  const cached = priceCache.get(coinId);
  if (cached && (Date.now() - cached.timestamp) < PRICE_CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    const { data } = await axios.get(url, { timeout: 5000 });
    
    const result = {
      price: data[coinId]?.usd || 0,
      change24h: data[coinId]?.usd_24h_change || 0
    };
    
    // Cache the result
    priceCache.set(coinId, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    // If rate limited, return cached value even if expired, or fallback prices
    if (error?.response?.status === 429 && cached) {
      console.log(`Using expired cache for ${coinId} due to rate limit`);
      return cached.data;
    }
    
    // Return reasonable fallback prices for common tokens
    const fallbackPrices = {
      'ethereum': { price: 2500, change24h: 0 },
      'usd-coin': { price: 1.0, change24h: 0 },
      'tether': { price: 1.0, change24h: 0 },
      'dai': { price: 1.0, change24h: 0 },
      'matic-network': { price: 0.8, change24h: 0 },
      'weth': { price: 2500, change24h: 0 },
      'wrapped-bitcoin': { price: 67000, change24h: 0 }
    };
    
    if (fallbackPrices[coinId]) {
      console.log(`Using fallback price for ${coinId}`);
      return fallbackPrices[coinId];
    }
    
    console.error(`CoinGecko price fetch error for ${coinId}:`, error?.message);
    return { price: 0, change24h: 0 };
  }
}

// Mock chat endpoint for testing
app.get('/api/chat/message', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Method not allowed. Use POST to send a chat message.',
    example: {
      method: 'POST',
      url: '/api/chat/message',
      body: {
        message: 'Analyze my DeFi portfolio',
        userAddress: '0xYourWallet'
      }
    }
  });
});

app.post('/api/chat/message', async (req, res) => {
  const { message, userAddress, conversationId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Find or create conversation
  let conversation = conversations.find(c => c.id === conversationId);
  if (!conversation) {
    conversation = {
      id: conversationId || `conv_${Date.now()}`,
      userAddress: userAddress || 'anonymous',
      title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    conversations.push(conversation);
  }

  // Add user message
  const userMessage = {
    id: messageIdCounter++,
    content: message,
    sender: 'user',
    timestamp: new Date().toISOString()
  };
  conversation.messages.push(userMessage);

  // Generate AI response (provider-backed if available)
  let aiText = '';
  try {
    aiText = await generateAIResponse(message);
  } catch (e) {
    console.error('AI generation failed:', e?.message || e);
    aiText = `I understood: "${message}" but had trouble generating a detailed answer right now.`;
  }

  const aiMessage = {
    id: messageIdCounter++,
    content: aiText,
    sender: 'assistant',
    timestamp: new Date().toISOString()
  };
  conversation.messages.push(aiMessage);
  
  conversation.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    userMessage,
    aiMessage,
    conversation
  });
});

// Mock portfolio endpoints
app.get('/api/portfolio/:address', (req, res) => {
  const { address } = req.params;
  res.json({
    success: true,
    data: {
      address,
      totalValue: 12345.67,
      totalValueUSD: 12345.67,
      tokens: [
        { 
          symbol: 'ETH', 
          name: 'Ethereum',
          balance: '2.5', 
          value: 6250,
          price: 2500,
          change24h: 1.8,
          address: '0x0000000000000000000000000000000000000000'
        },
        { 
          symbol: 'USDC', 
          name: 'USD Coin',
          balance: '5000', 
          value: 5000,
          price: 1.0,
          change24h: 0.1,
          address: '0xA0b86a33E6441b8435b662303c0f218C8F8c0c0c'
        },
        { 
          symbol: 'AAVE', 
          name: 'Aave',
          balance: '10', 
          value: 1095.67,
          price: 109.567,
          change24h: -2.3,
          address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
        }
      ],
      defiPositions: [
        {
          protocol: 'Uniswap V3',
          type: 'Liquidity Pool',
          value: 2500,
          apy: 12.5,
          pair: 'ETH/USDC'
        },
        {
          protocol: 'Aave',
          type: 'Lending',
          value: 1500,
          apy: 3.2,
          asset: 'USDC'
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  });
});

app.get('/api/portfolio', (req, res) => {
  res.status(400).json({
    success: false,
    error: 'Wallet address is required'
  });
});

app.get('/api/portfolio/:address/analysis', (req, res) => {
  const { address } = req.params;
  res.json({
    success: true,
    data: {
      diversificationScore: 75,
      riskScore: 45,
      recommendations: [
        'Consider diversifying into more stable assets like USDC or DAI',
        'Your ETH position is well-sized for long-term growth',
        'Consider adding some DeFi blue-chip tokens like UNI or AAVE',
        'Monitor your AAVE lending position for optimal yield opportunities'
      ],
      topHoldings: [
        { symbol: 'ETH', percentage: 50.6 },
        { symbol: 'USDC', percentage: 40.5 },
        { symbol: 'AAVE', percentage: 8.9 }
      ],
      allocation: {
        'Layer 1': 50.6,
        'Stablecoins': 40.5,
        'DeFi': 8.9
      }
    }
  });
});

// Mock market data endpoints
app.get('/api/market/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalMarketCap: 2450000000000,
      totalVolume24h: 85000000000,
      btcDominance: 52.3,
      ethDominance: 17.8,
      fearGreedIndex: 65,
      topGainers: [
        { symbol: 'SOL', price: 145.67, change24h: 8.5, volume24h: 2300000000 },
        { symbol: 'AVAX', price: 32.45, change24h: 6.2, volume24h: 800000000 },
        { symbol: 'MATIC', price: 0.85, change24h: 4.8, volume24h: 500000000 }
      ],
      topLosers: [
        { symbol: 'ADA', price: 0.45, change24h: -3.2, volume24h: 350000000 },
        { symbol: 'DOT', price: 6.78, change24h: -2.8, volume24h: 420000000 },
        { symbol: 'LINK', price: 14.32, change24h: -1.9, volume24h: 680000000 }
      ]
    }
  });
});

app.get('/api/market/prices', async (req, res) => {
  try {
    const { symbols } = req.query;
    const requestedSymbols = symbols ? symbols.split(',') : [];
    
    // Map symbols to CoinGecko IDs
    const symbolToCoinGeckoId = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'MATIC': 'matic-network',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'SOL': 'solana',
      'AVAX': 'avalanche-2',
      'DOT': 'polkadot',
      'ADA': 'cardano',
      'ATOM': 'cosmos',
      'NEAR': 'near',
      'FTM': 'fantom',
      'ALGO': 'algorand',
      'XRP': 'ripple',
      'DOGE': 'dogecoin',
      'SHIB': 'shiba-inu',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'XLM': 'stellar',
      'VET': 'vechain',
      'ICP': 'internet-computer',
      'FIL': 'filecoin',
      'SAND': 'the-sandbox',
      'MANA': 'decentraland',
      'AXS': 'axie-infinity',
      'THETA': 'theta-token',
      'EOS': 'eos',
      'CRV': 'curve-dao-token',
      'MKR': 'maker',
      'COMP': 'compound-governance-token',
      'SNX': 'havven',
      'YFI': 'yearn-finance',
      'SUSHI': 'sushi',
      'BAL': 'balancer',
      'ZRX': '0x',
      'ENJ': 'enjincoin',
      'CHZ': 'chiliz',
      'HOT': 'holotoken',
      'ZIL': 'zilliqa',
      'WAVES': 'waves',
      'ONT': 'ontology',
      'QTUM': 'qtum',
      'ICX': 'icon',
      'ZEN': 'zencash',
      'DASH': 'dash',
      'DCR': 'decred',
      'XTZ': 'tezos',
      'KAVA': 'kava'
    };
    
    const coinGeckoIds = requestedSymbols
      .map(symbol => symbolToCoinGeckoId[symbol.toUpperCase()])
      .filter(id => id);
    
    if (coinGeckoIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    
    // Fetch from CoinGecko
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinGeckoIds.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    const { data: coins } = await axios.get(url, { timeout: 10000 });
    
    const tokenPrices = coins.map(coin => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price || 0,
      change24h: coin.price_change_percentage_24h || 0,
      volume24h: coin.total_volume || 0,
      marketCap: coin.market_cap || 0,
      lastUpdated: new Date()
    }));
    
    res.json({
      success: true,
      data: tokenPrices
    });
  } catch (error) {
    console.error('Market prices fetch error:', error?.message);
    // Fallback to basic data
    res.json({
      success: true,
      data: [
        { symbol: 'BTC', name: 'Bitcoin', price: 67500, change24h: 2.5, volume24h: 28500000000, marketCap: 1320000000000, lastUpdated: new Date() },
        { symbol: 'ETH', name: 'Ethereum', price: 2500, change24h: 1.8, volume24h: 15200000000, marketCap: 300000000000, lastUpdated: new Date() },
        { symbol: 'USDC', name: 'USD Coin', price: 1.0, change24h: 0.1, volume24h: 5000000000, marketCap: 35000000000, lastUpdated: new Date() },
        { symbol: 'SOL', name: 'Solana', price: 145.67, change24h: 8.5, volume24h: 2300000000, marketCap: 65000000000, lastUpdated: new Date() },
        { symbol: 'AVAX', name: 'Avalanche', price: 32.45, change24h: 6.2, volume24h: 800000000, marketCap: 12000000000, lastUpdated: new Date() }
      ]
    });
  }
});

app.get('/api/analytics/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalTVL: 180000000000,
      totalUsers: 5200000,
      totalTransactions: 850000000,
      topProtocols: [
        { name: 'Uniswap', tvl: 4500000000, category: 'DEX' },
        { name: 'Aave', tvl: 12000000000, category: 'Lending' },
        { name: 'Compound', tvl: 8500000000, category: 'Lending' },
        { name: 'Curve', tvl: 6200000000, category: 'DEX' },
        { name: 'MakerDAO', tvl: 9800000000, category: 'CDP' }
      ],
      chainDistribution: [
        { chain: 'Ethereum', tvl: 85000000000, percentage: 47.2 },
        { chain: 'BSC', tvl: 25000000000, percentage: 13.9 },
        { chain: 'Polygon', tvl: 18000000000, percentage: 10.0 },
        { chain: 'Avalanche', tvl: 15000000000, percentage: 8.3 },
        { chain: 'Arbitrum', tvl: 12000000000, percentage: 6.7 }
      ]
    }
  });
});

// Chat history endpoints
app.get('/api/chat/conversations/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  const userConversations = conversations.filter(c => c.userAddress === userAddress);
  
  res.json({
    success: true,
    conversations: userConversations.map(conv => ({
      ...conv,
      messageCount: conv.messages.length,
      lastMessage: conv.messages[conv.messages.length - 1]?.content || ''
    }))
  });
});

app.delete('/api/chat/conversation/:id', (req, res) => {
  const { id } = req.params;
  const index = conversations.findIndex(c => c.id === id);
  
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Conversation not found'
    });
  }
  
  conversations.splice(index, 1);
  res.json({
    success: true,
    message: 'Conversation deleted'
  });
});

// Security endpoints
app.get('/api/security/protocols', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        name: 'Uniswap V3',
        slug: 'uniswap',
        category: 'dex',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Leading decentralized exchange protocol'
      },
      {
        name: 'Aave V3',
        slug: 'aave',
        category: 'lending',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Decentralized lending and borrowing protocol'
      },
      {
        name: 'Compound V3',
        slug: 'compound',
        category: 'lending',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Algorithmic money market protocol'
      },
      {
        name: 'Curve Finance',
        slug: 'curve',
        category: 'dex',
        riskLevel: 'low',
        auditStatus: 'audited',
        description: 'Stablecoin-focused DEX with low slippage'
      },
      {
        name: 'MakerDAO',
        slug: 'maker',
        category: 'lending',
        riskLevel: 'medium',
        auditStatus: 'audited',
        description: 'Decentralized stablecoin (DAI) protocol'
      }
    ]
  });
});

app.post('/api/security/analyze', async (req, res) => {
  const { protocol } = req.body;
  
  if (!protocol) {
    return res.status(400).json({
      success: false,
      error: 'Protocol name is required'
    });
  }

  try {
    // Simulate protocol analysis
    const protocolData = {
      'uniswap': {
        protocolName: 'Uniswap V3',
        contractAddress: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        riskLevel: 'low',
        riskScore: 15,
        auditStatus: 'audited',
        auditFirms: ['Trail of Bits', 'ABDK', 'Consensys Diligence'],
        issues: [
          {
            severity: 'low',
            category: 'Centralization Risk',
            description: 'Protocol governance is controlled by UNI token holders',
            impact: 'Governance decisions could affect protocol parameters',
            recommendation: 'Monitor governance proposals and participate in voting'
          }
        ],
        recommendations: [
          '✅ Protocol is battle-tested with over $4B TVL',
          '✅ Multiple security audits by top firms',
          '✅ Bug bounty program active with up to $2.25M rewards',
          '⚠️ Be aware of impermanent loss when providing liquidity',
          '💡 Use concentrated liquidity positions carefully'
        ]
      },
      'aave': {
        protocolName: 'Aave V3',
        contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
        riskLevel: 'low',
        riskScore: 18,
        auditStatus: 'audited',
        auditFirms: ['OpenZeppelin', 'Trail of Bits', 'ABDK', 'Peckshield'],
        issues: [
          {
            severity: 'medium',
            category: 'Liquidation Risk',
            description: 'Borrowed positions can be liquidated during market volatility',
            impact: 'Users may lose collateral if health factor drops below 1',
            recommendation: 'Maintain health factor above 1.5 and monitor positions regularly'
          },
          {
            severity: 'low',
            category: 'Oracle Dependency',
            description: 'Protocol relies on Chainlink price oracles',
            impact: 'Oracle failures could affect liquidations and borrowing',
            recommendation: 'Protocol has fallback mechanisms and circuit breakers'
          }
        ],
        recommendations: [
          '✅ One of the most audited DeFi protocols',
          '✅ Isolation mode protects main pool from risky assets',
          '✅ eMode for correlated assets (e.g., stablecoins)',
          '⚠️ Monitor your health factor to avoid liquidation',
          '💡 Use stable rate borrowing for predictable costs'
        ]
      },
      'compound': {
        protocolName: 'Compound V3',
        contractAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
        riskLevel: 'low',
        riskScore: 20,
        auditStatus: 'audited',
        auditFirms: ['OpenZeppelin', 'ChainSecurity'],
        issues: [
          {
            severity: 'medium',
            category: 'Interest Rate Risk',
            description: 'Interest rates adjust based on utilization',
            impact: 'Borrowing costs can increase during high demand',
            recommendation: 'Monitor utilization rates and adjust positions accordingly'
          }
        ],
        recommendations: [
          '✅ V3 (Comet) is more capital efficient than V2',
          '✅ Single-asset pools reduce complexity',
          '✅ Lower gas costs compared to V2',
          '⚠️ Fewer assets supported than Aave',
          '💡 Best for USDC-based lending/borrowing'
        ]
      },
      'curve': {
        protocolName: 'Curve Finance',
        contractAddress: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7',
        riskLevel: 'low',
        riskScore: 22,
        auditStatus: 'audited',
        auditFirms: ['Trail of Bits', 'Quantstamp', 'MixBytes'],
        issues: [
          {
            severity: 'medium',
            category: 'Smart Contract Complexity',
            description: 'Complex pool mechanics and gauge systems',
            impact: 'Higher complexity increases potential attack surface',
            recommendation: 'Stick to established pools with high TVL'
          },
          {
            severity: 'low',
            category: 'Impermanent Loss',
            description: 'Even stablecoin pools can experience IL during de-pegs',
            impact: 'Potential losses during stablecoin de-peg events',
            recommendation: 'Monitor pool balances and de-peg risks'
          }
        ],
        recommendations: [
          '✅ Best-in-class for stablecoin swaps',
          '✅ Low slippage and fees',
          '✅ CRV rewards for liquidity providers',
          '⚠️ Gauge voting can be complex',
          '💡 Focus on 3pool and major stablecoin pools'
        ]
      },
      'maker': {
        protocolName: 'MakerDAO',
        contractAddress: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
        riskLevel: 'medium',
        riskScore: 35,
        auditStatus: 'audited',
        auditFirms: ['Trail of Bits', 'Runtime Verification', 'PeckShield'],
        issues: [
          {
            severity: 'high',
            category: 'Collateralization Risk',
            description: 'DAI stability depends on collateral quality',
            impact: 'Poor collateral could lead to DAI de-peg',
            recommendation: 'Monitor collateralization ratios and collateral types'
          },
          {
            severity: 'medium',
            category: 'Governance Complexity',
            description: 'Complex governance system with multiple parameters',
            impact: 'Governance attacks or poor decisions could affect protocol',
            recommendation: 'Participate in governance or monitor proposals'
          },
          {
            severity: 'medium',
            category: 'Liquidation Risk',
            description: 'Vaults can be liquidated if collateral ratio drops',
            impact: '13% liquidation penalty on liquidated vaults',
            recommendation: 'Maintain collateralization ratio above 200%'
          }
        ],
        recommendations: [
          '✅ Oldest and most established DeFi protocol',
          '✅ DAI is widely used and integrated',
          '⚠️ Higher complexity than other lending protocols',
          '⚠️ Liquidation penalties are significant (13%)',
          '💡 Use Oasis.app for user-friendly vault management'
        ]
      }
    };

    const data = protocolData[protocol.toLowerCase()];
    
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Protocol not found. Try: uniswap, aave, compound, curve, or maker'
      });
    }

    res.json({
      success: true,
      data: {
        ...data,
        lastAnalyzed: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Security analysis error:', error?.message);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze protocol'
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ChainMind Backend (Simple Mode) running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`💡 This is a simplified version for quick testing`);
});
