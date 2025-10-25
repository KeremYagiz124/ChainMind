/**
 * Backend validation utilities
 */

import { ethers } from 'ethers';

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Validate and normalize Ethereum address
 */
export const normalizeAddress = (address: string): string | null => {
  try {
    return ethers.getAddress(address);
  } catch {
    return null;
  }
};

/**
 * Validate transaction hash
 */
export const isValidTxHash = (hash: string): boolean => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validate hex string
 */
export const isValidHex = (hex: string): boolean => {
  return /^0x[a-fA-F0-9]*$/.test(hex);
};

/**
 * Validate chain ID
 */
export const isValidChainId = (chainId: number): boolean => {
  return Number.isInteger(chainId) && chainId > 0;
};

/**
 * Validate amount string
 */
export const isValidAmount = (amount: string): boolean => {
  try {
    const parsed = ethers.parseEther(amount);
    return parsed >= 0n;
  } catch {
    return false;
  }
};

/**
 * Validate API key format
 */
export const isValidApiKey = (key: string): boolean => {
  return typeof key === 'string' && key.length >= 32;
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validate JWT token format
 */
export const isValidJWT = (token: string): boolean => {
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.replace(/[<>]/g, '');
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  page: number,
  limit: number
): { page: number; limit: number } => {
  const validPage = Math.max(1, Math.floor(page) || 1);
  const validLimit = Math.min(100, Math.max(1, Math.floor(limit) || 10));
  return { page: validPage, limit: validLimit };
};

/**
 * Validate date range
 */
export const isValidDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate <= endDate;
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
