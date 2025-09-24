import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
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

class HttpClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = API_ENDPOINTS.LOGIN.split('/seller')[0]; // Base API URL
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

  // Generic HTTP methods
  async get<T = any>(url: string, config = {}): Promise<T> {
    const response = await this.instance.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data = {}, config = {}): Promise<T> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config = {}): Promise<T> {
    const response = await this.instance.delete(url, config);
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