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

const environments = {
  staging: {
    API_BASE_URL: 'http://147.93.108.121:4000',  // 🟡 STAGING SERVER
    FCM_ENDPOINT: '/admin/fcm-management',
    DEBUG_MODE: true,
    ENVIRONMENT: 'staging',
  },
  production: {
    API_BASE_URL: 'http://147.93.108.121:3000',  // 🔴 PRODUCTION SERVER
    FCM_ENDPOINT: '/admin/fcm-management',
    DEBUG_MODE: false,
    ENVIRONMENT: 'production',
  },
};

/**
 * 🎯 AUTOMATIC ENVIRONMENT DETECTION
 * 
 * __DEV__ is a React Native global that's:
 * - true in debug builds
 * - false in release builds
 */
// Check if __DEV__ exists (React Native environment) or use Node.js fallback
const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const config = isDevelopment
  ? environments.staging    // 🛠️ Debug → Staging
  : environments.production; // 📱 Release → Production

console.log(`🌍 Environment: ${config.ENVIRONMENT.toUpperCase()}`);
console.log(`🔗 API Base URL: ${config.API_BASE_URL}`);

export default config;
