/**
 * Enhanced API utility with retry logic, timeout, and error handling
 */

import { apiLogger } from './logger';
import { showErrorToast } from './errorHandler';

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipErrorToast?: boolean;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }
  
  // Timeout errors
  if (error.name === 'AbortError') {
    return true;
  }
  
  // HTTP status codes that should be retried
  if (error.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }
  
  return false;
};

/**
 * Enhanced fetch with timeout
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Enhanced fetch with retry logic
 */
export const apiFetch = async <T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    skipErrorToast = false,
    ...fetchOptions
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      apiLogger.debug(`API request attempt ${attempt + 1}/${retries + 1}:`, url);
      
      const response = await fetchWithTimeout(url, fetchOptions, timeout);
      
      // Check if response is ok
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        
        // Try to parse error message from response
        try {
          const errorData = await response.json();
          error.message = errorData.error || errorData.message || error.message;
        } catch (e) {
          // Response is not JSON
        }
        
        throw error;
      }
      
      // Parse JSON response
      const data = await response.json();
      apiLogger.debug('API request successful:', url);
      
      return data as ApiResponse<T>;
      
    } catch (error: any) {
      lastError = error;
      
      // Log the error
      apiLogger.error(`API request failed (attempt ${attempt + 1}):`, error);
      
      // Check if we should retry
      if (attempt < retries && isRetryableError(error)) {
        const delayTime = retryDelay * Math.pow(2, attempt); // Exponential backoff
        apiLogger.info(`Retrying in ${delayTime}ms...`);
        await sleep(delayTime);
        continue;
      }
      
      // No more retries or non-retryable error
      break;
    }
  }
  
  // All retries failed
  const errorMessage = lastError?.message || 'API request failed';
  
  if (!skipErrorToast) {
    showErrorToast(lastError, errorMessage);
  }
  
  return {
    success: false,
    error: errorMessage
  };
};

/**
 * Convenience methods for different HTTP methods
 */
export const api = {
  get: <T = any>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return apiFetch<T>(url, { ...options, method: 'GET' });
  },
  
  post: <T = any>(url: string, data?: any, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return apiFetch<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  },
  
  put: <T = any>(url: string, data?: any, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return apiFetch<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  },
  
  patch: <T = any>(url: string, data?: any, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return apiFetch<T>(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : undefined
    });
  },
  
  delete: <T = any>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> => {
    return apiFetch<T>(url, { ...options, method: 'DELETE' });
  }
};

/**
 * Example usage:
 * 
 * // Simple GET request
 * const result = await api.get('/api/portfolio/0x123');
 * 
 * // POST with data
 * const result = await api.post('/api/chat/message', { content: 'Hello' });
 * 
 * // Custom options
 * const result = await api.get('/api/data', {
 *   retries: 5,
 *   timeout: 60000,
 *   skipErrorToast: true
 * });
 * 
 * // Check result
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Error:', result.error);
 * }
 */

export default api;
