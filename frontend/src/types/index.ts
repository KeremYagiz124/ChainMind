// Common Types
export interface User {
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    securityAlerts: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
  };
  aiAssistant: {
    model: string;
    temperature: number;
    contextLength: number;
  };
}

// Chat Types
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'assistant';
  timestamp: Date;
  conversationId?: string;
  type?: 'text' | 'analysis' | 'warning' | 'education';
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  userId: string;
  userAddress: string;
  title?: string;
  messages: Message[];
  isActive: boolean;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
}

// Portfolio Types
export interface Token {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chain: string;
  logoUrl?: string;
  coingeckoId?: string;
  balance?: string;
  price?: number;
  value?: number;
}

export interface Portfolio {
  id: string;
  userId: string;
  address: string;
  chain: string;
  balance: string;
  totalValue?: string;
  tokens: Token[];
  protocols: DeFiPosition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeFiPosition {
  protocol: string;
  type: 'lending' | 'staking' | 'liquidity' | 'yield';
  amount: string;
  value: string;
  apy?: number;
}

// Market Data Types
export interface MarketData {
  id: string;
  symbol: string;
  price: string;
  change24h?: string;
  volume24h?: string;
  marketCap?: string;
  source: string;
  timestamp: Date;
}

export interface PriceData {
  id: string;
  tokenId: string;
  price: string;
  source: string;
  timestamp: Date;
}

export interface TrendingToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  logoUrl?: string;
}

// Protocol & Security Types
export interface Protocol {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  chain: string;
  category: 'dex' | 'lending' | 'yield' | 'bridge' | 'derivative' | 'other';
  tvl?: string;
  auditStatus?: 'audited' | 'unaudited' | 'partially_audited';
  auditFirms?: string[];
  riskScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityAnalysis {
  id: string;
  protocolId: string;
  contractAddress: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: SecurityIssue[];
  score: number;
  analyzedAt: Date;
  analyzer: string;
  version?: string;
}

export interface SecurityIssue {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  recommendation?: string;
}

// Alert Types
export interface Alert {
  id: string;
  userId: string;
  type: 'price' | 'security' | 'portfolio' | 'system';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Chart Data Types
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
  }[];
}

// Blockchain Types
export interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
  gasPrice?: string;
}

// Component Props Types
export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
  options?: { label: string; value: string }[];
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

// Wallet Types
export interface WalletState {
  address?: string;
  isConnected: boolean;
  chain?: Chain;
  balance?: string;
}
