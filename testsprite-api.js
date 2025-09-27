/**
 * TestSprite API Integration for SellerApp2
 * Provides helper functions for common testing patterns
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class TestSpriteAPI {
  constructor(config) {
    this.baseURL = 'https://api.testsprite.com/v1';
    this.apiKey = process.env.TESTSPRITE_API_KEY || config.apiKey;
    this.projectId = config.projectId || 'sellerapp2-project';
    this.sessionId = null;
  }

  /**
   * Initialize TestSprite session
   */
  async initializeSession() {
    try {
      const response = await axios.post(`${this.baseURL}/sessions`, {
        projectId: this.projectId,
        capabilities: {
          platform: 'android',
          deviceName: 'emulator-5554',
          app: 'com.sellerapp2'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      this.sessionId = response.data.sessionId;
      console.log(`✅ TestSprite session initialized: ${this.sessionId}`);
      return this.sessionId;
    } catch (error) {
      console.error('❌ Failed to initialize TestSprite session:', error.message);
      throw error;
    }
  }

  /**
   * Launch the app
   */
  async launchApp() {
    if (!this.sessionId) {
      await this.initializeSession();
    }

    try {
      await axios.post(`${this.baseURL}/sessions/${this.sessionId}/actions`, {
        action: 'launchApp',
        params: {}
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🚀 App launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch app:', error.message);
      throw error;
    }
  }

  /**
   * Wait for element to appear
   */
  async waitForElement(selector, timeout = 10000) {
    try {
      const response = await axios.post(`${this.baseURL}/sessions/${this.sessionId}/actions`, {
        action: 'waitForElement',
        params: {
          selector,
          timeout
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ Element found: ${JSON.stringify(selector)}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Element not found: ${JSON.stringify(selector)}`, error.message);
      throw error;
    }
  }

  /**
   * Tap on an element
   */
  async tapElement(selector) {
    try {
      await axios.post(`${this.baseURL}/sessions/${this.sessionId}/actions`, {
        action: 'tapElement',
        params: {
          selector
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`👆 Tapped element: ${JSON.stringify(selector)}`);
    } catch (error) {
      console.error(`❌ Failed to tap element: ${JSON.stringify(selector)}`, error.message);
      throw error;
    }
  }

  /**
   * Send keys to an element
   */
  async sendKeys(selector, text) {
    try {
      await axios.post(`${this.baseURL}/sessions/${this.sessionId}/actions`, {
        action: 'sendKeys',
        params: {
          selector,
          text
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`⌨️ Sent text "${text}" to element: ${JSON.stringify(selector)}`);
    } catch (error) {
      console.error(`❌ Failed to send keys: ${JSON.stringify(selector)}`, error.message);
      throw error;
    }
  }

  /**
   * Check if element is visible
   */
  async isElementVisible(selector) {
    try {
      const response = await axios.post(`${this.baseURL}/sessions/${this.sessionId}/actions`, {
        action: 'elementVisible',
        params: {
          selector
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`👁️ Element visible: ${JSON.stringify(selector)}`);
      return response.data.visible;
    } catch (error) {
      console.error(`❌ Failed to check element visibility: ${JSON.stringify(selector)}`, error.message);
      throw error;
    }
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(filename) {
    try {
      const response = await axios.post(`${this.baseURL}/sessions/${this.sessionId}/actions`, {
        action: 'takeScreenshot',
        params: {
          filename
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📸 Screenshot saved: ${filename}`);
      return response.data.screenshotUrl;
    } catch (error) {
      console.error('❌ Failed to take screenshot:', error.message);
      throw error;
    }
  }

  /**
   * Close session
   */
  async closeSession() {
    if (this.sessionId) {
      try {
        await axios.delete(`${this.baseURL}/sessions/${this.sessionId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ TestSprite session closed');
        this.sessionId = null;
      } catch (error) {
        console.error('❌ Failed to close session:', error.message);
      }
    }
  }

  /**
   * Run test suite
   */
  async runTestSuite(suiteName) {
    const configPath = path.join(__dirname, 'testsprite.config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    const suite = config.suites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Test suite not found: ${suiteName}`);
    }

    console.log(`🚀 Running test suite: ${suite.name}`);
    await this.initializeSession();

    const results = [];

    for (const test of suite.tests) {
      console.log(`\n🧪 Running test: ${test.name}`);

      try {
        await this.executeTestSteps(test.steps);
        results.push({ test: test.name, status: 'passed' });
        console.log(`✅ Test passed: ${test.name}`);
      } catch (error) {
        results.push({ test: test.name, status: 'failed', error: error.message });
        console.error(`❌ Test failed: ${test.name}`, error.message);
      }
    }

    await this.closeSession();
    return results;
  }

  /**
   * Execute test steps
   */
  async executeTestSteps(steps) {
    for (const step of steps) {
      switch (step.action) {
        case 'launchApp':
          await this.launchApp();
          break;
        case 'waitForElement':
          await this.waitForElement(step.params.selector, step.params.timeout);
          break;
        case 'tapElement':
          await this.tapElement(step.params.selector);
          break;
        case 'sendKeys':
          await this.sendKeys(step.params.selector, step.params.text);
          break;
        case 'elementVisible':
          await this.isElementVisible(step.params.selector);
          break;
        case 'takeScreenshot':
          await this.takeScreenshot(step.params.filename);
          break;
        default:
          throw new Error(`Unknown action: ${step.action}`);
      }
    }
  }
}

module.exports = TestSpriteAPI;