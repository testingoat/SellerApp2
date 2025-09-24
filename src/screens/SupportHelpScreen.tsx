import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface SupportOption {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

interface HelpTopic {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

const SupportHelpScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleChatSupport = () => {
    Alert.alert(
      'Chat Support',
      'Chat support will be available soon. For immediate assistance, please call or email us.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailSupport = async () => {
    const email = 'support@freshly.com';
    const subject = 'Support Request';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Email client not available');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open email client');
    }
  };

  const handleCallSupport = async () => {
    const phoneNumber = '+1-800-FRESHLY';
    const url = `tel:${phoneNumber}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Phone calls are not supported on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call');
    }
  };

  const handleGettingStarted = () => {
    Alert.alert(
      'Getting Started',
      'Welcome to Goat Goat! Here are some quick tips to get you started:\n\n• Set up your store profile\n• Add your products\n• Configure payment methods\n• Start receiving orders!',
      [{ text: 'OK' }]
    );
  };

  const handleOrderManagement = () => {
    Alert.alert(
      'Order Management',
      'Learn how to:\n\n• Accept and reject orders\n• Track order status\n• Communicate with customers\n• Handle refunds and returns',
      [{ text: 'OK' }]
    );
  };

  const handlePaymentIssues = () => {
    Alert.alert(
      'Payment Issues',
      'Common payment topics:\n\n• Setting up bank accounts\n• Payout schedules\n• Transaction fees\n• Payment disputes',
      [{ text: 'OK' }]
    );
  };

  const handleAccountSettings = () => {
    Alert.alert(
      'Account Settings',
      'Manage your account:\n\n• Update profile information\n• Change password\n• Notification preferences\n• Privacy settings',
      [{ text: 'OK' }]
    );
  };

  const supportOptions: SupportOption[] = [
    {
      id: 'chat',
      title: 'Chat with Support',
      icon: 'chat-bubble',
      onPress: handleChatSupport,
    },
    {
      id: 'email',
      title: 'Email Support',
      icon: 'email',
      onPress: handleEmailSupport,
    },
    {
      id: 'call',
      title: 'Call Support',
      icon: 'call',
      onPress: handleCallSupport,
    },
  ];

  const helpTopics: HelpTopic[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket-launch',
      onPress: handleGettingStarted,
    },
    {
      id: 'order-management',
      title: 'Order Management',
      icon: 'inventory-2',
      onPress: handleOrderManagement,
    },
    {
      id: 'payment-issues',
      title: 'Payment Issues',
      icon: 'payment',
      onPress: handlePaymentIssues,
    },
    {
      id: 'account-settings',
      title: 'Account Settings',
      icon: 'settings',
      onPress: handleAccountSettings,
    },
  ];

  const renderSupportOption = (option: SupportOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.supportOption}
      onPress={option.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.supportOptionIcon}>
        <Icon name={option.icon} size={24} color="#3be340" />
      </View>
      <Text style={styles.supportOptionTitle}>{option.title}</Text>
    </TouchableOpacity>
  );

  const renderHelpTopic = (topic: HelpTopic) => (
    <TouchableOpacity
      key={topic.id}
      style={styles.helpTopic}
      onPress={topic.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.helpTopicIcon}>
        <Icon name={topic.icon} size={24} color="#6b7280" />
      </View>
      <Text style={styles.helpTopicTitle}>{topic.title}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Contact Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Support</Text>
            <View style={styles.supportOptions}>
              {supportOptions.map(renderSupportOption)}
            </View>
          </View>

          {/* Help Center Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Help Center</Text>
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for help"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Popular Topics Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Topics</Text>
            <View style={styles.helpTopics}>
              {helpTopics.map(renderHelpTopic)}
            </View>
          </View>
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
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
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
    flex: 1,
    textAlign: 'center',
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
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  supportOptions: {
    gap: 12,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 16,
  },
  supportOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 227, 64, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 18,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingLeft: 44,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  helpTopics: {
    gap: 8,
  },
  helpTopic: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 16,
  },
  helpTopicIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpTopicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
  },
});

export default SupportHelpScreen;
