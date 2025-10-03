#!/usr/bin/env node

/**
 * Automated Monitoring Scheduler
 * Runs monitoring tasks automatically on schedule
 */

const cron = require('node-cron');
const MonitoringOrchestrator = require('./monitoring-orchestrator');
const fs = require('fs');
const path = require('path');

class MonitoringScheduler {
  constructor() {
    this.orchestrator = new MonitoringOrchestrator();
    this.isRunning = false;
    this.configPath = path.join(__dirname, 'monitoring-scheduler.config.json');
    this.loadConfig();
  }

  loadConfig() {
    const defaultConfig = {
      enabled: true,
      schedules: {
        quick: {
          cron: '*/15 * * * *', // Every 15 minutes
          enabled: true,
          targets: ['prod-seller', 'prod-fcm']
        },
        comprehensive: {
          cron: '0 */1 * * *', // Every hour
          enabled: true,
          targets: 'all'
        },
        deep: {
          cron: '0 2 * * *', // Daily at 2 AM
          enabled: true,
          targets: 'all'
        }
      },
      notifications: {
        enabled: true,
        email: {
          enabled: false,
          recipients: []
        },
        console: {
          enabled: true
        }
      }
    };

    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
      this.config = defaultConfig;
    } else {
      try {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (error) {
        console.warn('Failed to load scheduler config, using defaults:', error.message);
        this.config = defaultConfig;
      }
    }
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Monitoring scheduler is already running');
      return;
    }

    console.log('🚀 Starting Automated Monitoring Scheduler...');
    this.isRunning = true;

