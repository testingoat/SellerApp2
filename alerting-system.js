#!/usr/bin/env node

/**
 * Advanced Alerting System for Website Monitoring
 * Handles real-time alerts, notifications, and escalation procedures
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AlertingSystem {
  constructor() {
    this.alertsPath = path.join(__dirname, 'monitoring-data', 'alerts');
    this.configPath = path.join(__dirname, 'alerting.config.json');
    this.templatesPath = path.join(__dirname, 'alert-templates');

    this.ensureDirectories();
    this.loadConfiguration();
  }

  ensureDirectories() {
    [this.alertsPath, this.templatesPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadConfiguration() {
    const defaultConfig = {
      thresholds: {
        critical: {
          healthScore: 70,
          loadTime: 5000,
          errorCount: 1,
          failedRequests: 2
        },
        warning: {
          healthScore: 80,
          loadTime: 3000,
          errorCount: 0,
          warningCount: 5,
          failedRequests: 1
        },
        info: {
          healthScore: 90,
          loadTime: 2000,
          layoutShift: 0.1
        }
      },
      notifications: {
        email: {
          enabled: true,
          recipients: ['admin@company.com', 'devops@company.com'],
          criticalOnly: false
        },
        slack: {
          enabled: true,
          webhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
          channel: '#alerts',
          criticalOnly: false
        },
        teams: {
          enabled: false,
          webhook: 'https://outlook.office.com/webhook/YOUR/TEAMS/WEBHOOK',
          criticalOnly: true
        }
      },
      escalation: {
        enabled: true,
        levels: [
          {
            name: 'immediate',
            delay: 0,
            notifications: ['email', 'slack']
          },
          {
            name: 'followup',
            delay: 300, // 5 minutes
            notifications: ['email', 'slack', 'teams']
          },
          {
            name: 'escalation',
            delay: 1800, // 30 minutes
            notifications: ['email', 'slack', 'teams'],
            additionalRecipients: ['manager@company.com']
          }
        ]
      },
      suppression: {
        enabled: true,
        rules: [
          {
            type: 'same_alert',
            window: 600, // 10 minutes
            maxCount: 1
          },
          {
            type: 'maintenance_window',
            schedule: ['02:00-04:00'], // 2AM-4AM daily
            levels: ['info', 'warning']
          }
        ]
      }
    };

    if (!fs.existsSync(this.configPath)) {
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
      this.config = defaultConfig;
    } else {
      try {
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (error) {
        console.warn('Failed to load alerting config, using defaults:', error.message);
        this.config = defaultConfig;
      }
    }
  }

  async processAlerts(monitoringResults) {
    console.log('🚨 Processing alerts from monitoring results...');

    const alerts = [];
    const timestamp = new Date().toISOString();

    for (const target of monitoringResults.targets) {
      if (target.status === 'success') {
        const targetAlerts = this.evaluateTargetAlerts(target, timestamp);
        alerts.push(...targetAlerts);
      }
    }

    // Filter and deduplicate alerts
    const filteredAlerts = await this.filterAlerts(alerts);

    // Send notifications
    for (const alert of filteredAlerts) {
      await this.sendAlert(alert);
    }

    return filteredAlerts;
  }

  evaluateTargetAlerts(target, timestamp) {
    const alerts = [];
    const thresholds = this.config.thresholds;

    // Health score alerts
    const healthScore = target.health || 0;
    if (healthScore < thresholds.critical.healthScore) {
      alerts.push(this.createAlert(
        'critical',
        'health_score',
        `Critical: Health score ${healthScore}% is below threshold ${thresholds.critical.healthScore}%`,
        target,
        { current: healthScore, threshold: thresholds.critical.healthScore },
        timestamp
      ));
    } else if (healthScore < thresholds.warning.healthScore) {
      alerts.push(this.createAlert(
        'warning',
        'health_score',
        `Warning: Health score ${healthScore}% is below threshold ${thresholds.warning.healthScore}%`,
        target,
        { current: healthScore, threshold: thresholds.warning.healthScore },
        timestamp
      ));
    }

    // Load time alerts
    const loadTime = target.performance?.navigation?.loadComplete || 0;
    if (loadTime > thresholds.critical.loadTime) {
      alerts.push(this.createAlert(
        'critical',
        'load_time',
        `Critical: Page load time ${loadTime}ms exceeds threshold ${thresholds.critical.loadTime}ms`,
        target,
        { current: loadTime, threshold: thresholds.critical.loadTime },
        timestamp
      ));
    } else if (loadTime > thresholds.warning.loadTime) {
      alerts.push(this.createAlert(
        'warning',
        'load_time',
        `Warning: Page load time ${loadTime}ms exceeds threshold ${thresholds.warning.loadTime}ms`,
        target,
        { current: loadTime, threshold: thresholds.warning.loadTime },
        timestamp
      ));
    }

    // Console error alerts
    const errorCount = target.console?.errors?.length || 0;
    if (errorCount > thresholds.critical.errorCount) {
      alerts.push(this.createAlert(
        'critical',
        'console_errors',
        `Critical: ${errorCount} console errors detected`,
        target,
        { count: errorCount, threshold: thresholds.critical.errorCount },
        timestamp
      ));
    }

    // Network failure alerts
    const failedRequests = target.network?.failedRequests || 0;
    if (failedRequests > thresholds.critical.failedRequests) {
      alerts.push(this.createAlert(
        'critical',
        'network_failures',
        `Critical: ${failedRequests} network requests failed`,
        target,
        { count: failedRequests, threshold: thresholds.critical.failedRequests },
        timestamp
      ));
    }

    // Layout shift alerts
    const layoutShift = target.performance?.layout?.cumulativeLayoutShift || 0;
    if (layoutShift > thresholds.info.layoutShift) {
      alerts.push(this.createAlert(
        'info',
        'layout_shift',
        `Info: Cumulative layout shift ${layoutShift.toFixed(3)} exceeds threshold ${thresholds.info.layoutShift}`,
        target,
        { current: layoutShift, threshold: thresholds.info.layoutShift },
        timestamp
      ));
    }

    return alerts;
  }

  createAlert(level, type, message, target, details, timestamp) {
    return {
      id: crypto.randomBytes(16).toString('hex'),
      level,
      type,
      message,
      target: {
        id: target.target.id,
        name: target.target.name,
        url: target.target.url,
        environment: target.target.environment
      },
      details,
      timestamp,
      status: 'active',
      acknowledged: false,
      resolved: false,
      notificationsSent: [],
      escalationLevel: 0
    };
  }

  async filterAlerts(alerts) {
    const filtered = [];

    for (const alert of alerts) {
      // Check suppression rules
      if (await this.shouldSuppressAlert(alert)) {
        console.log(`  🚫 Alert suppressed: ${alert.message}`);
        continue;
      }

      // Check for duplicates
      if (await this.isDuplicateAlert(alert)) {
        console.log(`  🔄 Duplicate alert ignored: ${alert.message}`);
        continue;
      }

      filtered.push(alert);
    }

    return filtered;
  }

  async shouldSuppressAlert(alert) {
    if (!this.config.suppression.enabled) {
      return false;
    }

    // Check maintenance window suppression
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

    for (const rule of this.config.suppression.rules) {
      if (rule.type === 'maintenance_window' && rule.levels.includes(alert.level)) {
        for (const window of rule.schedule) {
          const [startTime, endTime] = window.split('-');
          if (this.isTimeInWindow(currentTime, startTime, endTime)) {
            return true;
          }
        }
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
      // Handle overnight windows (e.g., 22:00-02:00)
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async isDuplicateAlert(alert) {
    const recentAlertsFile = path.join(this.alertsPath, 'recent-alerts.json');
    let recentAlerts = [];

    if (fs.existsSync(recentAlertsFile)) {
      recentAlerts = JSON.parse(fs.readFileSync(recentAlertsFile, 'utf8'));
    }

    // Clean old alerts (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    recentAlerts = recentAlerts.filter(a => new Date(a.timestamp) > tenMinutesAgo);

    // Check for duplicate
    const isDuplicate = recentAlerts.some(recentAlert =>
      recentAlert.target.id === alert.target.id &&
      recentAlert.type === alert.type &&
      recentAlert.level === alert.level
    );

    // Add current alert to recent alerts
    recentAlerts.push(alert);
    fs.writeFileSync(recentAlertsFile, JSON.stringify(recentAlerts, null, 2));

    return isDuplicate;
  }

  async sendAlert(alert) {
    console.log(`📢 Sending alert: ${alert.level.toUpperCase()} - ${alert.message}`);

    // Save alert to file
    await this.saveAlert(alert);

    // Send immediate notifications
    await this.sendNotifications(alert, 'immediate');

    // Schedule escalation if enabled
    if (this.config.escalation.enabled) {
      this.scheduleEscalation(alert);
    }
  }

  async saveAlert(alert) {
    const alertFile = path.join(this.alertsPath, `alert-${alert.id}.json`);
    fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

    // Update alerts log
    const alertsLogFile = path.join(this.alertsPath, 'alerts-log.json');
    let alertsLog = [];

    if (fs.existsSync(alertsLogFile)) {
      alertsLog = JSON.parse(fs.readFileSync(alertsLogFile, 'utf8'));
    }

    alertsLog.push(alert);

    // Keep only last 1000 alerts
    if (alertsLog.length > 1000) {
      alertsLog = alertsLog.slice(-1000);
    }

    fs.writeFileSync(alertsLogFile, JSON.stringify(alertsLog, null, 2));
  }

  async sendNotifications(alert, level) {
    const notifications = this.getNotificationsForLevel(alert.level, level);

    for (const notification of notifications) {
      try {
        await this.sendNotification(alert, notification);
        alert.notificationsSent.push({
          type: notification,
          level,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`❌ Failed to send ${notification} notification:`, error.message);
      }
    }
  }

  getNotificationsForLevel(alertLevel, escalationLevel) {
    const notifications = [];

    if (this.config.notifications.email.enabled) {
      if (!this.config.notifications.email.criticalOnly || alertLevel === 'critical') {
        notifications.push('email');
      }
    }

    if (this.config.notifications.slack.enabled) {
      if (!this.config.notifications.slack.criticalOnly || alertLevel === 'critical') {
        notifications.push('slack');
      }
    }

    if (this.config.notifications.teams.enabled) {
      if (!this.config.notifications.teams.criticalOnly || alertLevel === 'critical') {
        notifications.push('teams');
      }
    }

    // Add escalation-specific notifications
    if (escalationLevel === 'followup' || escalationLevel === 'escalation') {
      if (this.config.escalation.levels.find(l => l.name === escalationLevel)?.additionalRecipients) {
        notifications.push('email_escalation');
      }
    }

    return notifications;
  }

  async sendNotification(alert, notificationType) {
    console.log(`  📧 Sending ${notificationType} notification for ${alert.id}`);

    switch (notificationType) {
      case 'email':
        await this.sendEmailNotification(alert);
        break;
      case 'slack':
        await this.sendSlackNotification(alert);
        break;
      case 'teams':
        await this.sendTeamsNotification(alert);
        break;
      case 'email_escalation':
        await this.sendEmailEscalation(alert);
        break;
      default:
        console.warn(`Unknown notification type: ${notificationType}`);
    }
  }

  async sendEmailNotification(alert) {
    // Simulate email sending
    console.log(`    📧 Email sent to ${this.config.notifications.email.recipients.join(', ')}`);

    const emailContent = this.generateEmailContent(alert);
    const emailFile = path.join(this.alertsPath, `email-${alert.id}.html`);
    fs.writeFileSync(emailFile, emailContent);
  }

  async sendSlackNotification(alert) {
    // Simulate Slack notification
    console.log(`    💬 Slack message sent to #${this.config.notifications.slack.channel}`);

    const slackPayload = this.generateSlackPayload(alert);
    const slackFile = path.join(this.alertsPath, `slack-${alert.id}.json`);
    fs.writeFileSync(slackFile, JSON.stringify(slackPayload, null, 2));
  }

  async sendTeamsNotification(alert) {
    // Simulate Teams notification
    console.log(`    🏢 Teams message sent`);

    const teamsPayload = this.generateTeamsPayload(alert);
    const teamsFile = path.join(this.alertsPath, `teams-${alert.id}.json`);
    fs.writeFileSync(teamsFile, JSON.stringify(teamsPayload, null, 2));
  }

  async sendEmailEscalation(alert) {
    const escalationLevel = this.config.escalation.levels.find(l => l.name === 'escalation');
    if (escalationLevel?.additionalRecipients) {
      console.log(`    📧 Escalation email sent to ${escalationLevel.additionalRecipients.join(', ')}`);
    }
  }

  generateEmailContent(alert) {
    const color = alert.level === 'critical' ? '#dc3545' : alert.level === 'warning' ? '#ffc107' : '#17a2b8';

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Website Monitoring Alert</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background-color: ${color}; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .details { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #6c757d; }
        .btn { display: inline-block; padding: 10px 20px; background-color: ${color}; color: white; text-decoration: none; border-radius: 5px; margin: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 ${alert.level.toUpperCase()} ALERT</h1>
            <p>Website Monitoring System</p>
        </div>
        <div class="content">
            <h2>${alert.message}</h2>

            <div class="details">
                <h3>Details:</h3>
                <ul>
                    <li><strong>Target:</strong> ${alert.target.name}</li>
                    <li><strong>URL:</strong> ${alert.target.url}</li>
                    <li><strong>Environment:</strong> ${alert.target.environment}</li>
                    <li><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</li>
                    <li><strong>Alert ID:</strong> ${alert.id}</li>
                </ul>
            </div>

            <div class="details">
                <h3>Metrics:</h3>
                <ul>
                    ${Object.entries(alert.details).map(([key, value]) =>
                        `<li><strong>${key}:</strong> ${value}</li>`
                    ).join('')}
                </ul>
            </div>

            <div style="text-align: center; margin: 20px 0;">
                <a href="#" class="btn">Acknowledge Alert</a>
                <a href="#" class="btn">View Dashboard</a>
            </div>
        </div>
        <div class="footer">
            <p>This alert was generated by the Website Monitoring System</p>
            <p>If you believe this is a false alarm, please contact the monitoring team</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateSlackPayload(alert) {
    const color = alert.level === 'critical' ? 'danger' : alert.level === 'warning' ? 'warning' : 'good';
    const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';

    return {
      channel: this.config.notifications.slack.channel,
      username: 'Website Monitor',
      icon_emoji: ':robot_face:',
      attachments: [
        {
          color: color,
          title: `${emoji} ${alert.level.toUpperCase()} ALERT`,
          text: alert.message,
          fields: [
            {
              title: 'Target',
              value: `${alert.target.name} (${alert.target.environment})`,
              short: true
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString(),
              short: true
            },
            {
              title: 'URL',
              value: alert.target.url,
              short: false
            }
          ],
          footer: 'Website Monitoring System',
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000)
        }
      ]
    };
  }

  generateTeamsPayload(alert) {
    const color = alert.level === 'critical' ? 'Attention' : alert.level === 'warning' ? 'Accent' : 'Good';
    const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️';

    return {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": color === 'Attention' ? 'FF0000' : color === 'Accent' ? 'FFA500' : '00FF00',
      "summary": `${alert.level.toUpperCase()} Alert: ${alert.target.name}`,
      "sections": [
        {
          "activityTitle": `${emoji} ${alert.level.toUpperCase()} ALERT`,
          "activitySubtitle": alert.message,
          "facts": [
            {
              "name": "Target",
              "value": `${alert.target.name} (${alert.target.environment})`
            },
            {
              "name": "URL",
              "value": alert.target.url
            },
            {
              "name": "Time",
              "value": new Date(alert.timestamp).toLocaleString()
            },
            {
              "name": "Alert ID",
              "value": alert.id
            }
          ]
        }
      ]
    };
  }

  scheduleEscalation(alert) {
    const escalationLevels = this.config.escalation.levels.slice(1); // Skip 'immediate' level

    escalationLevels.forEach(level => {
      setTimeout(async () => {
        try {
          console.log(`🔔 Escalating alert ${alert.id} to ${level.name} level`);
          alert.escalationLevel++;
          await this.sendNotifications(alert, level.name);

          // Update alert file
          const alertFile = path.join(this.alertsPath, `alert-${alert.id}.json`);
          if (fs.existsSync(alertFile)) {
            const savedAlert = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
            savedAlert.escalationLevel = alert.escalationLevel;
            savedAlert.notificationsSent.push(...alert.notificationsSent);
            fs.writeFileSync(alertFile, JSON.stringify(savedAlert, null, 2));
          }
        } catch (error) {
          console.error(`❌ Failed to escalate alert ${alert.id}:`, error.message);
        }
      }, level.delay * 1000);
    });
  }

  async acknowledgeAlert(alertId) {
    const alertFile = path.join(this.alertsPath, `alert-${alertId}.json`);

    if (fs.existsSync(alertFile)) {
      const alert = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      alert.status = 'acknowledged';

      fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

      // Update alerts log
      await this.updateAlertsLog(alert);

      console.log(`✅ Alert ${alertId} acknowledged`);
      return true;
    }

    return false;
  }

  async resolveAlert(alertId, resolution = '') {
    const alertFile = path.join(this.alertsPath, `alert-${alertId}.json`);

    if (fs.existsSync(alertFile)) {
      const alert = JSON.parse(fs.readFileSync(alertFile, 'utf8'));
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      alert.status = 'resolved';

      fs.writeFileSync(alertFile, JSON.stringify(alert, null, 2));

      // Update alerts log
      await this.updateAlertsLog(alert);

      console.log(`✅ Alert ${alertId} resolved`);
      return true;
    }

    return false;
  }

  async updateAlertsLog(alert) {
    const alertsLogFile = path.join(this.alertsPath, 'alerts-log.json');
    let alertsLog = [];

    if (fs.existsSync(alertsLogFile)) {
      alertsLog = JSON.parse(fs.readFileSync(alertsLogFile, 'utf8'));
    }

    const index = alertsLog.findIndex(a => a.id === alert.id);
    if (index !== -1) {
      alertsLog[index] = alert;
    }

    fs.writeFileSync(alertsLogFile, JSON.stringify(alertsLog, null, 2));
  }

  async getActiveAlerts() {
    const alertsLogFile = path.join(this.alertsPath, 'alerts-log.json');

    if (!fs.existsSync(alertsLogFile)) {
      return [];
    }

    const alertsLog = JSON.parse(fs.readFileSync(alertsLogFile, 'utf8'));
    return alertsLog.filter(alert => alert.status === 'active' && !alert.resolved);
  }

  async getAlertSummary() {
    const alertsLogFile = path.join(this.alertsPath, 'alerts-log.json');

    if (!fs.existsSync(alertsLogFile)) {
      return { total: 0, byLevel: {}, byStatus: {}, recent: [] };
    }

    const alertsLog = JSON.parse(fs.readFileSync(alertsLogFile, 'utf8'));
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAlerts = alertsLog.filter(alert => new Date(alert.timestamp) > twentyFourHoursAgo);

    const summary = {
      total: recentAlerts.length,
      byLevel: {
        critical: recentAlerts.filter(a => a.level === 'critical').length,
        warning: recentAlerts.filter(a => a.level === 'warning').length,
        info: recentAlerts.filter(a => a.level === 'info').length
      },
      byStatus: {
        active: recentAlerts.filter(a => a.status === 'active').length,
        acknowledged: recentAlerts.filter(a => a.status === 'acknowledged').length,
        resolved: recentAlerts.filter(a => a.status === 'resolved').length
      },
      recent: recentAlerts.slice(-10).reverse()
    };

    return summary;
  }
}

module.exports = AlertingSystem;