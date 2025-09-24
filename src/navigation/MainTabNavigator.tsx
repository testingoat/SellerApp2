import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import MainDashboardScreen from '../screens/MainDashboardScreen';
import ProductListScreen from '../screens/ProductListScreen';
import OrderProcessingListScreen from '../screens/OrderProcessingListScreen';
import SalesAnalyticsScreen from '../screens/SalesAnalyticsScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';

export type TabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Orders: undefined;
  Analytics: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const MainTabNavigator: React.FC = () => {
  console.log('🏠 MainTabNavigator is rendering!');
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Products':
              iconName = 'inventory';
              break;
            case 'Orders':
              iconName = 'receipt';
              break;
            case 'Analytics':
              iconName = 'analytics';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            default:
              iconName = 'dashboard';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3be340',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#f6f8f6',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          fontFamily: 'Work Sans',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={MainDashboardScreen}
      />
      <Tab.Screen name="Products" component={ProductListScreen} />
      <Tab.Screen name="Orders" component={OrderProcessingListScreen} />
      <Tab.Screen name="Analytics" component={SalesAnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileSettingsScreen} />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;