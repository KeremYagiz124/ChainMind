/**
 * Application constants
 */

// Storage keys
export const STORAGE_KEYS = {
  THEME: 'chainmind_theme',
  LANGUAGE: 'chainmind_language',
  WALLET_ADDRESS: 'chainmind_wallet_address',
  CONVERSATION_ID: 'chainmind_conversation_id',
  USER_PREFERENCES: 'chainmind_user_preferences',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
} as const;

// Toast durations
export const TOAST_DURATION = {
  SHORT: 2000,
  MEDIUM: 3000,
  LONG: 5000,
} as const;

// Debounce delays
export const DEBOUNCE_DELAY = {
  SHORT: 300,
  MEDIUM: 500,
  LONG: 1000,
} as const;

// File size limits
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  MAX: 50 * 1024 * 1024, // 50MB
} as const;

// Regex patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  TX_HASH: /^0x[a-fA-F0-9]{64}$/,
  URL: /^https?:\/\/.+/,
} as const;

// Animation durations
export const ANIMATION = {
  FAST: 150,
  MEDIUM: 300,
  SLOW: 500,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Status types
export const STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading',
} as const;

// Message types
export const MESSAGE_TYPE = {
  TEXT: 'text',
  ANALYSIS: 'analysis',
  WARNING: 'warning',
  EDUCATION: 'education',
} as const;

// Protocol categories
export const PROTOCOL_CATEGORIES = {
  DEX: 'dex',
  LENDING: 'lending',
  YIELD: 'yield',
  BRIDGE: 'bridge',
  DERIVATIVE: 'derivative',
  OTHER: 'other',
} as const;

// Risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Audit status
export const AUDIT_STATUS = {
  AUDITED: 'audited',
  UNAUDITED: 'unaudited',
  PARTIALLY_AUDITED: 'partially_audited',
} as const;

// Transaction status
export const TX_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

// Alert types
export const ALERT_TYPES = {
  PRICE: 'price',
  SECURITY: 'security',
  PORTFOLIO: 'portfolio',
  SYSTEM: 'system',
} as const;

// Severity levels
export const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
} as const;

// Chart types
export const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
} as const;

// Time ranges
export const TIME_RANGES = {
  '1H': { label: '1H', value: '1h' },
  '24H': { label: '24H', value: '24h' },
  '7D': { label: '7D', value: '7d' },
  '30D': { label: '30D', value: '30d' },
  '90D': { label: '90D', value: '90d' },
  '1Y': { label: '1Y', value: '1y' },
  ALL: { label: 'All', value: 'all' },
} as const;

// Default values
export const DEFAULTS = {
  DECIMALS: 18,
  DISPLAY_DECIMALS: 4,
  PRICE_DECIMALS: 2,
  PERCENTAGE_DECIMALS: 2,
} as const;
