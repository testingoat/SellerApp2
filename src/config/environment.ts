/**
 * 🌍 ENVIRONMENT CONFIGURATION
 * 
 * Automatically switches between staging and production servers based on build type:
 * - Debug builds → Staging server (port 4000)
 * - Release builds → Production server (port 3000)
 * 
 * This ensures:
 * ✅ Development always uses staging
 * ✅ Play Store APK always uses production
 * ✅ Zero manual intervention required
 */

export interface EnvironmentConfig {
  API_BASE_URL: string;
  FCM_ENDPOINT: string;
  DEBUG_MODE: boolean;
  ENVIRONMENT: 'staging' | 'production';
}

const environments = {
  staging: {
    API_BASE_URL: 'http://147.93.108.121:4000',  // 🟡 STAGING SERVER
    FCM_ENDPOINT: '/admin/fcm-management',
    DEBUG_MODE: true,
    ENVIRONMENT: 'staging' as const,
  },
  production: {
    API_BASE_URL: 'http://147.93.108.121:3000',  // 🔴 PRODUCTION SERVER
    FCM_ENDPOINT: '/admin/fcm-management',
    DEBUG_MODE: false,
    ENVIRONMENT: 'production' as const,
  },
};

/**
 * 🎯 AUTOMATIC ENVIRONMENT DETECTION
 * 
 * __DEV__ is a React Native global that's:
 * - true in debug builds
 * - false in release builds
 */
const config: EnvironmentConfig = __DEV__ 
  ? environments.staging    // 🛠️ Debug → Staging
  : environments.production; // 📱 Release → Production

console.log(`🌍 Environment: ${config.ENVIRONMENT.toUpperCase()}`);
console.log(`🔗 API Base URL: ${config.API_BASE_URL}`);

export default config;