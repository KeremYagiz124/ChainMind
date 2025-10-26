// API Configuration
// VITE_API_URL should include /api suffix: http://localhost:3001/api
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_CHALLENGE: `${API_BASE_URL}/auth/challenge`,
  AUTH_VERIFY: `${API_BASE_URL}/auth/verify`,
  AUTH_REFRESH: `${API_BASE_URL}/auth/refresh`,
  AUTH_LOGOUT: `${API_BASE_URL}/auth/logout`,
  AUTH_ME: `${API_BASE_URL}/auth/me`,

  // Chat
  CHAT_MESSAGE: `${API_BASE_URL}/chat/message`,
  CHAT_CONVERSATIONS: (address: string) => `${API_BASE_URL}/chat/conversations/${address}`,
  CHAT_CONVERSATION: (id: string) => `${API_BASE_URL}/chat/conversation/${id}`,
  CHAT_QUICK_ACTIONS: `${API_BASE_URL}/chat/quick-actions`,

  // Portfolio
  PORTFOLIO: (address: string) => `${API_BASE_URL}/portfolio/${address}`,
  PORTFOLIO_ANALYSIS: (address: string) => `${API_BASE_URL}/portfolio/${address}/analysis`,
  PORTFOLIO_HISTORY: (address: string) => `${API_BASE_URL}/portfolio/${address}/history`,
  PORTFOLIO_NFTS: (address: string) => `${API_BASE_URL}/portfolio/${address}/nfts`,

  // Market
  MARKET_OVERVIEW: `${API_BASE_URL}/market/overview`,
  MARKET_PRICES: `${API_BASE_URL}/market/prices`,
  MARKET_TOKEN: (symbol: string) => `${API_BASE_URL}/market/token/${symbol}`,

  // Security
  SECURITY_ANALYZE: `${API_BASE_URL}/security/analyze`,
  SECURITY_PROTOCOLS: `${API_BASE_URL}/security/protocols`,
  SECURITY_CONTRACT: (address: string) => `${API_BASE_URL}/security/contract/${address}`,
};

// Helper function to build URL with query params
export const buildUrlWithParams = (baseUrl: string, params: Record<string, any>): string => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });
  return url.toString();
};
