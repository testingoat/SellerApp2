import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { httpClient } from './httpClient';
import { secureStorageService, SECURE_STORAGE_KEYS } from './secureStorage';

interface FCMNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface FCMTokenInfo {
  token: string;
  platform: 'android' | 'ios';
  registeredAt: string;
}

class FCMService {
  private initialized = false;
  private currentToken: string | null = null;

  /**
   * Initialize FCM service
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔥 FCMService: Initializing Firebase Cloud Messaging...');

      // Check if Firebase is available
      if (!messaging()) {
        console.error('❌ FCMService: Firebase messaging not available');
        return false;
      }

      // Request permission for notifications
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.warn('⚠️ FCMService: Notification permission not granted');
        return false;
      }

      // Get FCM token
      await this.getToken();

      // Setup message handlers
      this.setupMessageHandlers();

      // Setup token refresh handler
      this.setupTokenRefreshHandler();

      this.initialized = true;
      console.log('✅ FCMService: Initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ FCMService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      console.log('🔔 FCMService: Requesting notification permissions...');

      if (Platform.OS === 'android') {
        // For Android 13+ (API level 33+), request notification permission
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs access to notifications to keep you updated about orders and important updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('⚠️ FCMService: Android notification permission denied');
            return false;
          }
        }
        // For older Android versions, permission is granted by default
        console.log('✅ FCMService: Android notification permission granted');
        return true;
      }

      // For iOS, request permission through Firebase
      const authStatus = await messaging().requestPermission({
        sound: true,
        announcement: true,
        badge: true,
        alert: true,
      });

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ FCMService: iOS notification permission granted');
        return true;
      } else {
        console.warn('⚠️ FCMService: iOS notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ FCMService: Permission request failed:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getToken(): Promise<string | null> {
    try {
      if (!this.initialized && !messaging()) {
        console.error('❌ FCMService: Service not initialized');
        return null;
      }

      const token = await messaging().getToken();
      if (token) {
        console.log('🎫 FCMService: Token obtained successfully');
        console.log('🔍 FCMService: Token length:', token.length);
        
        this.currentToken = token;
        
        // Store token locally
        await this.storeTokenLocally(token);
        
        return token;
      } else {
        console.error('❌ FCMService: No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('❌ FCMService: Failed to get token:', error);
      return null;
    }
  }

  /**
   * Store FCM token locally
   */
  private async storeTokenLocally(token: string): Promise<void> {
    try {
      const tokenInfo: FCMTokenInfo = {
        token,
        platform: Platform.OS as 'android' | 'ios',
        registeredAt: new Date().toISOString(),
      };

      await secureStorageService.setSecureItem(
        SECURE_STORAGE_KEYS.FCM_TOKEN,
        JSON.stringify(tokenInfo)
      );
      console.log('💾 FCMService: Token stored locally');
    } catch (error) {
      console.error('❌ FCMService: Failed to store token locally:', error);
    }
  }

