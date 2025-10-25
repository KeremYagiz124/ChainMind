/**
 * Application route constants
 */

export const ROUTES = {
  HOME: '/',
  CHAT: '/',
  PORTFOLIO: '/portfolio',
  ANALYTICS: '/analytics',
  SECURITY: '/security',
  HISTORY: '/history',
  SETTINGS: '/settings',
} as const;

export const API_ROUTES = {
  // Chat
  CHAT_MESSAGE: '/api/chat/message',
  CHAT_CONVERSATIONS: '/api/chat/conversations',
  CHAT_CONVERSATION: '/api/chat/conversation',
  
  // Portfolio
  PORTFOLIO_GET: '/api/portfolio',
  PORTFOLIO_TOKENS: '/api/portfolio/tokens',
  PORTFOLIO_POSITIONS: '/api/portfolio/positions',
  
  // Analytics
  ANALYTICS_MARKET: '/api/analytics/market',
  ANALYTICS_PRICE: '/api/analytics/price',
  ANALYTICS_TRENDING: '/api/analytics/trending',
  
  // Security
  SECURITY_PROTOCOLS: '/api/security/protocols',
  SECURITY_ANALYSIS: '/api/security/analysis',
  SECURITY_SCAN: '/api/security/scan',
  
  // User
  USER_PROFILE: '/api/user/profile',
  USER_PREFERENCES: '/api/user/preferences',
  USER_ALERTS: '/api/user/alerts',
} as const;
