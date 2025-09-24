# SellerApp2 Login & OTP Integration - Phase 1

## 🎯 Objective

**Phase 1 Goal**: Implement complete login and OTP verification system with session persistence, seller registration, and database integration.

**Scope**: Only authentication flow - no other features will be modified.

---

## 📋 Current State Analysis

### **LoginScreen Analysis**
**File**: `src/screens/LoginScreen.tsx`

**Current Implementation**:
```typescript
// Mock implementation with fake OTP
const handleSendOTP = async () => {
  if (!phoneNumber.trim()) {
    Alert.alert('Error', 'Please enter your phone number');
    return;
  }

  if (phoneNumber.length < 10) {
    Alert.alert('Error', 'Please enter a valid phone number');
    return;
  }

  setIsLoading(true);

  // ❌ PROBLEM: Fake API call
  setTimeout(() => {
    setIsLoading(false);
    Alert.alert(
      'OTP Sent',
      `A 4-digit code has been sent to ${phoneNumber}`,
      [
        {
          text: 'OK',
          onPress: onLogin, // ❌ PROBLEM: Direct navigation without verification
        },
      ]
    );
  }, 1500);
};
```

### **Current Issues**
1. ❌ **No Real API Integration**: Mock OTP sending
2. ❌ **No OTP Verification**: Missing OTP verification screen
3. ❌ **No Session Management**: No token handling
4. ❌ **No Database Integration**: No seller data persistence
5. ❌ **No Persistence**: User logged out on app restart

---

## 🏗️ Integration Architecture

### **Authentication Flow**
```
LoginScreen → OTPVerificationScreen → StoreRegistrationScreen → MainDashboard
     ↓                ↓                      ↓                      ↓
  Send OTP         Verify OTP          Create Seller           Load Session
     ↓                ↓                      ↓                      ↓
  API Call         API Call              API Call              Validate Token
```

### **Technology Stack**
- **HTTP Client**: Axios for API calls
- **State Management**: Zustand for global state
- **Persistence**: AsyncStorage for token storage
- **Navigation**: React Navigation with auth flow
- **Security**: JWT tokens with refresh mechanism

---

## 🔧 Implementation Steps

### **Step 1: Dependencies Installation**

#### **1.1 Required Dependencies**
```bash
# Navigate to SellerApp2 directory
cd "C:\Seller App 2\SellerApp2"

# Install required packages
npm install @react-native-async-storage/async-storage
npm install axios
npm install zustand
npm install react-native-config
npm install jwt-decode
npm install @react-native-firebase/app
npm install @react-native-firebase/messaging
```

#### **1.2 Update package.json Scripts**
```json
{
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest",
    "link:fonts": "npx react-native-asset",
    "postinstall": "npx patch-package",
    "pod-install": "cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install"
  }
}
```

### **Step 2: Environment Configuration**

#### **2.1 Create .env Files**
**File**: `.env`
```env
# API Configuration
API_BASE_URL=https://goatgoat.tech/api
ENVIRONMENT=production

# Firebase Configuration (optional for now)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_PROJECT_ID=your_project_id
```

**File**: `.env.staging`
```env
# API Configuration
API_BASE_URL=https://staging.goatgoat.tech/api
ENVIRONMENT=staging
```

**File**: `.env.development`
```env
# API Configuration
API_BASE_URL=http://192.168.1.10:3000/api
ENVIRONMENT=development
```

#### **2.2 Update react-native.config.js**
```javascript
module.exports = {
  dependencies: {
    'react-native-config': {
      platforms: {
        android: {
          packageImportPath: 'import com.reactnativeconfig.BuildConfig',
          packageInstance: 'new BuildConfig()',
        },
      },
    },
  },
};
```

#### **2.3 Create API Configuration**
**File**: `src/config/api.ts`
```typescript
import Config from 'react-native-config';
import { Platform } from 'react-native';

const DEVELOPMENT_IP = '192.168.1.10'; // Your local IP

const getBaseURL = () => {
  const environment = Config.ENVIRONMENT || 'development';

  switch (environment) {
    case 'production':
      return Config.API_BASE_URL || 'https://goatgoat.tech/api';
    case 'staging':
      return Config.API_BASE_URL || 'https://staging.goatgoat.tech/api';
    case 'development':
    default:
      if (Platform.OS === 'android') {
        return `http://10.0.2.2:3000/api`; // Android emulator
      } else {
        return `http://${DEVELOPMENT_IP}:3000/api`; // iOS simulator
      }
  }
};

