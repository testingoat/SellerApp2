import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../state/authStore';
import { storeService } from '../services/storeService';

interface StoreData {
  storeName: string;
  ownerName: string;
  email: string;
  storeAddress: string;
  city: string;
  pincode: string;
  gstNumber: string;
  accountNumber: string;
  ifscCode: string;
  storeContact: string;
  storeWebsite: string;
}

const StoreInformationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, token, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const [storeData, setStoreData] = useState<StoreData>({
    storeName: '',
    ownerName: '',
    email: '',
    storeAddress: '',
    city: '',
    pincode: '',
    gstNumber: '',
    accountNumber: '',
    ifscCode: '',
    storeContact: '',
    storeWebsite: '',
  });

  // Load user data when component mounts
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      setIsInitialLoading(true);

      if (!user || !isAuthenticated) {
        console.log('⚠️ StoreInformation: No authenticated user found');
        setIsInitialLoading(false);
        return;
      }

      console.log('📋 StoreInformation: Loading user data:', {
        hasUser: !!user,
        userId: user.id,
        storeName: user.storeName,
        profileCompleted: user.profileCompleted
      });

      // Parse store address if it exists (format: "address, city, pincode")
      let parsedAddress = '';
      let parsedCity = '';
      let parsedPincode = '';

      if (user.storeAddress) {
        const addressParts = user.storeAddress.split(', ');
        if (addressParts.length >= 3) {
          parsedAddress = addressParts.slice(0, -2).join(', ');
          parsedCity = addressParts[addressParts.length - 2];
          parsedPincode = addressParts[addressParts.length - 1];
        } else {
          parsedAddress = user.storeAddress;
        }
      }

      // Set form data from user profile
      setStoreData({
        storeName: user.storeName || '',
        ownerName: user.name || '',
        email: user.email || '',
        storeAddress: parsedAddress,
        city: parsedCity,
        pincode: parsedPincode,
        gstNumber: '', // These fields are not in the current user model
        accountNumber: '',
        ifscCode: '',
        storeContact: user.phone || '',
        storeWebsite: '',
      });

      console.log('✅ StoreInformation: User data loaded successfully');
    } catch (error) {
      console.error('❌ StoreInformation: Error loading user data:', error);
      Alert.alert('Error', 'Failed to load store information. Please try again.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const updateStoreData = (field: keyof StoreData, value: string) => {
    setStoreData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const requiredFields: (keyof StoreData)[] = [
      'storeName',
      'ownerName',
      'email',
      'storeAddress',
      'city',
      'pincode',
      'storeContact',
    ];

    for (const field of requiredFields) {
      if (!storeData[field].trim()) {
        Alert.alert('Error', `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(storeData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    // Pincode validation
    if (!/^\d{5,6}$/.test(storeData.pincode)) {
      Alert.alert('Error', 'Please enter a valid pincode');
      return false;
    }

    // GST validation (if provided)
    if (storeData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(storeData.gstNumber)) {
      Alert.alert('Error', 'Please enter a valid GST number');
      return false;
    }

    // IFSC validation (if provided)
    if (storeData.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(storeData.ifscCode)) {
      Alert.alert('Error', 'Please enter a valid IFSC code');
      return false;
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    if (!user || !isAuthenticated || !token) {
      Alert.alert('Error', 'You must be logged in to save changes. Please log in again.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('💾 StoreInformation: Saving changes...');

      // Prepare data for API call (match server expectations)
      const updateData = {
        name: storeData.ownerName,
        email: storeData.email,
        storeName: storeData.storeName,
        storeAddress: `${storeData.storeAddress}${storeData.city ? ', ' + storeData.city : ''}${storeData.pincode ? ', ' + storeData.pincode : ''}`
      };

      console.log('📤 StoreInformation: Sending update data:', updateData);

      // Call the store service to update profile
      const result = await storeService.updateStoreProfile(updateData);

      if (result.success) {
        console.log('✅ StoreInformation: Profile updated successfully');

        // Update auth store with new data if returned
        if (result.user) {
          const { updateUserProfile } = useAuthStore.getState();
          await updateUserProfile(true); // Mark profile as completed
        }

        Alert.alert(
          'Success',
          'Store information updated successfully!',
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ StoreInformation: Update failed:', result.message);
        Alert.alert('Error', result.message || 'Failed to update store information');
      }
    } catch (error) {
      console.error('❌ StoreInformation: Save error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while saving. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderInputField = (
    label: string,
    field: keyof StoreData,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'url' = 'default',
    multiline: boolean = false
  ) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={storeData[field]}
        onChangeText={(text) => updateStoreData(field, text)}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
      />
    </View>
  );

  // Show loading screen while initial data is loading
  if (isInitialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
        <Text style={styles.loadingText}>Loading store information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Information</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {renderInputField('Store Name', 'storeName', 'Enter store name')}
          {renderInputField('Owner Name', 'ownerName', 'Enter owner name')}
          {renderInputField('Email', 'email', 'Enter email', 'email-address')}
          {renderInputField('Store Address', 'storeAddress', 'Enter store address', 'default', true)}
          
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              {renderInputField('City', 'city', 'Enter city')}
            </View>
            <View style={styles.halfWidth}>
              {renderInputField('Pincode', 'pincode', 'Enter pincode', 'phone-pad')}
            </View>
          </View>

          {renderInputField('GST Number', 'gstNumber', 'Enter GST number (optional)')}
          {renderInputField('Bank Account Number', 'accountNumber', 'Enter account number (optional)', 'phone-pad')}
          {renderInputField('IFSC Code', 'ifscCode', 'Enter IFSC code (optional)')}
          {renderInputField('Store Contact Number', 'storeContact', 'Enter store contact', 'phone-pad')}
          {renderInputField('Store Website/Social Media Link', 'storeWebsite', 'Enter URL (optional)', 'url')}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSaveChanges}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving Changes...' : 'Save Changes'}
          </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  textInput: {
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 52,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#112112',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default StoreInformationScreen;
