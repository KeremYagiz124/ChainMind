/**
 * API service with request/response handling
 */

import { API_CONFIG } from '../constants';
import type { ApiResponse, PaginatedResponse } from '../types';

class ApiService {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Make a request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout',
          };
        }

        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params)}` : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Request with retry logic
   */
  async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = API_CONFIG.RETRY_ATTEMPTS
  ): Promise<ApiResponse<T>> {
    let lastError: ApiResponse<T> = {
      success: false,
      error: 'Max retries exceeded',
    };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await this.request<T>(endpoint, options);

      if (result.success) {
        return result;
      }

      lastError = result;

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, attempt))
        );
      }
    }

    return lastError;
  }

  /**
   * Get paginated data
   */
  async getPaginated<T>(
    endpoint: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<T>> {
    const response = await this.get<any>(endpoint, { page, limit });

    if (!response.success) {
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }

    return {
      success: true,
      data: response.data?.items || response.data || [],
      pagination: response.data?.pagination || {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

// Export singleton instance
export const api = new ApiService();
export default api;