export const API_CONFIG = {
  BASE_URL: getBaseURL(),
  TIMEOUT: 10000,
  ENVIRONMENT: Config.ENVIRONMENT || 'development',
};

export const ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/auth/seller/otp',
    VERIFY_OTP: '/auth/seller/verify',
    REFRESH_TOKEN: '/auth/seller/refresh',
    LOGOUT: '/auth/seller/logout',
  },
  SELLER: {
    PROFILE: '/seller/profile',
    REGISTER: '/seller/register',
    VALIDATE_SESSION: '/seller/session/validate',
  },
};
```

### **Step 3: HTTP Client Setup**

#### **3.1 Create API Service**
**File**: `src/services/api.ts`
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, ENDPOINTS } from '../config/api';

// Storage keys
const ACCESS_TOKEN_KEY = 'seller_access_token';
const REFRESH_TOKEN_KEY = 'seller_refresh_token';
const SELLER_DATA_KEY = 'seller_data';

class ApiService {
  private instance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.instance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.instance(originalRequest);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.instance(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.instance.post(ENDPOINTS.AUTH.REFRESH_TOKEN, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

    return accessToken;
  }

  private processQueue(error: any, token: string | null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  private async logout() {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      SELLER_DATA_KEY,
    ]);
  }

  // Public methods
  getInstance(): AxiosInstance {
    return this.instance;
  }

  async setAuthTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  async clearAuthTokens() {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      SELLER_DATA_KEY,
    ]);
  }

  async getAccessToken(): Promise<string | null> {
    return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAccessToken();
    return !!token;
  }
}

export const apiService = new ApiService();
export default apiService.getInstance();
```

### **Step 4: Authentication Service**

#### **4.1 Create Auth Service**
**File**: `src/services/authService.ts`
```typescript
import api, { ENDPOINTS } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import jwtDecode from 'jwt-decode';

// Storage keys
const SELLER_DATA_KEY = 'seller_data';
const ONBOARDING_COMPLETE_KEY = 'seller_onboarding_complete';

interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeName: string;
  storeAddress: string;
  isActive: boolean;
  isVerified: boolean;
  onboardingComplete: boolean;
}

interface JWTDecoded {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

interface SendOTPResponse {
  success: boolean;
  message: string;
  verificationId?: string;
  existingUser?: boolean;
}

interface VerifyOTPResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  seller?: Seller;
  onboardingComplete: boolean;
}

class AuthService {
  async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    try {
      const response = await api.post(ENDPOINTS.AUTH.SEND_OTP, {
        phoneNumber,
        role: 'seller',
      });

      return {
        success: true,
        message: response.data.message,
        verificationId: response.data.verificationId,
        existingUser: response.data.existingUser,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP',
      };
    }
  }

  async verifyOTP(
    phoneNumber: string,
    otp: string,
    verificationId?: string
  ): Promise<VerifyOTPResponse> {
    try {
      const response = await api.post(ENDPOINTS.AUTH.VERIFY_OTP, {
        phoneNumber,
        otp,
        verificationId,
        role: 'seller',
      });

      const { accessToken, refreshToken, seller, onboardingComplete } = response.data;

      // Store tokens
      await AsyncStorage.setItem('seller_access_token', accessToken);
      await AsyncStorage.setItem('seller_refresh_token', refreshToken);

      // Store seller data
      if (seller) {
        await AsyncStorage.setItem(SELLER_DATA_KEY, JSON.stringify(seller));
        await AsyncStorage.setItem(
          ONBOARDING_COMPLETE_KEY,
          onboardingComplete.toString()
        );
      }

      return {
        success: true,
        message: 'OTP verified successfully',
        accessToken,
        refreshToken,
        seller,
        onboardingComplete,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify OTP',
      };
    }
  }

  async validateSession(): Promise<{ isValid: boolean; seller?: Seller }> {
    try {
      const token = await AsyncStorage.getItem('seller_access_token');
      if (!token) {
        return { isValid: false };
      }

      // Check if token is expired
      const decoded = jwtDecode<JWTDecoded>(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        return { isValid: false };
      }

      // Validate session with backend
      const response = await api.get(ENDPOINTS.SELLER.VALIDATE_SESSION);

      return {
        isValid: true,
        seller: response.data.seller,
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  async getCurrentSeller(): Promise<Seller | null> {
    try {
      const sellerData = await AsyncStorage.getItem(SELLER_DATA_KEY);
      return sellerData ? JSON.parse(sellerData) : null;
    } catch (error) {
      return null;
    }
  }

  async isOnboardingComplete(): Promise<boolean> {
    try {
      const complete = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      return complete === 'true';
    } catch (error) {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('seller_access_token');
      if (token) {
        await api.post(ENDPOINTS.AUTH.LOGOUT);
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      await AsyncStorage.multiRemove([
        'seller_access_token',
        'seller_refresh_token',
        SELLER_DATA_KEY,
        ONBOARDING_COMPLETE_KEY,
      ]);
    }
  }

  async updateSellerData(seller: Seller): Promise<void> {
    await AsyncStorage.setItem(SELLER_DATA_KEY, JSON.stringify(seller));
  }
}

export const authService = new AuthService();
export default authService;
```

