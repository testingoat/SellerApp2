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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface WalletData {
  provider: string;
  linkedId: string;
  verificationCode: string;
}

const DigitalWalletScreen: React.FC = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState<WalletData>({
    provider: '',
    linkedId: '',
    verificationCode: '',
  });
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const walletProviders = [
    { label: 'Select Wallet Provider', value: '' },
    { label: 'Paytm', value: 'paytm' },
    { label: 'Google Pay', value: 'googlepay' },
    { label: 'PhonePe', value: 'phonepe' },
    { label: 'Amazon Pay', value: 'amazonpay' },
  ];

  const updateFormData = (field: keyof WalletData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSendVerification = () => {
    if (!formData.provider) {
      Alert.alert('Error', 'Please select a wallet provider');
      return;
    }
    if (!formData.linkedId.trim()) {
      Alert.alert('Error', 'Please enter your linked phone number or ID');
      return;
    }

    setIsVerificationSent(true);
    Alert.alert('Success', 'Verification code sent successfully!');
  };

  const handleAddWallet = async () => {
    if (!formData.provider) {
      Alert.alert('Error', 'Please select a wallet provider');
      return;
    }
    if (!formData.linkedId.trim()) {
      Alert.alert('Error', 'Please enter your linked phone number or ID');
      return;
    }
    if (!formData.verificationCode.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      Alert.alert(
        'Success',
        'Digital wallet added successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

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
        <Text style={styles.headerTitle}>Add Digital Wallet</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Wallet Provider */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Wallet Provider</Text>
            <TouchableOpacity style={styles.pickerContainer}>
              <Text style={[styles.pickerText, !formData.provider && styles.placeholderText]}>
                {formData.provider ? 
                  walletProviders.find(provider => provider.value === formData.provider)?.label :
                  'Select Wallet Provider'
                }
              </Text>
              <Icon name="keyboard-arrow-down" size={24} color="#3be340" />
            </TouchableOpacity>
          </View>

          {/* Linked ID */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Linked Phone Number / ID</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your linked number or ID"
              placeholderTextColor="#648765"
              value={formData.linkedId}
              onChangeText={(text) => updateFormData('linkedId', text)}
            />
          </View>

          {/* Verification Section */}
          <View style={styles.verificationSection}>
            <Text style={styles.verificationTitle}>Verification</Text>
            <Text style={styles.verificationDescription}>
              To ensure the security of your payouts, please verify your digital wallet.
            </Text>
          </View>

          {/* Send Verification */}
          <View style={styles.verificationCard}>
            <Text style={styles.verificationCardText}>Send Verification Code</Text>
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendVerification}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>

          {/* Verification Code */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Verification Code</Text>
            <TextInput
              style={[
                styles.textInput,
                !isVerificationSent && styles.textInputDisabled
              ]}
              placeholder="Enter Verification Code"
              placeholderTextColor="#648765"
              value={formData.verificationCode}
              onChangeText={(text) => updateFormData('verificationCode', text)}
              editable={isVerificationSent}
              keyboardType="numeric"
            />
          </View>
        </View>
      </ScrollView>

      {/* Add Wallet Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.addButton, isLoading && styles.addButtonDisabled]}
          onPress={handleAddWallet}
          disabled={isLoading}
        >
          <Text style={styles.addButtonText}>
            {isLoading ? 'Adding Wallet...' : 'Add Wallet'}
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
    padding: 8,
    borderRadius: 20,
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
    gap: 24,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  textInput: {
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: 'rgba(59, 227, 64, 0.5)',
    height: 56,
  },
  textInputDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    color: '#9ca3af',
  },
  pickerContainer: {
    backgroundColor: '#f0f4f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 227, 64, 0.5)',
    height: 56,
  },
  pickerText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#648765',
  },
  verificationSection: {
    paddingTop: 16,
  },
  verificationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  verificationDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(59, 227, 64, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  verificationCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  sendButton: {
    backgroundColor: 'rgba(59, 227, 64, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
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
  addButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default DigitalWalletScreen;
