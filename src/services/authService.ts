import { httpClient, AuthResponse, ApiError } from './httpClient';
import { STORAGE_KEYS } from '../config';
import { secureStorageService, SECURE_STORAGE_KEYS, REGULAR_STORAGE_KEYS } from './secureStorage';
import { fcmService } from './fcmService';

// Backward-compatible in-memory storage (dev fallback)
let memoryStorage: Record<string, string> = {};

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone: string;
  role: string;
  storeName?: string;
  storeAddress?: string;
  isVerified: boolean;
  profileCompleted?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
}

export interface LoginCredentials {
  phone: string;
}

export interface OTPVerification {
  phone: string;
  otp: string;
}

class AuthService {
  // Initialize auth state from storage
  async initializeAuth(): Promise<AuthState> {
    try {
      // Check for migration - move data from memory storage if exists
      await this.migrateLegacyStorage();
      
      // Get auth data from secure storage
      const [token, userJson] = await Promise.all([
        secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN),
        secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.USER_DATA),
      ]);

      const parsedUser = userJson ? JSON.parse(userJson) : null;
      
      console.log('🔐 SecureStorage: Found token:', !!token, 'user:', !!parsedUser);

      return {
        user: parsedUser,
        token: token || null,
        isAuthenticated: !!(token && parsedUser),
        isLoading: false,
        isNewUser: false,
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isNewUser: false,
      };
    }
  }
  
  // Helper method to migrate from memory storage to secure storage
  private async migrateLegacyStorage(): Promise<void> {
    try {
      // Check if we have data in memory storage that needs migration
      if (Object.keys(memoryStorage).length > 0) {
        console.log('🔄 Migrating legacy storage to secure storage...');
        
        // Migrate auth token
        if (memoryStorage[STORAGE_KEYS.AUTH_TOKEN]) {
          await secureStorageService.setSecureItem(
            SECURE_STORAGE_KEYS.AUTH_TOKEN, 
            memoryStorage[STORAGE_KEYS.AUTH_TOKEN]
          );
        }
        
        // Migrate user data
        if (memoryStorage[STORAGE_KEYS.USER_DATA]) {
          await secureStorageService.setSecureItem(
            SECURE_STORAGE_KEYS.USER_DATA, 
            memoryStorage[STORAGE_KEYS.USER_DATA]
          );
        }
        
        // Migrate temp data
        if (memoryStorage.temp_phone) {
          await secureStorageService.setItem(REGULAR_STORAGE_KEYS.TEMP_PHONE, memoryStorage.temp_phone);
        }
        if (memoryStorage.temp_isNewUser) {
          await secureStorageService.setItem(REGULAR_STORAGE_KEYS.TEMP_IS_NEW_USER, memoryStorage.temp_isNewUser);
        }
        
        // Clear memory storage after migration
        memoryStorage = {};
        console.log('✅ Legacy storage migrated successfully');
      }
    } catch (error) {
      console.error('❌ Legacy storage migration failed:', error);
      // Don't throw error, let the app continue
    }
  }

  // Send OTP for login
  async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; isNewUser?: boolean }> {
    try {
      console.log('📱 AuthService: Sending OTP to phone:', credentials.phone);
      const response = await httpClient.login(credentials.phone);
      
      console.log('📡 AuthService: Login API Response:', {
        success: response.success,
        isNewUser: response.isNewUser,
        message: response.message
      });

      // Store temporary data for OTP verification
      await secureStorageService.setItem(REGULAR_STORAGE_KEYS.TEMP_PHONE, credentials.phone);
      await secureStorageService.setItem(REGULAR_STORAGE_KEYS.TEMP_IS_NEW_USER, response.isNewUser ? 'true' : 'false');

      console.log('✅ AuthService: Login completed successfully');
      return {
        success: response.success || true,
        message: response.message || 'OTP sent successfully',
        isNewUser: response.isNewUser,
      };
    } catch (error) {
      console.error('❌ AuthService: Login error:', error);
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to send OTP',
      };
    }
  }

  // Verify OTP and complete authentication
  async verifyOtp(verification: OTPVerification): Promise<{ success: boolean; message: string; user?: User; token?: string; isNewUser?: boolean }> {
    try {
      console.log('🔍 AuthService: Verifying OTP for phone:', verification.phone);
      const response = await httpClient.verifyOtp(verification.phone, verification.otp);
      
      console.log('📡 AuthService: API Response:', {
        success: response.success,
        hasToken: !!response.token,
        hasRefreshToken: !!response.refreshToken,
        hasUser: !!response.user,
        isNewUser: response.isNewUser,
        userProfileCompleted: response.user?.profileCompleted
      });

      if (!response.success) {
        console.log('❌ AuthService: OTP verification failed:', response.message);
        return {
          success: false,
          message: response.message || 'Failed to verify OTP',
        };
      }

      // Store auth data
      if (response.token) {
        console.log('💾 AuthService: Storing auth token');
        await secureStorageService.setSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN, response.token);
      }
      if (response.refreshToken) {
        console.log('💾 AuthService: Storing refresh token');
        await secureStorageService.setSecureItem(SECURE_STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }
      if (response.user) {
        console.log('💾 AuthService: Storing user data:', {
          id: response.user.id,
          phone: response.user.phone,
          profileCompleted: response.user.profileCompleted
        });
        await secureStorageService.setSecureItem(SECURE_STORAGE_KEYS.USER_DATA, JSON.stringify(response.user));
      }

      // Determine if user is new based on API response or profile completion status
      const isNewUser = response.isNewUser || !response.user?.profileCompleted;
      console.log('🔍 AuthService: Determined user status - isNewUser:', isNewUser);

      // Clear temporary data
      await secureStorageService.multiRemove([REGULAR_STORAGE_KEYS.TEMP_PHONE, REGULAR_STORAGE_KEYS.TEMP_IS_NEW_USER]);

      console.log('✅ AuthService: OTP verification completed successfully');

      // Register FCM token with server now that user is authenticated
      try {
        console.log('📨 AuthService: Registering FCM token with server...');
        const registered = await fcmService.registerTokenWithServer();
        if (registered) {
          console.log('✅ AuthService: FCM token registered with server');
        } else {
          console.warn('⚠️ AuthService: FCM token registration with server failed');
        }
      } catch (err) {
        console.warn('⚠️ AuthService: FCM registration encountered an error:', err);
      }

      return {
        success: true,
        message: response.message || 'OTP verified successfully',
        user: response.user,
        token: response.token,
        isNewUser
      };
    } catch (error) {
      console.error('❌ AuthService: OTP verification error:', error);
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to verify OTP',
      };
    }
  }

  // Resend OTP
  async resendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await httpClient.resendOtp(phone);
      return {
        success: response.success || true,
        message: response.message || 'OTP resent successfully',
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to resend OTP',
      };
    }
  }

  // Logout user
  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      // Call logout endpoint if available
      try {
        await httpClient.logout();
      } catch (error) {
        // Even if logout endpoint fails, clear local data
        console.warn('Logout endpoint failed, clearing local data');
      }

      // Clear all auth-related data
      await secureStorageService.multiRemove([
        REGULAR_STORAGE_KEYS.STORE_DATA,
        REGULAR_STORAGE_KEYS.TEMP_PHONE,
        REGULAR_STORAGE_KEYS.TEMP_IS_NEW_USER,
      ]);
      await secureStorageService.clearSecure();

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to logout',
      };
    }
  }

  // Get temporary phone number (stored during login)
  async getTempPhone(): Promise<string | null> {
    try {
      return await secureStorageService.getItem(REGULAR_STORAGE_KEYS.TEMP_PHONE);
    } catch (error) {
      console.error('Error getting temp phone:', error);
      return null;
    }
  }

  // Get temporary isNewUser flag
  async getTempIsNewUser(): Promise<boolean> {
    try {
      const value = await secureStorageService.getItem(REGULAR_STORAGE_KEYS.TEMP_IS_NEW_USER);
      return value === 'true';
    } catch (error) {
      console.error('Error getting temp isNewUser:', error);
      return false;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN);
      const userData = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.USER_DATA);
      return !!(token && userData);
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Get auth token
  async getToken(): Promise<string | null> {
    try {
      return await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();

// Export for testing purposes
export { AuthService };