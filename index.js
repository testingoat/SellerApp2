/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📦 Background Message Handler: Message handled in the background!', remoteMessage);
  
  // You can perform background tasks here like:
  // - Update local storage
  // - Trigger local notifications
  // - Update app badge count
  
  // Note: Keep this handler lightweight and fast
  // Heavy processing should be avoided
});

AppRegistry.registerComponent(appName, () => App);
