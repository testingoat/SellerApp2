import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../state/authStore';

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
}

const ProfileSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing functionality will be implemented');
  };

  const handleStoreInfo = () => {
    navigation.navigate('StoreInformation' as never);
  };

  const handleStoreLocation = () => {
    navigation.navigate('StoreLocationManagement' as never);
  };

  const handleBusinessHours = () => {
    navigation.navigate('BusinessHoursManagement' as never);
  };

  const handleDeliveryArea = () => {
    navigation.navigate('DeliveryArea' as never);
  };

  const handlePaymentMethods = () => {
    navigation.navigate('ManagePaymentMethods' as never);
  };

  const handlePayoutPreferences = () => {
    navigation.navigate('PayoutPreferences' as never);
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationPreferences' as never);
  };

  const handleHelpCenter = () => {
    navigation.navigate('SupportHelp' as never);
  };

  const handleLanguageSettings = () => {
    navigation.navigate('LanguageSettings' as never);
  };

  const handleFCMTest = () => {
    navigation.navigate('FCMTest' as never);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: async () => {
          try {
            console.log('🚪 Logging out user...');
            // Use auth store logout - this will clear tokens and update state
            await logout();
            console.log('🚀 Logout successful - navigation will happen automatically');
            // Navigation will happen automatically when isAuthenticated becomes false
          } catch (error) {
            console.error('❌ Logout failed:', error);
            Alert.alert('Error', 'Failed to logout. Please try again.');
          }
        }},
      ]
    );
  };

  // Build App Settings items dynamically based on build type
  const appSettingsItems: SettingsItem[] = [
    {
      id: 'language',
      title: 'Language Preferences',
      description: 'Choose your preferred language',
      icon: 'language',
      onPress: handleLanguageSettings,
    },
    {
      id: 'dark-mode',
      title: 'Dark Mode',
      description: 'Enable or disable dark theme',
      icon: 'dark-mode',
      isToggle: true,
      toggleValue: isDark,
      onToggle: toggleTheme,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Customize your notification preferences',
      icon: 'notifications',
      onPress: handleNotifications,
    },
  ];

  // Add FCM Test button ONLY in Debug builds (__DEV__ is true in Debug, false in Release)
  if (__DEV__) {
    appSettingsItems.push({
      id: 'fcm-test',
      title: 'FCM Test',
      description: 'Test Firebase Cloud Messaging functionality',
      icon: 'bug-report',
      onPress: handleFCMTest,
    });
  }

  const settingsSections: SettingsSection[] = [
    {
      title: 'Store Settings',
      items: [
        {
          id: 'store-info',
          title: 'Store Information',
          description: 'Edit store name, address, and contact',
          icon: 'storefront',
          onPress: handleStoreInfo,
        },
        {
          id: 'store-location',
          title: 'Store Location',
          description: 'Set your store location on map',
          icon: 'location-on',
          onPress: handleStoreLocation,
        },
        {
          id: 'business-hours',
          title: 'Business Hours',
          description: 'Set your store\'s operating hours',
          icon: 'schedule',
          onPress: handleBusinessHours,
        },
        {
          id: 'delivery-area',
          title: 'Delivery Area',
          description: 'Manage the areas where you deliver',
          icon: 'map',
          onPress: handleDeliveryArea,
        },
      ],
    },
    {
      title: 'Payment and Payout Settings',
      items: [
        {
          id: 'payment-methods',
          title: 'Payment Methods',
          description: 'Add or update your payment details',
          icon: 'payment',
          onPress: handlePaymentMethods,
        },
        {
          id: 'payout-preferences',
          title: 'Payout Preferences',
          description: 'Configure your payout schedule and method',
          icon: 'account-balance-wallet',
          onPress: handlePayoutPreferences,
        },
      ],
    },
    {
      title: 'App Settings',
      items: appSettingsItems,
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help-center',
          title: 'Help Center',
          description: '',
          icon: 'help-center',
          onPress: handleHelpCenter,
        },
      ],
    },
  ];

  const renderSettingsSection = (section: SettingsSection) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map((item) => (
          item.isToggle ? (
            <View key={item.id} style={styles.settingsItem}>
              <View style={styles.settingsIcon}>
                <Icon name={item.icon} size={24} color="#3be340" />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.settingsDescription}>{item.description}</Text>
                ) : null}
              </View>
              <Switch
                value={item.toggleValue}
                onValueChange={item.onToggle}
                trackColor={{ false: '#e5e7eb', true: '#3be340' }}
                thumbColor={item.toggleValue ? '#ffffff' : '#ffffff'}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          ) : (
            <TouchableOpacity
              key={item.id}
              style={styles.settingsItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.settingsIcon}>
                <Icon name={item.icon} size={24} color="#3be340" />
              </View>
              <View style={styles.settingsInfo}>
                <Text style={styles.settingsTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.settingsDescription}>{item.description}</Text>
                ) : null}
              </View>
              <Icon name="chevron-right" size={24} color="#9ca3af" />
            </TouchableOpacity>
          )
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApmt5hC80-1SjdaNTs5vATPiWGFToy0DL4OIoshJWbvSIOT19OKE0ySnY-OIVdmL_UCs1BZ_XpdtYwDXbWalK9rxv-qalVfAq0vC6AkcmOHKTkc4g2LRwcYRjzf48tPv0Hfb0Bj_YBbwJU_0vEfJTObf5kaIKwO1D-DN9qlexaQBkEPiWEatmqA9h3W3Ue9XjcM_iwIgeUDfARuWi4WJShbqyOGaXiD3-l310TEl_OMNSeCWMH0jr4CuudsKWXu5wvaCtjdAEsF00'
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                <Icon name="edit" size={16} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.storeName || user?.name || 'Store Name'}
              </Text>
              <Text style={styles.profileRole}>Store Owner</Text>
              <Text style={styles.profileId}>
                Store ID: {user?.id ? user.id.slice(-6).toUpperCase() : 'XXXXXX'}
              </Text>
            </View>
          </View>

          {/* Settings Sections */}
          {settingsSections.map(renderSettingsSection)}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(246, 248, 246, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  editProfileButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: '#3be340',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  profileRole: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileId: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 16,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingsDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },

});

export default ProfileSettingsScreen;
