import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { locationService } from '../services/locationService';
import { LocationData, StoreLocation } from '../types/location';
import LocationInput from '../components/LocationInput';

const StoreLocationManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [currentLocation, setCurrentLocation] = useState<StoreLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentLocation();
  }, []);

  const loadCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const response = await locationService.getStoreLocation();
      console.log('🔍 Location service response:', response);

      // Handle both success and error cases properly
      if (response && response.success && response.storeLocation) {
        setCurrentLocation(response.storeLocation);
      } else if (response && !response.success) {
        console.log('📍 No store location set yet:', response.error);
        // This is expected for new sellers who haven't set location yet
        setCurrentLocation(null);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        setCurrentLocation(null);
      }
    } catch (error) {
      console.error('Failed to load store location:', error);
      setCurrentLocation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleLocationChange = (location: LocationData) => {
    console.log('📍 Location changed:', location);
    setCurrentLocation({
      ...location,
      isSet: true,
    });
  };

  const handleSaveLocation = async () => {
    if (!currentLocation || !currentLocation.latitude || !currentLocation.longitude) {
      Alert.alert('Error', 'Please select a location first');
      return;
    }

    setIsSaving(true);
    try {
      const response = currentLocation.isSet 
        ? await locationService.updateStoreLocation({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: currentLocation.address,
          })
        : await locationService.setStoreLocation({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: currentLocation.address,
          });

      if (response.success) {
        Alert.alert(
          'Success',
          'Store location saved successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Save location error:', error);
      Alert.alert('Error', 'Failed to save location. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLocation = () => {
    Alert.alert(
      'Clear Location',
      'Are you sure you want to clear your store location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCurrentLocation(null);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Store Location
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Info Section */}
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
            <Icon name="info" size={20} color="#007AFF" />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Set your store location to help customers find you and enable accurate delivery services.
            </Text>
          </View>

          {/* Current Location Status */}
          <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.statusHeader}>
              <Icon 
                name={currentLocation?.isSet ? "location-on" : "location-off"} 
                size={24} 
                color={currentLocation?.isSet ? "#4CAF50" : "#999"} 
              />
              <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
                Location Status
              </Text>
            </View>
            
            <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
              {currentLocation?.isSet 
                ? 'Your store location is set and active'
                : 'No location set - customers cannot find your store'
              }
            </Text>

            {currentLocation?.isSet && (
              <View style={styles.locationDetails}>
                <Text style={[styles.locationAddress, { color: theme.colors.text }]}>
                  {currentLocation.address}
                </Text>
                <Text style={[styles.locationCoords, { color: theme.colors.textSecondary }]}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>

          {/* Location Input */}
          <View style={[styles.inputCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.inputTitle, { color: theme.colors.text }]}>
              Store Location
            </Text>
            <Text style={[styles.inputDescription, { color: theme.colors.textSecondary }]}>
              Tap to set or update your store location on the map
            </Text>
            
            <LocationInput
              value={currentLocation}
              onLocationChange={handleLocationChange}
              placeholder="Tap to set your store location on map"
              showMapButton={true}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!currentLocation || isSaving) && styles.disabledButton
              ]}
              onPress={handleSaveLocation}
              disabled={!currentLocation || isSaving}
            >
              {isSaving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Save Location</Text>
              )}
            </TouchableOpacity>

            {currentLocation?.isSet && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearLocation}
              >
                <Text style={styles.clearButtonText}>Clear Location</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 12,
  },
  locationDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
  },
  inputCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
});

export default StoreLocationManagementScreen;
