import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../state/authStore';
import LoginScreen from '../screens/LoginScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import StoreRegistrationScreen from '../screens/StoreRegistrationScreen';

export type AuthStackParamList = {
  Login: undefined;
  OTPVerification: { phoneNumber?: string };
  StoreRegistration: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const { isAuthenticated, tempPhone } = useAuthStore();

  if (isAuthenticated) {
    return null; // Parent navigator will handle redirect to MainTabs
  }

  return (
    <Stack.Navigator
      initialRouteName="Login"
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
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        initialParams={{
          phoneNumber: tempPhone,
        }}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StoreRegistration"
        component={StoreRegistrationScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;