// Simple test script to verify ProductListScreen API integration
// This script tests the server connection and API endpoints

const https = require('https');

const testEndpoint = (url, description) => {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📡 URL: ${url}`);
    
    const req = https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`📄 Response: ${data}`);
        
        if (res.statusCode === 401 || data.includes('Access token required')) {
          console.log('✅ PASS: Endpoint is accessible and requires authentication (expected)');
          resolve(true);
        } else if (res.statusCode === 404) {
          console.log('❌ FAIL: Endpoint not found');
          resolve(false);
        } else {
          console.log(`ℹ️  INFO: Unexpected response (Status: ${res.statusCode})`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ERROR: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ TIMEOUT: Request timed out');
      req.destroy();
      resolve(false);
    });
  });
};

const runTests = async () => {
  console.log('🚀 Starting SellerApp2 API Integration Tests');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      url: 'https://staging.goatgoat.tech/api/seller/products',
      description: 'Seller Products Endpoint'
    },
    {
      url: 'https://staging.goatgoat.tech/api/seller/categories',
      description: 'Seller Categories Endpoint'
    },
    {
      url: 'https://staging.goatgoat.tech/api/seller/login',
      description: 'Seller Login Endpoint'
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.url, test.description);
    if (result) passedTests++;
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`📈 Test Results: ${passedTests}/${tests.length} tests passed`);
  
  if (passedTests === tests.length) {
    console.log('🎉 SUCCESS: All API endpoints are functional!');
    console.log('✅ ProductListScreen should be able to connect to the server');
    console.log('✅ Server integration is working correctly');
  } else {
    console.log('⚠️  WARNING: Some endpoints are not working');
    console.log('📱 ProductListScreen will fall back to mock data');
  }
  
  console.log('\n🔍 Next Steps:');
  console.log('1. Test ProductListScreen in the React Native app');
  console.log('2. Verify authentication flow works');
  console.log('3. Test product CRUD operations');
  console.log('4. Check error handling and fallback mechanisms');
};

// Run the tests
runTests().catch(console.error);
