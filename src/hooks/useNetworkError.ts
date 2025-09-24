import { useNavigation } from '@react-navigation/native';
import { useNetwork } from '../context/NetworkContext';
import { Alert } from 'react-native';

export interface NetworkErrorOptions {
  showAlert?: boolean;
  navigateToErrorScreen?: boolean;
  customMessage?: string;
  onRetry?: () => void;
}

export const useNetworkError = () => {
  const navigation = useNavigation<any>();
  const { isConnected, isInternetReachable, checkConnection } = useNetwork();

  const handleNetworkError = (
    error: any,
    options: NetworkErrorOptions = {}
  ) => {
    const {
      showAlert = true,
      navigateToErrorScreen = false,
      customMessage,
      onRetry,
    } = options;

    const isNetworkError = 
      !isConnected || 
      !isInternetReachable || 
      error?.code === 'NETWORK_ERROR' ||
      error?.message?.includes('Network Error') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ENOTFOUND') ||
      error?.message?.includes('ECONNREFUSED');

    if (isNetworkError) {
      const message = customMessage || 
        'Please check your internet connection and try again.';

      if (navigateToErrorScreen) {
        navigation.navigate('NetworkError', {
          title: 'Network Error',
          message,
          onRetry: onRetry || (() => navigation.goBack()),
          showBackButton: true,
        });
      } else if (showAlert) {
        Alert.alert(
          'Network Error',
          message,
          [
            {
              text: 'Retry',
              onPress: onRetry || (() => {}),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      }

      return true; // Indicates it was a network error
    }

    return false; // Not a network error
  };

  const checkNetworkBeforeAction = async (
    action: () => Promise<any>,
    options: NetworkErrorOptions = {}
  ): Promise<any> => {
    try {
      // Check network connectivity first
      const isOnline = await checkConnection();
      
      if (!isOnline) {
        handleNetworkError(
          { code: 'NETWORK_ERROR', message: 'No internet connection' },
          options
        );
        return null;
      }

      // Execute the action
      return await action();
    } catch (error) {
      const wasNetworkError = handleNetworkError(error, options);
      
      if (!wasNetworkError) {
        // Re-throw non-network errors
        throw error;
      }
      
      return null;
    }
  };

  const isOnline = isConnected && isInternetReachable;

  return {
    isOnline,
    handleNetworkError,
    checkNetworkBeforeAction,
    checkConnection,
  };
};
