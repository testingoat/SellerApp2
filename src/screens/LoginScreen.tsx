import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useNetworkError } from '../hooks/useNetworkError';
import NetworkErrorBoundary from '../components/NetworkErrorBoundary';
import { useAuthStore } from '../state/authStore';
import { LoginScreenNavigationProp } from '../config/navigationTypes';
import { forceNewUserState, isDevelopmentMode } from '../utils/testUtils';

interface LoginScreenProps {
  onLogin?: (phoneNumber: string) => void;
  onBack?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onBack }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { checkNetworkBeforeAction, isOnline } = useNetworkError();
  const { login, error, clearError, isLoading: authIsLoading } = useAuthStore();

  // Update local loading state when auth loading changes
  useEffect(() => {
    setIsLoading(authIsLoading);
  }, [authIsLoading]);

  // Show error alerts from auth store
  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error, clearError]);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    // Check network before making API call
    await checkNetworkBeforeAction(
      async () => {
        // Call login API through auth store
        const ok = await login({ phone: `+91 ${phoneNumber}` });

        if (ok) {
          // Navigate to OTP screen immediately (no alert gating navigation)
          if (onLogin) {
            onLogin(`+91 ${phoneNumber}`);
          } else {
            navigation.navigate('OTPVerification', { phoneNumber: `+91 ${phoneNumber}` });
          }
        }
      },
      {
        showAlert: true,
        customMessage: 'Unable to send OTP. Please check your internet connection.',
        onRetry: () => handleSendOTP(),
      }
    );
  };

  return (
    <NetworkErrorBoundary>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (onBack) {
                  onBack();
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Icon name="arrow-back" size={24} color="#1f2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Login</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Enter your phone number</Text>
              <Text style={styles.subtitle}>
                We'll send you a 6-digit code to verify your phone number.
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="Enter phone number"
                    placeholderTextColor="#9ca3af"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!phoneNumber.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSendOTP}
              disabled={!phoneNumber.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            <View style={styles.termsSection}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Development Test Buttons */}
            {isDevelopmentMode() && (
              <View style={styles.testSection}>
                <Text style={styles.testTitle}>Development Mode - Test New User Flow</Text>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={() => {
                    forceNewUserState();
                    Alert.alert(
                      'Test Mode',
                      'Forced new user state. Navigate manually to test Store Registration.',
                      [
                        { text: 'Navigate to Store Registration', onPress: () => {
                          navigation.navigate('StoreRegistration' as never);
                        }},
                        { text: 'OK' }
                      ]
                    );
                  }}
                >
                  <Text style={styles.testButtonText}>Test New User Flow</Text>
                </TouchableOpacity>
                <Text style={styles.testHint}>
                  Or use phone: +91 1111111111 to simulate new user
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </NetworkErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  scrollViewContent: {
    flexGrow: 1,
    backgroundColor: '#f6f8f6',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#f6f8f6',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    marginLeft: -40, // Compensate for back button
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#f6f8f6',
    minHeight: 300,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#f6f8f6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#f6f8f6',
  },
  inputContainer: {
    marginBottom: 24,
    backgroundColor: '#f6f8f6',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#f6f8f6',
    marginTop: 'auto',
  },
  sendButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3be340',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  termsSection: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3be340',
    fontWeight: '600',
  },
  testSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  testButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  testHint: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoginScreen;
