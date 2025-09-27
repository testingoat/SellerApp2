import Geolocation from 'react-native-geolocation-service';
import { NativeModules, Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geocoder from 'react-native-geocoding';
import { 
  LocationData, 
  LocationPermissionStatus, 
  LocationError, 
  LocationErrorType,
  Coordinates,
  GeocodeResult,
  ReverseGeocodeResult
} from '../types/location';

class LocationUtils {
  private isInitialized = false;

  /**
   * Initialize location services
   */
  async initialize(googleMapsApiKey?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize Geocoder if API key is provided
      if (googleMapsApiKey) {
        Geocoder.init(googleMapsApiKey);
      }
      this.isInitialized = true;
    } catch (error) {
      console.warn('Location utils initialization warning:', error);
    }
  }

  /**
   * Check if location permission is already granted
   */
  async checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (hasPermission) {
          return { granted: true, canAskAgain: true };
        } else {
          return { granted: false, canAskAgain: true };
        }
      } else {
        // iOS permission check
        return new Promise((resolve) => {
          Geolocation.requestAuthorization('whenInUse').then((result) => {
            resolve({
              granted: result === 'granted',
              canAskAgain: result !== 'disabled'
            });
          }).catch(() => {
            resolve({ granted: false, canAskAgain: true });
          });
        });
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return { granted: false, canAskAgain: true };
    }
  }

  /**
   * Request location permissions
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // First check if we already have permission
      const currentStatus = await this.checkLocationPermission();
      if (currentStatus.granted) {
        console.log('✅ LocationUtils: Permission already granted');
        return currentStatus;
      }

      console.log('📍 LocationUtils: Requesting location permission...');

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to set your store location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        console.log('📍 LocationUtils: Android permission result:', granted);

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return { granted: true, canAskAgain: true };
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          return {
            granted: false,
            canAskAgain: false,
            message: 'Location permission denied permanently. Please enable it in settings.'
          };
        } else {
          return {
            granted: false,
            canAskAgain: true,
            message: 'Location permission denied.'
          };
        }
      } else {
        // iOS permission handling
        return new Promise((resolve) => {
          Geolocation.requestAuthorization('whenInUse').then((result) => {
            console.log('📍 LocationUtils: iOS permission result:', result);
            if (result === 'granted') {
              resolve({ granted: true, canAskAgain: true });
            } else {
              resolve({
                granted: false,
                canAskAgain: result !== 'disabled',
                message: 'Location permission denied.'
              });
            }
          }).catch((error) => {
            console.error('iOS permission error:', error);
            resolve({
              granted: false,
              canAskAgain: true,
              message: 'Failed to request location permission.'
            });
          });
        });
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return {
        granted: false,
        canAskAgain: true,
        message: 'Failed to request location permission.'
      };
    }
  }

  /**
   * Check if native location module is available
   */
  private isNativeModuleAvailable(): boolean {
    try {
      // Check if the native module is properly loaded
      if (Platform.OS === 'android') {
        const RNFusedLocation = NativeModules.RNFusedLocation;
        if (!RNFusedLocation) {
          console.error('❌ LocationUtils: RNFusedLocation native module not found');
          return false;
        }
        console.log('✅ LocationUtils: RNFusedLocation native module is available');
      }

      // Check if Geolocation service is available
      if (!Geolocation || typeof Geolocation.getCurrentPosition !== 'function') {
        console.error('❌ LocationUtils: Geolocation service not available');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ LocationUtils: Error checking native module availability:', error);
      return false;
    }
  }

  /**
   * Get current location with comprehensive error handling
   */
  async getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      console.log('📍 LocationUtils: Starting getCurrentPosition...');

      // Add timeout wrapper to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('❌ LocationUtils: Operation timed out after 15 seconds');
        reject(this.createLocationError(LocationErrorType.TIMEOUT, 'Location request timed out'));
      }, 15000);

      const cleanup = () => {
        clearTimeout(timeoutId);
      };

      try {
        // Check if native module is available
        if (!this.isNativeModuleAvailable()) {
          cleanup();
          reject(this.createLocationError(LocationErrorType.LOCATION_UNAVAILABLE, 'Native location module not available'));
          return;
        }

        console.log('📍 LocationUtils: Calling Geolocation.getCurrentPosition...');

        Geolocation.getCurrentPosition(
          (position) => {
            cleanup();
            console.log('✅ LocationUtils: Got position:', position?.coords);

            try {
              // Validate the position data
              if (!position || !position.coords) {
                reject(new Error('Invalid position data received'));
                return;
              }

              const { latitude, longitude } = position.coords;

              // Validate coordinates
              if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
                  isNaN(latitude) || isNaN(longitude) ||
                  latitude < -90 || latitude > 90 ||
                  longitude < -180 || longitude > 180) {
                reject(new Error('Invalid coordinates received'));
                return;
              }

              console.log('✅ LocationUtils: Coordinates validated successfully');
              resolve({
                latitude,
                longitude,
              });
            } catch (validationError) {
              console.error('❌ LocationUtils: Position validation error:', validationError);
              reject(new Error('Failed to validate location data'));
            }
          },
          (error) => {
            cleanup();
            console.error('❌ LocationUtils: getCurrentPosition error:', error);
            reject(this.mapLocationError(error));
          },
          {
            enableHighAccuracy: false, // Use lower accuracy for better compatibility
            timeout: 12000, // Reasonable timeout
            maximumAge: 10000, // Allow cached location
            distanceFilter: 0,
            forceRequestLocation: true, // Force fresh location request
            showLocationDialog: true, // Show system location dialog if needed
          }
        );
      } catch (nativeError) {
        cleanup();
        console.error('❌ LocationUtils: Native getCurrentPosition error:', nativeError);
        reject(this.createLocationError(LocationErrorType.LOCATION_UNAVAILABLE, `Native location service error: ${nativeError?.message || 'Unknown error'}`));
      }
    });
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('Location utils not initialized');
      }

      const response = await Geocoder.from(coordinates);
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
      throw new Error('No address found');
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
    }
  }

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      if (!this.isInitialized) {
        throw new Error('Location utils not initialized');
      }

      const response = await Geocoder.from(address);
      if (response.results && response.results.length > 0) {
        const result = response.results[0];
        return {
          address,
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
          },
          formattedAddress: result.formatted_address,
        };
      }
      throw new Error('Address not found');
    } catch (error) {
      console.error('Geocoding error:', error);
      throw this.createLocationError(LocationErrorType.GEOCODING_FAILED, 'Failed to find address');
    }
  }

  /**
   * Show location permission settings
   */
  showLocationSettings(): void {
    Alert.alert(
      'Location Permission Required',
      'Please enable location permission in settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }

  /**
   * Map native location errors to our error types
   */
  private mapLocationError(error: any): LocationError {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return this.createLocationError(
          LocationErrorType.PERMISSION_DENIED,
          'Location permission denied'
        );
      case 2: // POSITION_UNAVAILABLE
        return this.createLocationError(
          LocationErrorType.LOCATION_UNAVAILABLE,
          'Location unavailable'
        );
      case 3: // TIMEOUT
        return this.createLocationError(
          LocationErrorType.TIMEOUT,
          'Location request timed out'
        );
      default:
        return this.createLocationError(
          LocationErrorType.UNKNOWN_ERROR,
          error.message || 'Unknown location error'
        );
    }
  }

  /**
   * Create location error object
   */
  private createLocationError(type: LocationErrorType, message: string): LocationError {
    return { type, message };
  }

  /**
   * Validate coordinates
   */
  isValidCoordinates(coordinates: Coordinates): boolean {
    return (
      coordinates &&
      typeof coordinates.latitude === 'number' &&
      typeof coordinates.longitude === 'number' &&
      coordinates.latitude >= -90 &&
      coordinates.latitude <= 90 &&
      coordinates.longitude >= -180 &&
      coordinates.longitude <= 180
    );
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationUtils = new LocationUtils();
