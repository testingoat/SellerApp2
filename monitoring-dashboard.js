#!/usr/bin/env node

/**
 * Comprehensive Monitoring Dashboard
 * Provides real-time visualization and reporting of website monitoring data
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

class MonitoringDashboard {
  constructor() {
    this.dataPath = path.join(__dirname, 'monitoring-data');
    this.dashboardPath = path.join(this.dataPath, 'dashboard');
    this.reportsPath = path.join(this.dataPath, 'reports');

    this.ensureDirectories();

    this.targets = [
      { id: 'prod-seller', name: 'Production Seller', environment: 'production' },
      { id: 'prod-fcm', name: 'Production FCM', environment: 'production' },
      { id: 'staging-seller', name: 'Staging Seller', environment: 'staging' },
      { id: 'staging-fcm', name: 'Staging FCM', environment: 'staging' }
    ];
  }

  ensureDirectories() {
    [this.dashboardPath, this.reportsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateDashboard() {
    console.log('📊 Generating comprehensive monitoring dashboard...');

    const dashboard = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      summary: {},
      targets: [],
      alerts: {},
      trends: {},
      performance: {},
      recommendations: []
    };

    try {
      // Load latest session data
      const latestSession = await this.loadLatestSession();
      if (latestSession) {
        dashboard.summary = this.generateDashboardSummary(latestSession);
        dashboard.targets = latestSession.targets;
        dashboard.alerts = await this.loadAlertsSummary();
        dashboard.recommendations = latestSession.analysis?.recommendations || [];
      }

      // Load trends data
      dashboard.trends = await this.loadTrendsData();

      // Load performance metrics
      dashboard.performance = await this.loadPerformanceMetrics();

      // Generate dashboard HTML
      const dashboardHtml = this.generateDashboardHTML(dashboard);
      const dashboardFile = path.join(this.dashboardPath, 'dashboard.html');
      fs.writeFileSync(dashboardFile, dashboardHtml);

      // Generate dashboard JSON
      const dashboardJsonFile = path.join(this.dashboardPath, 'dashboard-data.json');
      fs.writeFileSync(dashboardJsonFile, JSON.stringify(dashboard, null, 2));

      console.log(`✅ Dashboard generated: ${dashboardFile}`);
      return dashboardFile;

    } catch (error) {
      console.error('❌ Failed to generate dashboard:', error.message);
      throw error;
    }
  }

  async loadLatestSession() {
    const latestSessionFile = path.join(this.dataPath, 'latest-session.json');

    if (!fs.existsSync(latestSessionFile)) {
      console.log('  📁 No latest session data found');
      return null;
    }

    try {
      const latestSession = JSON.parse(fs.readFileSync(latestSessionFile, 'utf8'));
      console.log('  📄 Latest session ID:', latestSession.sessionId);

      // Load full session data
      const sessionFile = path.join(this.dataPath, `session-${latestSession.sessionId}.json`);
      if (fs.existsSync(sessionFile)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
        console.log('  📊 Session loaded, targets:', sessionData.targets?.length || 0);
        return sessionData;
      }

      console.log('  ❌ Session file not found:', sessionFile);
      return null;
    } catch (error) {
      console.error('  ❌ Failed to load latest session:', error.message);
      return null;
    }
  }

  generateDashboardSummary(session) {
    console.log('  🔧 Generating dashboard summary...');
    const targets = session.targets || [];
    console.log('  📊 Total targets in session:', targets.length);
    const successfulTargets = targets.filter(t => t.status === 'success');
    console.log('  ✅ Successful targets:', successfulTargets.length);
    const totalAlerts = targets.flatMap(t => t.alerts || []);
    const criticalAlerts = totalAlerts.filter(a => a.level === 'critical');
    const warningAlerts = totalAlerts.filter(a => a.level === 'warning');

    return {
      overallHealth: this.calculateOverallHealth(session),
      lastChecked: session.startTime,
      targets: {
        total: targets.length,
        healthy: successfulTargets.length,
        critical: criticalAlerts.length,
        warnings: warningAlerts.length
      },
      performance: {
        avgHealthScore: successfulTargets.length > 0 ?
          Math.round(successfulTargets.reduce((sum, t) => sum + (t.health || 0), 0) / successfulTargets.length) : 0,
        avgLoadTime: successfulTargets.length > 0 ?
          Math.round(successfulTargets.reduce((sum, t) => sum + (t.performance?.loadTime || 0), 0) / successfulTargets.length) : 0,
        avgResponseTime: this.calculateAverageResponseTime(session)
      },
      environment: {
        production: targets.filter(t => t.environment === 'production').length,
        staging: targets.filter(t => t.environment === 'staging').length
      },
      alerts: {
        critical: criticalAlerts.length,
        warnings: warningAlerts.length,
        total: totalAlerts.length
      }
    };
  }

  calculateOverallHealth(session) {
    const successfulTargets = (session.targets || []).filter(t => t.status === 'success');

    if (successfulTargets.length === 0) {
      return { status: 'unknown', score: 0, color: '#6c757d' };
    }

    const avgHealth = successfulTargets.reduce((sum, t) => sum + (t.health || 0), 0) / successfulTargets.length;
    const totalAlerts = (session.targets || []).flatMap(t => t.alerts || []);
    const criticalAlerts = totalAlerts.filter(a => a.level === 'critical').length;

    let status, color;
    if (avgHealth >= 90 && criticalAlerts === 0) {
      status = 'excellent';
      color = '#28a745';
    } else if (avgHealth >= 80 && criticalAlerts <= 1) {
      status = 'good';
      color = '#17a2b8';
    } else if (avgHealth >= 70 && criticalAlerts <= 3) {
      status = 'fair';
      color = '#ffc107';
    } else {
      status = 'poor';
      color = '#dc3545';
    }

    return { status, score: Math.round(avgHealth), color };
  }

  calculateAverageResponseTime(session) {
    const successfulTargets = session.targets.filter(t => t.status === 'success');
    if (successfulTargets.length === 0) return 0;

    const totalResponseTime = successfulTargets.reduce((sum, t) => {
      return sum + (t.performance?.navigation?.domContentLoaded || 0);
    }, 0);

    return Math.round(totalResponseTime / successfulTargets.length);
  }

  async loadAlertsSummary() {
    const alertsLogFile = path.join(this.dataPath, 'alerts', 'alerts-log.json');

    if (!fs.existsSync(alertsLogFile)) {
      return { total: 0, byLevel: {}, recent: [] };
    }

    try {
      const alertsLog = JSON.parse(fs.readFileSync(alertsLogFile, 'utf8'));
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAlerts = alertsLog.filter(alert => new Date(alert.timestamp) > twentyFourHoursAgo);

      return {
        total: recentAlerts.length,
        byLevel: {
          critical: recentAlerts.filter(a => a.level === 'critical').length,
          warning: recentAlerts.filter(a => a.level === 'warning').length,
          info: recentAlerts.filter(a => a.level === 'info').length
        },
        recent: recentAlerts.slice(-10).reverse()
      };
    } catch (error) {
      console.error('  ❌ Failed to load alerts summary:', error.message);
      return { total: 0, byLevel: {}, recent: [] };
    }
  }

  async loadTrendsData() {
    const trends = {};

    for (const target of this.targets) {
      const trendFile = path.join(this.dataPath, 'trends', `${target.id}-latest-analysis.json`);

      if (fs.existsSync(trendFile)) {
        try {
          const trendData = JSON.parse(fs.readFileSync(trendFile, 'utf8'));
          trends[target.id] = {
            status: trendData.status,
            healthTrend: trendData.trends?.health?.trend || 'unknown',
            performanceTrend: trendData.trends?.loadTime?.trend || 'unknown',
            reliability: trendData.overall?.reliability?.current || 0,
            insights: trendData.insights || []
          };
        } catch (error) {
          console.error(`  ❌ Failed to load trends for ${target.id}:`, error.message);
          trends[target.id] = { status: 'error' };
        }
      } else {
        trends[target.id] = { status: 'no_data' };
      }
    }

    return trends;
  }

  async loadPerformanceMetrics() {
    const metrics = {
      overall: {
        avgLoadTime: 0,
        avgFirstContentfulPaint: 0,
        avgHealthScore: 0,
        totalRequests: 0,
        failedRequests: 0
      },
      byEnvironment: {
        production: { targets: 0, avgHealth: 0, avgLoadTime: 0 },
        staging: { targets: 0, avgHealth: 0, avgLoadTime: 0 }
      },
      benchmarks: {
        loadTime: { excellent: 1000, good: 2000, fair: 3000, poor: 5000 },
        healthScore: { excellent: 95, good: 85, fair: 75, poor: 60 },
        firstContentfulPaint: { excellent: 800, good: 1500, fair: 2500, poor: 4000 }
      }
    };

    // Load latest session for performance data
    const latestSession = await this.loadLatestSession();
    if (latestSession && latestSession.targets) {
      const successfulTargets = latestSession.targets.filter(t => t.status === 'success');

      if (successfulTargets.length > 0) {
        // Calculate overall averages
        metrics.overall.avgLoadTime = Math.round(
          successfulTargets.reduce((sum, t) => sum + (t.performance?.navigation?.loadComplete || 0), 0) / successfulTargets.length
        );
        metrics.overall.avgFirstContentfulPaint = Math.round(
          successfulTargets.reduce((sum, t) => sum + (t.performance?.paint?.firstContentfulPaint || 0), 0) / successfulTargets.length
        );
        metrics.overall.avgHealthScore = Math.round(
          successfulTargets.reduce((sum, t) => sum + (t.health || 0), 0) / successfulTargets.length
        );
        metrics.overall.totalRequests = successfulTargets.reduce((sum, t) => sum + (t.network?.totalRequests || 0), 0);
        metrics.overall.failedRequests = successfulTargets.reduce((sum, t) => sum + (t.network?.failedRequests || 0), 0);

        // Calculate environment-specific metrics
        successfulTargets.forEach(target => {
          const env = target.target.environment;
          if (metrics.byEnvironment[env]) {
            metrics.byEnvironment[env].targets++;
            metrics.byEnvironment[env].avgHealth += (target.health || 0);
            metrics.byEnvironment[env].avgLoadTime += (target.performance?.navigation?.loadComplete || 0);
          }
        });

        // Finalize environment averages
        ['production', 'staging'].forEach(env => {
          if (metrics.byEnvironment[env].targets > 0) {
            metrics.byEnvironment[env].avgHealth = Math.round(
              metrics.byEnvironment[env].avgHealth / metrics.byEnvironment[env].targets
            );
            metrics.byEnvironment[env].avgLoadTime = Math.round(
              metrics.byEnvironment[env].avgLoadTime / metrics.byEnvironment[env].targets
            );
          }
        });
      }
    }

    return metrics;
  }

  generateDashboardHTML(dashboard) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Monitoring Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .header h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header .subtitle {
            color: #718096;
            font-size: 1.1rem;
        }

        .header .meta {
            display: flex;
            gap: 30px;
            margin-top: 20px;
            color: #4a5568;
        }

        .meta-item {
            display: flex;
            flex-direction: column;
        }

        .meta-label {
            font-size: 0.9rem;
            color: #a0aec0;
        }

        .meta-value {
            font-size: 1.1rem;
            font-weight: 600;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .summary-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .card-title {
            font-size: 0.9rem;
            color: #718096;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .card-value {
            font-size: 2rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 8px;
        }

        .card-subtitle {
            font-size: 0.9rem;
            color: #a0aec0;
        }

        .health-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .targets-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .section-title {
            font-size: 1.5rem;
            color: #2d3748;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .targets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .target-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            background: #f7fafc;
        }

        .target-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .target-name {
            font-weight: 600;
            color: #2d3748;
        }

        .target-environment {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 500;
        }

        .environment-production {
            background: #fed7d7;
            color: #c53030;
        }

        .environment-staging {
            background: #feebc8;
            color: #c05621;
        }

        .target-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .metric {
            display: flex;
            flex-direction: column;
        }

        .metric-label {
            font-size: 0.8rem;
            color: #718096;
        }

        .metric-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2d3748;
        }

        .alerts-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .alert-item {
            display: flex;
            align-items: center;
            padding: 12px;
            border-left: 4px solid;
            margin-bottom: 10px;
            background: #f7fafc;
            border-radius: 0 4px 4px 0;
        }

        .alert-critical {
            border-left-color: #e53e3e;
            background: #fed7d7;
        }

        .alert-warning {
            border-left-color: #dd6b20;
            background: #feebc8;
        }

        .alert-info {
            border-left-color: #3182ce;
            background: #bee3f8;
        }

        .alert-content {
            flex: 1;
        }

        .alert-message {
            font-weight: 500;
            color: #2d3748;
            margin-bottom: 4px;
        }

        .alert-meta {
            font-size: 0.8rem;
            color: #718096;
        }

        .recommendations-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .recommendation-item {
            border-left: 4px solid #38b2ac;
            background: #e6fffa;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 0 4px 4px 0;
        }

        .recommendation-priority {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        .priority-high {
            background: #feb2b2;
            color: #742a2a;
        }

        .priority-medium {
            background: #feebc8;
            color: #7c2d12;
        }

        .priority-low {
            background: #c6f6d5;
            color: #22543d;
        }

        .recommendation-text {
            color: #2d3748;
            margin-bottom: 8px;
        }

        .recommendation-actions {
            font-size: 0.9rem;
            color: #4a5568;
        }

        .no-data {
            text-align: center;
            color: #718096;
            padding: 40px;
            font-style: italic;
        }

        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #4299e1;
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(66, 153, 225, 0.3);
            transition: all 0.3s ease;
        }

        .refresh-btn:hover {
            background: #3182ce;
            transform: scale(1.1);
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }

            .summary-grid {
                grid-template-columns: 1fr;
            }

            .targets-grid {
                grid-template-columns: 1fr;
            }

            .header .meta {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>🌐 Website Monitoring Dashboard</h1>
            <div class="subtitle">Real-time monitoring and analytics for your web applications</div>
            <div class="meta">
                <div class="meta-item">
                    <span class="meta-label">Last Updated</span>
                    <span class="meta-value">${new Date(dashboard.generatedAt).toLocaleString()}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Overall Health</span>
                    <span class="meta-value">
                        <span class="health-indicator" style="background-color: ${dashboard.summary.overallHealth?.color || '#6c757d'};"></span>
                        ${dashboard.summary.overallHealth?.status || 'Unknown'} (${dashboard.summary.overallHealth?.score || 0}%)
                    </span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Version</span>
                    <span class="meta-value">${dashboard.version}</span>
                </div>
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="card-title">Target Status</div>
                <div class="card-value">${dashboard.summary.targets?.healthy || 0}/${dashboard.summary.targets?.total || 0}</div>
                <div class="card-subtitle">Healthy targets</div>
            </div>
            <div class="summary-card">
                <div class="card-title">Average Health Score</div>
                <div class="card-value">${dashboard.summary.performance?.avgHealthScore || 0}%</div>
                <div class="card-subtitle">Across all targets</div>
            </div>
            <div class="summary-card">
                <div class="card-title">Average Load Time</div>
                <div class="card-value">${dashboard.summary.performance?.avgLoadTime || 0}ms</div>
                <div class="card-subtitle">Page load performance</div>
            </div>
            <div class="summary-card">
                <div class="card-title">Active Alerts</div>
                <div class="card-value">${dashboard.summary.alerts?.total || 0}</div>
                <div class="card-subtitle">
                    ${dashboard.summary.alerts?.critical || 0} critical, ${dashboard.summary.alerts?.warnings || 0} warnings
                </div>
            </div>
        </div>

        <div class="targets-section">
            <h2 class="section-title">🎯 Target Status</h2>
            ${dashboard.targets && Array.isArray(dashboard.targets) && dashboard.targets.length > 0 ? `
                <div class="targets-grid">
                    ${dashboard.targets.filter(t => t && typeof t === 'object').map((target, index) => {
                        console.log(`  🔍 Processing target ${index}:`, target?.id, target?.name, target?.environment);
                        return `
                        <div class="target-card">
                            <div class="target-header">
                                <div class="target-name">${(target && target.name) || 'Unknown'}</div>
                                <div class="target-environment environment-${(target && target.environment) || 'unknown'}">
                                    ${(target && target.environment) || 'Unknown'}
                                </div>
                            </div>
                            <div class="target-metrics">
                                <div class="metric">
                                    <span class="metric-label">Health Score</span>
                                    <span class="metric-value">${(target && target.health) || 'N/A'}%</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Load Time</span>
                                    <span class="metric-value">${(target && target.performance && target.performance.loadTime) || 'N/A'}ms</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">FCP</span>
                                    <span class="metric-value">${(target && target.performance && target.performance.firstContentfulPaint) || 'N/A'}ms</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-label">Status</span>
                                    <span class="metric-value">${(target && target.status) === 'success' ? '✅ OK' : '❌ Error'}</span>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            ` : '<div class="no-data">No target data available</div>'}
        </div>

        <div class="alerts-section">
            <h2 class="section-title">🚨 Recent Alerts</h2>
            ${dashboard.alerts?.recent && dashboard.alerts.recent.length > 0 ? `
                ${dashboard.alerts.recent.slice(0, 5).map(alert => `
                    <div class="alert-item alert-${alert.level}">
                        <div class="alert-content">
                            <div class="alert-message">${alert.message}</div>
                            <div class="alert-meta">
                                ${alert.targetName} • ${new Date(alert.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                `).join('')}
            ` : '<div class="no-data">No recent alerts</div>'}
        </div>

        <div class="recommendations-section">
            <h2 class="section-title">💡 Recommendations</h2>
            ${dashboard.recommendations && dashboard.recommendations.length > 0 ? `
                ${dashboard.recommendations.slice(0, 5).map(rec => `
                    <div class="recommendation-item">
                        <div class="recommendation-priority priority-${rec.priority || 'medium'}">${rec.priority || 'medium'}</div>
                        <div class="recommendation-text">
                            <strong>${rec.target || 'System'}:</strong> ${rec.recommendation}
                        </div>
                        ${rec.actions ? `
                            <div class="recommendation-actions">
                                <strong>Actions:</strong> ${rec.actions.join(', ')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            ` : '<div class="no-data">No recommendations at this time</div>'}
        </div>
    </div>

    <button class="refresh-btn" onclick="window.location.reload()" title="Refresh Dashboard">
        🔄
    </button>

    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 5 * 60 * 1000);

        // Add interactive features
        document.addEventListener('DOMContentLoaded', function() {
            // Animate summary cards on load
            const cards = document.querySelectorAll('.summary-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });

            // Add click handlers for target cards
            const targetCards = document.querySelectorAll('.target-card');
            targetCards.forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', function() {
                    // In a real implementation, this would open detailed view
                    console.log('Target card clicked');
                });
            });
        });
    </script>
</body>
</html>`;
  }

  async generateScheduledReports() {
    console.log('📄 Generating scheduled monitoring reports...');

    const reports = {
      daily: await this.generateDailyReport(),
      weekly: await this.generateWeeklyReport(),
      monthly: await this.generateMonthlyReport()
    };

    return reports;
  }

  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0];
    const reportFile = path.join(this.reportsPath, `daily-report-${today}.json`);

    // Load today's monitoring sessions
    const todaySessions = await this.loadTodaySessions();

    const report = {
      type: 'daily',
      date: today,
      generatedAt: new Date().toISOString(),
      sessions: todaySessions,
      summary: this.generateDailySummary(todaySessions),
      trends: await this.generateDailyTrends(),
      recommendations: await this.generateDailyRecommendations(todaySessions)
    };

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Generate markdown version
    const markdownFile = path.join(this.reportsPath, `daily-report-${today}.md`);
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(markdownFile, markdown);

    console.log(`📄 Daily report generated: ${markdownFile}`);
    return reportFile;
  }

  async loadTodaySessions() {
    const today = new Date().toDateString();
    const sessions = [];

    // Find all session files from today
    const sessionFiles = fs.readdirSync(this.dataPath)
      .filter(file => file.startsWith('session-') && file.endsWith('.json'));

    for (const file of sessionFiles) {
      const sessionPath = path.join(this.dataPath, file);
      try {
        const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        if (new Date(session.startTime).toDateString() === today) {
          sessions.push(session);
        }
      } catch (error) {
        console.error(`  ❌ Failed to load session ${file}:`, error.message);
      }
    }

    return sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }

  generateDailySummary(sessions) {
    if (sessions.length === 0) {
      return {
        status: 'no_data',
        message: 'No monitoring sessions found for today'
      };
    }

    const allTargets = sessions.flatMap(s => s.targets);
    const successfulTargets = allTargets.filter(t => t.status === 'success');
    const allAlerts = sessions.flatMap(s => s.alerts || []);

    return {
      totalSessions: sessions.length,
      monitoringPeriod: {
        start: sessions[0].startTime,
        end: sessions[sessions.length - 1].endTime
      },
      targets: {
        total: allTargets.length,
        successful: successfulTargets.length,
        failed: allTargets.length - successfulTargets.length
      },
      performance: {
        avgHealthScore: successfulTargets.length > 0 ?
          Math.round(successfulTargets.reduce((sum, t) => sum + (t.health || 0), 0) / successfulTargets.length) : 0,
        avgLoadTime: successfulTargets.length > 0 ?
          Math.round(successfulTargets.reduce((sum, t) => sum + (t.performance?.navigation?.loadComplete || 0), 0) / successfulTargets.length) : 0
      },
      alerts: {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.level === 'critical').length,
        warnings: allAlerts.filter(a => a.level === 'warning').length,
        info: allAlerts.filter(a => a.level === 'info').length
      },
      uptime: this.calculateUptime(successfulTargets)
    };
  }

  calculateUptime(successfulTargets) {
    if (successfulTargets.length === 0) return 0;

    const healthyTargets = successfulTargets.filter(t => (t.health || 0) >= 80);
    return Math.round((healthyTargets.length / successfulTargets.length) * 100);
  }

  async generateDailyTrends() {
    // This would compare today's data with yesterday's
    // For now, return a placeholder
    return {
      healthTrend: 'stable',
      performanceTrend: 'improving',
      reliabilityTrend: 'stable'
    };
  }

  async generateDailyRecommendations(sessions) {
    const recommendations = [];

    // Analyze patterns in today's sessions
    const allAlerts = sessions.flatMap(s => s.alerts || []);
    const criticalAlerts = allAlerts.filter(a => a.level === 'critical');

    if (criticalAlerts.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'alerts',
        title: 'Address Critical Alerts',
        description: `${criticalAlerts.length} critical alerts detected today - immediate attention required`,
        actionItems: ['Review alert details', 'Implement fixes', 'Monitor resolution']
      });
    }

    // Performance recommendations
    const allTargets = sessions.flatMap(s => s.targets).filter(t => t.status === 'success');
    const slowTargets = allTargets.filter(t => (t.performance?.navigation?.loadComplete || 0) > 3000);

    if (slowTargets.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'Optimize Slow Loading Pages',
        description: `${slowTargets.length} targets showing slow load times`,
        actionItems: ['Profile page loading', 'Optimize resources', 'Consider CDN']
      });
    }

    return recommendations;
  }

  async generateWeeklyReport() {
    // Implementation for weekly reports
    console.log('📊 Weekly report generation not yet implemented');
    return null;
  }

  async generateMonthlyReport() {
    // Implementation for monthly reports
    console.log('📊 Monthly report generation not yet implemented');
    return null;
  }

  generateMarkdownReport(report) {
    const { summary, sessions, trends, recommendations } = report;

    return `# Daily Monitoring Report

**Date:** ${report.date}
**Generated:** ${new Date(report.generatedAt).toLocaleString()}

## Executive Summary

- **Monitoring Sessions:** ${summary.totalSessions}
- **Overall Uptime:** ${summary.uptime}%
- **Average Health Score:** ${summary.performance.avgHealthScore}%
- **Average Load Time:** ${summary.performance.avgLoadTime}ms
- **Total Alerts:** ${summary.alerts.total}

## Monitoring Period

- **Start:** ${new Date(summary.monitoringPeriod.start).toLocaleString()}
- **End:** ${new Date(summary.monitoringPeriod.end).toLocaleString()}

## Target Performance

- **Total Targets Checked:** ${summary.targets.total}
- **Successful:** ${summary.targets.successful}
- **Failed:** ${summary.targets.failed}

## Alert Summary

- **Critical:** ${summary.alerts.critical}
- **Warnings:** ${summary.alerts.warnings}
- **Info:** ${summary.alerts.info}

## Trends

- **Health Trend:** ${trends.healthTrend}
- **Performance Trend:** ${trends.performanceTrend}
- **Reliability Trend:** ${trends.reliabilityTrend}

## Recommendations

${recommendations.map(rec => `
### ${rec.priority.toUpperCase()}: ${rec.title}
${rec.description}

**Action Items:**
${rec.actionItems.map(action => `- ${action}`).join('\n')}
`).join('\n') || 'No recommendations for today.'}

## Session Details

${sessions.map(session => `
### Session ${session.id}
- **Time:** ${new Date(session.startTime).toLocaleString()}
- **Duration:** ${Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000)}s
- **Targets:** ${session.targets.length}
- **Alerts:** ${session.alerts?.length || 0}
`).join('\n')}

---

*Report generated by Website Monitoring System*
`;
  }
}

module.exports = MonitoringDashboard;