import axios from 'axios';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { cacheGet, cacheSet } from '../config/redis';
import { getDatabase } from '../config/database';

export interface SecurityAnalysis {
  protocolName: string;
  contractAddress: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100, lower is better
  issues: SecurityIssue[];
  auditStatus: 'audited' | 'unaudited' | 'partially_audited';
  auditFirms: string[];
  lastAnalyzed: Date;
  recommendations: string[];
}

export interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  impact: string;
  recommendation: string;
}

export interface ContractInfo {
  address: string;
  name?: string;
  verified: boolean;
  sourceCode?: string;
  compiler?: string;
  optimization?: boolean;
  creationDate?: Date;
  creator?: string;
}

export class SecurityService {
  private db = getDatabase();
  private readonly BLOCKSCOUT_API_KEY = process.env.BLOCKSCOUT_API_KEY;
  
  private readonly BLOCKSCOUT_URLS: { [chainId: number]: string } = {
    1: process.env.BLOCKSCOUT_API_URL || 'https://eth.blockscout.com/api',
    137: process.env.BLOCKSCOUT_POLYGON_URL || 'https://polygon.blockscout.com/api',
    42161: process.env.BLOCKSCOUT_ARBITRUM_URL || 'https://arbitrum.blockscout.com/api',
    10: 'https://optimism.blockscout.com/api',
    8453: 'https://base.blockscout.com/api'
  };
  
  // Known protocol configurations
  private readonly KNOWN_PROTOCOLS = {
    'uniswap': {
      name: 'Uniswap V3',
      contracts: ['0x1F98431c8aD98523631AE4a59f267346ea31F984'],
      category: 'dex',
      auditFirms: ['Trail of Bits', 'Consensys Diligence']
    },
    'aave': {
      name: 'Aave V3',
      contracts: ['0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'],
      category: 'lending',
      auditFirms: ['OpenZeppelin', 'Consensys Diligence', 'Certora']
    },
    'compound': {
      name: 'Compound V3',
      contracts: ['0xc3d688B66703497DAA19211EEdff47f25384cdc3'],
      category: 'lending',
      auditFirms: ['OpenZeppelin', 'ChainSecurity']
    }
  };

  async analyzeProtocol(protocolIdentifier: string): Promise<SecurityAnalysis> {
    const cacheKey = `security_analysis:${protocolIdentifier}`;
    const cached = await cacheGet(cacheKey);
    
    if (cached && this.isCacheValid(cached.lastAnalyzed)) {
      logger.debug('Returning cached security analysis');
      return cached;
    }

    try {
      let contractAddress: string;
      let protocolName: string;

      // Determine if input is contract address or protocol name
      if (ethers.isAddress(protocolIdentifier)) {
        contractAddress = protocolIdentifier;
        protocolName = await this.getProtocolName(contractAddress);
      } else {
        const protocol = this.KNOWN_PROTOCOLS[protocolIdentifier.toLowerCase() as keyof typeof this.KNOWN_PROTOCOLS];
        if (protocol) {
          contractAddress = protocol.contracts[0];
          protocolName = protocol.name;
        } else {
          throw new Error(`Unknown protocol: ${protocolIdentifier}`);
        }
      }

      // Get contract information
      const contractInfo = await this.getContractInfo(contractAddress);
      
      // Perform security analysis
      const analysis = await this.performSecurityAnalysis(contractAddress, protocolName, contractInfo);
      
      // Store in database
      await this.storeAnalysisInDB(analysis);
      
      // Cache for 1 hour
      await cacheSet(cacheKey, analysis, 3600);
      
      return analysis;
    } catch (error) {
      logger.error('Security analysis error:', error);
      
      // Return fallback analysis
      return this.getFallbackAnalysis(protocolIdentifier);
    }
  }

  private async getContractInfo(address: string, chainId: number = 1): Promise<ContractInfo> {
    const baseUrl = this.BLOCKSCOUT_URLS[chainId] || this.BLOCKSCOUT_URLS[1];
    
    try {
      // Use Blockscout API v2 to get contract information
      const headers: any = {
        'Accept': 'application/json',
        'User-Agent': 'ChainMind/1.0'
      };
      
      if (this.BLOCKSCOUT_API_KEY) {
        headers['Authorization'] = `Bearer ${this.BLOCKSCOUT_API_KEY}`;
      }

      logger.debug(`Fetching contract info from Blockscout: ${baseUrl}/v2/smart-contracts/${address}`);

      const response = await axios.get(
        `${baseUrl}/v2/smart-contracts/${address}`,
        {
          timeout: parseInt(process.env.BLOCKCHAIN_TIMEOUT || '15000'),
          headers
        }
      );

      const data = response.data;
      
      return {
        address,
        name: data.name || 'Unknown Contract',
        verified: data.is_verified || data.verified || false,
        sourceCode: data.source_code,
        compiler: data.compiler_version,
        optimization: data.optimization_enabled,
        creationDate: data.created_at ? new Date(data.created_at) : undefined,
        creator: data.creator_address_hash
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        logger.warn(`Contract ${address} not found on Blockscout`);
      } else if (error.response?.status === 429) {
        logger.error('Blockscout API rate limit exceeded');
      } else {
        logger.error('Error fetching contract info from Blockscout:', error.message);
      }
      
      // Fallback: Try to get basic info from blockchain
      return await this.getContractInfoFromChain(address, chainId);
    }
  }
  
