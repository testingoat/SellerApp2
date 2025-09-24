import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create encrypted MMKV instance for sensitive data
const secureStorage = new MMKV({
  id: 'seller-app-secure',
  encryptionKey: 'seller-app-encryption-key-v1',
});

// Create regular MMKV instance for non-sensitive data
const regularStorage = new MMKV({
  id: 'seller-app-regular',
});

export interface SecureStorageService {
  // Secure methods for sensitive data (tokens, user data)
  setSecureItem: (key: string, value: string) => Promise<void>;
  getSecureItem: (key: string) => Promise<string | null>;
  removeSecureItem: (key: string) => Promise<void>;
  
  // Regular methods for non-sensitive data
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
  
  // Batch operations
  multiGet: (keys: string[]) => Promise<[string, string | null][]>;
  multiRemove: (keys: string[]) => Promise<void>;
  multiSet: (keyValuePairs: [string, string][]) => Promise<void>;
  
  // Clear all data
  clearAll: () => Promise<void>;
  clearSecure: () => Promise<void>;
}

class SecureStorageServiceImpl implements SecureStorageService {
  // Secure storage methods (for tokens, user data, etc.)
  async setSecureItem(key: string, value: string): Promise<void> {
    try {
      secureStorage.set(key, value);
    } catch (error) {
      console.error(`Failed to set secure item ${key}:`, error);
      throw error;
    }
  }

  async getSecureItem(key: string): Promise<string | null> {
    try {
      const value = secureStorage.getString(key);
      return value || null;
    } catch (error) {
      console.error(`Failed to get secure item ${key}:`, error);
      return null;
    }
  }

  async removeSecureItem(key: string): Promise<void> {
    try {
      secureStorage.delete(key);
    } catch (error) {
      console.error(`Failed to remove secure item ${key}:`, error);
      throw error;
    }
  }

  // Regular storage methods (for preferences, cache, etc.)
  async setItem(key: string, value: string): Promise<void> {
    try {
      regularStorage.set(key, value);
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const value = regularStorage.getString(key);
      return value || null;
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(key);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      regularStorage.delete(key);
      // Also remove from AsyncStorage in case of migration
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      throw error;
    }
  }

  // Batch operations
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    try {
      return keys.map(key => {
        const value = regularStorage.getString(key);
        return [key, value || null];
      });
    } catch (error) {
      console.error('Failed to multiGet:', error);
      // Fallback to AsyncStorage
      return await AsyncStorage.multiGet(keys);
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      keys.forEach(key => {
        regularStorage.delete(key);
      });
      // Also remove from AsyncStorage in case of migration
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Failed to multiRemove:', error);
      throw error;
    }
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    try {
      keyValuePairs.forEach(([key, value]) => {
        regularStorage.set(key, value);
      });
    } catch (error) {
      console.error('Failed to multiSet:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.multiSet(keyValuePairs);
    }
  }

  // Clear operations
  async clearAll(): Promise<void> {
    try {
      regularStorage.clearAll();
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Failed to clear all storage:', error);
      throw error;
    }
  }

  async clearSecure(): Promise<void> {
    try {
      secureStorage.clearAll();
    } catch (error) {
      console.error('Failed to clear secure storage:', error);
      throw error;
    }
  }

  // Migration helper - move data from AsyncStorage to MMKV
  async migrateFromAsyncStorage(keys: string[]): Promise<void> {
    try {
      console.log('🔄 Migrating storage from AsyncStorage to MMKV...');
      const data = await AsyncStorage.multiGet(keys);
      
      for (const [key, value] of data) {
        if (value !== null) {
          regularStorage.set(key, value);
          console.log(`✅ Migrated ${key}`);
        }
      }
      
      // Clean up AsyncStorage after migration
      await AsyncStorage.multiRemove(keys);
      console.log('✅ Storage migration completed');
    } catch (error) {
      console.error('❌ Storage migration failed:', error);
      // Don't throw error, let the app continue with fallback
    }
  }
}

// Export singleton instance
export const secureStorageService = new SecureStorageServiceImpl();

// Export storage keys constants
export const SECURE_STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  FCM_TOKEN: 'fcm_token',
} as const;

export const REGULAR_STORAGE_KEYS = {
  TEMP_PHONE: 'temp_phone',
  TEMP_IS_NEW_USER: 'temp_is_new_user',
  STORE_DATA: 'store_data',
  APP_PREFERENCES: 'app_preferences',
  LANGUAGE: 'language',
  THEME: 'theme',
} as const;