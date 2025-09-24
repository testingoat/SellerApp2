import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';

type NetInfoState = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
};

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string;
  isLoading: boolean;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get initial network state
    const getInitialState = async () => {
      try {
        const state = await NetInfo.fetch();
        updateNetworkState(state);
      } catch (error) {
        console.warn('Failed to get initial network state:', error);
        setIsConnected(false);
        setIsInternetReachable(false);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialState();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      updateNetworkState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateNetworkState = (state: NetInfoState) => {
    setIsConnected(state.isConnected ?? false);
    setIsInternetReachable(state.isInternetReachable ?? false);
    setConnectionType(state.type || 'unknown');
    setIsLoading(false);
  };

  const checkConnection = async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      updateNetworkState(state);
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.warn('Failed to check network connection:', error);
      setIsConnected(false);
      setIsInternetReachable(false);
      return false;
    }
  };

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable,
    connectionType,
    isLoading,
    checkConnection,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

// Hook for checking network before API calls
export const useNetworkCheck = () => {
  const { isConnected, isInternetReachable, checkConnection } = useNetwork();

  const ensureConnection = async (): Promise<boolean> => {
    if (!isConnected || !isInternetReachable) {
      return await checkConnection();
    }
    return true;
  };

  return {
    isOnline: isConnected && isInternetReachable,
    ensureConnection,
    checkConnection,
  };
};