  private async getContractInfoFromChain(address: string, chainId: number): Promise<ContractInfo> {
    try {
      const provider = this.getProvider(chainId);
      const code = await provider.getCode(address);
      
      return {
        address,
        verified: false,
        name: 'Unverified Contract',
        sourceCode: undefined
      };
    } catch (error) {
      logger.error('Error fetching contract from chain:', error);
      return {
        address,
        verified: false
      };
    }
  }
  
  private getProvider(chainId: number): ethers.JsonRpcProvider {
    const rpcUrls: { [key: number]: string } = {
      1: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
      42161: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
      10: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
      8453: process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    };
    
    return new ethers.JsonRpcProvider(rpcUrls[chainId] || rpcUrls[1]);
  }

  private async performSecurityAnalysis(
    contractAddress: string, 
    protocolName: string, 
    contractInfo: ContractInfo
  ): Promise<SecurityAnalysis> {
    const issues: SecurityIssue[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    // Check if contract is verified
    if (!contractInfo.verified) {
      issues.push({
        severity: 'high',
        category: 'Verification',
        description: 'Contract source code is not verified',
        impact: 'Cannot audit the contract code for vulnerabilities',
        recommendation: 'Only interact with verified contracts'
      });
      riskScore += 30;
    }

    // Check contract age
    if (contractInfo.creationDate) {
      const daysSinceCreation = (Date.now() - contractInfo.creationDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreation < 30) {
        issues.push({
          severity: 'medium',
          category: 'Maturity',
          description: 'Contract is relatively new (less than 30 days)',
          impact: 'New contracts may have undiscovered vulnerabilities',
          recommendation: 'Exercise extra caution with new protocols'
        });
        riskScore += 15;
      }
    }

    // Check for known protocol patterns
    const protocolConfig = Object.values(this.KNOWN_PROTOCOLS)
      .find(p => p.contracts.includes(contractAddress));

    let auditStatus: 'audited' | 'unaudited' | 'partially_audited' = 'unaudited';
    let auditFirms: string[] = [];

    if (protocolConfig) {
      auditStatus = 'audited';
      auditFirms = protocolConfig.auditFirms;
      riskScore = Math.max(0, riskScore - 20); // Reduce risk for known audited protocols
    } else {
      issues.push({
        severity: 'medium',
        category: 'Audit',
        description: 'No known security audits found',
        impact: 'Potential security vulnerabilities may exist',
        recommendation: 'Verify audit status before using'
      });
      riskScore += 20;
    }

    // Analyze source code if available
    if (contractInfo.sourceCode) {
      const codeIssues = await this.analyzeSourceCode(contractInfo.sourceCode);
      issues.push(...codeIssues);
      riskScore += codeIssues.length * 5;
    }

    // Generate recommendations
    if (riskScore > 70) {
      recommendations.push('⚠️ HIGH RISK: Avoid using this protocol');
      recommendations.push('Wait for security audits and community validation');
    } else if (riskScore > 40) {
      recommendations.push('⚠️ MEDIUM RISK: Use with caution');
      recommendations.push('Only invest small amounts you can afford to lose');
      recommendations.push('Monitor for security updates');
    } else {
      recommendations.push('✅ Relatively safe to use');
      recommendations.push('Still practice good security hygiene');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 80) riskLevel = 'critical';
    else if (riskScore >= 60) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      protocolName,
      contractAddress,
      riskLevel,
      riskScore: Math.min(100, riskScore),
      issues,
      auditStatus,
      auditFirms,
      lastAnalyzed: new Date(),
      recommendations
    };
  }

