import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '../config';

// Location interfaces
export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
}

export interface StoreLocation extends LocationData {
  isSet: boolean;
}

export interface LocationResponse {
  success: boolean;
  message?: string;
  storeLocation?: StoreLocation;
  error?: string;
}

export interface SetLocationRequest {
  latitude: number;
  longitude: number;
  address: string;
}

class LocationService {
  /**
   * Set store location (for both registration and profile scenarios)
   */
  async setStoreLocation(locationData: SetLocationRequest): Promise<LocationResponse> {
    try {
      console.log('📍 Setting store location:', locationData);
      const response = await httpClient.post<LocationResponse>(
        API_ENDPOINTS.SET_LOCATION,
        locationData
      );

      if (!response) {
        return {
          success: false,
          error: 'Empty response from server'
        };
      }

      return response;
    } catch (error: any) {
      console.error('Set store location error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to set store location'
      };
    }
  }

  /**
   * Get current store location
   */
  async getStoreLocation(): Promise<LocationResponse> {
    try {
      console.log('🔍 Making API call to:', API_ENDPOINTS.GET_LOCATION);
      const response = await httpClient.get<LocationResponse>(
        API_ENDPOINTS.GET_LOCATION
      );

      console.log('📡 Raw API response:', response);

      // Ensure we always return a proper response object
      if (!response) {
        console.warn('⚠️ Empty response from API');
        return {
          success: false,
          error: 'Empty response from server'
        };
      }

      return response;
    } catch (error: any) {
      console.error('Get store location error:', error);

      // Handle different types of errors
      if (error.response) {
        // Server responded with error status
        console.error('Server error response:', error.response.data);
        return {
          success: false,
          error: error.response.data?.message || `Server error: ${error.response.status}`
        };
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        return {
          success: false,
          error: 'Network error - please check your connection'
        };
      } else {
        // Other error
        console.error('Unknown error:', error.message);
        return {
          success: false,
          error: error.message || 'Failed to get store location'
        };
      }
    }
  }

  /**
   * Update existing store location
   */
  async updateStoreLocation(locationData: SetLocationRequest): Promise<LocationResponse> {
    try {
      const response = await httpClient.put<LocationResponse>(
        API_ENDPOINTS.UPDATE_LOCATION,
        locationData
      );
      return response;
    } catch (error: any) {
      console.error('Update store location error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update store location'
      };
    }
  }
}

export const locationService = new LocationService();
