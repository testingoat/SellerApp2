import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import Slider from '@react-native-community/slider';

const DeliveryAreaScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [showGetStarted, setShowGetStarted] = useState(true);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  const handleZoomIn = () => {
    Alert.alert('Zoom In', 'Map zoom in functionality');
  };

  const handleZoomOut = () => {
    Alert.alert('Zoom Out', 'Map zoom out functionality');
  };

  const handleCurrentLocation = () => {
    Alert.alert('Current Location', 'Navigate to current location');
  };

  const handleClearArea = () => {
    Alert.alert(
      'Clear Area',
      'Are you sure you want to clear the delivery area?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          setDeliveryRadius(0);
          Alert.alert('Success', 'Delivery area cleared');
        }},
      ]
    );
  };

  const handleSaveArea = () => {
    Alert.alert(
      'Success',
      `Delivery area saved with ${deliveryRadius} km radius`,
      [{ text: 'OK' }]
    );
  };

  const handleGetStarted = () => {
    setShowGetStarted(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Area</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <ImageBackground
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh6K9PuSCWSrf0-zCfvq_bguS4PAYi7yt9V1FywsMyHS_pmg70hlD2xBSme2sMjJBXsH0fT6V4FDxt4bz3X_6PGRek2ZlmCT6Z4m6pCn0RbYVo0q9HqPkNUeD6dVMYU4kh1oN3BBqSoTybg1uWxBqCGShxK6BqGdkoG7_rKy2Ixl--3hYttKGbIQWwpri_B_nM5jPrcBrY6Bg9PZjzDKAV0oDTqSbWnNhZYW3X0XTGnPogVjaUWAIcx2nFsHULswL7SS_CfqaurxQ'
          }}
          style={styles.mapBackground}
          resizeMode="cover"
        >
          <View style={styles.mapOverlay}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="rgba(31, 41, 55, 0.5)" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for an address"
                placeholderTextColor="rgba(31, 41, 55, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>

            {/* Map Controls */}
            <View style={styles.mapControls}>
              <View style={styles.zoomControls}>
                <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
                  <Icon name="add" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.zoomDivider} />
                <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
                  <Icon name="remove" size={24} color="#1f2937" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.locationButton} onPress={handleCurrentLocation}>
                <Icon name="my-location" size={24} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      {/* Delivery Radius Control */}
      <View style={styles.radiusContainer}>
        <View style={styles.radiusHeader}>
          <Text style={styles.radiusLabel}>Delivery Radius</Text>
          <Text style={styles.radiusValue}>{deliveryRadius} km</Text>
        </View>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20}
            value={deliveryRadius}
            onValueChange={setDeliveryRadius}
            step={1}
            minimumTrackTintColor="#3be340"
            maximumTrackTintColor="rgba(59, 227, 64, 0.3)"
            thumbStyle={styles.sliderThumb}
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearArea}>
          <Text style={styles.clearButtonText}>Clear Area</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveArea}>
          <Text style={styles.saveButtonText}>Save Area</Text>
        </TouchableOpacity>
      </View>

      {/* Get Started Modal */}
      <Modal
        visible={showGetStarted}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGetStarted(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Delivery Area</Text>
            <Text style={styles.modalDescription}>
              Define your delivery boundaries by setting a radius or drawing custom zones on the map.
            </Text>
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
  },
  mapBackground: {
    flex: 1,
  },
  mapOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  searchContainer: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 16,
    zIndex: 1,
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingLeft: 44,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  mapControls: {
    alignItems: 'flex-end',
    gap: 12,
  },
  zoomControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: 'rgba(31, 41, 55, 0.1)',
  },
  locationButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radiusContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  radiusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  radiusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  radiusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sliderContainer: {
    position: 'relative',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#3be340',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 227, 64, 0.2)',
    gap: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(59, 227, 64, 0.5)',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3be340',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3be340',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHandle: {
    width: 40,
    height: 6,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(31, 41, 55, 0.7)',
    lineHeight: 24,
    marginBottom: 24,
  },
  getStartedButton: {
    backgroundColor: '#3be340',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

export default DeliveryAreaScreen;