  private async analyzeSourceCode(sourceCode: string): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    // Simple pattern matching for common vulnerabilities
    const patterns = [
      {
        pattern: /selfdestruct|suicide/i,
        severity: 'high' as const,
        category: 'Dangerous Functions',
        description: 'Contract contains selfdestruct functionality',
        impact: 'Contract can be permanently destroyed',
        recommendation: 'Ensure selfdestruct is properly protected'
      },
      {
        pattern: /delegatecall/i,
        severity: 'medium' as const,
        category: 'Proxy Patterns',
        description: 'Contract uses delegatecall',
        impact: 'Potential for proxy-related vulnerabilities',
        recommendation: 'Verify delegatecall usage is secure'
      },
      {
        pattern: /assembly\s*\{/i,
        severity: 'medium' as const,
        category: 'Low-level Code',
        description: 'Contract contains inline assembly',
        impact: 'Assembly code bypasses Solidity safety checks',
        recommendation: 'Ensure assembly code is thoroughly audited'
      },
      {
        pattern: /tx\.origin/i,
        severity: 'medium' as const,
        category: 'Authentication',
        description: 'Contract uses tx.origin for authentication',
        impact: 'Vulnerable to phishing attacks',
        recommendation: 'Use msg.sender instead of tx.origin'
      }
    ];

    for (const { pattern, severity, category, description, impact, recommendation } of patterns) {
      if (pattern.test(sourceCode)) {
        issues.push({
          severity,
          category,
          description,
          impact,
          recommendation
        });
      }
    }

    return issues;
  }

  private async getProtocolName(contractAddress: string): Promise<string> {
    // Try to get protocol name from known contracts
    for (const [name, config] of Object.entries(this.KNOWN_PROTOCOLS)) {
      if (config.contracts.includes(contractAddress)) {
        return config.name;
      }
    }

    // Fallback to contract address
    return `Contract ${contractAddress.slice(0, 8)}...`;
  }

  private async storeAnalysisInDB(analysis: SecurityAnalysis): Promise<void> {
    if (!this.db) {
      logger.warn('Database not available, skipping analysis storage');
      return;
    }
    
    try {
      // First, ensure protocol exists
      await this.db.protocol.upsert({
        where: { name: analysis.protocolName },
        update: {
          riskScore: analysis.riskScore,
          auditStatus: analysis.auditStatus,
          auditFirms: analysis.auditFirms,
          updatedAt: new Date()
        },
        create: {
          name: analysis.protocolName,
          slug: analysis.protocolName.toLowerCase().replace(/\s+/g, '-'),
          chain: 'ethereum',
          category: 'unknown',
          riskScore: analysis.riskScore,
          auditStatus: analysis.auditStatus,
          auditFirms: analysis.auditFirms
        }
      });

      // Store security analysis
      const protocol = await this.db.protocol.findUnique({
        where: { name: analysis.protocolName }
      });

      if (protocol) {
        await this.db.securityAnalysis.create({
          data: {
            protocolId: protocol.id,
            contractAddress: analysis.contractAddress,
            riskLevel: analysis.riskLevel,
            issues: analysis.issues as any,
            score: analysis.riskScore,
            analyzer: 'chainmind',
            version: '1.0'
          }
        });
      }
    } catch (error) {
      logger.error('Error storing security analysis:', error);
    }
  }

  private getFallbackAnalysis(protocolIdentifier: string): SecurityAnalysis {
    return {
      protocolName: protocolIdentifier,
      contractAddress: ethers.isAddress(protocolIdentifier) ? protocolIdentifier : '0x0000000000000000000000000000000000000000',
      riskLevel: 'high',
      riskScore: 75,
      issues: [{
        severity: 'high',
        category: 'Analysis Failed',
        description: 'Unable to perform security analysis',
        impact: 'Security status unknown',
        recommendation: 'Proceed with extreme caution'
      }],
      auditStatus: 'unaudited',
      auditFirms: [],
      lastAnalyzed: new Date(),
      recommendations: ['⚠️ Analysis failed - avoid using until security can be verified']
    };
  }

  private isCacheValid(lastAnalyzed: Date): boolean {
    const oneHour = 60 * 60 * 1000;
    return (Date.now() - lastAnalyzed.getTime()) < oneHour;
  }

  async getProtocolRiskScore(protocolName: string): Promise<number> {
    if (!this.db) {
      return 50; // Default medium risk
    }
    
    try {
      const protocol = await this.db.protocol.findUnique({
        where: { name: protocolName },
        include: {
          securityAnalyses: {
            orderBy: { analyzedAt: 'desc' },
            take: 1
          }
        }
      });

      return protocol?.riskScore || 50; // Default medium risk
    } catch (error) {
      logger.error('Error getting protocol risk score:', error);
      return 50;
    }
  }

  async getSecurityAlerts(userAddress: string): Promise<Array<{
    type: string;
    message: string;
    severity: string;
    timestamp: Date;
  }>> {
    if (!this.db) {
      return [];
    }
    
    try {
      const alerts = await this.db.alert.findMany({
        where: {
          userId: userAddress,
          type: 'security',
          isRead: false
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return alerts.map(alert => ({
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.createdAt
      }));
    } catch (error) {
      logger.error('Error getting security alerts:', error);
      return [];
    }
  }
}
