import axios, { AxiosInstance, AxiosError, AxiosResponse, AxiosRequestConfig } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_ENDPOINTS, CONFIG, STORAGE_KEYS } from '../config';
import { secureStorageService, SECURE_STORAGE_KEYS } from './secureStorage';

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    name?: string;
    phone: string;
    email?: string;
    role: string;
    storeName?: string;
    isVerified: boolean;
    profileCompleted?: boolean;
  };
  isNewUser?: boolean;
  requestId?: string;
}

// Error handling interface
export interface ApiError extends Error {
  code?: string;
  status?: number;
  data?: any;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000, // Start with 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, rate limit, server errors
};

class HttpClient {
  private instance: AxiosInstance;
  private baseURL: string;
  private retryConfig: RetryConfig;

  constructor() {
    this.baseURL = API_ENDPOINTS.LOGIN.split('/seller')[0]; // Base API URL
    this.retryConfig = DEFAULT_RETRY_CONFIG;
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: CONFIG.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle common errors
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear auth data
          this.clearAuthData();
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    let message = 'An unexpected error occurred';
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response) {
      message = 'Network error. Please check your internet connection and try again.';
    }
    // Extract error message from response
    else if (error.response?.data) {
      const data = error.response.data as any;
      message = data.message || data.error || message;
      
      // Handle specific HTTP status codes
      if (error.response.status === 400) {
        message = data.message || 'Invalid request data';
      } else if (error.response.status === 401) {
        message = data.message || 'Authentication failed';
      } else if (error.response.status === 404) {
        message = data.message || 'Service not found';
      } else if (error.response.status === 429) {
        message = data.message || 'Too many requests. Please try again later.';
      } else if (error.response.status >= 500) {
        message = data.message || 'Server error. Please try again later.';
      }
    } else if (error.message) {
      message = error.message;
    }

    const apiError: ApiError = new Error(message);
    apiError.code = error.code || 'API_ERROR';
    apiError.status = error.response?.status;
    apiError.data = error.response?.data;

    console.error('🚨 API Error:', {
      message,
      code: apiError.code,
      status: apiError.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase()
    });

    return apiError;
  }

  private async clearAuthData() {
    await secureStorageService.clearSecure();
  }

  // Check network connectivity before making requests
  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.warn('Failed to check network connectivity:', error);
      return true; // Assume connected if check fails
    }
  }

  // Determine if error is retryable
  private isRetryableError(error: AxiosError): boolean {
    // Network errors are retryable
    if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !error.response) {
      return true;
    }

    // Specific HTTP status codes are retryable
    if (error.response && this.retryConfig.retryableStatuses.includes(error.response.status)) {
      return true;
    }

    return false;
  }

  // Exponential backoff delay
  private async delay(retryCount: number): Promise<void> {
    const delayMs = this.retryConfig.retryDelay * Math.pow(2, retryCount);
    console.log(`⏳ Retrying in ${delayMs}ms (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  // Execute request with retry logic
  private async executeWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryCount = 0
  ): Promise<AxiosResponse<T>> {
    try {
      // Check network before making request
      const isOnline = await this.checkNetworkConnectivity();
      if (!isOnline) {
        const error: any = new Error('No internet connection');
        error.code = 'NETWORK_ERROR';
        throw error;
      }

      return await requestFn();
    } catch (error) {
      const axiosError = error as AxiosError;

      // Don't retry if max retries reached
      if (retryCount >= this.retryConfig.maxRetries) {
        console.error(`❌ Max retries (${this.retryConfig.maxRetries}) reached`);
        throw error;
      }

      // Don't retry if error is not retryable
      if (!this.isRetryableError(axiosError)) {
        throw error;
      }

      // Wait before retrying
      await this.delay(retryCount);

      // Retry the request
      console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${this.retryConfig.maxRetries})`);
      return this.executeWithRetry(requestFn, retryCount + 1);
    }
  }

  // Generic HTTP methods with retry logic
  async get<T = any>(url: string, config = {}): Promise<T> {
    const response = await this.executeWithRetry(() => this.instance.get(url, config));
    return response.data;
  }

  async post<T = any>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.executeWithRetry(() => this.instance.post(url, data, config));
    return response.data;
  }

  async put<T = any>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.executeWithRetry(() => this.instance.put(url, data, config));
    return response.data;
  }

  async delete<T = any>(url: string, config = {}): Promise<T> {
    const response = await this.executeWithRetry(() => this.instance.delete(url, config));
    return response.data;
  }

  // Auth-specific methods
  async login(phone: string): Promise<AuthResponse> {
    return this.post<AuthResponse>(API_ENDPOINTS.LOGIN, { phone });
  }

  async verifyOtp(phone: string, otp: string): Promise<AuthResponse> {
    return this.post<AuthResponse>(API_ENDPOINTS.VERIFY_OTP, { phone, otp });
  }

  async resendOtp(phone: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(API_ENDPOINTS.RESEND_OTP, { phone });
  }

  async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>(API_ENDPOINTS.LOGOUT, {});
  }

  // Store registration methods
  async registerStore(storeData: any): Promise<any> {
    // Use POST to complete seller registration with store information
    return this.post(API_ENDPOINTS.STORE_REGISTER, storeData);
  }

  async getStoreInfo(): Promise<any> {
    return this.get(API_ENDPOINTS.STORE);
  }

  async updateStore(storeData: any): Promise<any> {
    return this.put(API_ENDPOINTS.UPDATE_STORE, storeData);
  }

  async updateStoreProfile(storeData: any): Promise<any> {
    // Use the same endpoint as store registration for profile updates
    return this.post(API_ENDPOINTS.STORE_REGISTER, storeData);
  }

  // Get base URL for constructing image URLs
  getBaseURL(): string {
    return this.baseURL;
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Export for testing purposes
export { HttpClient };