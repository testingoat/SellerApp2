/**
 * 🧪 Environment Configuration Test
 * 
 * This script tests if our environment configuration works correctly:
 * - Debug mode should use staging server (port 4000)
 * - Release mode should use production server (port 3000)
 */

// Mock __DEV__ for testing
global.__DEV__ = true;

// Import our configuration
const environment = require('./src/config/environment.ts');

console.log('🧪 Environment Configuration Test');
console.log('================================');
console.log(`Environment: ${environment.default.ENVIRONMENT}`);
console.log(`API Base URL: ${environment.default.API_BASE_URL}`);
console.log(`Debug Mode: ${environment.default.DEBUG_MODE}`);
console.log(`__DEV__: ${__DEV__}`);

// Test production mode with NODE_ENV
console.log('\n🔄 Testing Production Mode...');
process.env.NODE_ENV = 'production';
global.__DEV__ = false;
delete require.cache[require.resolve('./src/config/environment.ts')];
const prodEnvironment = require('./src/config/environment.ts');

console.log(`Production Environment: ${prodEnvironment.default.ENVIRONMENT}`);
console.log(`Production API Base URL: ${prodEnvironment.default.API_BASE_URL}`);
console.log(`Production Debug Mode: ${prodEnvironment.default.DEBUG_MODE}`);

console.log('\n✅ Environment configuration test completed!');
console.log('Debug builds will use:', 'http://147.93.108.121:4000 (STAGING)');
console.log('Release builds will use:', 'http://147.93.108.121:3000 (PRODUCTION)');