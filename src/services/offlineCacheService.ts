import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  PRODUCTS: '@offline_cache_products',
  ORDERS: '@offline_cache_orders',
  CATEGORIES: '@offline_cache_categories',
  STORE_INFO: '@offline_cache_store_info',
};

// Cache expiration time (in milliseconds)
const CACHE_EXPIRATION = {
  PRODUCTS: 30 * 60 * 1000, // 30 minutes
  ORDERS: 15 * 60 * 1000, // 15 minutes
  CATEGORIES: 60 * 60 * 1000, // 1 hour
  STORE_INFO: 60 * 60 * 1000, // 1 hour
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class OfflineCacheService {
  // Generic cache setter
  private async setCache<T>(key: string, data: T, expirationMs: number): Promise<void> {
    try {
      const timestamp = Date.now();
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp,
        expiresAt: timestamp + expirationMs,
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
      console.log(`✅ Cached data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to cache data for key ${key}:`, error);
    }
  }

  // Generic cache getter
  private async getCache<T>(key: string): Promise<T | null> {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      
      if (!cachedData) {
        console.log(`📭 No cached data for key: ${key}`);
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cachedData);
      const now = Date.now();

      // Check if cache has expired
      if (now > cacheEntry.expiresAt) {
        console.log(`⏰ Cache expired for key: ${key}`);
        await this.clearCache(key);
        return null;
      }

      console.log(`✅ Retrieved cached data for key: ${key}`);
      return cacheEntry.data;
    } catch (error) {
      console.error(`❌ Failed to retrieve cache for key ${key}:`, error);
      return null;
    }
  }

  // Clear specific cache
  private async clearCache(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Cleared cache for key: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to clear cache for key ${key}:`, error);
    }
  }

  // Products cache
  async cacheProducts(products: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.PRODUCTS, products, CACHE_EXPIRATION.PRODUCTS);
  }

  async getCachedProducts(): Promise<any[] | null> {
    return this.getCache<any[]>(CACHE_KEYS.PRODUCTS);
  }

  async clearProductsCache(): Promise<void> {
    await this.clearCache(CACHE_KEYS.PRODUCTS);
  }

  // Orders cache
  async cacheOrders(orders: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.ORDERS, orders, CACHE_EXPIRATION.ORDERS);
  }

  async getCachedOrders(): Promise<any[] | null> {
    return this.getCache<any[]>(CACHE_KEYS.ORDERS);
  }

  async clearOrdersCache(): Promise<void> {
    await this.clearCache(CACHE_KEYS.ORDERS);
  }

  // Categories cache
  async cacheCategories(categories: any[]): Promise<void> {
    await this.setCache(CACHE_KEYS.CATEGORIES, categories, CACHE_EXPIRATION.CATEGORIES);
  }

  async getCachedCategories(): Promise<any[] | null> {
    return this.getCache<any[]>(CACHE_KEYS.CATEGORIES);
  }

  async clearCategoriesCache(): Promise<void> {
    await this.clearCache(CACHE_KEYS.CATEGORIES);
  }

  // Store info cache
  async cacheStoreInfo(storeInfo: any): Promise<void> {
    await this.setCache(CACHE_KEYS.STORE_INFO, storeInfo, CACHE_EXPIRATION.STORE_INFO);
  }

  async getCachedStoreInfo(): Promise<any | null> {
    return this.getCache<any>(CACHE_KEYS.STORE_INFO);
  }

  async clearStoreInfoCache(): Promise<void> {
    await this.clearCache(CACHE_KEYS.STORE_INFO);
  }

  // Clear all caches
  async clearAllCaches(): Promise<void> {
    console.log('🗑️ Clearing all offline caches...');
    await Promise.all([
      this.clearProductsCache(),
      this.clearOrdersCache(),
      this.clearCategoriesCache(),
      this.clearStoreInfoCache(),
    ]);
    console.log('✅ All caches cleared');
  }

  // Check if cache exists and is valid
  async isCacheValid(key: string): Promise<boolean> {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      
      if (!cachedData) {
        return false;
      }

      const cacheEntry: CacheEntry<any> = JSON.parse(cachedData);
      const now = Date.now();

      return now <= cacheEntry.expiresAt;
    } catch (error) {
      return false;
    }
  }

  // Get cache age in minutes
  async getCacheAge(key: string): Promise<number | null> {
    try {
      const cachedData = await AsyncStorage.getItem(key);
      
      if (!cachedData) {
        return null;
      }

      const cacheEntry: CacheEntry<any> = JSON.parse(cachedData);
      const now = Date.now();
      const ageMs = now - cacheEntry.timestamp;
      
      return Math.floor(ageMs / 60000); // Convert to minutes
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
export const offlineCacheService = new OfflineCacheService();

// Export for testing
export { OfflineCacheService };

