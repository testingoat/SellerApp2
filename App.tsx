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
import { locationUtils } from './src/utils/locationUtils';
import { CONFIG } from './src/config';

function App(): React.JSX.Element {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        // Initialize FCM service
        console.log('🚀 App: Initializing FCM service...');
        const fcmInitialized = await fcmService.initialize();

        if (fcmInitialized) {
          console.log('✅ App: FCM service initialized successfully');
          console.log('📝 App: FCM token will be registered after user authentication');
        } else {
          console.warn('⚠️ App: FCM service initialization failed');
        }

        // Initialize Location Utils with Google Maps API key
        console.log('🗺️ App: Initializing Location Utils...');
        await locationUtils.initialize(CONFIG.GOOGLE_MAPS_API_KEY);
        console.log('✅ App: Location Utils initialized with Google Maps API key');

        // Request location permission at app startup (once only)
        console.log('📍 App: Requesting location permission at startup...');
        const locationPermission = await locationUtils.requestLocationPermission();
        if (locationPermission.granted) {
          console.log('✅ App: Location permission granted at startup');
        } else {
          console.log('⚠️ App: Location permission denied at startup - will request again when needed');
        }

      } catch (error) {
        console.error('❌ App: Service initialization error:', error);
      }
    };

    initializeServices();
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
