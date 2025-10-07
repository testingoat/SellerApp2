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
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

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
  const { theme } = useTheme();
  const { triggerSuccess, triggerError, triggerLight } = useHaptic();

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
      triggerError(); // Haptic feedback for validation error
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (phoneNumber.length < 10) {
      triggerError(); // Haptic feedback for validation error
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    triggerLight(); // Haptic feedback for button press

    // Check network before making API call
    await checkNetworkBeforeAction(
      async () => {
        // Call login API through auth store
        const ok = await login({ phone: `+91 ${phoneNumber}` });

        if (ok) {
          triggerSuccess(); // Haptic feedback for successful OTP send
          // Navigate to OTP screen immediately (no alert gating navigation)
          if (onLogin) {
            onLogin(`+91 ${phoneNumber}`);
          } else {
            navigation.navigate('OTPVerification', { phoneNumber: `+91 ${phoneNumber}` });
          }
        } else {
          triggerError(); // Haptic feedback for failed OTP send
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
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={[styles.scrollViewContent, { backgroundColor: theme.colors.background }]}
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
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Login</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Enter your phone number</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                We'll send you a 6-digit code to verify your phone number.
              </Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Phone Number</Text>
                <View style={[styles.phoneInputContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <View style={[styles.countryCode, { borderColor: theme.colors.border }]}>
                    <Text style={[styles.countryCodeText, { color: theme.colors.text }]}>🇮🇳 +91</Text>
                  </View>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.colors.text }]}
                    placeholder="Enter phone number"
                    placeholderTextColor={theme.colors.textMuted}
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
          <View style={[styles.bottomSection, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: theme.colors.primary },
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
              <Text style={[styles.termsText, { color: theme.colors.textMuted }]}>
                By continuing, you agree to our{' '}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                  onPress={() => navigation.navigate('TermsOfService' as never)}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  style={[styles.termsLink, { color: theme.colors.primary }]}
                  onPress={() => navigation.navigate('PrivacyPolicy' as never)}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Development Test Buttons */}
            {isDevelopmentMode() && (
              <View style={styles.testSection}>
                <Text style={[styles.testTitle, { color: theme.colors.warning }]}>Development Mode - Test New User Flow</Text>
                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning }]}
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
                  <Text style={[styles.testButtonText, { color: theme.colors.warning }]}>Test New User Flow</Text>
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
    // backgroundColor removed - using theme
  },
  scrollView: {
    flex: 1,
    // backgroundColor removed - using theme
  },
  scrollViewContent: {
    flexGrow: 1,
    // backgroundColor removed - using theme
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    // backgroundColor removed - using theme
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    // color removed - using theme
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    // color removed - using theme
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
    // backgroundColor removed - using theme
    minHeight: 300,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    // backgroundColor removed - using theme
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    // color removed - using theme
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    // color removed - using theme
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  formSection: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    // backgroundColor removed - using theme
  },
  inputContainer: {
    marginBottom: 24,
    // backgroundColor removed - using theme
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    // color removed - using theme
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    borderWidth: 2,
    // borderColor removed - using theme
    borderRadius: 12,
    // backgroundColor removed - using theme
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    // backgroundColor: transparent - using parent theme
    borderRightWidth: 1,
    // borderRightColor removed - using theme
    justifyContent: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    // color removed - using theme
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    // color removed - using theme
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    // backgroundColor removed - using theme
    marginTop: 'auto',
  },
  sendButton: {
    // backgroundColor removed - using theme
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
    // color removed - using theme
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    // color removed - using theme
    fontWeight: '600',
  },
  testSection: {
    marginTop: 20,
    padding: 16,
    // backgroundColor removed - using theme
    borderRadius: 8,
    borderWidth: 1,
    // borderColor removed - using theme
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    // color removed - using theme
    marginBottom: 8,
    textAlign: 'center',
  },
  testButton: {
    // backgroundColor removed - using theme
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
  },
  testButtonText: {
    // color removed - using theme
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
