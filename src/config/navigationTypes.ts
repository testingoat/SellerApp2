// Navigation type definitions for SellerApp2
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// Auth Stack Types
export type AuthStackParamList = {
  Login: undefined;
  OTPVerification: { phoneNumber?: string };
  StoreRegistration: undefined;
};

// Main Stack Types
export type MainStackParamList = {
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
  FCMTest: undefined;
};

// Tab Types
export type TabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Analytics: undefined;
  Profile: undefined;
};

// Navigation Props
export type AuthStackNavigationProp = StackNavigationProp<AuthStackParamList>;
export type MainStackNavigationProp = StackNavigationProp<MainStackParamList>;
export type TabNavigationProp = BottomTabNavigationProp<TabParamList>;

// Screen-specific navigation props
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type OTPVerificationScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'OTPVerification'>;