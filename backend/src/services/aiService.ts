import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';
import { MarketService } from './marketService';
import { SecurityService } from './securityService';
import { PortfolioService } from './portfolioService';

export interface AIResponse {
  content: string;
  type: 'text' | 'analysis' | 'warning' | 'education';
  confidence: number;
  sources?: string[];
  metadata?: any;
}

export interface ChatContext {
  userAddress?: string | undefined;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userPreferences?: any;
}

export class AIService {
  private openai?: any;
  private gemini?: GoogleGenerativeAI;
  private aiProvider: string;
  private marketService: MarketService;
  private securityService: SecurityService;
  private portfolioService: PortfolioService;

  constructor() {
    this.aiProvider = process.env.AI_PROVIDER || 'gemini';
    
    // Initialize based on provider
    switch (this.aiProvider) {
      case 'gemini':
        if (process.env.GEMINI_API_KEY) {
          this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
        break;
      case 'openai':
        if (process.env.OPENAI_API_KEY) {
          // Lazy load OpenAI only if needed
          const OpenAI = require('openai').default;
          this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });
        }
        break;
    }
    
    this.marketService = new MarketService();
    this.securityService = new SecurityService();
    this.portfolioService = new PortfolioService();
  }

  async processMessage(message: string, context: ChatContext): Promise<AIResponse> {
    try {
      logger.info('Processing AI message:', { message, userAddress: context.userAddress });

      // Analyze message intent
      const intent = await this.analyzeIntent(message);
      logger.debug('Message intent:', intent);

      // Get relevant data based on intent
      const contextData = await this.gatherContextData(intent, message, context);

      // Generate AI response
      const response = await this.generateResponse(message, intent, contextData, context);

      // Cache response for similar queries
      const cacheKey = `ai_response:${this.hashMessage(message)}`;
      await cacheSet(cacheKey, response, 300); // 5 minutes cache

      return response;
    } catch (error) {
      logger.error('AI Service error:', error);
      return {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        type: 'warning',
        confidence: 0
      };
    }
  }

  private async analyzeIntent(message: string): Promise<string> {
    const intentPrompt = `
    Analyze the following user message and determine the primary intent. 
    Respond with one of these categories: portfolio, market, security, education, general
    
    Message: "${message}"
    
    Intent:`;

    try {
      if (this.aiProvider === 'gemini' && this.gemini) {
        // Try multiple model names since Google keeps changing them
        const modelNames = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-pro'];
        
        for (const modelName of modelNames) {
          try {
            const model = this.gemini.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(intentPrompt);
            const response = await result.response;
            const intent = response.text().trim().toLowerCase() || 'general';
            return intent;
          } catch (modelError: any) {
            if (modelError.status === 404) {
              console.log(`Model ${modelName} not found, trying next...`);
              continue;
            }
            throw modelError;
          }
        }
        throw new Error('No working Gemini models found');
      } else if (this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: intentPrompt }],
          max_tokens: 10,
          temperature: 0.1
        });
        const intent = response.choices[0]?.message?.content?.trim().toLowerCase() || 'general';
        return intent;
      }
      
      return 'general';
    } catch (error) {
      logger.error('Intent analysis error:', error);
      return 'general';
    }
  }

  private async gatherContextData(intent: string, message: string, context: ChatContext): Promise<any> {
    const data: any = {};

    try {
      switch (intent) {
        case 'portfolio':
          if (context.userAddress) {
            data.portfolio = await this.portfolioService.getPortfolioData(context.userAddress);
            data.portfolioAnalysis = await this.portfolioService.analyzePortfolio(context.userAddress);
          }
          break;

        case 'market':
          data.marketData = await this.marketService.getMarketOverview();
          // Extract token symbols from message
          const tokens = this.extractTokenSymbols(message);
          if (tokens.length > 0) {
            data.tokenPrices = await this.marketService.getTokenPrices(tokens);
          }
          break;

        case 'security':
          // Extract contract addresses or protocol names
          const protocols = this.extractProtocols(message);
          if (protocols.length > 0) {
            data.securityAnalysis = await Promise.all(
              protocols.map(protocol => this.securityService.analyzeProtocol(protocol))
            );
          }
          break;

        case 'education':
          // No additional data needed for educational content
          break;

        default:
          // General queries might need market overview
          data.marketOverview = await this.marketService.getMarketOverview();
          break;
      }
    } catch (error) {
      logger.error('Context data gathering error:', error);
    }

    return data;
  }

  private async generateResponse(
    message: string, 
    intent: string, 
    contextData: any, 
    context: ChatContext
  ): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(intent, contextData);
    const conversationHistory = context.conversationHistory.slice(-10); // Last 10 messages

    try {
      let content = '';
      let tokensUsed = 0;
      let modelUsed = '';

      if (this.aiProvider === 'gemini' && this.gemini) {
        // Try multiple model names since Google keeps changing them
        const modelNames = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest', 'gemini-1.5-pro'];
        
        for (const modelName of modelNames) {
          try {
            const model = this.gemini.getGenerativeModel({ model: modelName });
            
            // Build conversation context for Gemini
            const conversationContext = conversationHistory
              .map(msg => `${msg.role}: ${msg.content}`)
              .join('\n');
            
            const fullPrompt = `${systemPrompt}\n\nConversation History:\n${conversationContext}\n\nUser: ${message}\n\nAssistant:`;
            
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            content = response.text() || 'I apologize, but I could not generate a response.';
            modelUsed = modelName;
            tokensUsed = 0; // Gemini doesn't provide token usage in free tier
            break; // Success, exit the loop
          } catch (modelError: any) {
            if (modelError.status === 404) {
              console.log(`Model ${modelName} not found, trying next...`);
              continue;
            }
            throw modelError;
          }
        }
        
        if (!content) {
          throw new Error('No working Gemini models found');
        }
        
      } else if (this.aiProvider === 'huggingface') {
        // Use Hugging Face Inference API
        const API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
        
        try {
          const response = await fetch(API_URL, {
            headers: {
              'Content-Type': 'application/json',
              ...(process.env.HUGGINGFACE_API_KEY && {
                'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
              })
            },
            method: 'POST',
            body: JSON.stringify({
              inputs: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
              parameters: {
                max_length: 500,
                temperature: 0.7,
                do_sample: true
              }
            })
          });

          if (!response.ok) {
            throw new Error(`Hugging Face API error: ${response.status}`);
          }

          const result = await response.json();
          content = Array.isArray(result) && result[0]?.generated_text 
            ? result[0].generated_text.split('Assistant:')[1]?.trim() || 'I apologize, but I could not generate a response.'
            : 'I apologize, but I could not generate a response.';
          
          modelUsed = 'DialoGPT-medium';
          tokensUsed = 0;
        } catch (hfError) {
          // Fallback to a simpler model
          try {
            const fallbackURL = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
            const fallbackResponse = await fetch(fallbackURL, {
              headers: { 'Content-Type': 'application/json' },
              method: 'POST',
              body: JSON.stringify({ inputs: message })
            });
            
            const fallbackResult = await fallbackResponse.json();
            content = Array.isArray(fallbackResult) && fallbackResult[0]?.generated_text 
              ? fallbackResult[0].generated_text 
              : 'I apologize, but I could not generate a response.';
            
            modelUsed = 'BlenderBot-400M';
            tokensUsed = 0;
          } catch (fallbackError) {
            content = 'I apologize, but the AI service is temporarily unavailable. Please try again later.';
            modelUsed = 'fallback';
            tokensUsed = 0;
          }
        }
        
      } else if (this.openai) {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: 'user' as const, content: message }
        ];

        const response = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages,
          max_tokens: 1000,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        });

        content = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
        tokensUsed = response.usage?.total_tokens || 0;
        modelUsed = 'gpt-4';
      } else {
        throw new Error(`AI provider ${this.aiProvider} not properly configured`);
      }
      
      return {
        content,
        type: this.determineResponseType(intent, content),
        confidence: this.calculateConfidence({ choices: [{ message: { content } }] }),
        sources: this.extractSources(contextData),
        metadata: {
          intent,
          tokensUsed,
          model: modelUsed,
          provider: this.aiProvider
        }
      };
    } catch (error) {
      logger.error(`${this.aiProvider} API error:`, error);
      throw error;
    }
  }

  private buildSystemPrompt(intent: string, contextData: any): string {
    let basePrompt = `You are ChainMind, an intelligent blockchain and DeFi assistant. You provide helpful, accurate, and educational responses about cryptocurrency, DeFi protocols, and blockchain technology.

Key guidelines:
- Be conversational and friendly
- Provide accurate, up-to-date information
- Always include risk warnings for financial advice
- Use emojis sparingly but effectively
- Format responses with markdown for better readability
- If you don't know something, say so clearly

`;

    switch (intent) {
      case 'portfolio':
        basePrompt += `You are analyzing a user's portfolio. Use the provided portfolio data to give personalized insights.
Portfolio Data: ${JSON.stringify(contextData.portfolio || {})}
Analysis: ${JSON.stringify(contextData.portfolioAnalysis || {})}

Focus on:
- Portfolio performance and diversification
- Risk assessment
- Optimization suggestions
- DeFi opportunities`;
        break;

      case 'market':
        basePrompt += `You are providing market analysis and insights.
Market Data: ${JSON.stringify(contextData.marketData || {})}
Token Prices: ${JSON.stringify(contextData.tokenPrices || {})}

Focus on:
- Price movements and trends
- Market sentiment
- Technical analysis insights
- Trading opportunities and risks`;
        break;

      case 'security':
        basePrompt += `You are analyzing DeFi protocol security.
Security Analysis: ${JSON.stringify(contextData.securityAnalysis || {})}

Focus on:
- Smart contract risks
- Protocol security scores
- Audit status
- Risk mitigation strategies
- Clear warnings about high-risk protocols`;
        break;

      case 'education':
        basePrompt += `You are teaching blockchain and DeFi concepts.

Focus on:
- Clear, beginner-friendly explanations
- Step-by-step guides
- Real-world examples
- Best practices and safety tips`;
        break;
    }

    return basePrompt;
  }

  private determineResponseType(intent: string, content: string): 'text' | 'analysis' | 'warning' | 'education' {
    if (content.includes('⚠️') || content.includes('WARNING') || content.includes('RISK')) {
      return 'warning';
    }
    if (intent === 'education' || content.includes('learn') || content.includes('explain')) {
      return 'education';
    }
    if (intent === 'portfolio' || intent === 'market' || intent === 'security') {
      return 'analysis';
    }
    return 'text';
  }

  private calculateConfidence(response: any): number {
    // Simple confidence calculation based on response length and completeness
    const content = response.choices[0]?.message?.content || '';
    if (content.length < 50) return 0.3;
    if (content.length < 200) return 0.6;
    if (content.length < 500) return 0.8;
    return 0.9;
  }

  private extractSources(contextData: any): string[] {
    const sources: string[] = [];
    if (contextData.marketData) sources.push('Pyth Network');
    if (contextData.portfolio) sources.push('Blockscout');
    if (contextData.securityAnalysis) sources.push('ChainMind Security Analysis');
    return sources;
  }

  private extractTokenSymbols(message: string): string[] {
    // Simple regex to extract common token symbols
    const tokenRegex = /\b(BTC|ETH|USDC|USDT|DAI|LINK|UNI|AAVE|COMP|MKR|SNX|CRV|SUSHI|YFI|1INCH|MATIC|AVAX|SOL|ADA|DOT|ATOM)\b/gi;
    const matches = message.match(tokenRegex);
    return matches ? [...new Set(matches.map(m => m.toUpperCase()))] : [];
  }

  private extractProtocols(message: string): string[] {
    // Extract protocol names or contract addresses
    const protocolRegex = /\b(uniswap|aave|compound|makerdao|curve|sushiswap|yearn|synthetix|1inch|balancer)\b/gi;
    const addressRegex = /0x[a-fA-F0-9]{40}/g;
    
    const protocols = message.match(protocolRegex) || [];
    const addresses = message.match(addressRegex) || [];
    
    return [...protocols.map(p => p.toLowerCase()), ...addresses];
  }

  private hashMessage(message: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }
}
