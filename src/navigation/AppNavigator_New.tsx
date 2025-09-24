import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

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
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';

// Import navigation components
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  MainTabs: undefined;
  NetworkError: {
    onRetry?: () => void;
    title?: string;
    message?: string;
    showBackButton?: boolean;
  };
  StoreRegistration: undefined;
  AddEditProduct: { product?: any };
  BankAccount: undefined;
  ManagePaymentMethods: undefined;
  OrderTimeline: { orderId?: string };
  CustomerCommunication: { customer?: any };
  DigitalWallet: undefined;
  Notifications: undefined;
  PayoutPreferences: undefined;
  SupportHelp: undefined;
  BusinessHoursManagement: undefined;
  DeliveryArea: undefined;
  NotificationPreferences: undefined;
  StoreInformation: undefined;
  LanguageSettings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen name="Splash">
          {({ navigation }) => (
            <SplashScreen
              onFinish={() => navigation.replace('Auth')}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Auth" component={AuthNavigator} />

        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        <Stack.Screen name="StoreRegistration">
          {({ navigation }) => (
            <StoreRegistrationScreen
              onComplete={() => navigation.replace('MainTabs')}
              onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Auth')}
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
        <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />

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