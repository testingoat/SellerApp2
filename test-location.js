/**
 * Simple location test script for debugging
 * Run this in React Native debugger console to test location services
 */

import { locationUtils } from './src/utils/locationUtils';

const testLocationServices = async () => {
  console.log('🧪 Testing location services...');
  
  try {
    // Test 1: Initialize
    console.log('1. Initializing location utils...');
    await locationUtils.initialize('AIzaSyDOBBimUu_eGMwsXZUqrNFk3puT5rMWbig');
    console.log('✅ Location utils initialized');
    
    // Test 2: Check permission
    console.log('2. Checking location permission...');
    const permissionStatus = await locationUtils.checkLocationPermission();
    console.log('Permission status:', permissionStatus);
    
    // Test 3: Request permission if needed
    if (!permissionStatus.granted) {
      console.log('3. Requesting location permission...');
      const requestResult = await locationUtils.requestLocationPermission();
      console.log('Permission request result:', requestResult);
    }
    
    // Test 4: Get current location
    console.log('4. Getting current location...');
    const coordinates = await locationUtils.getCurrentLocation();
    console.log('✅ Got coordinates:', coordinates);
    
    // Test 5: Reverse geocode
    console.log('5. Reverse geocoding...');
    const address = await locationUtils.reverseGeocode(coordinates);
    console.log('✅ Got address:', address);
    
    console.log('🎉 All location tests passed!');
    
  } catch (error) {
    console.error('❌ Location test failed:', error);
  }
};

// Export for manual testing
export { testLocationServices };
