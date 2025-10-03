#!/usr/bin/env node

/**
 * Enhanced Website Monitoring System with MCP Integration
 * This system uses Chrome DevTools MCP tools for real website monitoring
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ChromeDevToolsMonitor = require('./chrome-devtools-monitor');

class EnhancedMonitoringSystem {
  constructor() {
    this.configPath = path.join(__dirname, 'monitoring.config.json');
    this.dataPath = path.join(__dirname, 'monitoring-data');
    this.reportsPath = path.join(this.dataPath, 'reports');
    this.trendsPath = path.join(this.dataPath, 'trends');
    this.alertsPath = path.join(this.dataPath, 'alerts');

    this.ensureDirectories();

    this.chromeMonitor = new ChromeDevToolsMonitor();

    this.targets = [
      {
        id: 'prod-seller',
        name: 'Production Seller',
        url: 'https://goatgoat.tech/admin/resources/Seller',
        type: 'seller',
        environment: 'production',
        criticality: 'high'
      },
      {
        id: 'prod-fcm',
        name: 'Production FCM',
        url: 'https://goatgoat.tech/admin/fcm-management',
        type: 'fcm',
        environment: 'production',
        criticality: 'high'
      },
      {
        id: 'staging-seller',
        name: 'Staging Seller',
        url: 'https://staging.goatgoat.tech/admin/resources/Seller',
        type: 'seller',
        environment: 'staging',
        criticality: 'medium'
      },
      {
        id: 'staging-fcm',
        name: 'Staging FCM',
        url: 'https://staging.goatgoat.tech/admin/fcm-management',
        type: 'fcm',
        environment: 'staging',
        criticality: 'medium'
      }
    ];

    this.currentSession = null;
    this.alertThresholds = {
      healthScore: 80,
      loadTime: 3000,
      errorCount: 0,
      warningCount: 5,
      layoutShift: 0.1
    };
  }

  ensureDirectories() {
    [this.dataPath, this.reportsPath, this.trendsPath, this.alertsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async runComprehensiveMonitoring() {
    console.log('🚀 Starting comprehensive website monitoring with MCP integration');

    this.currentSession = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      targets: [],
      alerts: [],
      summary: {}
    };

    try {
      // Initialize Chrome DevTools monitoring
      await this.chromeMonitor.initializeMonitoring();

      // Monitor each target
      for (const target of this.targets) {
        console.log(`\n🔍 Monitoring: ${target.name}`);

        try {
          const result = await this.monitorTargetWithMCP(target);
          this.currentSession.targets.push(result);

          // Process alerts immediately
          await this.processAlerts(result);

        } catch (error) {
          console.error(`❌ Failed to monitor ${target.name}:`, error.message);
          this.currentSession.targets.push({
            ...target,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Generate session summary
      this.currentSession.summary = this.generateSessionSummary();
      this.currentSession.endTime = new Date().toISOString();

      // Save results and generate reports
      await this.saveSessionResults();
      await this.updateTrendsData();
      await this.generateComprehensiveReport();

      console.log('\n📊 Comprehensive monitoring completed');
      this.printSessionSummary();

      return this.currentSession;

    } catch (error) {
      console.error('❌ Monitoring session failed:', error.message);
      throw error;
    } finally {
      await this.chromeMonitor.cleanup();
    }
  }

  async monitorTargetWithMCP(target) {
    console.log(`  🔍 Using MCP tools to monitor: ${target.url}`);

    const monitoringResult = await this.chromeMonitor.monitorWebsite(target);

    // Enhance with additional analysis
    monitoringResult.trendAnalysis = await this.analyzeTrends(target.id);
    monitoringResult.benchmarkComparison = await this.compareWithBenchmarks(target, monitoringResult);

    return monitoringResult;
  }

  async processAlerts(targetResult) {
    if (targetResult.alerts && targetResult.alerts.length > 0) {
      console.log(`  🚨 Processing ${targetResult.alerts.length} alerts for ${targetResult.target.name}`);

      for (const alert of targetResult.alerts) {
        const alertData = {
          ...alert,
          target: targetResult.target.id,
          targetName: targetResult.target.name,
          sessionId: this.currentSession.id,
          timestamp: new Date().toISOString(),
          resolved: false
        };

        this.currentSession.alerts.push(alertData);
        await this.saveAlert(alertData);

        // Send immediate notification for critical alerts
        if (alert.level === 'critical') {
          await this.sendCriticalAlert(alertData);
        }
      }
    }
  }

  async saveAlert(alertData) {
    const alertFilename = `alert-${alertData.target}-${Date.now()}.json`;
    const alertPath = path.join(this.alertsPath, alertFilename);

    fs.writeFileSync(alertPath, JSON.stringify(alertData, null, 2));

    // Also update alerts log
    const alertsLogPath = path.join(this.alertsPath, 'alerts-log.json');
    let alertsLog = [];

    if (fs.existsSync(alertsLogPath)) {
      alertsLog = JSON.parse(fs.readFileSync(alertsLogPath, 'utf8'));
    }

    alertsLog.push(alertData);

    // Keep only last 1000 alerts
    if (alertsLog.length > 1000) {
      alertsLog = alertsLog.slice(-1000);
    }

    fs.writeFileSync(alertsLogPath, JSON.stringify(alertsLog, null, 2));
  }

  async sendCriticalAlert(alertData) {
    console.log(`🚨 CRITICAL ALERT: ${alertData.message}`);
    console.log(`   Target: ${alertData.targetName}`);
    console.log(`   Time: ${alertData.timestamp}`);

    // In a real implementation, this would send emails, Slack notifications, etc.
    // For now, we'll just create a critical alert file
    const criticalAlertPath = path.join(this.alertsPath, 'critical-alerts.json');
    let criticalAlerts = [];

    if (fs.existsSync(criticalAlertPath)) {
      criticalAlerts = JSON.parse(fs.readFileSync(criticalAlertPath, 'utf8'));
    }

    criticalAlerts.push({
      ...alertData,
      notified: true,
      notificationTime: new Date().toISOString()
    });

    // Keep only last 50 critical alerts
    if (criticalAlerts.length > 50) {
      criticalAlerts = criticalAlerts.slice(-50);
    }

    fs.writeFileSync(criticalAlertPath, JSON.stringify(criticalAlerts, null, 2));
  }

  async analyzeTrends(targetId) {
    // Load historical data for trend analysis
    const trendsFile = path.join(this.trendsPath, `${targetId}-trends.json`);

    if (!fs.existsSync(trendsFile)) {
      return {
        status: 'no_historical_data',
        message: 'No historical data available for trend analysis'
      };
    }

    try {
      const historicalData = JSON.parse(fs.readFileSync(trendsFile, 'utf8'));
      const recentData = historicalData.slice(-10); // Last 10 monitoring sessions

      if (recentData.length < 2) {
        return {
          status: 'insufficient_data',
          message: 'Insufficient data for trend analysis'
        };
      }

      // Calculate trends
      const healthTrend = this.calculateTrend(recentData.map(d => d.health));
      const loadTimeTrend = this.calculateTrend(recentData.map(d => d.performance?.navigation?.loadComplete || 0));
      const errorTrend = this.calculateTrend(recentData.map(d => d.console?.errors?.length || 0));

      return {
        status: 'success',
        dataPoints: recentData.length,
        trends: {
          health: healthTrend,
          loadTime: loadTimeTrend,
          errors: errorTrend
        },
        status: 'analyzed'
      };

    } catch (error) {
      return {
        status: 'error',
        message: `Trend analysis failed: ${error.message}`
      };
    }
  }

  calculateTrend(values) {
    if (values.length < 2) return 'insufficient_data';

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'improving' : 'degrading';
  }

  async compareWithBenchmarks(target, currentResult) {
    const benchmarks = this.getBenchmarks(target.type);

    return {
      performance: {
        loadTime: {
          current: currentResult.performance?.navigation?.loadComplete || 0,
          benchmark: benchmarks.loadTime,
          status: this.getBenchmarkStatus(currentResult.performance?.navigation?.loadComplete || 0, benchmarks.loadTime)
        },
        firstContentfulPaint: {
          current: currentResult.performance?.paint?.firstContentfulPaint || 0,
          benchmark: benchmarks.firstContentfulPaint,
          status: this.getBenchmarkStatus(currentResult.performance?.paint?.firstContentfulPaint || 0, benchmarks.firstContentfulPaint)
        }
      },
      health: {
        current: currentResult.health || 0,
        benchmark: benchmarks.health,
        status: this.getHealthBenchmarkStatus(currentResult.health || 0, benchmarks.health)
      }
    };
  }

  getBenchmarks(targetType) {
    const benchmarks = {
      seller: {
        loadTime: 2000,
        firstContentfulPaint: 1000,
        health: 90
      },
      fcm: {
        loadTime: 1500,
        firstContentfulPaint: 800,
        health: 95
      }
    };

    return benchmarks[targetType] || benchmarks.seller;
  }

  getBenchmarkStatus(current, benchmark) {
    if (current <= benchmark) return 'excellent';
    if (current <= benchmark * 1.5) return 'good';
    if (current <= benchmark * 2) return 'fair';
    return 'poor';
  }

  getHealthBenchmarkStatus(current, benchmark) {
    if (current >= benchmark) return 'excellent';
    if (current >= benchmark - 10) return 'good';
    if (current >= benchmark - 20) return 'fair';
    return 'poor';
  }

  generateSessionSummary() {
    const successfulTargets = this.currentSession.targets.filter(t => t.status === 'success');
    const failedTargets = this.currentSession.targets.filter(t => t.status === 'error');

    const summary = {
      totalTargets: this.targets.length,
      successfulTargets: successfulTargets.length,
      failedTargets: failedTargets.length,
      totalAlerts: this.currentSession.alerts.length,
      criticalAlerts: this.currentSession.alerts.filter(a => a.level === 'critical').length,
      warningAlerts: this.currentSession.alerts.filter(a => a.level === 'warning').length,
      avgHealthScore: 0,
      avgLoadTime: 0,
      environmentSummary: {
        production: { healthy: 0, total: 0 },
        staging: { healthy: 0, total: 0 }
      }
    };

    if (successfulTargets.length > 0) {
      const totalHealth = successfulTargets.reduce((sum, target) => sum + (target.health || 0), 0);
      const totalLoadTime = successfulTargets.reduce((sum, target) =>
        sum + (target.performance?.navigation?.loadComplete || 0), 0);

      summary.avgHealthScore = Math.round(totalHealth / successfulTargets.length);
      summary.avgLoadTime = Math.round(totalLoadTime / successfulTargets.length);
    }

    // Environment-specific summary
    successfulTargets.forEach(target => {
      const env = target.target.environment;
      summary.environmentSummary[env].total++;
      if ((target.health || 0) >= this.alertThresholds.healthScore) {
        summary.environmentSummary[env].healthy++;
      }
    });

    return summary;
  }

  async saveSessionResults() {
    const sessionFile = path.join(this.dataPath, `session-${this.currentSession.id}.json`);
    fs.writeFileSync(sessionFile, JSON.stringify(this.currentSession, null, 2));

    // Update latest session reference
    const latestSessionFile = path.join(this.dataPath, 'latest-session.json');
    fs.writeFileSync(latestSessionFile, JSON.stringify({
      sessionId: this.currentSession.id,
      timestamp: this.currentSession.startTime,
      summary: this.currentSession.summary
    }, null, 2));

    console.log(`💾 Session results saved: ${sessionFile}`);
  }

  async updateTrendsData() {
    for (const targetResult of this.currentSession.targets) {
      if (targetResult.status === 'success') {
        const trendsFile = path.join(this.trendsPath, `${targetResult.target.id}-trends.json`);
        let trendsData = [];

        if (fs.existsSync(trendsFile)) {
          trendsData = JSON.parse(fs.readFileSync(trendsFile, 'utf8'));
        }

        // Add current data point
        trendsData.push({
          timestamp: targetResult.timestamp,
          sessionId: this.currentSession.id,
          health: targetResult.health,
          performance: targetResult.performance,
          console: targetResult.console,
          alerts: targetResult.alerts.length
        });

        // Keep only last 30 data points
        if (trendsData.length > 30) {
          trendsData = trendsData.slice(-30);
        }

        fs.writeFileSync(trendsFile, JSON.stringify(trendsData, null, 2));
      }
    }
  }

  async generateComprehensiveReport() {
    const report = {
      ...this.currentSession,
      analysis: {
        overallHealth: this.analyzeOverallHealth(),
        recommendations: this.generateRecommendations(),
        actionItems: this.generateActionItems(),
        nextSteps: this.generateNextSteps()
      }
    };

    const reportFile = path.join(this.reportsPath, `comprehensive-report-${this.currentSession.id}.md`);
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(reportFile, markdown);

    console.log(`📄 Comprehensive report generated: ${reportFile}`);
    return reportFile;
  }

  analyzeOverallHealth() {
    const successfulTargets = this.currentSession.targets.filter(t => t.status === 'success');

    if (successfulTargets.length === 0) {
      return { status: 'critical', message: 'All targets failed monitoring' };
    }

    const avgHealth = successfulTargets.reduce((sum, t) => sum + (t.health || 0), 0) / successfulTargets.length;
    const criticalAlerts = this.currentSession.alerts.filter(a => a.level === 'critical').length;

    if (avgHealth >= 90 && criticalAlerts === 0) {
      return { status: 'excellent', message: 'All systems operating optimally' };
    } else if (avgHealth >= 80 && criticalAlerts <= 1) {
      return { status: 'good', message: 'Systems operating well with minor issues' };
    } else if (avgHealth >= 70 && criticalAlerts <= 3) {
      return { status: 'fair', message: 'Some issues requiring attention' };
    } else {
      return { status: 'poor', message: 'Multiple critical issues requiring immediate attention' };
    }
  }

  generateRecommendations() {
    const recommendations = [];

    this.currentSession.targets.forEach(target => {
      if (target.status === 'success') {
        if (target.health < this.alertThresholds.healthScore) {
          recommendations.push({
            target: target.target.name,
            priority: 'high',
            category: 'health',
            recommendation: `Improve overall health score from ${target.health}% to above ${this.alertThresholds.healthScore}%`,
            actions: ['Fix console errors', 'Optimize performance', 'Address accessibility issues']
          });
        }

        if (target.performance?.navigation?.loadComplete > this.alertThresholds.loadTime) {
          recommendations.push({
            target: target.target.name,
            priority: 'high',
            category: 'performance',
            recommendation: `Reduce page load time from ${target.performance.navigation.loadComplete}ms to under ${this.alertThresholds.loadTime}ms`,
            actions: ['Optimize images', 'Minimize resources', 'Enable compression']
          });
        }

        if (target.console?.errors?.length > 0) {
          recommendations.push({
            target: target.target.name,
            priority: 'critical',
            category: 'errors',
            recommendation: `Fix ${target.console.errors.length} console errors`,
            actions: ['Review error logs', 'Debug failing resources', 'Update broken links']
          });
        }
      }
    });

    return recommendations;
  }

  generateActionItems() {
    const actionItems = [];
    const criticalAlerts = this.currentSession.alerts.filter(a => a.level === 'critical');

    if (criticalAlerts.length > 0) {
      actionItems.push({
        priority: 'immediate',
        title: 'Address Critical Alerts',
        description: `${criticalAlerts.length} critical alerts require immediate attention`,
        estimatedTime: '2-4 hours',
        assignee: 'Development Team'
      });
    }

    const failedTargets = this.currentSession.targets.filter(t => t.status === 'error');
    if (failedTargets.length > 0) {
      actionItems.push({
        priority: 'high',
        title: 'Investigate Failed Monitoring',
        description: `${failedTargets.length} targets failed monitoring - investigate connectivity or access issues`,
        estimatedTime: '1-2 hours',
        assignee: 'DevOps Team'
      });
    }

    return actionItems;
  }

  generateNextSteps() {
    return [
      'Schedule follow-up monitoring in 1 hour for critical issues',
      'Review and address all critical alerts within 24 hours',
      'Implement performance optimizations for slow-loading pages',
      'Set up automated alerting for immediate notifications',
      'Create monitoring dashboard for real-time visibility'
    ];
  }

  generateMarkdownReport(report) {
    const { summary, analysis, targets, alerts } = report;

    return `# Comprehensive Website Monitoring Report

**Session ID:** ${report.id}
**Date:** ${new Date(report.startTime).toLocaleString()}
**Duration:** ${Math.round((new Date(report.endTime) - new Date(report.startTime)) / 1000)} seconds

## Executive Summary

**Overall Health Status:** ${analysis.overallHealth.status.toUpperCase()}

- **Total Targets:** ${summary.totalTargets}
- **Successful:** ${summary.successfulTargets}
- **Failed:** ${summary.failedTargets}
- **Average Health Score:** ${summary.avgHealthScore}%
- **Average Load Time:** ${summary.avgLoadTime}ms
- **Critical Alerts:** ${summary.criticalAlerts}
- **Total Alerts:** ${summary.totalAlerts}

**Message:** ${analysis.overallHealth.message}

## Environment Status

### Production Environment
- **Healthy Targets:** ${summary.environmentSummary.production.healthy}/${summary.environmentSummary.production.total}
- **Status:** ${summary.environmentSummary.production.healthy === summary.environmentSummary.production.total ? '✅ All Healthy' : '⚠️ Issues Detected'}

### Staging Environment
- **Healthy Targets:** ${summary.environmentSummary.staging.healthy}/${summary.environmentSummary.staging.total}
- **Status:** ${summary.environmentSummary.staging.healthy === summary.environmentSummary.staging.total ? '✅ All Healthy' : '⚠️ Issues Detected'}

## Target Analysis

${targets.map(target => `
### ${target.target.name}

**Status:** ${target.status === 'success' ? '✅ Success' : '❌ Failed'}
**Health Score:** ${target.health || 'N/A'}%
**URL:** ${target.target.url}

${target.status === 'success' ? `
**Performance Metrics:**
- Load Time: ${target.performance?.navigation?.loadComplete || 'N/A'}ms
- First Contentful Paint: ${target.performance?.paint?.firstContentfulPaint || 'N/A'}ms
- Largest Contentful Paint: ${target.performance?.paint?.largestContentfulPaint || 'N/A'}ms
- Cumulative Layout Shift: ${target.performance?.layout?.cumulativeLayoutShift || 'N/A'}
- First Input Delay: ${target.performance?.responsiveness?.firstInputDelay || 'N/A'}ms

**Console Analysis:**
- Errors: ${target.console?.errors?.length || 0}
- Warnings: ${target.console?.warnings?.length || 0}
- Total Messages: ${target.console?.totalMessages || 0}

**Network Analysis:**
- Total Requests: ${target.network?.totalRequests || 'N/A'}
- Failed Requests: ${target.network?.failedRequests || 0}
- Transfer Size: ${((target.network?.totalTransferSize || 0) / 1024 / 1024).toFixed(2)}MB

**UI Analysis:**
- Screenshots: ${target.ui?.snapshotCount || 0}
- Changes Detected: ${target.ui?.changeCount || 0}
- Accessibility Score: ${target.accessibility?.score || 'N/A'}%

**Benchmark Comparison:**
- Load Time: ${target.benchmarkComparison?.performance?.loadTime?.status || 'N/A'}
- Health Score: ${target.benchmarkComparison?.health?.status || 'N/A'}

**Alerts:** ${target.alerts?.length || 0}
${target.alerts?.map(alert => `- **${alert.level.toUpperCase()}:** ${alert.message}`).join('\n') || 'No alerts'}
` : `**Error:** ${target.error || 'Unknown error'}`}
`).join('\n')}

## Critical Alerts

${alerts.filter(a => a.level === 'critical').map(alert => `
### ${alert.targetName}
- **Type:** ${alert.type}
- **Message:** ${alert.message}
- **Time:** ${new Date(alert.timestamp).toLocaleString()}
`).join('') || 'No critical alerts detected.'}

## Recommendations

${analysis.recommendations.map(rec => `
### ${rec.target} - ${rec.priority.toUpperCase()}

**Category:** ${rec.category}
**Recommendation:** ${rec.recommendation}
**Actions:**
${rec.actions.map(action => `- ${action}`).join('\n')}
`).join('') || 'No recommendations at this time.'}

## Action Items

${analysis.actionItems.map(item => `
### ${item.priority.toUpperCase()}: ${item.title}
- **Description:** ${item.description}
- **Estimated Time:** ${item.estimatedTime}
- **Assignee:** ${item.assignee}
`).join('') || 'No immediate action items.'}

## Next Steps

${analysis.nextSteps.map(step => `- ${step}`).join('\n')}

## Historical Context

This monitoring session provides comprehensive insights into your website health and performance. Regular monitoring helps:

- 📈 Track performance trends over time
- 🚨 Proactively identify and resolve issues
- 📊 Make data-driven optimization decisions
- 🎯 Maintain consistent user experience
- 📋 Plan infrastructure improvements

---

*Report generated by Enhanced Monitoring System on ${new Date().toLocaleString()}*
*Session ID: ${report.id}*
`;
  }

  printSessionSummary() {
    const { summary } = this.currentSession;

    console.log('\n📊 Session Summary');
    console.log('==================');
    console.log(`Total Targets: ${summary.totalTargets}`);
    console.log(`Successful: ${summary.successfulTargets}`);
    console.log(`Failed: ${summary.failedTargets}`);
    console.log(`Average Health: ${summary.avgHealthScore}%`);
    console.log(`Average Load Time: ${summary.avgLoadTime}ms`);
    console.log(`Critical Alerts: ${summary.criticalAlerts}`);
    console.log(`Total Alerts: ${summary.totalAlerts}`);

    if (summary.criticalAlerts > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED - Immediate attention required!');
    }

    console.log('\n📄 Detailed report available in the reports directory');
  }

  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  async runAutomatedMonitoring(intervalMinutes = 60) {
    console.log(`⏰ Starting automated monitoring every ${intervalMinutes} minutes`);

    const run = async () => {
      try {
        console.log(`\n🔄 Running automated monitoring: ${new Date().toLocaleString()}`);
        await this.runComprehensiveMonitoring();
      } catch (error) {
        console.error('❌ Automated monitoring failed:', error.message);
      }
    };

    // Run immediately
    await run();

    // Then run on schedule
    setInterval(run, intervalMinutes * 60 * 1000);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const monitor = new EnhancedMonitoringSystem();

  if (args.includes('--automated')) {
    const interval = parseInt(args[args.indexOf('--automated') + 1]) || 60;
    monitor.runAutomatedMonitoring(interval);
  } else if (args.includes('--single')) {
    monitor.runComprehensiveMonitoring().catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  node monitoring-system-mcp.js --single         # Run monitoring once');
    console.log('  node monitoring-system-mcp.js --automated 30   # Run monitoring every 30 minutes');
  }
}

module.exports = EnhancedMonitoringSystem;