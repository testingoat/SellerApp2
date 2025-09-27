# TestSprite Testing for SellerApp2

This document provides comprehensive information about using TestSprite for automated testing of the SellerApp2 React Native application.

## Overview

TestSprite has been configured to test the following key areas of the SellerApp2:

- **Authentication Tests**: Login, OTP verification, and user authentication flows
- **Store Registration Tests**: Store setup, information forms, and onboarding
- **Dashboard Tests**: Main dashboard functionality, order summaries, and analytics
- **Order Management Tests**: Order processing, list management, and order details
- **Product Management Tests**: Product CRUD operations, listing, and inventory
- **Location Services Tests**: GPS permissions, store location management, and geolocation
- **Network Resilience Tests**: Network error handling and offline capabilities
- **Push Notification Tests**: FCM integration and notification handling

## Setup Instructions

### Prerequisites

1. **TestSprite MCP Server**: Already configured with your API key
2. **Android Emulator**: Ensure it's running and accessible
3. **App Installation**: SellerApp2 must be installed on the emulator

### Environment Variables

Create a `.env.local` file in your project root:

```env
TESTSPRITE_API_KEY=sk-user-FCz9hI9l6OZ5PiQeIVk1rGk2k6txC6LHT8ArBNYhozqUFySyiM0e5SrGFfc7spiv6bXHua13ERd92iiazg_1qGFXMZ__s5XqFiefY4v3R4tx5on8KQqpgfaqOQzcUNpFlPg
ANDROID_HOME=/path/to/android-sdk
```

## Running Tests

### Individual Test Suites

Run specific test suites using npm scripts:

```bash
# Authentication tests
npm run testsprite:auth

# Dashboard tests
npm run testsprite:dashboard

# Order management tests
npm run testsprite:orders

# Product management tests
npm run testsprite:products

# Location services tests
npm run testsprite:location

# Network resilience tests
npm run testsprite:network

# Push notification tests
npm run testsprite:notifications
```

### Complete Test Suite

Run all tests at once:

```bash
npm run testsprite:all
# or
npm run testsprite
```

### Custom Test Execution

Use the TestSprite API directly:

```javascript
const TestSpriteAPI = require('./testsprite-api');
const api = new TestSpriteAPI({});

// Run specific suite
await api.runTestSuite('Authentication Tests');

// Or run custom test steps
await api.initializeSession();
await api.launchApp();
await api.waitForElement({ type: 'accessibilityId', value: 'MainDashboardScreen' });
await api.closeSession();
```

## Test Configuration

### File Structure

```
SellerApp2/
├── testsprite.config.json     # Main test configuration
├── testsprite-runner.js       # Test execution runner
├── testsprite-api.js          # TestSprite API wrapper
└── TESTSPRITE_README.md       # This documentation
```

### Configuration Options

The `testsprite.config.json` file contains:

- **Platform Configuration**: Android emulator settings
- **Test Suites**: Organized test groups
- **Test Steps**: Individual test actions and assertions
- **Selectors**: Element identification strategies

### Supported Actions

- `launchApp`: Start the application
- `waitForElement`: Wait for element to appear
- `tapElement`: Click/tap on an element
- `sendKeys`: Enter text into input fields
- `elementVisible`: Check if element is visible
- `takeScreenshot`: Capture screen shots
- `setNetworkConnection`: Control network state

## Test Coverage Areas

### Authentication Flow
- Login screen elements and functionality
- OTP verification process
- Authentication state management

### Store Registration
- Store information forms
- Business details input
- Registration completion flow

### Dashboard Features
- Order summary displays
- Revenue tracking
- Performance metrics

### Order Management
- Order list display
- Order processing workflows
- Order status updates

### Product Management
- Product listing
- Add/edit product forms
- Inventory management

### Location Services
- GPS permission handling
- Store location setup
- Location-based features

### Network Resilience
- Offline mode detection
- Network error handling
- Recovery mechanisms

### Push Notifications
- Notification screen navigation
- FCM service integration
- Notification handling

## Troubleshooting

### Common Issues

1. **Emulator Not Found**: Ensure Android emulator is running
2. **App Not Installed**: Install SellerApp2 on the emulator first
3. **Network Issues**: Check internet connection and API key validity
4. **Permission Errors**: Grant necessary permissions to the app

### Debug Mode

Enable debug logging:

```javascript
const api = new TestSpriteAPI({ debug: true });
```

### Test Results

Test results include:
- Pass/fail status
- Execution time
- Error messages
- Screenshots (if configured)

## Best Practices

1. **Test Organization**: Keep related tests in the same suite
2. **Wait Times**: Use appropriate timeouts for element loading
3. **Cleanup**: Close sessions properly after test execution
4. **Error Handling**: Implement proper error handling and retry logic
5. **Documentation**: Keep test cases well-documented

## Custom Tests

To add new tests:

1. **Add to Configuration**: Include in `testsprite.config.json`
2. **Define Steps**: Specify action sequence
3. **Test Locally**: Run individual tests before adding to CI/CD
4. **Update Documentation**: Document new test coverage

Example test configuration:

```json
{
  "name": "Custom Feature Test",
  "steps": [
    {
      "action": "launchApp",
      "params": {}
    },
    {
      "action": "waitForElement",
      "params": {
        "selector": {
          "type": "accessibilityId",
          "value": "customFeature"
        },
        "timeout": 10000
      }
    }
  ]
}
```

## Integration with CI/CD

Add TestSprite testing to your CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run TestSprite Tests
  run: npm run testsprite:all
  env:
    TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
```

## Support

For TestSprite-specific issues:
- TestSprite Documentation: https://docs.testsprite.com
- API Support: support@testsprite.com

For SellerApp2 testing issues:
- Check test configuration files
- Review emulator setup
- Verify app installation status