### **Step 5: State Management**

#### **5.1 Create Zustand Store**
**File**: `src/state/authStore.ts`
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/authService';
import { Seller } from '../services/authService';

interface AuthState {
  seller: Seller | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  error: string | null;

  // Actions
  login: (seller: Seller, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateSeller: (seller: Seller) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setOnboardingComplete: (complete: boolean) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      seller: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboardingComplete: false,
      error: null,

      login: async (seller: Seller, accessToken: string, refreshToken: string) => {
        set({
          seller,
          isAuthenticated: true,
          error: null,
          isOnboardingComplete: seller.onboardingComplete,
        });
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            seller: null,
            isAuthenticated: false,
            isOnboardingComplete: false,
            error: null,
          });
        }
      },

      updateSeller: (seller: Seller) => {
        set({ seller });
        authService.updateSellerData(seller);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      setOnboardingComplete: (complete: boolean) => {
        set({ isOnboardingComplete: complete });
      },

      initializeAuth: async () => {
        set({ isLoading: true });

        try {
          const { isValid, seller } = await authService.validateSession();

          if (isValid && seller) {
            set({
              seller,
              isAuthenticated: true,
              isOnboardingComplete: seller.onboardingComplete,
              error: null,
            });
          } else {
            // Clear invalid session
            await get().logout();
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          await get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Don't persist sensitive data, only use for initialization
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        isOnboardingComplete: state.isOnboardingComplete,
      }),
    }
  )
);
```

### **Step 6: Navigation Updates**

#### **6.1 Create Auth Navigator**
**File**: `src/navigation/AuthNavigator.tsx`
```typescript
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../state/authStore';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import StoreRegistrationScreen from '../screens/StoreRegistrationScreen';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const AuthNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isOnboardingComplete,
    isLoading,
    initializeAuth
  } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  if (isLoading) {
    return <SplashScreen onFinish={() => {}} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
          </>
        ) : (
          <>
            {isOnboardingComplete ? (
              <Stack.Screen name="MainApp" component={AppNavigator} />
            ) : (
              <Stack.Screen name="StoreRegistration" component={StoreRegistrationScreen} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AuthNavigator;
```

#### **6.2 Update App.tsx**
**File**: `App.tsx`
```typescript
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AuthNavigator from './src/navigation/AuthNavigator';
import { ThemeProvider } from './src/context/ThemeContext';

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="#f6f8f6"
            translucent={false}
          />
          <AuthNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

export default App;
```

### **Step 7: Screen Updates**

#### **7.1 Update LoginScreen**
**File**: `src/screens/LoginScreen.tsx`
```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../state/authStore';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onLogin?: () => void;
  onBack?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack }) => {
  const navigation = useNavigation();
  const { setLoading, setError, error } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    // Validation
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.sendOTP(phoneNumber);

      if (result.success) {
        // Navigate to OTP verification
        navigation.navigate('OTPVerification', {
          phoneNumber,
          verificationId: result.verificationId,
          existingUser: result.existingUser,
        });
      } else {
        Alert.alert('Error', result.message);
        setError(result.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send OTP';
      Alert.alert('Error', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Icon name="store" size={80} color="#3be340" />
          <Text style={styles.title}>Seller Portal</Text>
          <Text style={styles.subtitle}>
            Manage your store efficiently
          </Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Icon name="phone" size={20} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              maxLength={10}
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSendOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3be340',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default LoginScreen;
```

#### **7.2 Create OTPVerificationScreen**
**File**: `src/screens/OTPVerificationScreen.tsx**
```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuthStore } from '../state/authStore';
import { authService } from '../services/authService';

interface RouteParams {
  phoneNumber: string;
  verificationId?: string;
  existingUser?: boolean;
}

interface OTPVerificationScreenProps {
  onVerify?: () => void;
  onBack?: () => void;
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ onVerify, onBack }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const { setLoading, setError, error, login } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit OTP');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.verifyOTP(
        params.phoneNumber,
        otp,
        params.verificationId
      );

      if (result.success && result.seller) {
        // Update auth store
        await login(result.seller, result.accessToken, result.refreshToken);

        Alert.alert('Success', 'Login successful!');

        if (result.onboardingComplete) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainApp' as any }],
          });
        } else {
          navigation.navigate('StoreRegistration');
        }
      } else {
        Alert.alert('Error', result.message);
        setError(result.message);
        setAttempts(prev => prev + 1);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to verify OTP';
      Alert.alert('Error', errorMessage);
      setError(errorMessage);
      setAttempts(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      const result = await authService.sendOTP(params.phoneNumber);

      if (result.success) {
        setResendTimer(30); // 30 seconds cooldown
        Alert.alert('Success', 'OTP resent successfully');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Icon name="verified-user" size={80} color="#3be340" />
          </View>

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code sent to {params.phoneNumber}
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.form}>
          <View style={styles.otpContainer}>
            {[0, 1, 2, 3].map((index) => (
              <TextInput
                key={index}
                style={[
                  styles.otpInput,
                  otp.length === index && styles.otpInputFocused,
                ]}
                value={otp[index] || ''}
                onChangeText={(text) => {
                  if (text.length <= 1) {
                    const newOtp = otp.split('');
                    newOtp[index] = text;
                    setOtp(newOtp.join(''));

                    // Auto-focus next input
                    if (text && index < 3) {
                      const nextInput = document.getElementById(`otp-${index + 1}`);
                      if (nextInput) nextInput.focus();
                    }
                  }
                }}
                onKeyPress={(e) => {
                  if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                    const prevInput = document.getElementById(`otp-${index - 1}`);
                    if (prevInput) prevInput.focus();
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                placeholderTextColor="#9ca3af"
              />
            ))}
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {attempts > 2 && (
            <Text style={styles.warningText}>
              Multiple failed attempts. Please check your OTP and try again.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Verify OTP</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
              onPress={handleResendOTP}
              disabled={resendTimer > 0}
            >
              <Text style={[
                styles.resendButtonText,
                resendTimer > 0 && styles.resendButtonTextDisabled
              ]}>
                {resendTimer > 0 ? `Resend in ${formatTimer(resendTimer)}` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  otpInputFocused: {
    borderColor: '#3be340',
    backgroundColor: '#ffffff',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3be340',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 4,
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonText: {
    fontSize: 14,
    color: '#3be340',
    fontWeight: '500',
  },
  resendButtonTextDisabled: {
    color: '#9ca3af',
  },
});

export default OTPVerificationScreen;
```

### **Step 8: Backend API Implementation**

#### **8.1 Server-side API Routes**
**File**: `server/api/routes/auth/seller.js`
```javascript
import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Seller } from '../../models/Seller';
import { sendOTP } from '../../services/otpService';
import { generateTokens } from '../../utils/jwtUtils';

const router = express.Router();

// Send OTP
router.post('/otp', [
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('role').optional().isIn(['seller']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phoneNumber, role = 'seller' } = req.body;

    // Check if seller exists
    let seller = await Seller.findOne({ phone: phoneNumber, role });
    const existingUser = !!seller;

    // Generate and send OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const verificationId = await sendOTP(phoneNumber, otp);

    // Store OTP hash for verification
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await Seller.findOneAndUpdate(
      { phone: phoneNumber },
      {
        $set: {
          otp: await bcrypt.hash(otp, 10),
          otpExpiry,
          lastOTPRequest: new Date(),
        },
        $setOnInsert: {
          phone: phoneNumber,
          role,
          isActive: false,
          isVerified: false,
          onboardingComplete: false,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'OTP sent successfully',
      verificationId,
      existingUser,
    });
  } catch (error) {
    console.error('OTP send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
    });
  }
});

// Verify OTP
router.post('/verify', [
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('otp').isLength({ min: 4, max: 4 }).withMessage('4-digit OTP required'),
  body('role').optional().isIn(['seller']).withMessage('Invalid role'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { phoneNumber, otp, role = 'seller' } = req.body;

    // Find seller
    const seller = await Seller.findOne({ phone: phoneNumber, role });
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // Check OTP expiry
    if (seller.otpExpiry && new Date() > seller.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired',
      });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, seller.otp);
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Clear OTP
    seller.otp = undefined;
    seller.otpExpiry = undefined;
    seller.isVerified = true;
    seller.lastLoginAt = new Date();
    await seller.save();

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: seller._id,
      phone: seller.phone,
      role: seller.role,
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      accessToken,
      refreshToken,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        storeName: seller.storeName,
        storeAddress: seller.storeAddress,
        isActive: seller.isActive,
        isVerified: seller.isVerified,
        onboardingComplete: seller.onboardingComplete,
      },
      onboardingComplete: seller.onboardingComplete,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find seller
    const seller = await Seller.findById(decoded.userId);
    if (!seller || !seller.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: seller._id,
      phone: seller.phone,
      role: seller.role,
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;

    // Update seller's last logout time
    await Seller.findByIdAndUpdate(userId, {
      lastLogoutAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout',
    });
  }
});

export default router;
```

#### **8.2 Seller Model**
**File**: `server/models/Seller.js`
```javascript
import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['seller'],
    default: 'seller',
  },
  storeName: {
    type: String,
    trim: true,
  },
  storeAddress: {
    type: String,
    trim: true,
  },
  businessHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean },
  },
  deliveryAreas: [{
    type: String,
    trim: true,
  }],
  bankAccounts: [{
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
  }],
  fcmTokens: [String],
  isActive: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  onboardingComplete: {
    type: Boolean,
    default: false,
  },
  otp: String,
  otpExpiry: Date,
  lastOTPRequest: Date,
  lastLoginAt: Date,
  lastLogoutAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
sellerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
sellerSchema.index({ phone: 1 });
sellerSchema.index({ email: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ createdAt: -1 });

const Seller = mongoose.model('Seller', sellerSchema);

export default Seller;
```

---

## 🧪 Testing Strategy

### **Unit Tests**
- Test authentication service methods
- Test API service interceptors
- Test state management actions
- Test validation functions

### **Integration Tests**
- Test complete login flow
- Test OTP verification
- Test token refresh
- Test session persistence

### **End-to-End Tests**
- Test login from app start to dashboard
- Test app restart with active session
- Test logout functionality
- Test error scenarios

---

## 🔍 Security Considerations

### **Authentication Security**
- JWT tokens with expiration
- OTP with 5-minute expiry
- Rate limiting for OTP requests
- Secure token storage

### **API Security**
- Input validation and sanitization
- HTTPS/TLS encryption
- CORS configuration
- Request/response sanitization

### **Data Security**
- Password hashing with bcrypt
- Secure token storage
- Session timeout handling
- Error message sanitization

---

## 📱 App Differentiation Guide

### **Main App vs SellerApp2**
```
Main App (Customer/Delivery)
├── Location: C:\client\
├── Package: grocery_app
├── Android: C:\client\android\
├── iOS: C:\client\ios\
└── Server Integration: ✅ Complete

SellerApp2 (Seller Portal)
├── Location: C:\Seller App 2\SellerApp2\
├── Package: SellerApp2
├── Android: C:\Seller App 2\SellerApp2\android\
├── iOS: C:\Seller App 2\SellerApp2\ios\
└── Server Integration: 🔄 Phase 1 (Login/OTP)
```

### **Working Guidelines**
1. **Always check current working directory**
2. **Use full paths when switching between apps**
3. **Verify package.json before making changes**
4. **Test in correct environment**
5. **Use appropriate server endpoints**

---

## 🎯 Success Metrics

### **Phase 1 Success Criteria**
- ✅ OTP sending success rate > 95%
- ✅ OTP verification success rate > 98%
- ✅ Session persistence across app restarts
- ✅ Token refresh mechanism working
- ✅ Error handling for all scenarios
- ✅ Security measures implemented

### **Testing Checklist**
- [ ] Login flow works correctly
- [ ] OTP verification successful
- [ ] Session persists after app restart
- [ ] Token refresh works automatically
- [ ] Logout clears all data
- [ ] Error scenarios handled gracefully
- [ ] Security measures in place
- [ ] Performance within acceptable limits

---

## 🚀 Next Steps

### **Immediate Actions**
1. ✅ Install required dependencies
2. ✅ Create environment configuration
3. ✅ Implement API service layer
4. ✅ Create authentication service
5. ✅ Set up state management
6. ✅ Update navigation structure
7. ✅ Update login and OTP screens
8. ✅ Implement backend API endpoints

### **Phase 1 Completion**
- [ ] Test complete login flow
- [ ] Verify session persistence
- [ ] Test error scenarios
- [ ] Security testing
- [ ] Performance testing
- [ ] Documentation update

---

*Phase 1 Integration Plan - Login & OTP Authentication*
*Created: September 17, 2025*