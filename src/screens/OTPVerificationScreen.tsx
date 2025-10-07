import React, { useState, useRef, useEffect } from 'react';
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
import { useAuthStore } from '../state/authStore';
import { useNetworkError } from '../hooks/useNetworkError';
import { OTPVerificationScreenNavigationProp } from '../config/navigationTypes';
import { shouldTriggerNewUserFlow, simulateNewUserOTPVerification, isDevelopmentMode } from '../utils/testUtils';
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

interface OTPVerificationScreenProps {
  onVerifySuccess?: () => void;
  onBack?: () => void;
  phoneNumber?: string;
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  onVerifySuccess,
  onBack,
  phoneNumber = '+91 XXXXXXXXXX'
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(59);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const navigation = useNavigation<OTPVerificationScreenNavigationProp>();
  const { theme } = useTheme();
  const { triggerSuccess, triggerError, triggerLight } = useHaptic();
  const {
    verifyOtp,
    resendOtp,
    error,
    clearError,
    isLoading: authIsLoading,
    tempPhone,
    isNewUser,
    user
  } = useAuthStore();
  const { checkNetworkBeforeAction } = useNetworkError();

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

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      triggerError(); // Haptic feedback for validation error
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    // Use tempPhone from auth store or fallback to props
    const phoneToVerify = tempPhone || phoneNumber;

    if (!phoneToVerify || phoneToVerify === '+91 XXXXXXXXXX') {
      triggerError(); // Haptic feedback for error
      Alert.alert('Error', 'Phone number not found. Please go back and login again.');
      return;
    }

    triggerLight(); // Haptic feedback for button press

    await checkNetworkBeforeAction(
      async () => {
        // Handle test phone numbers in development mode
        if (isDevelopmentMode() && shouldTriggerNewUserFlow(phoneToVerify)) {
          console.log('🧪 Test Mode: Using test phone number for new user flow');
          const testResult = await simulateNewUserOTPVerification(phoneToVerify, otpString);
          console.log('🧪 Test Result:', testResult);
          triggerSuccess(); // Haptic feedback for successful verification
        } else {
          // Call verify OTP API through auth store
          await verifyOtp({ phone: phoneToVerify, otp: otpString });
          triggerSuccess(); // Haptic feedback for successful verification
        }

        console.log('🔍 OTP Verification completed. Let AppNavigator handle navigation based on auth state.');

        // The AppNavigator will automatically handle navigation based on the updated auth state
        // No manual navigation needed here - the auth state change will trigger appropriate screen
        if (onVerifySuccess) {
          onVerifySuccess();
        }
        // Navigation will be handled automatically by AppNavigator based on:
        // - isAuthenticated: true
        // - needsRegistration: isNewUser || !user.profileCompleted
      },
      {
        showAlert: true,
        customMessage: 'Unable to verify OTP. Please check your internet connection.',
        onRetry: () => handleVerifyOTP(),
      }
    );
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    // Use tempPhone from auth store or fallback to props
    const phoneToSend = tempPhone || phoneNumber;

    if (!phoneToSend || phoneToSend === '+91 XXXXXXXXXX') {
      triggerError(); // Haptic feedback for error
      Alert.alert('Error', 'Phone number not found. Please go back and login again.');
      return;
    }

    triggerLight(); // Haptic feedback for button press

    setCanResend(false);
    setResendTimer(59);
    setOtp(['', '', '', '', '', '']);

    // Focus first input
    inputRefs.current[0]?.focus();

    // Restart timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await checkNetworkBeforeAction(
      async () => {
        // Call resend OTP API through auth store
        await resendOtp(phoneToSend);

        triggerSuccess(); // Haptic feedback for successful resend
        Alert.alert(
          'OTP Resent',
          `A new 6-digit code has been sent to ${phoneToSend}`,
          [{ text: 'OK' }]
        );
      },
      {
        showAlert: true,
        customMessage: 'Unable to resend OTP. Please check your internet connection.',
        onRetry: () => handleResendOTP(),
      }
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Verification</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Enter OTP</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              A 6-digit code has been sent to your phone number.
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Enter 6-Digit Code</Text>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text },
                      digit ? [styles.otpInputFilled, { borderColor: theme.colors.primary }] : null
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    textAlign="center"
                    autoFocus={index === 0}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={[styles.bottomSection, { backgroundColor: theme.colors.background }]}>
          <TouchableOpacity
            style={[
              styles.verifyButton,
              { backgroundColor: theme.colors.primary },
              !isOtpComplete && styles.verifyButtonDisabled
            ]}
            onPress={handleVerifyOTP}
            disabled={!isOtpComplete || isLoading}
          >
            <Text style={styles.verifyButtonText}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendSection}>
            <Text style={[styles.resendText, { color: theme.colors.textMuted }]}>
              Resend code in{' '}
              <Text style={[styles.timerText, { color: theme.colors.primary }]}>
                {formatTimer(resendTimer)}
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.resendButton,
              { borderColor: theme.colors.primary },
              !canResend && [styles.resendButtonDisabled, { borderColor: theme.colors.border }]
            ]}
            onPress={handleResendOTP}
            disabled={!canResend}
          >
            <Text style={[
              styles.resendButtonText,
              { color: theme.colors.primary },
              !canResend && [styles.resendButtonTextDisabled, { color: theme.colors.textMuted }]
            ]}>
              Resend OTP
            </Text>
          </TouchableOpacity>

          <View style={styles.termsSection}>
            <Text style={[styles.termsText, { color: theme.colors.textMuted }]}>
              By continuing, you agree to our{' '}
              <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Terms of Service</Text> and{' '}
              <Text style={[styles.termsLink, { color: theme.colors.primary }]}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    // color removed - using theme
    flex: 1,
    textAlign: 'center',
    marginLeft: -40,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 64,
    borderRadius: 12,
    // backgroundColor removed - using theme
    borderWidth: 2,
    // borderColor removed - using theme
    fontSize: 24,
    fontWeight: '700',
    // color removed - using theme
  },
  otpInputFilled: {
    // backgroundColor removed - using theme
    // borderColor removed - using theme
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    // backgroundColor removed - using theme
    marginTop: 'auto',
  },
  verifyButton: {
    // backgroundColor removed - using theme
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    // shadowColor removed - using theme
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  verifyButtonDisabled: {
    // backgroundColor removed - using theme
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    // color removed - using theme
  },
  timerText: {
    fontWeight: '700',
    // color removed - using theme
  },
  resendButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    // borderColor removed - using theme
    marginBottom: 20,
  },
  resendButtonDisabled: {
    // borderColor removed - using theme
  },
  resendButtonText: {
    // color removed - using theme
    fontSize: 16,
    fontWeight: '700',
  },
  resendButtonTextDisabled: {
    // color removed - using theme
  },
  termsSection: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    // color removed - using theme
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    // color removed - using theme
    fontWeight: '600',
  },
});

export default OTPVerificationScreen;
