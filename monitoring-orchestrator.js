#!/usr/bin/env node

/**
 * Website Monitoring Orchestrator
 * Main system that coordinates all monitoring components and provides a unified interface
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const EnhancedMonitoringSystem = require('./monitoring-system-mcp');
const AlertingSystem = require('./alerting-system');
const TrendAnalysis = require('./trend-analysis');
const MonitoringDashboard = require('./monitoring-dashboard');

class MonitoringOrchestrator {
  constructor() {
    this.configPath = path.join(__dirname, 'orchestrator.config.json');
    this.logPath = path.join(__dirname, 'monitoring-data', 'logs');
    this.schedulesPath = path.join(__dirname, 'monitoring-data', 'schedules');

    this.ensureDirectories();
    this.loadConfiguration();

    // Initialize components
    this.monitoringSystem = new EnhancedMonitoringSystem();
    this.alertingSystem = new AlertingSystem();
    this.trendAnalysis = new TrendAnalysis();
    this.dashboard = new MonitoringDashboard();

    this.activeSchedules = new Map();
    this.isRunning = false;
  }

  ensureDirectories() {
    [this.logPath, this.schedulesPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadConfiguration() {
    const defaultConfig = {
      monitoring: {
        defaultInterval: 60, // minutes
        maxRetries: 3,
        timeoutMs: 30000
      },
      schedules: {
        comprehensive: {
          enabled: true,
          interval: 60, // minutes
          timeWindow: '00:00-23:59'
        },
        quick: {
          enabled: true,
          interval: 15, // minutes
          targets: ['prod-seller', 'prod-fcm'] // Only production targets
        },
        deep: {
          enabled: true,
          interval: 1440, // 24 hours
          includeTrends: true,
          includePredictions: true
        }
      },
      reporting: {
        daily: {
          enabled: true,
          time: '23:59'
        },
        weekly: {
          enabled: true,
          day: 'sunday',
          time: '23:59'
        },
        monthly: {
          enabled: true,
          day: 1,
          time: '23:59'
        }
      },
      notifications: {
        startup: true,
        shutdown: true,
        errors: true,
        summaries: true
      },
      maintenance: {
        windows: ['02:00-04:00'], // Daily 2AM-4AM
        skipDuringMaintenance: true,
        reducedMonitoring: true
      }
    };

    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
      this.config = defaultConfig;
    } else {
      try {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (error) {
        console.warn('Failed to load orchestrator config, using defaults:', error.message);
        this.config = defaultConfig;
      }
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Monitoring orchestrator is already running');
      return;
    }

    console.log('🚀 Starting Website Monitoring Orchestrator...');
    this.isRunning = true;

    try {
      await this.logInfo('Orchestrator started');

      // Send startup notification if enabled
      if (this.config.notifications.startup) {
        await this.sendNotification('startup', 'Website Monitoring Orchestrator started successfully');
      }

      // Start scheduled monitoring
      await this.startScheduledMonitoring();

      // Start scheduled reporting
      await this.startScheduledReporting();

      // Generate initial dashboard
      await this.generateDashboard();

      console.log('✅ Monitoring Orchestrator started successfully');
      await this.logInfo('Orchestrator initialization completed');

    } catch (error) {
      console.error('❌ Failed to start orchestrator:', error.message);
      await this.logError('Orchestrator startup failed', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Monitoring orchestrator is not running');
      return;
    }

    console.log('🛑 Stopping Website Monitoring Orchestrator...');
    this.isRunning = false;

    try {
      // Stop all scheduled tasks
      this.activeSchedules.forEach((schedule, name) => {
        if (schedule.interval) {
          clearInterval(schedule.interval);
        }
        if (schedule.timeout) {
          clearTimeout(schedule.timeout);
        }
      });
      this.activeSchedules.clear();

      // Send shutdown notification if enabled
      if (this.config.notifications.shutdown) {
        await this.sendNotification('shutdown', 'Website Monitoring Orchestrator stopped');
      }

      await this.logInfo('Orchestrator stopped');
      console.log('✅ Monitoring Orchestrator stopped successfully');

    } catch (error) {
      console.error('❌ Failed to stop orchestrator:', error.message);
      await this.logError('Orchestrator shutdown failed', error);
    }
  }

  async startScheduledMonitoring() {
    const schedules = this.config.schedules;

    // Comprehensive monitoring
    if (schedules.comprehensive.enabled) {
      await this.scheduleMonitoring(
        'comprehensive',
        schedules.comprehensive.interval,
        this.runComprehensiveMonitoring.bind(this)
      );
    }

    // Quick monitoring
    if (schedules.quick.enabled) {
      await this.scheduleMonitoring(
        'quick',
        schedules.quick.interval,
        this.runQuickMonitoring.bind(this),
        schedules.quick.targets
      );
    }

    // Deep monitoring
    if (schedules.deep.enabled) {
      await this.scheduleMonitoring(
        'deep',
        schedules.deep.interval,
        this.runDeepMonitoring.bind(this)
      );
    }
  }

  async scheduleMonitoring(name, intervalMinutes, callback, targets = null) {
    console.log(`⏰ Scheduling ${name} monitoring every ${intervalMinutes} minutes`);

    const intervalMs = intervalMinutes * 60 * 1000;
    const schedule = {
      name,
      intervalMinutes,
      lastRun: null,
      nextRun: new Date(Date.now() + intervalMs),
      callback,
      targets
    };

    // Run immediately first
    setTimeout(async () => {
      if (this.isRunning) {
        await this.executeScheduledMonitoring(name, callback, targets);
      }
    }, 1000);

    // Then run on schedule
    const intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.executeScheduledMonitoring(name, callback, targets);
      }
    }, intervalMs);

    schedule.interval = intervalId;
    this.activeSchedules.set(name, schedule);
  }

  async executeScheduledMonitoring(name, callback, targets) {
    const schedule = this.activeSchedules.get(name);
    if (!schedule) return;

    // Check if we're in maintenance window
    if (this.shouldSkipForMaintenance(name)) {
      console.log(`🔧 Skipping ${name} monitoring due to maintenance window`);
      return;
    }

    console.log(`🔄 Executing scheduled ${name} monitoring...`);
    schedule.lastRun = new Date();

    try {
      const startTime = Date.now();

      let result;
      if (targets) {
        result = await callback(targets);
      } else {
        result = await callback();
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${name} monitoring completed in ${duration}ms`);

      // Update next run time
      schedule.nextRun = new Date(Date.now() + schedule.intervalMinutes * 60 * 1000);

      // Log completion
      await this.logInfo(`${name} monitoring completed`, {
        duration,
        result: result.summary || {}
      });

      // Process alerts if monitoring system was used
      if (result.targets) {
        await this.alertingSystem.processAlerts(result);
      }

      // Update historical data
      if (result.targets) {
        await this.updateHistoricalData(result);
      }

    } catch (error) {
      console.error(`❌ ${name} monitoring failed:`, error.message);
      await this.logError(`${name} monitoring failed`, error);

      if (this.config.notifications.errors) {
        await this.sendNotification('error', `${name} monitoring failed: ${error.message}`);
      }
    }
  }

  shouldSkipForMonitoring(scheduleName) {
    if (!this.config.maintenance.skipDuringMaintenance) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const window of this.config.maintenance.windows) {
      const [startTime, endTime] = window.split('-');
      if (this.isTimeInWindow(currentTime, startTime, endTime)) {
        return true;
      }
    }

    return false;
  }

  isTimeInWindow(current, start, end) {
    const currentMinutes = this.timeToMinutes(current);
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    } else {
      // Handle overnight windows
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async runComprehensiveMonitoring() {
    return await this.monitoringSystem.runComprehensiveMonitoring();
  }

  async runQuickMonitoring(targets) {
    // Run a lighter version of monitoring for specified targets
    console.log(`⚡ Running quick monitoring for: ${targets.join(', ')}`);

    const results = {
      session: this.generateSessionId(),
      startTime: new Date().toISOString(),
      targets: [],
      type: 'quick'
    };

    for (const targetId of targets) {
      const target = this.monitoringSystem.targets.find(t => t.id === targetId);
      if (target) {
        try {
          const result = await this.monitoringSystem.monitorTargetWithMCP(target);
          results.targets.push(result);
        } catch (error) {
          console.error(`❌ Quick monitoring failed for ${targetId}:`, error.message);
          results.targets.push({
            ...target,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    results.endTime = new Date().toISOString();
    return results;
  }

  async runDeepMonitoring() {
    console.log('🔍 Running deep monitoring with trends and predictions...');

    // Run comprehensive monitoring first
    const monitoringResults = await this.runComprehensiveMonitoring();

    // Then run trend analysis
    console.log('📈 Running trend analysis...');
    for (const target of this.monitoringSystem.targets) {
      await this.trendAnalysis.analyzeTrendsForTarget(target.id, 30);
    }

    // Generate trend report
    await this.trendAnalysis.generateTrendReport(7);

    // Generate updated dashboard
    await this.generateDashboard();

    return monitoringResults;
  }

  async startScheduledReporting() {
    const reporting = this.config.reporting;

    // Daily reports
    if (reporting.daily.enabled) {
      await this.scheduleDailyReport(reporting.daily.time);
    }

    // Weekly reports
    if (reporting.weekly.enabled) {
      await this.scheduleWeeklyReport(reporting.weekly.day, reporting.weekly.time);
    }

    // Monthly reports
    if (reporting.monthly.enabled) {
      await this.scheduleMonthlyReport(reporting.monthly.day, reporting.monthly.time);
    }
  }

  async scheduleDailyReport(time) {
    const [hours, minutes] = time.split(':').map(Number);

    const scheduleNext = () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);

      // If the scheduled time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const delay = scheduledTime - now;
      console.log(`📅 Daily report scheduled for: ${scheduledTime.toLocaleString()}`);

      const timeoutId = setTimeout(async () => {
        if (this.isRunning) {
          await this.generateDailyReport();
        }
        scheduleNext(); // Schedule next day's report
      }, delay);

      this.activeSchedules.set('daily-report', { timeout: timeoutId });
    };

    scheduleNext();
  }

  async scheduleWeeklyReport(day, time) {
    // Implementation for weekly reports
    console.log(`📅 Weekly report scheduling not yet implemented for ${day} at ${time}`);
  }

  async scheduleMonthlyReport(day, time) {
    // Implementation for monthly reports
    console.log(`📅 Monthly report scheduling not yet implemented for day ${day} at ${time}`);
  }

  async generateDailyReport() {
    console.log('📊 Generating daily report...');
    try {
      await this.dashboard.generateDailyReport();
      await this.logInfo('Daily report generated');

      if (this.config.notifications.summaries) {
        await this.sendNotification('summary', 'Daily monitoring report generated');
      }
    } catch (error) {
      console.error('❌ Failed to generate daily report:', error.message);
      await this.logError('Daily report generation failed', error);
    }
  }

  async generateDashboard() {
    try {
      await this.dashboard.generateDashboard();
      await this.logInfo('Dashboard updated');
    } catch (error) {
      console.error('❌ Failed to generate dashboard:', error.message);
      await this.logError('Dashboard generation failed', error);
    }
  }

  async updateHistoricalData(results) {
    for (const target of results.targets) {
      if (target.status === 'success') {
        await this.trendAnalysis.addHistoricalDataPoint(target.target.id, target);
      }
    }
  }

  async sendNotification(type, message) {
    // This would integrate with the alerting system or other notification services
    console.log(`📢 Notification [${type}]: ${message}`);
    await this.logInfo(`Notification sent: ${type}`, { message });
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async logInfo(message, metadata = {}) {
    await this.writeLog('info', message, metadata);
  }

  async logError(message, error, metadata = {}) {
    await this.writeLog('error', message, { ...metadata, error: error.message, stack: error.stack });
  }

  async writeLog(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata
    };

    const logFile = path.join(this.logPath, `orchestrator-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';

    fs.appendFileSync(logFile, logLine);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeSchedules: Array.from(this.activeSchedules.keys()),
      nextRuns: Array.from(this.activeSchedules.entries()).map(([name, schedule]) => ({
        name,
        nextRun: schedule.nextRun,
        lastRun: schedule.lastRun,
        interval: schedule.intervalMinutes
      })),
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }

  async runManualMonitoring(type = 'comprehensive') {
    if (!this.isRunning) {
      throw new Error('Orchestrator is not running');
    }

    console.log(`🔧 Running manual ${type} monitoring...`);

    switch (type) {
      case 'comprehensive':
        return await this.runComprehensiveMonitoring();
      case 'quick':
        return await this.runQuickMonitoring(['prod-seller', 'prod-fcm']);
      case 'deep':
        return await this.runDeepMonitoring();
      default:
        throw new Error(`Unknown monitoring type: ${type}`);
    }
  }

  async generateReport(type = 'dashboard') {
    switch (type) {
      case 'dashboard':
        await this.generateDashboard();
        return 'C:\\Seller App 2\\SellerApp2\\monitoring-data\\dashboard\\dashboard.html';
      case 'daily':
        return await this.generateDailyReport();
      case 'trends':
        return await this.trendAnalysis.generateTrendReport(7);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const orchestrator = new MonitoringOrchestrator();

  async function handleCommand(command) {
    try {
      switch (command) {
        case 'start':
          await orchestrator.start();
          console.log('🚀 Orchestrator started. Press Ctrl+C to stop.');

          // Keep process running
          process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down orchestrator...');
            await orchestrator.stop();
            process.exit(0);
          });

          // Prevent process from exiting
          await new Promise(() => {});
          break;

        case 'monitor':
          const monitorType = args[2] || 'comprehensive';
          const results = await orchestrator.runManualMonitoring(monitorType);
          console.log('✅ Manual monitoring completed');
          break;

        case 'report':
          const reportType = args[2] || 'dashboard';
          const reportPath = await orchestrator.generateReport(reportType);
          console.log(`📄 Report generated: ${reportPath}`);
          break;

        case 'status':
          const status = orchestrator.getStatus();
          console.log('📊 Orchestrator Status:');
          console.log(`  Running: ${status.isRunning}`);
          console.log(`  Active Schedules: ${status.activeSchedules.join(', ')}`);
          console.log(`  Uptime: ${Math.round(status.uptime / 1000)}s`);
          break;

        default:
          console.log('Available commands:');
          console.log('  start                     - Start the orchestrator');
          console.log('  monitor [type]            - Run manual monitoring (comprehensive|quick|deep)');
          console.log('  report [type]             - Generate report (dashboard|daily|trends)');
          console.log('  status                    - Show orchestrator status');
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    }
  }

  const command = args[0];
  if (command) {
    handleCommand(command);
  } else {
    console.log('Website Monitoring Orchestrator');
    console.log('Usage: node monitoring-orchestrator.js <command>');
    console.log('');
    console.log('Commands: start, monitor, report, status');
  }
}

module.exports = MonitoringOrchestrator;