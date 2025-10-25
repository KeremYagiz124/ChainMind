/**
 * Format utilities for displaying data
 */

/**
 * Format a number as currency
 */
export const formatCurrency = (
  value: number | string,
  currency: string = 'USD',
  decimals: number = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

/**
 * Format a large number with abbreviations (K, M, B)
 */
export const formatCompactNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Format a percentage
 */
export const formatPercentage = (
  value: number | string,
  decimals: number = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Format a wallet address (shortened)
 */
export const formatAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format a date relative to now
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  
  return dateObj.toLocaleDateString();
};

/**
 * Format a date and time
 */
export const formatDateTime = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return dateObj.toLocaleString('en-US', options || defaultOptions);
};

/**
 * Format token amount with decimals
 */
export const formatTokenAmount = (
  amount: string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const actualAmount = numAmount / Math.pow(10, decimals);
  
  if (actualAmount === 0) return '0';
  if (actualAmount < 0.0001) return '< 0.0001';
  
  return actualAmount.toFixed(displayDecimals);
};

/**
 * Format gas price in Gwei
 */
export const formatGasPrice = (weiPrice: string | number): string => {
  const wei = typeof weiPrice === 'string' ? parseFloat(weiPrice) : weiPrice;
  const gwei = wei / 1e9;
  
  return `${gwei.toFixed(2)} Gwei`;
};

/**
 * Format transaction hash (shortened)
 */
export const formatTxHash = (hash: string): string => {
  return formatAddress(hash, 10, 8);
};

/**
 * Parse and format JSON safely
 */
export const formatJSON = (data: any, indent: number = 2): string => {
  try {
    return JSON.stringify(data, null, indent);
  } catch (error) {
    return String(data);
  }
};
