import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../state/authStore';
import { MainStackParamList } from '../config/navigationTypes';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import NetworkErrorScreen from '../screens/NetworkErrorScreen';
import StoreRegistrationScreen from '../screens/StoreRegistrationScreen';
import AddEditProductScreen from '../screens/AddEditProductScreen';
import BankAccountScreen from '../screens/BankAccountScreen';
import ManagePaymentMethodsScreen from '../screens/ManagePaymentMethodsScreen';
import OrderTimelineScreen from '../screens/OrderTimelineScreen';
import CustomerCommunicationScreen from '../screens/CustomerCommunicationScreen';
import DigitalWalletScreen from '../screens/DigitalWalletScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PayoutPreferencesScreen from '../screens/PayoutPreferencesScreen';
import SupportHelpScreen from '../screens/SupportHelpScreen';
import BusinessHoursManagementScreen from '../screens/BusinessHoursManagementScreen';
import DeliveryAreaScreen from '../screens/DeliveryAreaScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import StoreInformationScreen from '../screens/StoreInformationScreen';
import StoreLocationManagementScreen from '../screens/StoreLocationManagementScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import FCMTestScreen from '../screens/main/FCMTestScreen';

// Import navigation components
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

const Stack = createStackNavigator<MainStackParamList>();

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isBootLoading, initializeAuth, setBootLoading, user, isNewUser } = useAuthStore();
  const hasInitializedRef = React.useRef(false);
  
  // Determine if user needs registration
  const needsRegistration = isAuthenticated && (isNewUser || !user?.profileCompleted);
  
  console.log('🔍 AppNavigator render - isBootLoading:', isBootLoading, 'isAuthenticated:', isAuthenticated);
  console.log('🔍 User state:', { isNewUser, profileCompleted: user?.profileCompleted, needsRegistration });
  console.log('🔍 Navigation will show:', isBootLoading ? 'SPLASH' : (isAuthenticated ? (needsRegistration ? 'STORE_REGISTRATION' : 'MAIN_TABS') : 'AUTH'));

  React.useEffect(() => {
    // Only run once on mount
    if (!hasInitializedRef.current) {
      console.log('🔄 Initializing auth (once only)...');
      hasInitializedRef.current = true;
      
      // Initialize auth
      initializeAuth().catch(error => {
        console.error('Auth init failed:', error);
        setBootLoading(false);
      });
      
      // Fallback timer - force completion after 3 seconds
      const timer = setTimeout(() => {
        console.log('⏰ Timeout reached! Current boot loading state:', useAuthStore.getState().isBootLoading);
        console.log('⏰ Forcing completion...');
        setBootLoading(false);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, []); // Empty dependency array - run only once on mount

  if (isBootLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash">
            {({ navigation }) => (
              <SplashScreen
                onFinish={() => {
                  // This will be handled by the auth state change
                  // The splash will automatically disappear when isLoading becomes false
                }}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  console.log('📺 Rendering main navigation. Will show:', isAuthenticated ? (needsRegistration ? 'StoreRegistration' : 'MainTabs') : 'Auth');
  
  // Use conditional rendering instead of initialRouteName for dynamic auth state
  if (isAuthenticated && needsRegistration) {
    console.log('🏪 User is authenticated but needs registration - showing StoreRegistration');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="StoreRegistration">
            {({ navigation }) => (
              <StoreRegistrationScreen
                onComplete={() => {
                  console.log('🏆 Store registration completed - navigating to MainTabs');
                  navigation.replace('MainTabs');
                }}
                onBack={() => {
                  // For new users, back should go to auth flow
                  navigation.replace('Auth');
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="NetworkError">
            {({ navigation, route }) => (
              <NetworkErrorScreen
                onRetry={route.params?.onRetry || (() => navigation.goBack())}
                onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('StoreRegistration')}
                title={route.params?.title}
                message={route.params?.message}
                showBackButton={route.params?.showBackButton ?? true}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  if (isAuthenticated) {
    console.log('🚀 User is authenticated and profile complete - showing MainTabs');
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          <Stack.Screen name="StoreRegistration">
            {({ navigation }) => (
              <StoreRegistrationScreen
                onComplete={() => navigation.replace('MainTabs')}
                onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="AddEditProduct">
            {({ navigation, route }) => (
              <AddEditProductScreen
                product={route.params?.product}
                onSave={() => navigation.goBack()}
                onBack={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="BankAccount" component={BankAccountScreen} />
          <Stack.Screen name="ManagePaymentMethods" component={ManagePaymentMethodsScreen} />
          <Stack.Screen name="OrderTimeline" component={OrderTimelineScreen} />
          <Stack.Screen name="CustomerCommunication" component={CustomerCommunicationScreen} />
          <Stack.Screen name="DigitalWallet" component={DigitalWalletScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="PayoutPreferences" component={PayoutPreferencesScreen} />
          <Stack.Screen name="SupportHelp" component={SupportHelpScreen} />
          <Stack.Screen name="BusinessHoursManagement" component={BusinessHoursManagementScreen} />
          <Stack.Screen name="DeliveryArea" component={DeliveryAreaScreen} />
          <Stack.Screen name="NotificationPreferences" component={NotificationPreferencesScreen} />
          <Stack.Screen name="StoreInformation" component={StoreInformationScreen} />
          <Stack.Screen name="StoreLocationManagement" component={StoreLocationManagementScreen} />
          <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
          <Stack.Screen name="FCMTest" component={FCMTestScreen} />
          <Stack.Screen name="NetworkError">
            {({ navigation, route }) => (
              <NetworkErrorScreen
                onRetry={route.params?.onRetry || (() => navigation.goBack())}
                onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
                title={route.params?.title}
                message={route.params?.message}
                showBackButton={route.params?.showBackButton ?? true}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  console.log('🔑 User not authenticated - showing Auth');
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="NetworkError">
          {({ navigation, route }) => (
            <NetworkErrorScreen
              onRetry={route.params?.onRetry || (() => navigation.goBack())}
              onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Auth')}
              title={route.params?.title}
              message={route.params?.message}
              showBackButton={route.params?.showBackButton ?? true}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );

};

export default AppNavigator;