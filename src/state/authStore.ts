import { create } from 'zustand';
import { authService, User, LoginCredentials, OTPVerification } from '../services/authService';

// Auth store interface
interface AuthStore {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  // Loading for in-app actions (login, verify, resend, etc.)
  isLoading: boolean;
  // Loading only for app boot/initialization
  isBootLoading: boolean;
  isNewUser: boolean;
  tempPhone: string | null;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  verifyOtp: (verification: OTPVerification) => Promise<void>;
  resendOtp: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setBootLoading: (loading: boolean) => void;
  setTempPhone: (phone: string) => void;
  clearTempData: () => void;
  updateUserProfile: (profileCompleted: boolean) => Promise<void>;
}

// Create the auth store without persistence for now
export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isBootLoading: false,
  isNewUser: false,
  tempPhone: null,
  error: null,

  // Actions
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.login(credentials);

      if (result.success) {
        set({
          isLoading: false,
          isNewUser: result.isNewUser || false,
          tempPhone: credentials.phone,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: result.message,
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      return false;
    }
  },

  verifyOtp: async (verification: OTPVerification) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.verifyOtp(verification);

      if (result.success && result.user && result.token) {
        console.log('🔍 AuthStore: OTP verification result:', {
          success: result.success,
          hasUser: !!result.user,
          hasToken: !!result.token,
          isNewUser: result.isNewUser,
          userProfileCompleted: result.user.profileCompleted
        });
        
        set({
          user: result.user,
          token: result.token,
          isAuthenticated: true,
          isLoading: false,
          isNewUser: result.isNewUser || false, // Use the API response value
          tempPhone: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.message,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'OTP verification failed',
      });
    }
  },

  resendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.resendOtp(phone);

      if (result.success) {
        set({
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.message,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to resend OTP',
      });
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.logout();

      if (result.success) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isNewUser: false,
          tempPhone: null,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: result.message,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      });
    }
  },

  initializeAuth: async () => {
    console.log('🔍 AuthStore: Starting initializeAuth');
    set({ isBootLoading: true, error: null });

    try {
      console.log('🔍 AuthStore: Calling authService.initializeAuth');
      const authState = await authService.initializeAuth();
      console.log('🔍 AuthStore: Auth state received:', authState);
      
      console.log('🔍 AuthStore: Getting temp data');
      const tempPhone = await authService.getTempPhone();
      const isNewUser = await authService.getTempIsNewUser();
      console.log('🔍 AuthStore: Temp data - phone:', tempPhone, 'isNewUser:', isNewUser);

      console.log('🔍 AuthStore: Setting final state');
      set({
        user: authState.user,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        isBootLoading: false,
        isNewUser: isNewUser || false,
        tempPhone: tempPhone,
      });
      console.log('✅ AuthStore: Initialize complete - isAuthenticated:', authState.isAuthenticated);
    } catch (error) {
      console.error('❌ AuthStore: Initialize error:', error);
      set({
        isBootLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize auth',
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setBootLoading: (loading: boolean) => {
    set({ isBootLoading: loading });
  },

  setTempPhone: (phone: string) => {
    set({ tempPhone: phone });
  },

  clearTempData: () => {
    set({ tempPhone: null, isNewUser: false });
  },

  updateUserProfile: async (profileCompleted: boolean) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        profileCompleted
      };
      
      console.log('💾 AuthStore: Updating user profile completion status:', profileCompleted);
      
      // Update the state
      set({ user: updatedUser, isNewUser: !profileCompleted });
      
      // Also update the secure storage
      try {
        const { secureStorageService, SECURE_STORAGE_KEYS } = await import('../services/secureStorage');
        await secureStorageService.setSecureItem(
          SECURE_STORAGE_KEYS.USER_DATA, 
          JSON.stringify(updatedUser)
        );
        console.log('✅ AuthStore: User data updated in secure storage');
      } catch (error) {
        console.error('❌ AuthStore: Failed to update user data in secure storage:', error);
      }
    }
  },
}));

// Export auth actions for direct use
export const authActions = {
  login: useAuthStore.getState().login,
  verifyOtp: useAuthStore.getState().verifyOtp,
  resendOtp: useAuthStore.getState().resendOtp,
  logout: useAuthStore.getState().logout,
  initializeAuth: useAuthStore.getState().initializeAuth,
  clearError: useAuthStore.getState().clearError,
  setLoading: useAuthStore.getState().setLoading,
  setBootLoading: useAuthStore.getState().setBootLoading,
  setTempPhone: useAuthStore.getState().setTempPhone,
  clearTempData: useAuthStore.getState().clearTempData,
};

// Export selectors for common use cases
export const authSelectors = {
  isAuthenticated: () => useAuthStore.getState().isAuthenticated,
  getUser: () => useAuthStore.getState().user,
  getToken: () => useAuthStore.getState().token,
  isLoading: () => useAuthStore.getState().isLoading,
  isBootLoading: () => useAuthStore.getState().isBootLoading,
  getError: () => useAuthStore.getState().error,
  getTempPhone: () => useAuthStore.getState().tempPhone,
  isNewUser: () => useAuthStore.getState().isNewUser,
};