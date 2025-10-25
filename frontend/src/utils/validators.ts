/**
 * Validation utilities
 */

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate transaction hash
 */
export const isValidTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validate URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate number in range
 */
export const isInRange = (
  value: number,
  min: number,
  max: number
): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return value > 0 && !isNaN(value) && isFinite(value);
};

/**
 * Validate non-negative number
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return value >= 0 && !isNaN(value) && isFinite(value);
};

/**
 * Validate string length
 */
export const isValidLength = (
  str: string,
  minLength: number,
  maxLength?: number
): boolean => {
  if (str.length < minLength) return false;
  if (maxLength && str.length > maxLength) return false;
  return true;
};

/**
 * Validate private key format
 */
export const isValidPrivateKey = (key: string): boolean => {
  return /^(0x)?[a-fA-F0-9]{64}$/.test(key);
};

/**
 * Check if value is empty
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate JSON string
 */
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate amount with decimals
 */
export const isValidAmount = (
  amount: string,
  decimals: number = 18
): boolean => {
  if (!amount || amount === '0') return false;
  
  const regex = new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`);
  return regex.test(amount);
};

/**
 * Validate hex string
 */
export const isValidHex = (hex: string): boolean => {
  return /^0x[a-fA-F0-9]*$/.test(hex);
};
