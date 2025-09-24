/**
 * Freshly Seller App
 * Multi-screen seller application for managing products and orders
 *
 * @format
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/context/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';
import { fcmService } from './src/services/fcmService';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize FCM service
    const initializeFCM = async () => {
      try {
        console.log('🚀 App: Initializing FCM service...');
        const initialized = await fcmService.initialize();
        
        if (initialized) {
          console.log('✅ App: FCM service initialized successfully');
          console.log('📝 App: FCM token will be registered after user authentication');
        } else {
          console.warn('⚠️ App: FCM service initialization failed');
        }
      } catch (error) {
        console.error('❌ App: FCM initialization error:', error);
      }
    };

    initializeFCM();
  }, []);

  return (
    <ThemeProvider>
      <NetworkProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor="#f6f8f6"
              translucent={false}
            />
            <AppNavigator />
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;
