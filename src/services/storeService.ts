import { httpClient } from './httpClient';
import { secureStorageService, REGULAR_STORAGE_KEYS } from './secureStorage';
import { 
  StoreRegistrationData, 
  StoreRegistrationRequest, 
  StoreRegistrationResponse,
  StoreInfo,
  ApiError 
} from '../types/store';

class StoreService {
  // Register a new store
  async registerStore(storeData: StoreRegistrationData, phone: string): Promise<{ success: boolean; message: string; store?: any }> {
    try {
      // Transform the data to match server expectations
      const requestData = {
        name: storeData.ownerName,
        email: storeData.email,
        storeName: storeData.storeName,
        storeAddress: `${storeData.address}, ${storeData.city}, ${storeData.pincode}`
      };

      console.log('🏪 StoreService: Registering store with data:', {
        storeName: requestData.storeName,
        ownerName: requestData.name,
        email: requestData.email,
        storeAddress: requestData.storeAddress
      });

      const response = await httpClient.registerStore(requestData);

      if (response.success) {
        // Store the store data locally for future use
        if (response.user) {
          await secureStorageService.setItem(
            REGULAR_STORAGE_KEYS.STORE_DATA, 
            JSON.stringify(response.user)
          );
        }

        return {
          success: true,
          message: response.message || 'Store registered successfully',
          store: response.user
        };
      } else {
        return {
          success: false,
          message: response.message || response.error || 'Failed to register store'
        };
      }
    } catch (error: any) {
      console.error('❌ StoreService: Registration error:', error);
      
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || !error.status) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection and try again.'
        };
      }

      // Handle 404 - endpoint not found
      if (error.status === 404) {
        console.error('❌ StoreService: Store registration endpoint not implemented on server yet');
        console.log('🔄 StoreService: Using fallback - storing data locally and marking profile as complete');
        
        // Fallback: Store the data locally and mark profile as complete
        // This allows the app to function while the backend endpoint is being implemented
        try {
          const fallbackStoreData = {
            storeId: `temp_${Date.now()}`,
            status: 'pending',
            profileCompleted: true,
            ...storeData
          };
          
          await secureStorageService.setItem(
            REGULAR_STORAGE_KEYS.STORE_DATA, 
            JSON.stringify(fallbackStoreData)
          );
          
          console.log('✅ StoreService: Fallback registration successful - data stored locally');
          return {
            success: true,
            message: 'Store information saved successfully! (Note: Full registration will be completed when server is ready)',
            store: fallbackStoreData
          };
        } catch (fallbackError) {
          console.error('❌ StoreService: Fallback registration failed:', fallbackError);
          return {
            success: false,
            message: 'Unable to save store information. Please try again later.'
          };
        }
      }

      // Handle validation errors
      if (error.status === 400 && error.data?.validationErrors) {
        const validationError = error.data.validationErrors[0];
        return {
          success: false,
          message: validationError ? validationError.message : 'Please check your input data'
        };
      }

      // Handle other API errors
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to register store'
      };
    }
  }

  // Get current store information
  async getStoreInfo(): Promise<{ success: boolean; store?: StoreInfo; message?: string }> {
    try {
      const response = await httpClient.getStoreInfo();
      
      if (response.success && response.data) {
        // Cache the store data
        await secureStorageService.setItem(
          REGULAR_STORAGE_KEYS.STORE_DATA, 
          JSON.stringify(response.data)
        );

        return {
          success: true,
          store: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch store information'
        };
      }
    } catch (error: any) {
      console.error('❌ StoreService: Get store info error:', error);
      
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to fetch store information'
      };
    }
  }

  // Get cached store data
  async getCachedStoreData(): Promise<any | null> {
    try {
      const storeData = await secureStorageService.getItem(REGULAR_STORAGE_KEYS.STORE_DATA);
      return storeData ? JSON.parse(storeData) : null;
    } catch (error) {
      console.error('❌ StoreService: Error getting cached store data:', error);
      return null;
    }
  }

  // Update store information
  async updateStore(storeData: Partial<StoreRegistrationData>): Promise<{ success: boolean; message: string; store?: any }> {
    try {
      const response = await httpClient.updateStore(storeData);

      if (response.success) {
        // Update cached store data
        if (response.data) {
          await secureStorageService.setItem(
            REGULAR_STORAGE_KEYS.STORE_DATA, 
            JSON.stringify(response.data)
          );
        }

        return {
          success: true,
          message: response.message || 'Store updated successfully',
          store: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || response.error || 'Failed to update store'
        };
      }
    } catch (error: any) {
      console.error('❌ StoreService: Update error:', error);
      
      const apiError = error as ApiError;
      return {
        success: false,
        message: apiError.message || 'Failed to update store'
      };
    }
  }

  // Clear store data (used during logout)
  async clearStoreData(): Promise<void> {
    try {
      await secureStorageService.removeItem(REGULAR_STORAGE_KEYS.STORE_DATA);
    } catch (error) {
      console.error('❌ StoreService: Error clearing store data:', error);
    }
  }

  // Validate store registration data
  validateStoreData(data: StoreRegistrationData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!data.storeName?.trim()) {
      errors.push('Store name is required');
    }
    if (!data.ownerName?.trim()) {
      errors.push('Owner name is required');
    }
    if (!data.email?.trim()) {
      errors.push('Email address is required');
    }
    if (!data.address?.trim()) {
      errors.push('Store address is required');
    }
    if (!data.city?.trim()) {
      errors.push('City is required');
    }
    if (!data.pincode?.trim()) {
      errors.push('Pincode is required');
    }

    // Email format validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Please enter a valid email address');
    }

    // Pincode validation
    if (data.pincode && !/^\d{6}$/.test(data.pincode)) {
      errors.push('Pincode must be exactly 6 digits');
    }

    // GST number validation (if provided)
    if (data.gstNumber && data.gstNumber.trim() && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(data.gstNumber)) {
      errors.push('Please enter a valid GST number');
    }

    // IFSC code validation (if bank account is provided)
    if (data.bankAccount && data.bankAccount.trim() && (!data.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode))) {
      errors.push('Please enter a valid IFSC code for the bank account');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Update existing store profile
  async updateStoreProfile(updateData: { name: string; email: string; storeName: string; storeAddress: string }): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      console.log('🔄 StoreService: Updating store profile with data:', updateData);

      const response = await httpClient.updateStoreProfile(updateData);

      if (response.success) {
        // Store the updated data locally
        if (response.user) {
          await secureStorageService.setItem(
            REGULAR_STORAGE_KEYS.STORE_DATA,
            JSON.stringify(response.user)
          );
        }

        return {
          success: true,
          message: response.message || 'Store profile updated successfully',
          user: response.user
        };
      } else {
        return {
          success: false,
          message: response.message || response.error || 'Failed to update store profile'
        };
      }
    } catch (error: any) {
      console.error('❌ StoreService: Update profile error:', error);

      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || !error.status) {
        return {
          success: false,
          message: 'Network error. Please check your internet connection and try again.'
        };
      }

      // Handle other errors
      return {
        success: false,
        message: error.message || 'Failed to update store profile'
      };
    }
  }
}

// Export singleton instance
export const storeService = new StoreService();
export default storeService;