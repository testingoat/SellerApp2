/**
 * 🧪 Environment Test Component
 * 
 * This component displays the current environment configuration
 * to verify automatic server switching works correctly:
 * - Debug builds should show staging server (port 4000)
 * - Release builds should show production server (port 3000)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import environment from '../config/environment';

export const EnvironmentTest: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌍 Environment Status</Text>
      <Text style={styles.info}>Environment: {environment.ENVIRONMENT.toUpperCase()}</Text>
      <Text style={styles.info}>API Base URL: {environment.API_BASE_URL}</Text>
      <Text style={styles.info}>Debug Mode: {environment.DEBUG_MODE ? 'ON' : 'OFF'}</Text>
      <Text style={styles.info}>Build Type: {__DEV__ ? 'DEBUG' : 'RELEASE'}</Text>
      
      <View style={[styles.badge, { backgroundColor: environment.ENVIRONMENT === 'staging' ? '#FFA500' : '#FF4444' }]}>
        <Text style={styles.badgeText}>
          {environment.ENVIRONMENT === 'staging' ? '🟡 STAGING SERVER' : '🔴 PRODUCTION SERVER'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  badge: {
    marginTop: 10,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default EnvironmentTest;