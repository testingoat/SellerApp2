import { secureStorageService, SECURE_STORAGE_KEYS, REGULAR_STORAGE_KEYS } from '../services/secureStorage';

export const testStoragePersistence = async (): Promise<void> => {
  console.log('🧪 Testing storage persistence...');
  
  try {
    // Test secure storage
    const testToken = 'test-token-' + Date.now();
    const testUser = { id: '1', name: 'Test User', phone: '+1234567890', role: 'seller', isVerified: true };
    
    console.log('💾 Storing test data...');
    await secureStorageService.setSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN, testToken);
    await secureStorageService.setSecureItem(SECURE_STORAGE_KEYS.USER_DATA, JSON.stringify(testUser));
    
    console.log('📖 Reading test data...');
    const retrievedToken = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN);
    const retrievedUserJson = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.USER_DATA);
    const retrievedUser = retrievedUserJson ? JSON.parse(retrievedUserJson) : null;
    
    console.log('🔍 Results:');
    console.log('  Token match:', retrievedToken === testToken);
    console.log('  User match:', JSON.stringify(retrievedUser) === JSON.stringify(testUser));
    
    // Test regular storage
    await secureStorageService.setItem(REGULAR_STORAGE_KEYS.TEMP_PHONE, '+9876543210');
    const retrievedPhone = await secureStorageService.getItem(REGULAR_STORAGE_KEYS.TEMP_PHONE);
    console.log('  Phone match:', retrievedPhone === '+9876543210');
    
    // Clean up test data
    await secureStorageService.removeSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN);
    await secureStorageService.removeSecureItem(SECURE_STORAGE_KEYS.USER_DATA);
    await secureStorageService.removeItem(REGULAR_STORAGE_KEYS.TEMP_PHONE);
    
    console.log('✅ Storage persistence test completed successfully');
  } catch (error) {
    console.error('❌ Storage persistence test failed:', error);
  }
};

export const debugCurrentStorage = async (): Promise<void> => {
  console.log('🔍 Current storage state:');
  
  try {
    const token = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.AUTH_TOKEN);
    const userJson = await secureStorageService.getSecureItem(SECURE_STORAGE_KEYS.USER_DATA);
    const tempPhone = await secureStorageService.getItem(REGULAR_STORAGE_KEYS.TEMP_PHONE);
    const tempIsNewUser = await secureStorageService.getItem(REGULAR_STORAGE_KEYS.TEMP_IS_NEW_USER);
    
    console.log('  Auth Token:', token ? 'Present (****)' : 'Not found');
    console.log('  User Data:', userJson ? 'Present' : 'Not found');
    console.log('  Temp Phone:', tempPhone || 'Not found');
    console.log('  Temp IsNewUser:', tempIsNewUser || 'Not found');
  } catch (error) {
    console.error('❌ Failed to debug storage:', error);
  }
};