import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

interface NotificationSection {
  title: string;
  settings: NotificationSetting[];
}

const NotificationPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [notificationSections, setNotificationSections] = useState<NotificationSection[]>([
    {
      title: 'In-App Notifications',
      settings: [
        {
          id: 'new-orders',
          title: 'New Orders',
          description: 'Receive notifications for new orders.',
          enabled: true,
        },
        {
          id: 'order-updates',
          title: 'Order Updates',
          description: 'Get updates on order status.',
          enabled: false,
        },
        {
          id: 'low-stock',
          title: 'Low Stock Alerts',
          description: 'Be alerted when stock is low.',
          enabled: true,
        },
        {
          id: 'promotions',
          title: 'Promotions',
          description: 'Receive promotional offers.',
          enabled: false,
        },
        {
          id: 'announcements',
          title: 'Announcements',
          description: 'Important announcements.',
          enabled: true,
        },
      ],
    },
    {
      title: 'Push Notifications',
      settings: [
        {
          id: 'push-orders',
          title: 'Order Notifications',
          description: 'Push notifications for new orders.',
          enabled: true,
        },
        {
          id: 'push-messages',
          title: 'Customer Messages',
          description: 'Push notifications for customer messages.',
          enabled: true,
        },
        {
          id: 'push-payments',
          title: 'Payment Updates',
          description: 'Push notifications for payment updates.',
          enabled: false,
        },
      ],
    },
    {
      title: 'Email Notifications',
      settings: [
        {
          id: 'email-daily',
          title: 'Daily Summary',
          description: 'Daily summary of orders and sales.',
          enabled: true,
        },
        {
          id: 'email-weekly',
          title: 'Weekly Reports',
          description: 'Weekly performance reports.',
          enabled: false,
        },
        {
          id: 'email-marketing',
          title: 'Marketing Updates',
          description: 'Marketing tips and updates.',
          enabled: false,
        },
      ],
    },
  ]);

  const handleBack = () => {
    navigation.goBack();
  };

  const toggleNotification = (sectionIndex: number, settingId: string) => {
    setNotificationSections(prev => 
      prev.map((section, index) => 
        index === sectionIndex
          ? {
              ...section,
              settings: section.settings.map(setting =>
                setting.id === settingId
                  ? { ...setting, enabled: !setting.enabled }
                  : setting
              ),
            }
          : section
      )
    );
  };

  const handleSave = () => {
    Alert.alert(
      'Success',
      'Notification preferences saved successfully!',
      [{ text: 'OK' }]
    );
  };

  const renderNotificationSetting = (
    setting: NotificationSetting,
    sectionIndex: number
  ) => (
    <View key={setting.id} style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{setting.title}</Text>
        <Text style={styles.settingDescription}>{setting.description}</Text>
      </View>
      <Switch
        value={setting.enabled}
        onValueChange={() => toggleNotification(sectionIndex, setting.id)}
        trackColor={{ false: '#e5e7eb', true: '#3be340' }}
        thumbColor={setting.enabled ? '#ffffff' : '#ffffff'}
        ios_backgroundColor="#e5e7eb"
      />
    </View>
  );

  const renderSection = (section: NotificationSection, index: number) => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.settings.map((setting, settingIndex) => (
          <View key={setting.id}>
            {renderNotificationSetting(setting, index)}
            {settingIndex < section.settings.length - 1 && (
              <View style={styles.settingDivider} />
            )}
          </View>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {notificationSections.map(renderSection)}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: 'rgba(246, 248, 246, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 227, 64, 0.2)',
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
    paddingTop: 24,
    paddingBottom: 100,
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f6f8f6',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#3be340',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#112112',
  },
});

export default NotificationPreferencesScreen;