  /**
   * Get stored FCM token
   */
  async getStoredToken(): Promise<FCMTokenInfo | null> {
    try {
      const tokenData = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.FCM_TOKEN);
      if (tokenData) {
        return JSON.parse(tokenData) as FCMTokenInfo;
      }
      return null;
    } catch (error) {
      console.error('❌ FCMService: Failed to get stored token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with server
   */
  async registerTokenWithServer(): Promise<boolean> {
    try {
      const token = this.currentToken || await this.getToken();
      if (!token) {
        console.error('❌ FCMService: No token available for server registration');
        return false;
      }

      console.log('🔄 FCMService: Registering token with server...');

      // We need to add this endpoint to the server
      const response = await httpClient.put('/seller/fcm-token', {
        fcmToken: token,
        platform: Platform.OS,
        deviceInfo: {
          platform: Platform.OS,
          version: Platform.Version,
        },
      });

      if (response.success) {
        console.log('✅ FCMService: Token registered with server');
        return true;
      } else {
        console.error('❌ FCMService: Server registration failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ FCMService: Server registration error:', error);
      return false;
    }
  }

  /**
   * Setup message handlers for foreground and background notifications
   */
  private setupMessageHandlers(): void {
    console.log('🔧 FCMService: Setting up message handlers...');

    // Foreground message handler
    messaging().onMessage(async (remoteMessage) => {
      console.log('📱 FCMService: Foreground notification received:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // Background message handler (when app is in background but not killed)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 FCMService: Background notification opened:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    // App opened from killed state via notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📱 FCMService: App opened from killed state via notification:', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });

    console.log('✅ FCMService: Message handlers setup complete');
  }

  /**
   * Setup token refresh handler
   */
  private setupTokenRefreshHandler(): void {
    console.log('🔧 FCMService: Setting up token refresh handler...');

    messaging().onTokenRefresh(async (token) => {
      console.log('🔄 FCMService: Token refreshed:', token.substring(0, 20) + '...');
      
      this.currentToken = token;
      await this.storeTokenLocally(token);
      
      // Register new token with server
      await this.registerTokenWithServer();
    });

    console.log('✅ FCMService: Token refresh handler setup complete');
  }

  /**
   * Handle foreground notifications (when app is active)
   */
  private handleForegroundMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      // Show alert for foreground notifications
      Alert.alert(
        notification.title || 'Notification',
        notification.body || 'You have a new notification',
        [
          {
            text: 'Dismiss',
            style: 'cancel',
          },
          {
            text: 'View',
            onPress: () => this.handleNotificationTap(remoteMessage),
          },
        ]
      );
    }

    // You can also update app state, show in-app notifications, etc.
    this.updateNotificationBadge(data);
  }

  /**
   * Handle notification tap (when user taps on notification)
   */
  private handleNotificationTap(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { data } = remoteMessage;
    
    console.log('👆 FCMService: User tapped notification with data:', data);

    // Handle different notification types
    if (data?.type) {
      switch (data.type) {
        case 'new_order':
          this.navigateToOrder(data.orderId);
          break;
        case 'order_update':
          this.navigateToOrder(data.orderId);
          break;
        case 'system_update':
          this.navigateToSettings();
          break;
        case 'promotion':
          this.navigateToPromotions();
          break;
        default:
          this.navigateToNotifications();
          break;
      }
    } else {
      // Default: navigate to notifications screen
      this.navigateToNotifications();
    }
  }

  /**
   * Update notification badge count
   */
  private updateNotificationBadge(data: Record<string, string> | undefined): void {
    // Implementation depends on your notification center setup
    // For now, just log
    console.log('🔢 FCMService: Updating notification badge with data:', data);
  }

  /**
   * Navigation helpers
   */
  private navigateToOrder(orderId?: string): void {
    // TODO: Implement navigation to order screen
    console.log('📦 FCMService: Navigate to order:', orderId);
  }

  private navigateToSettings(): void {
    // TODO: Implement navigation to settings
    console.log('⚙️ FCMService: Navigate to settings');
  }

  private navigateToPromotions(): void {
    // TODO: Implement navigation to promotions
    console.log('🎯 FCMService: Navigate to promotions');
  }

  private navigateToNotifications(): void {
    // TODO: Implement navigation to notifications screen
    console.log('🔔 FCMService: Navigate to notifications');
  }

  /**
   * Send test notification (for debugging)
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.error('❌ FCMService: No token available for test');
        return false;
      }

      console.log('🧪 FCMService: Sending test notification...');

      const response = await httpClient.post('/notifications/test', {
        fcmToken: token,
      });

      if (response.success) {
        console.log('✅ FCMService: Test notification sent');
        return true;
      } else {
        console.error('❌ FCMService: Test notification failed:', response.message);
        return false;
      }
    } catch (error) {
      console.error('❌ FCMService: Test notification error:', error);
      return false;
    }
  }

  /**
   * Check FCM service status
   */
  async getStatus(): Promise<{
    initialized: boolean;
    hasToken: boolean;
    hasPermission: boolean;
    serverConnected: boolean;
  }> {
    const hasPermission = await messaging().hasPermission();
    const hasToken = !!this.currentToken;
    
    let serverConnected = false;
    try {
      const response = await httpClient.get('/notifications/fcm-status');
      serverConnected = response.success && response.status?.firebaseInitialized;
    } catch (error) {
      console.warn('⚠️ FCMService: Could not check server status:', error);
    }

    return {
      initialized: this.initialized,
      hasToken,
      hasPermission: hasPermission === messaging.AuthorizationStatus.AUTHORIZED,
      serverConnected,
    };
  }

  /**
   * Clear stored FCM data
   */
  async clearData(): Promise<void> {
    try {
      await secureStorageService.removeSecureItem(SECURE_STORAGE_KEYS.FCM_TOKEN);
      this.currentToken = null;
      this.initialized = false;
      console.log('✅ FCMService: Data cleared');
    } catch (error) {
      console.error('❌ FCMService: Failed to clear data:', error);
    }
  }
}

// Export singleton instance
export const fcmService = new FCMService();
export default fcmService;