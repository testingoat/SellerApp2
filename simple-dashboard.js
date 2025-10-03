#!/usr/bin/env node

/**
 * Simple Dashboard Generator
 * Creates a working dashboard with accurate monitoring data
 */

const fs = require('fs');
const path = require('path');

class SimpleDashboard {
  constructor() {
    this.dataPath = path.join(__dirname, 'monitoring-data');
    this.dashboardPath = path.join(this.dataPath, 'dashboard');
  }

  async generateDashboard() {
    console.log('📊 Generating simple dashboard...');

    // Load latest session
    const latestSessionFile = path.join(this.dataPath, 'latest-session.json');
    if (!fs.existsSync(latestSessionFile)) {
      console.log('❌ No latest session found');
      return null;
    }

    const latestSession = JSON.parse(fs.readFileSync(latestSessionFile, 'utf8'));
    const sessionFile = path.join(this.dataPath, `session-${latestSession.sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
      console.log('❌ Session file not found');
      return null;
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    console.log(`📊 Loaded session with ${sessionData.targets.length} targets`);

    // Calculate summary
    const successfulTargets = sessionData.targets.filter(t => t.status === 'success');
    const failedTargets = sessionData.targets.filter(t => t.status === 'error');
    const avgHealth = Math.round(sessionData.targets.reduce((sum, t) => sum + (t.health || 0), 0) / sessionData.targets.length);

    // Generate HTML
    const html = this.generateHTML(sessionData, {
      totalTargets: sessionData.targets.length,
      successfulTargets: successfulTargets.length,
      failedTargets: failedTargets.length,
      avgHealth: avgHealth
    });

    // Save dashboard
    const dashboardFile = path.join(this.dashboardPath, 'dashboard.html');
    fs.writeFileSync(dashboardFile, html);

    console.log('✅ Dashboard generated successfully');
    return dashboardFile;
  }

  generateHTML(sessionData, summary) {
    const currentTime = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Monitoring Dashboard - ACCURATE</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            text-align: center;
        }

        .header h1 {
            color: #2d3748;
            font-size: 2.5rem;
            margin-bottom: 10px;
        }

        .header .subtitle {
            color: #718096;
            font-size: 1.1rem;
            margin-bottom: 20px;
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
            text-align: center;
        }

        .card-title {
            font-size: 0.9rem;
            color: #718096;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .card-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 5px;
        }

        .card-subtitle {
            font-size: 0.9rem;
            color: #a0aec0;
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
            text-align: center;
        }

        .targets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
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
            font-size: 0.9rem;
            word-break: break-all;
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
            text-align: center;
        }

        .metric-label {
            font-size: 0.8rem;
            color: #718096;
            margin-bottom: 4px;
        }

        .metric-value {
            font-size: 1.1rem;
            font-weight: 600;
            color: #2d3748;
        }

        .status-success {
            color: #38a169;
        }

        .status-error {
            color: #e53e3e;
        }

        .alert-section {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .alert-item {
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid;
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

        .alert-message {
            font-weight: 500;
            color: #2d3748;
        }

        .alert-meta {
            font-size: 0.8rem;
            color: #718096;
            margin-top: 4px;
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
        }

        .refresh-btn:hover {
            background: #3182ce;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 ACCURATE Website Monitoring Dashboard</h1>
            <div class="subtitle">Real monitoring with real error detection</div>
            <div style="color: #4a5568; margin-top: 10px;">
                Last Updated: ${currentTime} | Session: ${sessionData.session}
            </div>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="card-title">Sites Monitored</div>
                <div class="card-value">${summary.totalTargets}</div>
                <div class="card-subtitle">Total websites</div>
            </div>
            <div class="summary-card">
                <div class="card-title">Sites Online</div>
                <div class="card-value" style="color: ${summary.successfulTargets === summary.totalTargets ? '#38a169' : '#e53e3e'};">
                    ${summary.successfulTargets}/${summary.totalTargets}
                </div>
                <div class="card-subtitle">Healthy sites</div>
            </div>
            <div class="summary-card">
                <div class="card-title">Average Health</div>
                <div class="card-value" style="color: ${summary.avgHealth >= 80 ? '#38a169' : summary.avgHealth >= 60 ? '#dd6b20' : '#e53e3e'};">
                    ${summary.avgHealth}%
                </div>
                <div class="card-subtitle">System health</div>
            </div>
            <div class="summary-card">
                <div class="card-title">Sites Down</div>
                <div class="card-value" style="color: ${summary.failedTargets > 0 ? '#e53e3e' : '#38a169'};">
                    ${summary.failedTargets}
                </div>
                <div class="card-subtitle">Critical issues</div>
            </div>
        </div>

        <div class="targets-section">
            <h2 class="section-title">🎯 Website Status Details</h2>
            <div class="targets-grid">
                ${sessionData.targets.map(target => `
                    <div class="target-card">
                        <div class="target-header">
                            <div class="target-name">${target.name}</div>
                            <div class="target-environment environment-${target.environment}">
                                ${target.environment.toUpperCase()}
                            </div>
                        </div>
                        <div class="target-metrics">
                            <div class="metric">
                                <div class="metric-label">Status</div>
                                <div class="metric-value status-${target.status}">
                                    ${target.status === 'success' ? '✅ Online' : '❌ Down'}
                                </div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Health</div>
                                <div class="metric-value" style="color: ${target.health >= 80 ? '#38a169' : target.health >= 60 ? '#dd6b20' : '#e53e3e'};">
                                    ${target.health}%
                                </div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Load Time</div>
                                <div class="metric-value">${target.performance.loadTime}ms</div>
                            </div>
                            <div class="metric">
                                <div class="metric-label">Console Errors</div>
                                <div class="metric-value" style="color: ${target.console.errors.length > 0 ? '#e53e3e' : '#38a169'};">
                                    ${target.console.errors.length}
                                </div>
                            </div>
                        </div>
                        ${target.status === 'error' ? `
                            <div style="margin-top: 15px; padding: 10px; background: #fed7d7; border-radius: 4px; border-left: 4px solid #e53e3e;">
                                <strong style="color: #c53030;">Error:</strong> ${target.error}
                            </div>
                        ` : ''}
                        ${target.console.errors.length > 0 ? `
                            <div style="margin-top: 15px; padding: 10px; background: #fed7d7; border-radius: 4px;">
                                <strong style="color: #c53030;">Console Errors:</strong>
                                <ul style="margin: 5px 0; padding-left: 20px; color: #742a2a;">
                                    ${target.console.errors.map(error => `<li>${error.message}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>

        ${summary.failedTargets > 0 ? `
            <div class="alert-section">
                <h2 class="section-title">🚨 Critical Alerts</h2>
                ${sessionData.targets.filter(t => t.status === 'error').map(target => `
                    <div class="alert-item alert-critical">
                        <div class="alert-message">Site Down: ${target.name}</div>
                        <div class="alert-meta">${target.error} • Detected at ${new Date(target.timestamp).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}

        ${sessionData.targets.some(t => t.console.errors.length > 0) ? `
            <div class="alert-section">
                <h2 class="section-title">⚠️ Console Errors</h2>
                ${sessionData.targets.filter(t => t.console.errors.length > 0).map(target => `
                    <div class="alert-item alert-warning">
                        <div class="alert-message">${target.console.errors.length} console errors on ${target.name}</div>
                        <div class="alert-meta">Health Score: ${target.health}% • Last checked: ${new Date(target.timestamp).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    </div>

    <button class="refresh-btn" onclick="window.location.reload()" title="Refresh Dashboard">
        🔄
    </button>

    <script>
        // Auto-refresh every 5 minutes
        setTimeout(() => {
            window.location.reload();
        }, 5 * 60 * 1000);
    </script>
</body>
</html>`;
  }
}

// Run if called directly
if (require.main === module) {
  const dashboard = new SimpleDashboard();
  dashboard.generateDashboard()
    .then(file => {
      if (file) {
        console.log(`Dashboard generated: ${file}`);
        console.log('Open this file in your browser to view the dashboard');
      }
    })
    .catch(error => {
      console.error('Failed to generate dashboard:', error);
    });
}

module.exports = SimpleDashboard;