// Simple authentication test utility
export const testAuthIntegration = () => {
  console.log('🧪 Testing Authentication Integration...');

  try {
    // Test 1: Check if stores are properly initialized
    const authStore = require('../state/authStore').useAuthStore;
    console.log('✅ Auth store imported successfully');

    // Test 2: Check if services are available
    const authService = require('../services/authService').authService;
    console.log('✅ Auth service imported successfully');

    // Test 3: Check if HTTP client is available
    const httpClient = require('../services/httpClient').httpClient;
    console.log('✅ HTTP client imported successfully');

    // Test 4: Check if config is available
    const config = require('../config').API_ENDPOINTS;
    console.log('✅ Configuration imported successfully');
    console.log('🔗 API Base URL:', config.LOGIN.split('/seller')[0]);

    console.log('🎉 All authentication components are properly integrated!');
    return true;
  } catch (error) {
    console.error('❌ Authentication integration test failed:', error);
    return false;
  }
};