import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import NetworkErrorScreen from '../screens/NetworkErrorScreen';

interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    onRetry: () => void;
    onBack?: () => void;
  }>;
  showErrorOnOffline?: boolean;
  onBack?: () => void;
}

const NetworkErrorBoundary: React.FC<NetworkErrorBoundaryProps> = ({
  children,
  fallback: FallbackComponent,
  showErrorOnOffline = true,
  onBack,
}) => {
  const { isConnected, isInternetReachable, checkConnection } = useNetwork();
  const [showError, setShowError] = useState(false);
  const [hasTriedRetry, setHasTriedRetry] = useState(false);

  useEffect(() => {
    if (showErrorOnOffline) {
      const isOffline = !isConnected || !isInternetReachable;
      
      if (isOffline && !hasTriedRetry) {
        setShowError(true);
      } else if (!isOffline && showError) {
        setShowError(false);
        setHasTriedRetry(false);
      }
    }
  }, [isConnected, isInternetReachable, showErrorOnOffline, hasTriedRetry, showError]);

  const handleRetry = async () => {
    setHasTriedRetry(true);
    
    try {
      const isOnline = await checkConnection();
      if (isOnline) {
        setShowError(false);
        setHasTriedRetry(false);
      } else {
        // Still offline, keep showing error
        setTimeout(() => setHasTriedRetry(false), 2000);
      }
    } catch (error) {
      console.warn('Network retry failed:', error);
      setTimeout(() => setHasTriedRetry(false), 2000);
    }
  };

  if (showError) {
    if (FallbackComponent) {
      return <FallbackComponent onRetry={handleRetry} onBack={onBack} />;
    }
    
    return (
      <NetworkErrorScreen
        onRetry={handleRetry}
        onBack={onBack}
        showBackButton={!!onBack}
      />
    );
  }

  return <View style={{ flex: 1 }}>{children}</View>;
};

export default NetworkErrorBoundary;

// Higher-order component for wrapping screens
export const withNetworkErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    showErrorOnOffline?: boolean;
    fallback?: React.ComponentType<{
      onRetry: () => void;
      onBack?: () => void;
    }>;
  }
) => {
  const WrappedComponent: React.FC<P & { navigation?: any }> = (props) => {
    const handleBack = () => {
      if (props.navigation?.canGoBack()) {
        props.navigation.goBack();
      }
    };

    return (
      <NetworkErrorBoundary
        showErrorOnOffline={options?.showErrorOnOffline ?? true}
        fallback={options?.fallback}
        onBack={props.navigation ? handleBack : undefined}
      >
        <Component {...props} />
      </NetworkErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withNetworkErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