    try {
      // Start the orchestrator
      await this.orchestrator.start();

      // Set up scheduled tasks
      this.setupScheduledTasks();

      console.log('✅ Monitoring Scheduler started successfully');
      this.logInfo('Scheduler started');

      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down scheduler...');
        await this.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n🛑 Shutting down scheduler...');
        await this.stop();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Failed to start scheduler:', error.message);
      this.isRunning = false;
      throw error;
    }
  }

  setupScheduledTasks() {
    const { schedules } = this.config;

    // Quick monitoring every 15 minutes
    if (schedules.quick.enabled) {
      const quickTask = cron.schedule(schedules.quick.cron, async () => {
        await this.runScheduledTask('quick', schedules.quick.targets);
      }, {
        scheduled: false,
        timezone: 'Asia/Kolkata'
      });
      quickTask.start();
      console.log('⏰ Quick monitoring scheduled:', schedules.quick.cron);
    }

    // Comprehensive monitoring every hour
    if (schedules.comprehensive.enabled) {
      const comprehensiveTask = cron.schedule(schedules.comprehensive.cron, async () => {
        await this.runScheduledTask('comprehensive', schedules.comprehensive.targets);
      }, {
        scheduled: false,
        timezone: 'Asia/Kolkata'
      });
      comprehensiveTask.start();
      console.log('⏰ Comprehensive monitoring scheduled:', schedules.comprehensive.cron);
    }

    // Deep monitoring daily at 2 AM
    if (schedules.deep.enabled) {
      const deepTask = cron.schedule(schedules.deep.cron, async () => {
        await this.runScheduledTask('deep', schedules.deep.targets);
      }, {
        scheduled: false,
        timezone: 'Asia/Kolkata'
      });
      deepTask.start();
      console.log('⏰ Deep monitoring scheduled:', schedules.deep.cron);
    }
  }

  async runScheduledTask(type, targets) {
    if (!this.isRunning) return;

    console.log(`🔄 Running scheduled ${type} monitoring...`);

    try {
      const startTime = Date.now();

      let results;
      switch (type) {
        case 'quick':
          results = await this.orchestrator.runQuickMonitoring(targets);
          break;
        case 'comprehensive':
          results = await this.orchestrator.runComprehensiveMonitoring();
          break;
        case 'deep':
          results = await this.orchestrator.runDeepMonitoring();
          break;
        default:
          throw new Error(`Unknown monitoring type: ${type}`);
      }

      const duration = Date.now() - startTime;
      console.log(`✅ ${type} monitoring completed in ${duration}ms`);

      // Generate updated dashboard
      await this.orchestrator.generateDashboard();

      // Send notification if enabled
      if (this.config.notifications.enabled) {
        await this.sendNotification(`${type} monitoring completed`, {
          duration,
          targets: results.targets?.length || 0,
          healthy: results.targets?.filter(t => t.status === 'success').length || 0
        });
      }

      this.logInfo(`${type} monitoring completed`, { duration, results });

    } catch (error) {
      console.error(`❌ ${type} monitoring failed:`, error.message);

      if (this.config.notifications.enabled) {
        await this.sendNotification(`${type} monitoring failed: ${error.message}`, { error: error.message });
      }

      this.logError(`${type} monitoring failed`, error);
    }
  }

  async sendNotification(message, data = {}) {
    if (!this.config.notifications.enabled) return;

    if (this.config.notifications.console.enabled) {
      console.log(`📢 ${message}`, data);
    }

    if (this.config.notifications.email.enabled) {
      // Email notification implementation would go here
      console.log('📧 Email notification would be sent:', message);
    }
  }

  async stop() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping Monitoring Scheduler...');
    this.isRunning = false;

    try {
      await this.orchestrator.stop();
      console.log('✅ Monitoring Scheduler stopped successfully');
      this.logInfo('Scheduler stopped');
    } catch (error) {
      console.error('❌ Failed to stop scheduler:', error.message);
    }
  }

  async runNow(type = 'comprehensive') {
    console.log(`🔧 Running manual ${type} monitoring...`);

    try {
      switch (type) {
        case 'quick':
          return await this.orchestrator.runQuickMonitoring(['prod-seller', 'prod-fcm']);
        case 'comprehensive':
          return await this.orchestrator.runComprehensiveMonitoring();
        case 'deep':
          return await this.orchestrator.runDeepMonitoring();
        default:
          throw new Error(`Unknown monitoring type: ${type}`);
      }
    } catch (error) {
      console.error(`❌ Manual ${type} monitoring failed:`, error.message);
      throw error;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      orchestrator: this.orchestrator.getStatus(),
      config: this.config,
      nextRuns: {
        quick: this.getNextRunTime(this.config.schedules.quick.cron),
        comprehensive: this.getNextRunTime(this.config.schedules.comprehensive.cron),
        deep: this.getNextRunTime(this.config.schedules.deep.cron)
      }
    };
  }

  getNextRunTime(cronExpression) {
    try {
      // Simple next run calculation - in a real implementation, you'd use a proper cron parser
      const now = new Date();
      return new Date(now.getTime() + 15 * 60 * 1000); // Placeholder
    } catch (error) {
      return 'Unknown';
    }
  }

  async logInfo(message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      metadata
    };

    const logFile = path.join(__dirname, 'monitoring-data', 'logs', 'scheduler.log');
    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write log:', error.message);
    }
  }

  async logError(message, error, metadata = {}) {
    await this.logInfo(message, { ...metadata, error: error.message, stack: error.stack });
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const scheduler = new MonitoringScheduler();

  async function handleCommand(command) {
    try {
      switch (command) {
        case 'start':
          await scheduler.start();
          console.log('🚀 Scheduler started. Press Ctrl+C to stop.');

          // Keep process running
          await new Promise(() => {});
          break;

        case 'stop':
          await scheduler.stop();
          break;

        case 'run':
          const type = args[1] || 'comprehensive';
          await scheduler.runNow(type);
          console.log(`✅ Manual ${type} monitoring completed`);
          break;

        case 'status':
          const status = scheduler.getStatus();
          console.log('📊 Scheduler Status:');
          console.log(`  Running: ${status.isRunning}`);
          console.log(`  Orchestrator Running: ${status.orchestrator.isRunning}`);
          console.log(`  Quick Monitoring: ${status.config.schedules.quick.enabled ? 'Enabled' : 'Disabled'}`);
          console.log(`  Comprehensive Monitoring: ${status.config.schedules.comprehensive.enabled ? 'Enabled' : 'Disabled'}`);
          console.log(`  Deep Monitoring: ${status.config.schedules.deep.enabled ? 'Enabled' : 'Disabled'}`);
          break;

        default:
          console.log('Available commands:');
          console.log('  start              - Start the automated scheduler');
          console.log('  stop               - Stop the scheduler');
          console.log('  run [type]         - Run monitoring now (quick|comprehensive|deep)');
          console.log('  status             - Show scheduler status');
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
    console.log('Automated Monitoring Scheduler');
    console.log('Usage: node monitoring-scheduler.js <command>');
    console.log('');
    console.log('Commands: start, stop, run, status');
  }
}

module.exports = MonitoringScheduler;