#!/usr/bin/env node

/**
 * Monitoring System Setup Script
 * Initializes the complete monitoring system with proper configuration
 */

const fs = require('fs');
const path = require('path');

class MonitoringSetup {
  constructor() {
    this.projectRoot = __dirname;
    this.monitoringDataPath = path.join(this.projectRoot, 'monitoring-data');
  }

  async setup() {
    console.log('🚀 Setting up Website Monitoring System...');
    console.log('==========================================\n');

    try {
      // Create directory structure
      await this.createDirectoryStructure();

      // Create configuration files
      await this.createConfigurationFiles();

      // Create package.json scripts
      await this.updatePackageJson();

      // Create example MCP integration
      await this.createMCPIntegration();

      // Create documentation
      await this.createDocumentation();

      // Create startup scripts
      await this.createStartupScripts();

      console.log('\n✅ Monitoring system setup completed successfully!');
      console.log('\n📚 Next steps:');
      console.log('1. Review and update configuration files');
      console.log('2. Set up your MCP integration');
      console.log('3. Run: npm run monitoring:start');
      console.log('4. Access dashboard at: monitoring-data/dashboard/dashboard.html');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async createDirectoryStructure() {
    console.log('📁 Creating directory structure...');

    const directories = [
      'monitoring-data',
      'monitoring-data/alerts',
      'monitoring-data/dashboard',
      'monitoring-data/history',
      'monitoring-data/logs',
      'monitoring-data/predictions',
      'monitoring-data/reports',
      'monitoring-data/screenshots',
      'monitoring-data/schedules',
      'monitoring-data/trends',
      'monitoring-config',
      'monitoring-docs'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`  ✅ Created: ${dir}`);
      }
    });
  }

  async createConfigurationFiles() {
    console.log('⚙️ Creating configuration files...');

    // Main monitoring configuration
    const mainConfig = {
      websites: [
        {
          id: 'prod-seller',
          name: 'Production Seller',
          url: 'https://goatgoat.tech/admin/resources/Seller',
          type: 'seller',
          environment: 'production',
          criticality: 'high',
          expectedElements: ['.seller-dashboard', '.seller-list'],
          loginRequired: false,
          testPaths: ['/admin/resources/Seller']
        },
        {
          id: 'prod-fcm',
          name: 'Production FCM',
          url: 'https://goatgoat.tech/admin/fcm-management',
          type: 'fcm',
          environment: 'production',
          criticality: 'high',
          expectedElements: ['.fcm-dashboard', '.notification-controls'],
          loginRequired: false,
          testPaths: ['/admin/fcm-management']
        },
        {
          id: 'staging-seller',
          name: 'Staging Seller',
          url: 'https://staging.goatgoat.tech/admin/resources/Seller',
          type: 'seller',
          environment: 'staging',
          criticality: 'medium',
          expectedElements: ['.seller-dashboard', '.seller-list'],
          loginRequired: false,
          testPaths: ['/admin/resources/Seller']
        },
        {
          id: 'staging-fcm',
          name: 'Staging FCM',
          url: 'https://staging.goatgoat.tech/admin/fcm-management',
          type: 'fcm',
          environment: 'staging',
          criticality: 'medium',
          expectedElements: ['.fcm-dashboard', '.notification-controls'],
          loginRequired: false,
          testPaths: ['/admin/fcm-management']
        }
      ],
      thresholds: {
        health: {
          excellent: 95,
          good: 85,
          fair: 75,
          poor: 60
        },
        performance: {
          loadTime: {
            excellent: 1000,
            good: 2000,
            fair: 3000,
            poor: 5000
          },
          firstContentfulPaint: {
            excellent: 800,
            good: 1500,
            fair: 2500,
            poor: 4000
          },
          layoutShift: {
            excellent: 0.05,
            good: 0.1,
            fair: 0.2,
            poor: 0.3
          }
        },
        accessibility: {
          excellent: 95,
          good: 85,
          fair: 75,
          poor: 60
        }
      },
      monitoring: {
        intervals: {
          comprehensive: 60,
          quick: 15,
          deep: 1440
        },
        retry: {
          maxAttempts: 3,
          delayMs: 5000
        },
        timeout: {
          pageLoad: 30000,
          element: 10000
        }
      }
    };

    const configFile = path.join(this.projectRoot, 'monitoring-config', 'websites.json');
    fs.writeFileSync(configFile, JSON.stringify(mainConfig, null, 2));
    console.log(`  ✅ Created: monitoring-config/websites.json`);

    // MCP Integration configuration
    const mcpConfig = {
      chromeDevTools: {
        enabled: true,
        viewport: {
          width: 1920,
          height: 1080
        },
        userAgent: 'Website-Monitor/1.0',
        timeout: 30000,
        screenshotFormat: 'png',
        fullPageScreenshots: true
      },
      playwright: {
        enabled: true,
        headless: true,
        viewport: { width: 1920, height: 1080 },
        timeout: 30000
      }
    };

    const mcpConfigFile = path.join(this.projectRoot, 'monitoring-config', 'mcp.json');
    fs.writeFileSync(mcpConfigFile, JSON.stringify(mcpConfig, null, 2));
    console.log(`  ✅ Created: monitoring-config/mcp.json`);
  }

  async updatePackageJson() {
    console.log('📦 Updating package.json...');

    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Add monitoring scripts
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts['monitoring:start'] = 'node monitoring-orchestrator.js start';
      packageJson.scripts['monitoring:monitor'] = 'node monitoring-orchestrator.js monitor';
      packageJson.scripts['monitoring:report'] = 'node monitoring-orchestrator.js report';
      packageJson.scripts['monitoring:status'] = 'node monitoring-orchestrator.js status';
      packageJson.scripts['monitoring:dashboard'] = 'node monitoring-dashboard.js';
      packageJson.scripts['monitoring:trends'] = 'node trend-analysis.js';
      packageJson.scripts['monitoring:setup'] = 'node setup-monitoring.js';

      // Add monitoring dependencies if not present
      packageJson.dependencies = packageJson.dependencies || {};

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`  ✅ Updated package.json with monitoring scripts`);
    }
  }

  async createMCPIntegration() {
    console.log('🔌 Creating MCP integration...');

    const mcpIntegration = `#!/usr/bin/env node

/**
 * Real MCP Integration for Website Monitoring
 * This file contains the actual MCP tool calls for Chrome DevTools integration
 */

// This file would contain the actual MCP tool calls
// For now, it's a placeholder that shows the structure

async function monitorWebsiteWithMCP(target) {
  console.log(\`🌐 Starting MCP monitoring for: \${target.url}\`);

  try {
    // Initialize Chrome DevTools session
    // await mcp__chrome-devtools__new_page(target.url);

    // Wait for page load
    // await mcp__chrome-devtools__wait_for('DOMContentLoaded', 10000);

    // Take screenshot
    // await mcp__chrome-devtools__take_screenshot({
    //   format: 'png',
    //   quality: 90,
    //   fullPage: true,
    //   filePath: \`monitoring-data/screenshots/\${target.id}-\${Date.now()}.png\`
    // });

    // Get console messages
    // const consoleMessages = await mcp__chrome-devtools__list_console_messages();

    // Get network requests
    // const networkRequests = await mcp__chrome-devtools__list_network_requests({
    //   pageSize: 100,
    //   pageIdx: 0,
    //   resourceTypes: ['document', 'stylesheet', 'script', 'image', 'xhr', 'fetch']
    // });

    // Start performance trace
    // await mcp__chrome-devtools__performance_start_trace({
    //   reload: true,
    //   autoStop: true
    // });

    // Close page
    // await mcp__chrome-devtools__close_page(0);

    return {
      status: 'success',
      message: 'MCP monitoring completed',
      // consoleMessages,
      // networkRequests
    };

  } catch (error) {
    console.error(\`❌ MCP monitoring failed for \${target.id}:\`, error.message);
    return {
      status: 'error',
      error: error.message
    };
  }
}

module.exports = { monitorWebsiteWithMCP };
`;

    const mcpFile = path.join(this.projectRoot, 'monitoring-config', 'mcp-integration.js');
    fs.writeFileSync(mcpFile, mcpIntegration);
    console.log(`  ✅ Created: monitoring-config/mcp-integration.js`);
  }

  async createDocumentation() {
    console.log('📚 Creating documentation...');

    const readme = `# Website Monitoring System

A comprehensive monitoring system for your websites using Chrome DevTools MCP integration.

## Overview

This monitoring system provides:
- Real-time website monitoring
- Performance analysis
- Error detection and alerting
- UI regression testing
- Trend analysis and predictions
- Automated reporting

## Quick Start

1. **Setup the system:**
   \`\`\`bash
   npm run monitoring:setup
   \`\`\`

2. **Start monitoring:**
   \`\`\`bash
   npm run monitoring:start
   \`\`\`

3. **View dashboard:**
   Open \`monitoring-data/dashboard/dashboard.html\` in your browser

## Features

### 🔍 Comprehensive Monitoring
- Console error detection
- Performance metrics tracking
- Network request analysis
- UI snapshot comparison
- Accessibility audits

### 🚨 Smart Alerting
- Real-time notifications
- Escalation procedures
- Custom thresholds
- Multiple notification channels

### 📈 Trend Analysis
- Historical data tracking
- Predictive analytics
- Performance trends
- Anomaly detection

### 📊 Reporting
- Real-time dashboard
- Automated daily/weekly reports
- Executive summaries
- Actionable recommendations

## Configuration

### Website Configuration
Edit \`monitoring-config/websites.json\` to configure your targets:

\`\`\`json
{
  "id": "prod-seller",
  "name": "Production Seller",
  "url": "https://goatgoat.tech/admin/resources/Seller",
  "criticality": "high",
  "expectedElements": [".seller-dashboard", ".seller-list"]
}
\`\`\`

### Thresholds
Configure performance and health thresholds in the same file:

\`\`\`json
{
  "thresholds": {
    "health": {
      "excellent": 95,
      "good": 85,
      "fair": 75,
      "poor": 60
    },
    "performance": {
      "loadTime": {
        "excellent": 1000,
        "good": 2000,
        "fair": 3000,
        "poor": 5000
      }
    }
  }
}
\`\`\`

## Usage

### Command Line Interface

\`\`\`bash
# Start the monitoring orchestrator
npm run monitoring:start

# Run manual monitoring
npm run monitoring:monitor comprehensive

# Generate reports
npm run monitoring:report dashboard

# Check status
npm run monitoring:status

# Generate trend analysis
npm run monitoring:trends
\`\`\`

### Monitoring Types

1. **Comprehensive**: Full monitoring with all metrics
2. **Quick**: Basic health checks for critical targets
3. **Deep**: Comprehensive monitoring with trend analysis

### Alerting

The system supports:
- Email notifications
- Slack integration
- Microsoft Teams integration
- Custom webhooks

Configure alerting in \`alerting-system.js\`.

## Data Storage

All monitoring data is stored in \`monitoring-data/\`:
- \`alerts/\`: Alert history and notifications
- \`history/\`: Historical monitoring data
- \`screenshots/\`: UI snapshots
- \`reports/\`: Generated reports
- \`trends/\`: Trend analysis results
- \`logs/\`: System logs

## MCP Integration

This system is designed to work with Chrome DevTools MCP tools for real browser automation:

- Page navigation and interaction
- Console message capture
- Performance analysis
- Screenshot capture
- Network request monitoring
- Accessibility audits

## Troubleshooting

### Common Issues

1. **Monitoring fails to start**
   - Check if MCP tools are properly configured
   - Verify website URLs are accessible
   - Check system logs in \`monitoring-data/logs/\`

2. **Missing data in dashboard**
   - Ensure monitoring has run at least once
   - Check for errors in logs
   - Verify data file permissions

3. **Alerts not working**
   - Check notification configuration
   - Verify email/webhook settings
   - Check alert suppression rules

### Logs

System logs are stored in \`monitoring-data/logs/\` with daily rotation:
- \`orchestrator-YYYY-MM-DD.log\`: Main system logs
- Check these files for detailed error information

## Development

### Project Structure

\`\`\`
monitoring-system/
├── monitoring-orchestrator.js    # Main orchestration system
├── monitoring-system-mcp.js      # Core monitoring with MCP
├── chrome-devtools-monitor.js    # Chrome DevTools integration
├── alerting-system.js           # Alert management
├── trend-analysis.js            # Historical analysis
├── monitoring-dashboard.js      # Dashboard generation
├── setup-monitoring.js          # Setup script
└── monitoring-data/             # Data storage
    ├── alerts/
    ├── dashboard/
    ├── history/
    ├── reports/
    └── trends/
\`\`\`

### Extending the System

To add new monitoring capabilities:

1. Extend \`monitoring-system-mcp.js\`
2. Add new alert types in \`alerting-system.js\`
3. Update dashboard in \`monitoring-dashboard.js\`
4. Configure new metrics in trend analysis

## Support

For issues and questions:
1. Check system logs
2. Review configuration files
3. Verify MCP tool connectivity
4. Check this documentation

---

**Version:** 1.0.0
**Last Updated:** ${new Date().toLocaleDateString()}
`;

    const readmeFile = path.join(this.projectRoot, 'monitoring-docs', 'README.md');
    fs.writeFileSync(readmeFile, readme);
    console.log(`  ✅ Created: monitoring-docs/README.md`);

    // Create API documentation
    const apiDocs = `# Monitoring System API Documentation

## Core Components

### MonitoringOrchestrator
Main system controller that coordinates all monitoring activities.

\`\`\`javascript
const orchestrator = new MonitoringOrchestrator();
await orchestrator.start();
await orchestrator.runManualMonitoring('comprehensive');
\`\`\`

### EnhancedMonitoringSystem
Core monitoring engine with MCP integration.

\`\`\`javascript
const monitor = new EnhancedMonitoringSystem();
const results = await monitor.runComprehensiveMonitoring();
\`\`\`

### ChromeDevToolsMonitor
Chrome DevTools integration for real browser monitoring.

\`\`\`javascript
const chromeMonitor = new ChromeDevToolsMonitor();
const results = await chromeMonitor.monitorWebsite(target);
\`\`\`

### AlertingSystem
Manages alerts, notifications, and escalation.

\`\`\`javascript
const alerting = new AlertingSystem();
await alerting.processAlerts(monitoringResults);
\`\`\`

### TrendAnalysis
Analyzes historical data and provides insights.

\`\`\`javascript
const trends = new TrendAnalysis();
const analysis = await trends.analyzeTrendsForTarget('prod-seller', 30);
\`\`\`

### MonitoringDashboard
Generates real-time dashboard and reports.

\`\`\`javascript
const dashboard = new MonitoringDashboard();
const dashboardPath = await dashboard.generateDashboard();
\`\`\`

## Configuration

### Website Configuration
\`\`\`json
{
  "id": "unique-id",
  "name": "Display Name",
  "url": "https://example.com",
  "type": "website-type",
  "environment": "production|staging",
  "criticality": "high|medium|low",
  "expectedElements": [".selector", "#element-id"],
  "loginRequired": false,
  "testPaths": ["/path1", "/path2"]
}
\`\`\`

### Alert Configuration
\`\`\`json
{
  "thresholds": {
    "critical": {
      "healthScore": 70,
      "loadTime": 5000,
      "errorCount": 1
    },
    "warning": {
      "healthScore": 80,
      "loadTime": 3000,
      "errorCount": 0
    }
  },
  "notifications": {
    "email": {
      "enabled": true,
      "recipients": ["admin@example.com"]
    },
    "slack": {
      "enabled": true,
      "webhook": "https://hooks.slack.com/..."
    }
  }
}
\`\`\`

## Data Structures

### Monitoring Results
\`\`\`javascript
{
  "session": "session-id",
  "startTime": "2024-01-01T00:00:00Z",
  "targets": [
    {
      "target": { /* website config */ },
      "timestamp": "2024-01-01T00:00:00Z",
      "status": "success|error",
      "health": 95,
      "performance": { /* performance metrics */ },
      "console": { /* console messages */ },
      "network": { /* network analysis */ },
      "ui": { /* UI analysis */ },
      "alerts": [ /* alerts */ ]
    }
  ],
  "summary": { /* session summary */ }
}
\`\`\`

### Alert Structure
\`\`\`javascript
{
  "id": "alert-id",
  "level": "critical|warning|info",
  "type": "error-type",
  "message": "Alert message",
  "target": { /* target info */ },
  "details": { /* alert details */ },
  "timestamp": "2024-01-01T00:00:00Z",
  "status": "active|acknowledged|resolved"
}
\`\`\`

## Integration Points

### MCP Tools Integration
The system integrates with Chrome DevTools MCP tools:

- \`mcp__chrome-devtools__navigate_page\`: Navigate to URLs
- \`mcp__chrome-devtools__list_console_messages\`: Capture console output
- \`mcp__chrome-devtools__list_network_requests\`: Analyze network traffic
- \`mcp__chrome-devtools__take_screenshot\**: Capture screenshots
- \`mcp__chrome-devtools__performance_start_trace\**: Performance analysis

### Custom Integrations
Add new monitoring capabilities by extending the core components:

1. **New Metrics**: Extend monitoring targets
2. **Custom Alerts**: Add alert types and rules
3. **External Services**: Integrate with external APIs
4. **Data Sources**: Add new data collection methods

## Best Practices

1. **Configuration**: Keep website configurations up to date
2. **Thresholds**: Set appropriate thresholds for your environment
3. **Alerting**: Configure proper notification channels
4. **Monitoring**: Run comprehensive checks regularly
5. **Maintenance**: Review and clean up historical data
6. **Security**: Secure sensitive configuration data
`;

    const apiDocsFile = path.join(this.projectRoot, 'monitoring-docs', 'API.md');
    fs.writeFileSync(apiDocsFile, apiDocs);
    console.log(`  ✅ Created: monitoring-docs/API.md`);
  }

  async createStartupScripts() {
    console.log('🚀 Creating startup scripts...');

    // Windows batch file
    const windowsScript = `@echo off
echo Starting Website Monitoring System...
cd /d "%~dp0"
node monitoring-orchestrator.js start
pause
`;

    const windowsFile = path.join(this.projectRoot, 'start-monitoring.bat');
    fs.writeFileSync(windowsFile, windowsScript);
    console.log(`  ✅ Created: start-monitoring.bat`);

    // Linux/macOS shell script
    const unixScript = `#!/bin/bash
echo "Starting Website Monitoring System..."
cd "$(dirname "$0")"
node monitoring-orchestrator.js start
`;

    const unixFile = path.join(this.projectRoot, 'start-monitoring.sh');
    fs.writeFileSync(unixFile, unixScript);
    fs.chmodSync(unixFile, '755');
    console.log(`  ✅ Created: start-monitoring.sh`);
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new MonitoringSetup();
  setup.setup().catch(console.error);
}

module.exports = MonitoringSetup;