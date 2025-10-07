import { useCallback } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Platform } from 'react-native';

/**
 * Haptic Feedback Hook
 * Provides tactile feedback for user interactions
 * 
 * Supports both iOS and Android
 * Gracefully handles devices without haptic support
 * 
 * Usage:
 * const { triggerSuccess, triggerError, triggerWarning, triggerLight } = useHaptic();
 * 
 * triggerSuccess(); // On successful actions
 * triggerError();   // On error states
 * triggerWarning(); // On warning states
 * triggerLight();   // On light interactions (toggles, switches)
 */

// Haptic feedback options
const hapticOptions = {
  enableVibrateFallback: true, // Fallback to vibration if haptic not supported
  ignoreAndroidSystemSettings: false, // Respect system settings
};

export const useHaptic = () => {
  /**
   * Trigger success haptic feedback
   * Use for: Successful form submissions, successful actions, confirmations
   */
  const triggerSuccess = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
      } else {
        // Android: Use impactHeavy for success
        ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
      }
    } catch (error) {
      // Silently fail if haptic not supported
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  /**
   * Trigger error haptic feedback
   * Use for: Form validation errors, failed actions, errors
   */
  const triggerError = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
      } else {
        // Android: Use impactHeavy for errors
        ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
      }
    } catch (error) {
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  /**
   * Trigger warning haptic feedback
   * Use for: Warnings, important notifications, alerts
   */
  const triggerWarning = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
      } else {
        // Android: Use impactMedium for warnings
        ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
      }
    } catch (error) {
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  /**
   * Trigger light haptic feedback
   * Use for: Button presses, toggles, switches, light interactions
   */
  const triggerLight = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      } else {
        // Android: Use impactLight for light interactions
        ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
      }
    } catch (error) {
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  /**
   * Trigger selection haptic feedback
   * Use for: Selecting items, changing selections, picker changes
   */
  const triggerSelection = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        ReactNativeHapticFeedback.trigger('selection', hapticOptions);
      } else {
        // Android: Use clockTick for selection
        ReactNativeHapticFeedback.trigger('clockTick', hapticOptions);
      }
    } catch (error) {
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  /**
   * Trigger medium impact haptic feedback
   * Use for: Important button presses, confirmations
   */
  const triggerMedium = useCallback(() => {
    try {
      ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
    } catch (error) {
      console.debug('Haptic feedback not supported:', error);
    }
  }, []);

  return {
    triggerSuccess,
    triggerError,
    triggerWarning,
    triggerLight,
    triggerSelection,
    triggerMedium,
  };
};

