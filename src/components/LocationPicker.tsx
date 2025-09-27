import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LocationData, LocationPickerProps, MapRegion } from '../types/location';
import { locationUtils } from '../utils/locationUtils';
import { CONFIG } from '../config';

const { width, height } = Dimensions.get('window');

// Helper function to validate location data
const isValidLocation = (location: LocationData | null): location is LocationData => {
  return location !== null &&
         typeof location.latitude === 'number' &&
         typeof location.longitude === 'number' &&
         !isNaN(location.latitude) &&
         !isNaN(location.longitude) &&
         location.latitude >= -90 && location.latitude <= 90 &&
         location.longitude >= -180 && location.longitude <= 180;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelected,
  onCancel,
  title = 'Select Store Location',
  showCurrentLocationButton = true,
}) => {
  console.log('🗺️ LocationPicker: Component initializing with props:', {
    hasInitialLocation: !!initialLocation,
    initialLocationValid: isValidLocation(initialLocation),
    title,
    showCurrentLocationButton
  });
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    isValidLocation(initialLocation) ? initialLocation : null
  );
  const [address, setAddress] = useState(
    isValidLocation(initialLocation) ? initialLocation.address : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);

  // Safe mapRegion initialization with fallback coordinates
  const getInitialMapRegion = (): MapRegion => {
    if (isValidLocation(initialLocation)) {
      return {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    // Default to Bangalore, India coordinates
    return {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  };

  const [mapRegion, setMapRegion] = useState<MapRegion>(getInitialMapRegion());

  // Handle map errors and switch to fallback mode
  const handleMapError = (error: any) => {
    console.error('❌ MapView error:', error);
    const errorMessage = error?.message || 'Unknown map error';

    // Check for API key related errors
    if (errorMessage.includes('REQUEST_DENIED') ||
        errorMessage.includes('API_KEY') ||
        errorMessage.includes('not authorized')) {
      console.log('🔄 Maps API error detected, switching to fallback mode');
      setMapError('Maps temporarily unavailable');
      setShowFallback(true);
    } else {
      setMapError(errorMessage);
    }
  };

  useEffect(() => {
    // Initialize location utils with Google Maps API key
    const initializeLocationUtils = async () => {
      try {
        await locationUtils.initialize(CONFIG.GOOGLE_MAPS_API_KEY);
        console.log('✅ Location utils initialized with Google Maps API key');
      } catch (error) {
        console.error('❌ Failed to initialize location utils:', error);
      }
    };

    initializeLocationUtils();
  }, []);

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setIsLoading(true);

    try {
      const reverseGeocodedAddress = await locationUtils.reverseGeocode({
        latitude,
        longitude,
      });

      const newLocation: LocationData = {
        latitude,
        longitude,
        address: reverseGeocodedAddress,
      };

      setSelectedLocation(newLocation);
      setAddress(reverseGeocodedAddress);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      const newLocation: LocationData = {
        latitude,
        longitude,
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      };
      setSelectedLocation(newLocation);
      setAddress(newLocation.address);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    console.log('📍 LocationPicker: Starting current location request...');
    setIsLoading(true);

    // Add global error boundary
    const globalErrorHandler = (error: any) => {
      console.error('❌ LocationPicker: Unhandled error in location request:', error);
      setIsLoading(false);
      Alert.alert(
        'Location Error',
        'An unexpected error occurred while getting your location. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    };

    try {
      // Wrap everything in additional try-catch for maximum safety
      await new Promise<void>((resolve, reject) => {
        const executeLocationRequest = async () => {
          try {
            // Request permission first
            console.log('📍 LocationPicker: Requesting location permission...');
            const permissionStatus = await locationUtils.requestLocationPermission();
            console.log('📍 LocationPicker: Permission status:', permissionStatus);

            if (!permissionStatus.granted) {
              console.log('❌ LocationPicker: Permission denied');
              Alert.alert(
                'Permission Required',
                permissionStatus.message || 'Location permission is required to get your current location.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Settings',
                    onPress: () => {
                      try {
                        locationUtils.showLocationSettings();
                      } catch (settingsError) {
                        console.error('❌ LocationPicker: Error opening settings:', settingsError);
                      }
                    }
                  },
                ]
              );
              resolve();
              return;
            }

            // Get current location with additional safety
            console.log('📍 LocationPicker: Getting current location...');
            let coordinates: any = null;

            try {
              console.log('📍 LocationPicker: Calling locationUtils.getCurrentLocation()...');
              coordinates = await locationUtils.getCurrentLocation();
              console.log('📍 LocationPicker: Got coordinates:', coordinates);
            } catch (locationError: any) {
              console.error('❌ LocationPicker: Location service error:', locationError);
              throw new Error(`Location service failed: ${locationError.message || 'Unknown error'}`);
            }

            if (!coordinates) {
              console.error('❌ LocationPicker: No coordinates returned');
              throw new Error('No location data received');
            }

            // Validate coordinates
            if (!coordinates ||
                typeof coordinates.latitude !== 'number' ||
                typeof coordinates.longitude !== 'number' ||
                isNaN(coordinates.latitude) ||
                isNaN(coordinates.longitude)) {
              console.error('❌ LocationPicker: Invalid coordinates:', coordinates);
              throw new Error('Invalid coordinates received from location service');
            }

            console.log('✅ LocationPicker: Coordinates validated successfully');

            // Reverse geocode with fallback
            console.log('📍 LocationPicker: Reverse geocoding...');
            let reverseGeocodedAddress: string;
            try {
              reverseGeocodedAddress = await locationUtils.reverseGeocode(coordinates);
            } catch (geocodeError) {
              console.warn('⚠️ LocationPicker: Reverse geocoding failed, using coordinates:', geocodeError);
              reverseGeocodedAddress = `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
            }

            const currentLocation: LocationData = {
              ...coordinates,
              address: reverseGeocodedAddress,
            };

            console.log('✅ LocationPicker: Successfully got current location:', currentLocation);
            setSelectedLocation(currentLocation);
            setAddress(reverseGeocodedAddress);
            setMapRegion({
              ...coordinates,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });

            resolve();
          } catch (innerError) {
            reject(innerError);
          }
        };

        // Execute with timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out after 20 seconds'));
        }, 20000);

        executeLocationRequest()
          .then(() => {
            clearTimeout(timeoutId);
            resolve();
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error);
          });
      });

    } catch (error: any) {
      console.error('❌ LocationPicker: Get current location failed:', error);

      // Provide specific error messages based on error type
      let errorMessage = 'Failed to get current location. Please try again or select location manually on the map.';

      if (error.message?.includes('timeout')) {
        errorMessage = 'Location request timed out. Please check your GPS is enabled and try again.';
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Location permission is required. Please enable location access in settings.';
      } else if (error.message?.includes('unavailable')) {
        errorMessage = 'Location services are unavailable. Please check your GPS settings.';
      } else if (error.message?.includes('Native location service error')) {
        errorMessage = 'Location service is not available. Please check your device settings and try again.';
      }

      Alert.alert(
        'Location Error',
        errorMessage,
        [
          { text: 'OK', style: 'default' },
          {
            text: 'Settings',
            onPress: () => {
              try {
                locationUtils.showLocationSettings();
              } catch (settingsError) {
                console.error('❌ LocationPicker: Error opening settings:', settingsError);
              }
            }
          }
        ]
      );
    } finally {
      console.log('📍 LocationPicker: Current location request completed');
      setIsLoading(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address to search');
      return;
    }

    setIsLoading(true);

    try {
      const geocodeResult = await locationUtils.geocodeAddress(address.trim());
      
      const searchedLocation: LocationData = {
        latitude: geocodeResult.coordinates.latitude,
        longitude: geocodeResult.coordinates.longitude,
        address: geocodeResult.formattedAddress || address,
      };

      setSelectedLocation(searchedLocation);
      setAddress(searchedLocation.address);
      setMapRegion({
        ...geocodeResult.coordinates,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error: any) {
      console.error('Address search failed:', error);
      Alert.alert(
        'Search Error',
        'Could not find the address. Please check the address or select location on the map.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation || !isValidLocation(selectedLocation)) {
      Alert.alert('Error', 'Please select a valid location first');
      return;
    }

    onLocationSelected(selectedLocation);
  };

  // Error boundary wrapper
  const renderContent = () => {
    try {
      // Validate initial location data
      if (initialLocation && !isValidLocation(initialLocation)) {
        console.warn('⚠️ Invalid initial location data provided:', initialLocation);
      }

      return (
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Icon name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity 
            onPress={handleConfirm} 
            style={[styles.confirmButton, !selectedLocation && styles.disabledButton]}
            disabled={!selectedLocation}
          >
            <Text style={[styles.confirmText, !selectedLocation && styles.disabledText]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>

        {/* Address Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address or search location"
              multiline
              numberOfLines={2}
            />
            <TouchableOpacity onPress={handleAddressSearch} style={styles.searchButton}>
              <Icon name="search" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {showCurrentLocationButton && (
            <TouchableOpacity onPress={handleCurrentLocation} style={styles.currentLocationButton}>
              <Icon name="my-location" size={16} color="#007AFF" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {showFallback ? (
            // Fallback UI when map fails
            <View style={styles.fallbackContainer}>
              <Icon name="map" size={48} color="#ccc" />
              <Text style={styles.fallbackTitle}>Map Temporarily Unavailable</Text>
              <Text style={styles.fallbackText}>
                Please use the address search or current location button above
              </Text>
              {mapError && (
                <Text style={styles.errorText}>Error: {mapError}</Text>
              )}
            </View>
          ) : (
            (() => {
              try {
                return (
                  <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    region={mapRegion}
                    onPress={handleMapPress}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    onError={handleMapError}
                    onMapReady={() => {
                      console.log('✅ MapView ready');
                    }}
                  >
                  {isValidLocation(selectedLocation) && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      }}
                      title="Store Location"
                      description={selectedLocation.address}
                    />
                  )}
                </MapView>
              );
            } catch (mapError) {
              console.error('❌ MapView render error:', mapError);
              handleMapError(mapError);
              return (
                <View style={styles.fallbackContainer}>
                  <Icon name="map" size={48} color="#ccc" />
                  <Text style={styles.fallbackTitle}>Map unavailable</Text>
                  <Text style={styles.fallbackText}>Please use address search above</Text>
                </View>
              );
            }
          })()
          )}

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
        </View>

        {/* Selected Location Info */}
        {selectedLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoTitle}>Selected Location:</Text>
            <Text style={styles.locationInfoAddress}>{selectedLocation.address}</Text>
            <Text style={styles.locationInfoCoords}>
              {isValidLocation(selectedLocation)
                ? `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`
                : 'Invalid coordinates'
              }
            </Text>
          </View>
        )}
        </View>
      );
    } catch (error) {
      console.error('❌ LocationPicker render error:', error);
      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Error</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Icon name="error-outline" size={48} color="#ff6b6b" />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, textAlign: 'center' }}>
              Unable to load location picker
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' }}>
              Please try again or check your location permissions
            </Text>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                backgroundColor: '#007AFF',
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
                marginTop: 20
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      {(() => {
        try {
          return renderContent();
        } catch (modalError) {
          console.error('❌ LocationPicker Modal error:', modalError);
          return (
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.title}>Error</Text>
                <View style={{ width: 40 }} />
              </View>
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Icon name="error-outline" size={48} color="#ff6b6b" />
                <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, textAlign: 'center' }}>
                  Location picker failed to load
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' }}>
                  Please try again later or contact support if the issue persists
                </Text>
                <TouchableOpacity
                  onPress={onCancel}
                  style={{
                    backgroundColor: '#007AFF',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                    marginTop: 20
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }
      })()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 60,
  },
  searchButton: {
    marginLeft: 8,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  currentLocationText: {
    marginLeft: 4,
    color: '#007AFF',
    fontSize: 14,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  locationInfo: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationInfoAddress: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  locationInfoCoords: {
    fontSize: 12,
    color: '#666',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LocationPicker;
