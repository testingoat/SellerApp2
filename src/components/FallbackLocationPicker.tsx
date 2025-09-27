import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LocationData, LocationPickerProps } from '../types/location';
import { locationUtils } from '../utils/locationUtils';

const { width } = Dimensions.get('window');

// Fallback LocationPicker without MapView for when Maps fail
const FallbackLocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelected,
  onCancel,
  title = 'Select Store Location',
  showCurrentLocationButton = true,
}) => {
  const [address, setAddress] = useState(initialLocation?.address || '');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    initialLocation || null
  );

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
    } catch (error: any) {
      console.error('Address search failed:', error);
      Alert.alert(
        'Search Error',
        'Could not find the address. Please check the address and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const permissionStatus = await locationUtils.requestLocationPermission();
      
      if (!permissionStatus.granted) {
        Alert.alert(
          'Permission Required',
          permissionStatus.message || 'Location permission is required to get your current location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => locationUtils.showLocationSettings() 
            },
          ]
        );
        return;
      }

      const coordinates = await locationUtils.getCurrentLocation();
      const reverseGeocodedAddress = await locationUtils.reverseGeocode(coordinates);

      const currentLocation: LocationData = {
        ...coordinates,
        address: reverseGeocodedAddress,
      };

      setSelectedLocation(currentLocation);
      setAddress(reverseGeocodedAddress);
    } catch (error: any) {
      console.error('Get current location failed:', error);
      Alert.alert(
        'Location Error',
        error.message || 'Failed to get current location. Please enter address manually.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please search for an address or get current location first');
      return;
    }

    onLocationSelected(selectedLocation);
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
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

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Icon name="info-outline" size={20} color="#007AFF" />
            <Text style={styles.infoText}>
              Map view is temporarily unavailable. Please enter your address manually or use current location.
            </Text>
          </View>

          {/* Address Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Store Address</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your store address"
                multiline
                numberOfLines={2}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.searchButton, isLoading && styles.disabledButton]}
                onPress={handleAddressSearch}
                disabled={isLoading}
              >
                <Icon name="search" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Location Button */}
          {showCurrentLocationButton && (
            <TouchableOpacity
              style={[styles.currentLocationButton, isLoading && styles.disabledButton]}
              onPress={handleCurrentLocation}
              disabled={isLoading}
            >
              <Icon name="my-location" size={20} color="#007AFF" />
              <Text style={styles.currentLocationText}>Use Current Location</Text>
            </TouchableOpacity>
          )}

          {/* Selected Location Info */}
          {selectedLocation && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoTitle}>Selected Location:</Text>
              <Text style={styles.locationInfoAddress}>{selectedLocation.address}</Text>
              <Text style={styles.locationInfoCoords}>
                {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}
        </View>
      </View>
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    maxHeight: 80,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 20,
  },
  currentLocationText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  locationInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationInfoAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationInfoCoords: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default FallbackLocationPicker;
