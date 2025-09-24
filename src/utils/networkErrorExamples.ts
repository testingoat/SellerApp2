/**
 * Network Error Handling Examples
 * 
 * This file demonstrates different ways to integrate network error handling
 * throughout the SellerApp2 application.
 */

import { useNetworkError } from '../hooks/useNetworkError';
import { Alert } from 'react-native';

// Example 1: Basic API call with network error handling
export const useApiWithNetworkHandling = () => {
  const { checkNetworkBeforeAction } = useNetworkError();

  const sendOTP = async (phoneNumber: string) => {
    return await checkNetworkBeforeAction(
      async () => {
        // Your actual API call here
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      },
      {
        showAlert: true,
        customMessage: 'Unable to send OTP. Please check your connection.',
        onRetry: () => sendOTP(phoneNumber),
      }
    );
  };

  return { sendOTP };
};

// Example 2: Screen-level network error handling
export const useScreenNetworkHandling = () => {
  const { handleNetworkError, isOnline } = useNetworkError();

  const handleScreenError = (error: any) => {
    const wasNetworkError = handleNetworkError(error, {
      navigateToErrorScreen: true,
      customMessage: 'This screen requires an internet connection.',
    });

    if (!wasNetworkError) {
      // Handle other types of errors
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return { handleScreenError, isOnline };
};

// Example 3: Form submission with network handling
export const useFormNetworkHandling = () => {
  const { checkNetworkBeforeAction } = useNetworkError();

  const submitForm = async (formData: any, onSuccess: () => void) => {
    const result = await checkNetworkBeforeAction(
      async () => {
        // Simulate form submission
        const response = await fetch('/api/form/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        return await response.json();
      },
      {
        showAlert: false, // Don't show alert, handle manually
        navigateToErrorScreen: true,
        customMessage: 'Unable to submit form. Please check your connection.',
      }
    );

    if (result) {
      onSuccess();
    }
  };

  return { submitForm };
};

// Example 4: Data fetching with network handling
export const useDataFetchingWithNetwork = () => {
  const { checkNetworkBeforeAction, isOnline } = useNetworkError();

  const fetchData = async (endpoint: string) => {
    if (!isOnline) {
      Alert.alert(
        'No Internet Connection',
        'Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return null;
    }

    return await checkNetworkBeforeAction(
      async () => {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      },
      {
        showAlert: true,
        customMessage: 'Unable to load data. Please try again.',
      }
    );
  };

  return { fetchData, isOnline };
};

// Example 5: Integration patterns for different screen types

// Pattern A: Wrap entire screen with NetworkErrorBoundary
/*
const MyScreen = () => {
  return (
    <NetworkErrorBoundary>
      <View>
        // Your screen content
      </View>
    </NetworkErrorBoundary>
  );
};
*/

// Pattern B: Use HOC for automatic wrapping
/*
import { withNetworkErrorBoundary } from '../components/NetworkErrorBoundary';

const MyScreen = () => {
  return (
    <View>
      // Your screen content
    </View>
  );
};

export default withNetworkErrorBoundary(MyScreen);
*/

// Pattern C: Manual network checking in components
/*
const MyComponent = () => {
  const { isOnline, handleNetworkError } = useNetworkError();
  
  useEffect(() => {
    if (!isOnline) {
      handleNetworkError(
        { code: 'NETWORK_ERROR' },
        { navigateToErrorScreen: true }
      );
    }
  }, [isOnline]);
  
  return <View>// Component content</View>;
};
*/

// Example 6: Global network status indicator
export const useNetworkStatusIndicator = () => {
  const { isOnline } = useNetworkError();
  
  return {
    isOnline,
    statusColor: isOnline ? '#10b981' : '#ef4444',
    statusText: isOnline ? 'Connected' : 'No Connection',
  };
};

// Example 7: Retry mechanisms
export const useRetryMechanism = () => {
  const { checkNetworkBeforeAction } = useNetworkError();

  const retryableAction = async (
    action: () => Promise<any>,
    maxRetries: number = 3
  ) => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await checkNetworkBeforeAction(action, {
          showAlert: attempts === maxRetries - 1, // Only show alert on final attempt
        });
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  };

  return { retryableAction };
};
