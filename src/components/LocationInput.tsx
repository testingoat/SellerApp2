import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LocationData, LocationInputProps } from '../types/location';
import LocationPicker from './LocationPicker';
import FallbackLocationPicker from './FallbackLocationPicker';

// Helper function to validate location data
const isValidLocation = (location: LocationData | null | undefined): location is LocationData => {
  return location !== null &&
         location !== undefined &&
         typeof location.latitude === 'number' &&
         typeof location.longitude === 'number' &&
         !isNaN(location.latitude) &&
         !isNaN(location.longitude) &&
         location.latitude >= -90 && location.latitude <= 90 &&
         location.longitude >= -180 && location.longitude <= 180;
};

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onLocationChange,
  placeholder = 'Tap to set store location',
  editable = true,
  showMapButton = true,
}) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [useFallbackPicker, setUseFallbackPicker] = useState(false);

  const handleLocationPress = () => {
    if (!editable) return;

    try {
      console.log('📍 Opening location picker...');
      setShowLocationPicker(true);
    } catch (error) {
      console.error('❌ Error opening location picker:', error);
      Alert.alert(
        'Error',
        'Unable to open location picker. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLocationSelected = (location: LocationData) => {
    onLocationChange(location);
    setShowLocationPicker(false);
    setUseFallbackPicker(false);
  };

  const handleLocationCancel = () => {
    setShowLocationPicker(false);
    setUseFallbackPicker(false);
  };

  const handleLocationPickerError = () => {
    console.log('📍 LocationPicker failed, switching to fallback picker');
    setUseFallbackPicker(true);
  };

  const displayText = value?.address || placeholder;
  const hasLocation = isValidLocation(value) && !!value.address;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.inputContainer,
          !editable && styles.disabledContainer,
          hasLocation && styles.hasLocationContainer,
        ]}
        onPress={handleLocationPress}
        disabled={!editable}
      >
        <View style={styles.iconContainer}>
          <Icon 
            name="location-on" 
            size={20} 
            color={hasLocation ? '#007AFF' : '#999'} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Text 
            style={[
              styles.locationText,
              !hasLocation && styles.placeholderText,
              !editable && styles.disabledText,
            ]}
            numberOfLines={2}
          >
            {displayText}
          </Text>
          
          {hasLocation && isValidLocation(value) && (
            <Text style={styles.coordinatesText}>
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </Text>
          )}
        </View>

        {showMapButton && editable && (
          <View style={styles.actionContainer}>
            <Icon name="map" size={20} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>

      {hasLocation && editable && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => onLocationChange({ latitude: 0, longitude: 0, address: '' })}
        >
          <Icon name="clear" size={16} color="#999" />
          <Text style={styles.clearText}>Clear Location</Text>
        </TouchableOpacity>
      )}

      {showLocationPicker && !useFallbackPicker && (
        <LocationPicker
          initialLocation={value}
          onLocationSelected={handleLocationSelected}
          onCancel={handleLocationCancel}
          title="Set Store Location"
          showCurrentLocationButton={true}
        />
      )}

      {showLocationPicker && useFallbackPicker && (
        <FallbackLocationPicker
          initialLocation={value}
          onLocationSelected={handleLocationSelected}
          onCancel={handleLocationCancel}
          title="Set Store Location"
          showCurrentLocationButton={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 56,
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  hasLocationContainer: {
    borderColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  disabledText: {
    color: '#666',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionContainer: {
    marginLeft: 8,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  clearText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#999',
  },
});

export default LocationInput;
