import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { fcmService } from '../../services/fcmService';

const FCMTestScreen: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetStatus = async () => {
    setLoading(true);
    try {
      const fcmStatus = await fcmService.getStatus();
      setStatus(fcmStatus);
      console.log('📊 FCM Status:', fcmStatus);
    } catch (error) {
      console.error('Error getting FCM status:', error);
      Alert.alert('Error', 'Failed to get FCM status');
    }
    setLoading(false);
  };

  const handleGetToken = async () => {
    setLoading(true);
    try {
      const fcmToken = await fcmService.getToken();
      setToken(fcmToken);
      console.log('🎫 FCM Token:', fcmToken);
    } catch (error) {
      console.error('Error getting FCM token:', error);
      Alert.alert('Error', 'Failed to get FCM token');
    }
    setLoading(false);
  };

  const handleRegisterToken = async () => {
    setLoading(true);
    try {
      const success = await fcmService.registerTokenWithServer();
      if (success) {
        Alert.alert('Success', 'FCM token registered with server');
      } else {
        Alert.alert('Failed', 'FCM token registration failed');
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      Alert.alert('Error', 'Failed to register FCM token');
    }
    setLoading(false);
  };

  const handleSendTestNotification = async () => {
    setLoading(true);
    try {
      const success = await fcmService.sendTestNotification();
      if (success) {
        Alert.alert('Success', 'Test notification sent');
      } else {
        Alert.alert('Failed', 'Test notification failed');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
    setLoading(false);
  };

  const TestButton = ({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) => (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FCM Test Screen</Text>
        <Text style={styles.subtitle}>Test Firebase Cloud Messaging integration</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Status</Text>
        <TestButton title="Get FCM Status" onPress={handleGetStatus} />
        
        {status && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Initialized: {status.initialized ? '✅' : '❌'}</Text>
            <Text style={styles.statusLabel}>Has Token: {status.hasToken ? '✅' : '❌'}</Text>
            <Text style={styles.statusLabel}>Has Permission: {status.hasPermission ? '✅' : '❌'}</Text>
            <Text style={styles.statusLabel}>Server Connected: {status.serverConnected ? '✅' : '❌'}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token</Text>
        <TestButton title="Get FCM Token" onPress={handleGetToken} />
        
        {token && (
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Full FCM Token:</Text>
            <Text style={styles.tokenText}>{token}</Text>
            <Text style={styles.tokenLabel}>Token Length: {token.length}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Integration</Text>
        <TestButton title="Register Token with Server" onPress={handleRegisterToken} />
        <TestButton title="Send Test Notification" onPress={handleSendTestNotification} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructions</Text>
        <Text style={styles.instructionText}>
          1. First, get FCM status to see if everything is initialized{'\n'}
          2. Get FCM token to verify token generation works{'\n'}
          3. Register token with server (requires authentication){'\n'}
          4. Send test notification to verify end-to-end functionality{'\n'}
          5. Check console logs for detailed debugging information
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#666666',
  },
  statusContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  statusLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  tokenContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  tokenText: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: '#eee',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default FCMTestScreen;