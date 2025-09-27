import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { storeService } from '../services/storeService';
import { locationService } from '../services/locationService';
import { StoreRegistrationData } from '../types/store';
import { LocationData } from '../types/location';
import LocationInput from '../components/LocationInput';

interface StoreRegistrationScreenProps {
  onComplete: () => void;
  onBack?: () => void;
}

const StoreRegistrationScreen: React.FC<StoreRegistrationScreenProps> = ({ 
  onComplete, 
  onBack 
}) => {
  const navigation = useNavigation();
  const { user, updateUserProfile } = useAuthStore();
  
  const [formData, setFormData] = useState<StoreRegistrationData>({
    storeName: '',
    ownerName: '',
    email: '',
    address: '',
    city: '',
    pincode: '',
    gstNumber: '',
    bankAccount: '',
    ifscCode: '',
    storeLocation: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (location: LocationData) => {
    setFormData(prev => ({ ...prev, storeLocation: location }));
  };

  const validateForm = (): boolean => {
    setErrors([]);
    
    // Use the storeService validation
    const validation = storeService.validateStoreData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', validation.errors[0]);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user?.phone) {
      Alert.alert('Error', 'User phone number not found. Please log in again.');
      return;
    }

    setIsLoading(true);
    setErrors([]);
    
    try {
      console.log('🏪 StoreRegistration: Submitting registration...');
      const result = await storeService.registerStore(formData, user.phone);

      if (result.success) {
        console.log('🎆 StoreRegistration: Registration successful, updating profile status');

        // If location is provided, save it to the backend
        if (formData.storeLocation && formData.storeLocation.latitude && formData.storeLocation.longitude) {
          console.log('📍 StoreRegistration: Saving store location...');
          try {
            await locationService.setStoreLocation({
              latitude: formData.storeLocation.latitude,
              longitude: formData.storeLocation.longitude,
              address: formData.storeLocation.address,
            });
            console.log('✅ StoreRegistration: Store location saved successfully');
          } catch (locationError) {
            console.error('❌ StoreRegistration: Failed to save location:', locationError);
            // Don't fail the entire registration if location save fails
          }
        }

        // Update user profile status to indicate completion
        await updateUserProfile(true);
        
        Alert.alert(
          'Registration Successful!',
          result.message || 'Your store has been registered successfully.',
          [
            { 
              text: 'Continue', 
              onPress: () => {
                console.log('📍 StoreRegistration: User clicked Continue, calling onComplete');
                if (onComplete) {
                  onComplete();
                } else {
                  console.log('📍 StoreRegistration: No onComplete, navigating to MainTabs');
                  // This should not be needed as AppNavigator should handle it
                  // but keeping as fallback
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainTabs' as never }],
                  });
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      console.error('❌ StoreRegistration: Submission error:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Registration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Register Your Store</Text>
          <Text style={styles.subtitle}>
            Please provide your store details to get started
          </Text>

          {/* Store Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Store Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your store name"
                placeholderTextColor="#9ca3af"
                value={formData.storeName}
                onChangeText={(value) => updateFormData('storeName', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Owner Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter owner's full name"
                placeholderTextColor="#9ca3af"
                value={formData.ownerName}
                onChangeText={(value) => updateFormData('ownerName', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Address Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Address *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter complete store address"
                placeholderTextColor="#9ca3af"
                value={formData.address}
                onChangeText={(value) => updateFormData('address', value)}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.inputLabel}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#9ca3af"
                  value={formData.city}
                  onChangeText={(value) => updateFormData('city', value)}
                />
              </View>

              <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor="#9ca3af"
                  value={formData.pincode}
                  onChangeText={(value) => updateFormData('pincode', value)}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>
            </View>

            {/* Store Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Store Location (Optional)</Text>
              <Text style={styles.inputHint}>
                Set your store location to help customers find you and enable accurate delivery
              </Text>
              <LocationInput
                value={formData.storeLocation}
                onLocationChange={handleLocationChange}
                placeholder="Tap to set your store location on map"
                showMapButton={true}
              />
            </View>
          </View>

          {/* Business Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Information (Optional)</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GST Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter GST number"
                placeholderTextColor="#9ca3af"
                value={formData.gstNumber}
                onChangeText={(value) => updateFormData('gstNumber', value)}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter bank account number"
                placeholderTextColor="#9ca3af"
                value={formData.bankAccount}
                onChangeText={(value) => updateFormData('bankAccount', value)}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>IFSC Code</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter IFSC code"
                placeholderTextColor="#9ca3af"
                value={formData.ifscCode}
                onChangeText={(value) => updateFormData('ifscCode', value)}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={[styles.submitButtonText, styles.loadingText]}>Registering...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Register Store</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1f2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3be340',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
  },
});

export default StoreRegistrationScreen;
