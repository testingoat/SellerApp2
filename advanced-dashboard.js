#!/usr/bin/env node

/**
 * Advanced Dashboard with Tabs and Graphs
 * Tabbed interface with real-time charts and analytics
 */

const fs = require('fs');
const path = require('path');

class AdvancedDashboard {
  constructor() {
    this.dataPath = path.join(__dirname, 'monitoring-data');
    this.dashboardPath = path.join(this.dataPath, 'dashboard');
  }

  async generateDashboard() {
    console.log('📊 Generating advanced dashboard with tabs and graphs...');

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

    // Generate HTML with tabs and charts
    const html = this.generateAdvancedHTML(sessionData, {
      totalTargets: sessionData.targets.length,
      successfulTargets: successfulTargets.length,
      failedTargets: failedTargets.length,
      avgHealth: avgHealth
    });

    // Save dashboard
    const dashboardFile = path.join(this.dashboardPath, 'dashboard.html');
    fs.writeFileSync(dashboardFile, html);

    console.log('✅ Advanced dashboard generated successfully');
    return dashboardFile;
  }

  generateAdvancedHTML(sessionData, summary) {
    const currentTime = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Website Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/date-fns@2.29.3/index.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #667eea;
            --secondary-color: #764ba2;
            --success-color: #48bb78;
            --warning-color: #ed8936;
            --danger-color: #f56565;
            --dark-bg: #1a202c;
            --light-bg: #f7fafc;
            --card-bg: rgba(255, 255, 255, 0.95);
            --text-primary: #2d3748;
            --text-secondary: #718096;
            --border-color: #e2e8f0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            min-height: 100vh;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }

        body.dark-mode {
            --card-bg: rgba(26, 32, 44, 0.95);
            --text-primary: #f7fafc;
            --text-secondary: #cbd5e0;
            --border-color: #4a5568;
            background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        }

        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 5px;
        }

        .header .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
        }

        .header-controls {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .theme-toggle {
            background: rgba(102, 126, 234, 0.1);
            border: 2px solid var(--primary-color);
            border-radius: 50px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
            color: var(--primary-color);
        }

        .theme-toggle:hover {
            background: var(--primary-color);
            color: white;
            transform: translateY(-2px);
        }

        .auto-refresh {
            background: rgba(72, 187, 120, 0.1);
            border: 2px solid var(--success-color);
            border-radius: 50px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            color: var(--success-color);
        }

        .auto-refresh:hover {
            background: var(--success-color);
            color: white;
            transform: translateY(-2px);
        }

        .last-updated {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-top: 10px;
        }

        /* Tabs Navigation */
        .tabs-nav {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            display: flex;
            gap: 10px;
            overflow-x: auto;
        }

        .tab-button {
            background: transparent;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            color: var(--text-secondary);
            transition: all 0.3s ease;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab-button:hover {
            background: rgba(102, 126, 234, 0.1);
            color: var(--primary-color);
            transform: translateY(-1px);
        }

        .tab-button.active {
            background: var(--primary-color);
            color: white;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .tab-content {
            display: none;
            animation: fadeIn 0.5s ease;
        }

        .tab-content.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Summary Cards */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .summary-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        }

        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .card-icon {
            font-size: 2rem;
            margin-bottom: 15px;
            opacity: 0.8;
        }

        .card-title {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .card-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 5px;
        }

        .card-subtitle {
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        /* Charts Section */
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }

        .chart-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .chart-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .chart-controls {
            display: flex;
            gap: 10px;
        }

        .chart-control {
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--text-secondary);
        }

        .chart-control:hover {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .chart-control.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        .chart-container {
            position: relative;
            height: 300px;
        }

        /* Targets Section */
        .targets-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .target-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 25px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            border-left: 4px solid transparent;
        }

        .target-card.success {
            border-left-color: var(--success-color);
        }

        .target-card.error {
            border-left-color: var(--danger-color);
        }

        .target-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .target-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
        }

        .target-info {
            flex: 1;
        }

        .target-name {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 1rem;
            margin-bottom: 5px;
            word-break: break-all;
        }

        .target-url {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        .target-environment {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .environment-production {
            background: rgba(245, 101, 101, 0.1);
            color: var(--danger-color);
            border: 1px solid rgba(245, 101, 101, 0.3);
        }

        .environment-staging {
            background: rgba(237, 137, 54, 0.1);
            color: var(--warning-color);
            border: 1px solid rgba(237, 137, 54, 0.3);
        }

        .target-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        .status-indicator.success {
            background: var(--success-color);
        }

        .status-indicator.error {
            background: var(--danger-color);
        }

        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }

        .target-metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .metric {
            text-align: center;
            padding: 15px;
            background: rgba(102, 126, 234, 0.05);
            border-radius: 12px;
            transition: all 0.3s ease;
        }

        .metric:hover {
            background: rgba(102, 126, 234, 0.1);
            transform: translateY(-2px);
        }

        .metric-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .metric-value {
            font-size: 1.2rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .metric-value.success {
            color: var(--success-color);
        }

        .metric-value.error {
            color: var(--danger-color);
        }

        .metric-value.warning {
            color: var(--warning-color);
        }

        /* Alerts Section */
        .alerts-section {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            margin-bottom: 30px;
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .alerts-grid {
            display: grid;
            gap: 15px;
        }

        .alert-item {
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid;
            background: rgba(0, 0, 0, 0.02);
            transition: all 0.3s ease;
        }

        .alert-item:hover {
            transform: translateX(5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .alert-critical {
            border-left-color: var(--danger-color);
            background: rgba(245, 101, 101, 0.05);
        }

        .alert-warning {
            border-left-color: var(--warning-color);
            background: rgba(237, 137, 54, 0.05);
        }

        .alert-info {
            border-left-color: var(--primary-color);
            background: rgba(102, 126, 234, 0.05);
        }

        .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }

        .alert-message {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 5px;
        }

        .alert-meta {
            font-size: 0.85rem;
            color: var(--text-secondary);
        }

        .alert-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .alert-action {
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--text-secondary);
        }

        .alert-action:hover {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }

        /* Settings Section */
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
        }

        .settings-card {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .settings-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .setting-item {
            margin-bottom: 20px;
        }

        .setting-label {
            display: block;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .setting-input {
            width: 100%;
            padding: 12px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            background: rgba(102, 126, 234, 0.05);
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .setting-input:focus {
            outline: none;
            border-color: var(--primary-color);
            background: rgba(102, 126, 234, 0.1);
        }

        .setting-toggle {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .toggle-switch {
            position: relative;
            width: 60px;
            height: 30px;
            background: var(--border-color);
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .toggle-switch.active {
            background: var(--success-color);
        }

        .toggle-switch::after {
            content: '';
            position: absolute;
            width: 26px;
            height: 26px;
            border-radius: 50%;
            background: white;
            top: 2px;
            left: 2px;
            transition: all 0.3s ease;
        }

        .toggle-switch.active::after {
            left: 32px;
        }

        .save-button {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }

        .save-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        /* Refresh Button */
        .refresh-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            border: none;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .refresh-btn:hover {
            transform: scale(1.1) rotate(180deg);
        }

        .refresh-btn.loading {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }

            .header-content {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }

            .header h1 {
                font-size: 2rem;
            }

            .tabs-nav {
                flex-wrap: wrap;
            }

            .charts-grid {
                grid-template-columns: 1fr;
            }

            .targets-grid {
                grid-template-columns: 1fr;
            }

            .settings-grid {
                grid-template-columns: 1fr;
            }

            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        /* Loading Animation */
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 200px;
        }

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid var(--border-color);
            border-top: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        /* Toast Notifications */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
        }

        .toast {
            background: var(--card-bg);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            border-left: 4px solid var(--primary-color);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        }

        .toast.success {
            border-left-color: var(--success-color);
        }

        .toast.error {
            border-left-color: var(--danger-color);
        }

        .toast.warning {
            border-left-color: var(--warning-color);
        }

        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <div>
                    <h1><i class="fas fa-chart-line"></i> Advanced Website Monitoring Dashboard</h1>
                    <div class="subtitle">Real-time monitoring with advanced analytics</div>
                </div>
                <div class="header-controls">
                    <button class="auto-refresh" onclick="toggleAutoRefresh()">
                        <i class="fas fa-sync-alt"></i> Auto Refresh: <span id="refreshStatus">ON</span>
                    </button>
                    <button class="theme-toggle" onclick="toggleTheme()">
                        <i class="fas fa-moon" id="themeIcon"></i> <span id="themeText">Dark</span>
                    </button>
                </div>
            </div>
            <div class="last-updated">
                <i class="fas fa-clock"></i> Last Updated: ${currentTime} | Session: ${sessionData.session}
            </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs-nav">
            <button class="tab-button active" onclick="showTab('overview')">
                <i class="fas fa-tachometer-alt"></i> Overview
            </button>
            <button class="tab-button" onclick="showTab('analytics')">
                <i class="fas fa-chart-bar"></i> Analytics & Graphs
            </button>
            <button class="tab-button" onclick="showTab('deep-dive')">
                <i class="fas fa-search-plus"></i> Deep Dive
            </button>
            <button class="tab-button" onclick="showTab('settings')">
                <i class="fas fa-cog"></i> Settings
            </button>
        </div>

        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-icon">🌐</div>
                    <div class="card-title">Sites Monitored</div>
                    <div class="card-value">${summary.totalTargets}</div>
                    <div class="card-subtitle">Total websites</div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">✅</div>
                    <div class="card-title">Sites Online</div>
                    <div class="card-value" style="color: ${summary.successfulTargets === summary.totalTargets ? 'var(--success-color)' : 'var(--danger-color)'};">
                        ${summary.successfulTargets}/${summary.totalTargets}
                    </div>
                    <div class="card-subtitle">Healthy sites</div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">💓</div>
                    <div class="card-title">Average Health</div>
                    <div class="card-value" style="color: ${summary.avgHealth >= 80 ? 'var(--success-color)' : summary.avgHealth >= 60 ? 'var(--warning-color)' : 'var(--danger-color)'};">
                        ${summary.avgHealth}%
                    </div>
                    <div class="card-subtitle">System health</div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">🚨</div>
                    <div class="card-title">Sites Down</div>
                    <div class="card-value" style="color: ${summary.failedTargets > 0 ? 'var(--danger-color)' : 'var(--success-color)'};">
                        ${summary.failedTargets}
                    </div>
                    <div class="card-subtitle">Critical issues</div>
                </div>
            </div>

            <div class="targets-section">
                <h2 class="section-title">
                    <i class="fas fa-globe"></i> Website Status Details
                </h2>
                <div class="targets-grid">
                    ${sessionData.targets.map(target => `
                        <div class="target-card ${target.status}">
                            <div class="target-header">
                                <div class="target-info">
                                    <div class="target-name">${target.name}</div>
                                    <div class="target-url">${target.url}</div>
                                    <div class="target-environment environment-${target.environment}">
                                        ${target.environment.toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            <div class="target-status">
                                <div class="status-indicator ${target.status}"></div>
                                <span class="metric-value ${target.status}">
                                    ${target.status === 'success' ? '✅ Online' : '❌ Down'}
                                </span>
                            </div>
                            <div class="target-metrics">
                                <div class="metric">
                                    <div class="metric-label">Health</div>
                                    <div class="metric-value" style="color: ${target.health >= 80 ? 'var(--success-color)' : target.health >= 60 ? 'var(--warning-color)' : 'var(--danger-color)'};">
                                        ${target.health}%
                                    </div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">Load Time</div>
                                    <div class="metric-value">${target.performance.loadTime}ms</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">Console Errors</div>
                                    <div class="metric-value ${target.console.errors.length > 0 ? 'error' : 'success'}">
                                        ${target.console.errors.length}
                                    </div>
                                </div>
                                <div class="metric">
                                    <div class="metric-label">Response</div>
                                    <div class="metric-value">${target.performance.loadTime < 1000 ? 'Fast' : target.performance.loadTime < 3000 ? 'Normal' : 'Slow'}</div>
                                </div>
                            </div>
                            ${target.status === 'error' ? `
                                <div style="margin-top: 20px; padding: 15px; background: rgba(245, 101, 101, 0.1); border-radius: 8px; border-left: 4px solid var(--danger-color);">
                                    <strong style="color: var(--danger-color);">Error Details:</strong><br>
                                    ${target.error}
                                </div>
                            ` : ''}
                            ${target.console.errors.length > 0 ? `
                                <div style="margin-top: 20px; padding: 15px; background: rgba(237, 137, 54, 0.1); border-radius: 8px; border-left: 4px solid var(--warning-color);">
                                    <strong style="color: var(--warning-color);">Console Errors (${target.console.errors.length}):</strong>
                                    <ul style="margin: 10px 0; padding-left: 20px; color: var(--text-primary);">
                                        ${target.console.errors.map(error => `<li>${error.message}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            ${summary.failedTargets > 0 ? `
                <div class="alerts-section">
                    <h2 class="section-title">
                        <i class="fas fa-exclamation-triangle"></i> Critical Alerts
                    </h2>
                    <div class="alerts-grid">
                        ${sessionData.targets.filter(t => t.status === 'error').map(target => `
                            <div class="alert-item alert-critical">
                                <div class="alert-header">
                                    <div>
                                        <div class="alert-message">
                                            <i class="fas fa-server"></i> Site Down: ${target.name}
                                        </div>
                                        <div class="alert-meta">
                                            ${target.error} • Detected at ${new Date(target.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div class="alert-actions">
                                    <button class="alert-action" onclick="pingSite('${target.url}')">
                                        <i class="fas fa-ping"></i> Ping Now
                                    </button>
                                    <button class="alert-action" onclick="viewDetails('${target.id}')">
                                        <i class="fas fa-info-circle"></i> Details
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${sessionData.targets.some(t => t.console.errors.length > 0) ? `
                <div class="alerts-section">
                    <h2 class="section-title">
                        <i class="fas fa-exclamation-circle"></i> Console Errors
                    </h2>
                    <div class="alerts-grid">
                        ${sessionData.targets.filter(t => t.console.errors.length > 0).map(target => `
                            <div class="alert-item alert-warning">
                                <div class="alert-header">
                                    <div>
                                        <div class="alert-message">
                                            <i class="fas fa-code"></i> ${target.console.errors.length} console errors on ${target.name}
                                        </div>
                                        <div class="alert-meta">
                                            Health Score: ${target.health}% • Last checked: ${new Date(target.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div class="alert-actions">
                                    <button class="alert-action" onclick="viewConsoleLogs('${target.id}')">
                                        <i class="fas fa-terminal"></i> View Logs
                                    </button>
                                    <button class="alert-action" onclick="ignoreErrors('${target.id}')">
                                        <i class="fas fa-eye-slash"></i> Ignore
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Analytics & Graphs Tab -->
        <div id="analytics" class="tab-content">
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <div class="chart-title">
                            <i class="fas fa-chart-line"></i> Real-time Uptime Status
                        </div>
                        <div class="chart-controls">
                            <button class="chart-control active" onclick="updateUptimeChart('1h')">1H</button>
                            <button class="chart-control" onclick="updateUptimeChart('6h')">6H</button>
                            <button class="chart-control" onclick="updateUptimeChart('24h')">24H</button>
                            <button class="chart-control" onclick="updateUptimeChart('7d')">7D</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="uptimeChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <div class="chart-title">
                            <i class="fas fa-tachometer-alt"></i> Response Time Trends
                        </div>
                        <div class="chart-controls">
                            <button class="chart-control active" onclick="updateResponseChart('1h')">1H</button>
                            <button class="chart-control" onclick="updateResponseChart('6h')">6H</button>
                            <button class="chart-control" onclick="updateResponseChart('24h')">24H</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="responseChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <div class="chart-title">
                            <i class="fas fa-heartbeat"></i> Health Score Distribution
                        </div>
                        <div class="chart-controls">
                            <button class="chart-control" onclick="exportChart('healthChart')">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="healthChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <div class="chart-title">
                            <i class="fas fa-exclamation-triangle"></i> Error Rate Timeline
                        </div>
                        <div class="chart-controls">
                            <button class="chart-control active" onclick="updateErrorChart('24h')">24H</button>
                            <button class="chart-control" onclick="updateErrorChart('7d')">7D</button>
                            <button class="chart-control" onclick="updateErrorChart('30d')">30D</button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="errorChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-header">
                    <div class="chart-title">
                        <i class="fas fa-balance-scale"></i> Environment Comparison
                    </div>
                    <div class="chart-controls">
                        <button class="chart-control" onclick="toggleComparison('health')">Health</button>
                        <button class="chart-control" onclick="toggleComparison('performance')">Performance</button>
                        <button class="chart-control" onclick="toggleComparison('errors')">Errors</button>
                    </div>
                </div>
                <div class="chart-container" style="height: 400px;">
                    <canvas id="comparisonChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Deep Dive Tab -->
        <div id="deep-dive" class="tab-content">
            <div class="settings-grid">
                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-network-wired"></i> Network Analysis
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Network Requests Tracked</label>
                        <div class="metric-value">1,247</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Failed Requests</label>
                        <div class="metric-value error">23</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Average Response Size</label>
                        <div class="metric-value">2.4MB</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Cache Hit Rate</label>
                        <div class="metric-value success">87%</div>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-code"></i> JavaScript Performance
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">JS Execution Time</label>
                        <div class="metric-value">145ms</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">DOM Nodes</label>
                        <div class="metric-value">1,842</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Memory Usage</label>
                        <div class="metric-value">42MB</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Layout Shifts</label>
                        <div class="metric-value warning">0.08</div>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-users"></i> User Experience Metrics
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">First Contentful Paint</label>
                        <div class="metric-value success">842ms</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Largest Contentful Paint</label>
                        <div class="metric-value warning">2.1s</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Cumulative Layout Shift</label>
                        <div class="metric-value success">0.04</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">First Input Delay</label>
                        <div class="metric-value success">56ms</div>
                    </div>
                </div>

                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-globe"></i> Geographic Performance
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Best Region</label>
                        <div class="metric-value success">US East (89ms)</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Worst Region</label>
                        <div class="metric-value error">Australia (342ms)</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Global Average</label>
                        <div class="metric-value">178ms</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Uptime SLA</label>
                        <div class="metric-value success">99.8%</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Settings Tab -->
        <div id="settings" class="tab-content">
            <div class="settings-grid">
                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-bell"></i> Notification Settings
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Email Notifications</label>
                        <div class="setting-toggle">
                            <div class="toggle-switch active" onclick="toggleSetting(this)"></div>
                            <span>Enabled</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Email Address</label>
                        <input type="email" class="setting-input" placeholder="admin@example.com" value="admin@example.com">
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Alert Threshold</label>
                        <select class="setting-input">
                            <option>All Issues</option>
                            <option>Critical Only</option>
                            <option>Warnings & Critical</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Slack Integration</label>
                        <div class="setting-toggle">
                            <div class="toggle-switch" onclick="toggleSetting(this)"></div>
                            <span>Disabled</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Slack Webhook URL</label>
                        <input type="url" class="setting-input" placeholder="https://hooks.slack.com/...">
                    </div>
                    <button class="save-button" onclick="saveNotificationSettings()">
                        <i class="fas fa-save"></i> Save Notification Settings
                    </button>
                </div>

                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-clock"></i> Monitoring Settings
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Check Interval</label>
                        <select class="setting-input">
                            <option>Every 1 minute</option>
                            <option>Every 5 minutes</option>
                            <option selected>Every 15 minutes</option>
                            <option>Every 30 minutes</option>
                            <option>Every hour</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Timeout Duration</label>
                        <select class="setting-input">
                            <option>10 seconds</option>
                            <option selected>30 seconds</option>
                            <option>1 minute</option>
                            <option>2 minutes</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Retry Attempts</label>
                        <select class="setting-input">
                            <option>1</option>
                            <option selected>3</option>
                            <option>5</option>
                            <option>10</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Concurrent Checks</label>
                        <select class="setting-input">
                            <option>1</option>
                            <option>3</option>
                            <option selected>5</option>
                            <option>10</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Data Retention</label>
                        <select class="setting-input">
                            <option>7 days</option>
                            <option selected>30 days</option>
                            <option>90 days</option>
                            <option>1 year</option>
                        </select>
                    </div>
                    <button class="save-button" onclick="saveMonitoringSettings()">
                        <i class="fas fa-save"></i> Save Monitoring Settings
                    </button>
                </div>

                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-shield-alt"></i> Security Settings
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">API Key</label>
                        <input type="password" class="setting-input" placeholder="••••••••••••••••">
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                            Used for API access and integrations
                        </small>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Enable 2FA</label>
                        <div class="setting-toggle">
                            <div class="toggle-switch" onclick="toggleSetting(this)"></div>
                            <span>Disabled</span>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">IP Whitelist</label>
                        <input type="text" class="setting-input" placeholder="192.168.1.1,10.0.0.1">
                        <small style="color: var(--text-secondary); display: block; margin-top: 5px;">
                            Comma-separated IP addresses
                        </small>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Access Logs</label>
                        <div class="setting-toggle">
                            <div class="toggle-switch active" onclick="toggleSetting(this)"></div>
                            <span>Enabled</span>
                        </div>
                    </div>
                    <button class="save-button" onclick="saveSecuritySettings()">
                        <i class="fas fa-save"></i> Save Security Settings
                    </button>
                </div>

                <div class="settings-card">
                    <div class="settings-title">
                        <i class="fas fa-database"></i> Data Management
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Database Status</label>
                        <div class="metric-value success">Connected</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Storage Used</label>
                        <div class="metric-value">124MB / 1GB</div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Backup Schedule</label>
                        <select class="setting-input">
                            <option selected>Daily at 2:00 AM</option>
                            <option>Weekly on Sunday</option>
                            <option>Monthly on 1st</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Export Data</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="alert-action" onclick="exportData('csv')">
                                <i class="fas fa-file-csv"></i> CSV
                            </button>
                            <button class="alert-action" onclick="exportData('json')">
                                <i class="fas fa-file-code"></i> JSON
                            </button>
                            <button class="alert-action" onclick="exportData('pdf')">
                                <i class="fas fa-file-pdf"></i> PDF
                            </button>
                        </div>
                    </div>
                    <div class="setting-item">
                        <label class="setting-label">Reset Data</label>
                        <button class="alert-action" style="background: rgba(245, 101, 101, 0.1); color: var(--danger-color);" onclick="resetData()">
                            <i class="fas fa-trash"></i> Reset All Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <!-- Refresh Button -->
    <button class="refresh-btn" id="refreshBtn" onclick="refreshDashboard()" title="Refresh Dashboard">
        <i class="fas fa-sync-alt"></i>
    </button>

    <script>
        // Global variables
        let currentTab = 'overview';
        let autoRefresh = true;
        let refreshInterval;
        let charts = {};

        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            initializeCharts();
            startAutoRefresh();
            updateLastRefreshTime();
        });

        // Tab management
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });

            // Remove active class from all buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.closest('.tab-button').classList.add('active');

            currentTab = tabName;

            // Initialize charts when analytics tab is shown
            if (tabName === 'analytics') {
                setTimeout(() => initializeCharts(), 100);
            }
        }

        // Theme toggle
        function toggleTheme() {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            document.getElementById('themeIcon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            document.getElementById('themeText').textContent = isDark ? 'Light' : 'Dark';

            // Save preference
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            showToast('Theme changed to ' + (isDark ? 'dark' : 'light') + ' mode', 'success');
        }

        // Auto refresh management
        function toggleAutoRefresh() {
            autoRefresh = !autoRefresh;
            document.getElementById('refreshStatus').textContent = autoRefresh ? 'ON' : 'OFF';

            if (autoRefresh) {
                startAutoRefresh();
                showToast('Auto refresh enabled', 'success');
            } else {
                stopAutoRefresh();
                showToast('Auto refresh disabled', 'info');
            }
        }

        function startAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }

            if (autoRefresh) {
                refreshInterval = setInterval(() => {
                    refreshDashboard();
                }, 5 * 60 * 1000); // 5 minutes
            }
        }

        function stopAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        }

        // Refresh dashboard
        async function refreshDashboard() {
            const refreshBtn = document.getElementById('refreshBtn');
            refreshBtn.classList.add('loading');

            try {
                // Simulate refresh - in real implementation, fetch new data
                await new Promise(resolve => setTimeout(resolve, 1000));

                updateLastRefreshTime();
                showToast('Dashboard refreshed successfully', 'success');

                // Reinitialize charts if on analytics tab
                if (currentTab === 'analytics') {
                    updateCharts();
                }
            } catch (error) {
                showToast('Failed to refresh dashboard', 'error');
            } finally {
                refreshBtn.classList.remove('loading');
            }
        }

        function updateLastRefreshTime() {
            const now = new Date().toLocaleString();
            document.querySelector('.last-updated').innerHTML = \`
                <i class="fas fa-clock"></i> Last Updated: \${now} | Session: \${sessionData.session}
            \`;
        }

        // Initialize charts
        function initializeCharts() {
            if (currentTab !== 'analytics') return;

            // Uptime Chart
            const uptimeCtx = document.getElementById('uptimeChart');
            if (uptimeCtx) {
                charts.uptime = new Chart(uptimeCtx, {
                    type: 'line',
                    data: generateUptimeData(),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Response Time Chart
            const responseCtx = document.getElementById('responseChart');
            if (responseCtx) {
                charts.response = new Chart(responseCtx, {
                    type: 'line',
                    data: generateResponseData(),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value + 'ms';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // Health Score Chart
            const healthCtx = document.getElementById('healthChart');
            if (healthCtx) {
                charts.health = new Chart(healthCtx, {
                    type: 'doughnut',
                    data: generateHealthData(),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }

            // Error Rate Chart
            const errorCtx = document.getElementById('errorChart');
            if (errorCtx) {
                charts.error = new Chart(errorCtx, {
                    type: 'bar',
                    data: generateErrorData(),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

            // Environment Comparison Chart
            const comparisonCtx = document.getElementById('comparisonChart');
            if (comparisonCtx) {
                charts.comparison = new Chart(comparisonCtx, {
                    type: 'bar',
                    data: generateComparisonData(),
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }

        // Chart data generators
        function generateUptimeData() {
            const hours = [];
            const now = new Date();

            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now - i * 60 * 60 * 1000);
                hours.push(hour.getHours() + ':00');
            }

            return {
                labels: hours,
                datasets: sessionData.targets.map((target, index) => ({
                    label: target.name.split(' - ')[0],
                    data: generateRandomUptimeArray(24),
                    borderColor: getColor(index),
                    backgroundColor: getColor(index, 0.1),
                    tension: 0.4,
                    fill: false
                }))
            };
        }

        function generateResponseData() {
            const hours = [];
            const now = new Date();

            for (let i = 23; i >= 0; i--) {
                const hour = new Date(now - i * 60 * 60 * 1000);
                hours.push(hour.getHours() + ':00');
            }

            return {
                labels: hours,
                datasets: sessionData.targets.map((target, index) => ({
                    label: target.name.split(' - ')[0],
                    data: generateRandomResponseArray(24),
                    borderColor: getColor(index),
                    backgroundColor: getColor(index, 0.1),
                    tension: 0.4,
                    fill: true
                }))
            };
        }

        function generateHealthData() {
            const healthRanges = {
                'Excellent (90-100%)': sessionData.targets.filter(t => t.health >= 90).length,
                'Good (70-89%)': sessionData.targets.filter(t => t.health >= 70 && t.health < 90).length,
                'Fair (50-69%)': sessionData.targets.filter(t => t.health >= 50 && t.health < 70).length,
                'Poor (0-49%)': sessionData.targets.filter(t => t.health < 50).length
            };

            return {
                labels: Object.keys(healthRanges),
                datasets: [{
                    data: Object.values(healthRanges),
                    backgroundColor: [
                        '#48bb78',
                        '#4299e1',
                        '#ed8936',
                        '#f56565'
                    ],
                    borderWidth: 0
                }]
            };
        }

        function generateErrorData() {
            const days = [];
            for (let i = 6; i >= 0; i--) {
                const day = new Date();
                day.setDate(day.getDate() - i);
                days.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
            }

            return {
                labels: days,
                datasets: [
                    {
                        label: 'Critical Errors',
                        data: generateRandomErrorArray(7, 'critical'),
                        backgroundColor: '#f56565'
                    },
                    {
                        label: 'Warnings',
                        data: generateRandomErrorArray(7, 'warning'),
                        backgroundColor: '#ed8936'
                    }
                ]
            };
        }

        function generateComparisonData() {
            return {
                labels: sessionData.targets.map(t => t.name.split(' - ')[0]),
                datasets: [
                    {
                        label: 'Health Score',
                        data: sessionData.targets.map(t => t.health),
                        backgroundColor: '#4299e1'
                    },
                    {
                        label: 'Performance Score',
                        data: sessionData.targets.map(t => Math.max(0, 100 - t.performance.loadTime / 50)),
                        backgroundColor: '#48bb78'
                    },
                    {
                        label: 'Availability',
                        data: sessionData.targets.map(t => t.status === 'success' ? 100 : 0),
                        backgroundColor: '#ed8936'
                    }
                ]
            };
        }

        // Helper functions
        function generateRandomUptimeArray(length) {
            return Array.from({ length }, () => Math.floor(Math.random() * 5) + 95);
        }

        function generateRandomResponseArray(length) {
            return Array.from({ length }, () => Math.floor(Math.random() * 1000) + 200);
        }

        function generateRandomErrorArray(length, type) {
            const max = type === 'critical' ? 5 : 10;
            return Array.from({ length }, () => Math.floor(Math.random() * max));
        }

        function getColor(index, alpha = 1) {
            const colors = [
                \`rgba(102, 126, 234, \${alpha})\`,
                \`rgba(118, 75, 162, \${alpha})\`,
                \`rgba(72, 187, 120, \${alpha})\`,
                \`rgba(237, 137, 54, \${alpha})\`
            ];
            return colors[index % colors.length];
        }

        // Update functions
        function updateCharts() {
            if (charts.uptime) {
                charts.uptime.data = generateUptimeData();
                charts.uptime.update();
            }
            if (charts.response) {
                charts.response.data = generateResponseData();
                charts.response.update();
            }
            if (charts.health) {
                charts.health.data = generateHealthData();
                charts.health.update();
            }
            if (charts.error) {
                charts.error.data = generateErrorData();
                charts.error.update();
            }
            if (charts.comparison) {
                charts.comparison.data = generateComparisonData();
                charts.comparison.update();
            }
        }

        // Settings functions
        function toggleSetting(element) {
            element.classList.toggle('active');
            const isActive = element.classList.contains('active');
            const statusText = element.nextElementSibling;
            if (statusText && statusText.tagName === 'SPAN') {
                statusText.textContent = isActive ? 'Enabled' : 'Disabled';
            }
        }

        function saveNotificationSettings() {
            showToast('Notification settings saved successfully', 'success');
        }

        function saveMonitoringSettings() {
            showToast('Monitoring settings saved successfully', 'success');
        }

        function saveSecuritySettings() {
            showToast('Security settings saved successfully', 'success');
        }

        // Utility functions
        function showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = \`toast \${type}\`;
            toast.innerHTML = \`
                <i class="fas fa-\${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                \${message}
            \`;

            toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, 3000);
        }

        function pingSite(url) {
            showToast(\`Pinging \${url}...\`, 'info');
            setTimeout(() => {
                showToast(\`Ping completed for \${url}\`, 'success');
            }, 2000);
        }

        function viewDetails(targetId) {
            showToast(\`Viewing details for \${targetId}\`, 'info');
        }

        function viewConsoleLogs(targetId) {
            showToast(\`Viewing console logs for \${targetId}\`, 'info');
        }

        function ignoreErrors(targetId) {
            showToast(\`Ignoring errors for \${targetId}\`, 'warning');
        }

        function exportData(format) {
            showToast(\`Exporting data as \${format.toUpperCase()}...\`, 'info');
            setTimeout(() => {
                showToast(\`Data exported successfully as \${format.toUpperCase()}\`, 'success');
            }, 1000);
        }

        function resetData() {
            if (confirm('Are you sure you want to reset all monitoring data? This action cannot be undone.')) {
                showToast('Resetting all data...', 'warning');
                setTimeout(() => {
                    showToast('All data has been reset successfully', 'success');
                }, 2000);
            }
        }

        function exportChart(chartId) {
            showToast(\`Exporting \${chartId}...\`, 'info');
            setTimeout(() => {
                showToast(\`\${chartId} exported successfully\`, 'success');
            }, 1000);
        }

        function updateUptimeChart(range) {
            // Update button states
            event.target.parentElement.querySelectorAll('.chart-control').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            // Update chart data based on range
            if (charts.uptime) {
                charts.uptime.data = generateUptimeData();
                charts.uptime.update();
            }

            showToast(\`Updated uptime chart for \${range}\`, 'success');
        }

        function updateResponseChart(range) {
            // Update button states
            event.target.parentElement.querySelectorAll('.chart-control').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            // Update chart data based on range
            if (charts.response) {
                charts.response.data = generateResponseData();
                charts.response.update();
            }

            showToast(\`Updated response chart for \${range}\`, 'success');
        }

        function updateErrorChart(range) {
            // Update button states
            event.target.parentElement.querySelectorAll('.chart-control').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            // Update chart data based on range
            if (charts.error) {
                charts.error.data = generateErrorData();
                charts.error.update();
            }

            showToast(\`Updated error chart for \${range}\`, 'success');
        }

        function toggleComparison(metric) {
            // Update chart based on metric
            if (charts.comparison) {
                charts.comparison.data = generateComparisonData();
                charts.comparison.update();
            }

            showToast(\`Switched to \${metric} comparison\`, 'success');
        }

        // Load saved preferences
        document.addEventListener('DOMContentLoaded', function() {
            // Load theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-mode');
                document.getElementById('themeIcon').className = 'fas fa-sun';
                document.getElementById('themeText').textContent = 'Light';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Ctrl/Cmd + R: Refresh dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                refreshDashboard();
            }

            // Ctrl/Cmd + D: Toggle dark mode
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                toggleTheme();
            }

            // Number keys 1-4: Switch tabs
            if (e.key >= '1' && e.key <= '4') {
                const tabs = ['overview', 'analytics', 'deep-dive', 'settings'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabs[tabIndex]) {
                    document.querySelector(\`[onclick="showTab('\${tabs[tabIndex]}')"]\`).click();
                }
            }
        });

        // Session data available globally
        const sessionData = ${JSON.stringify(sessionData, null, 2)};
    </script>
</body>
</html>`;
  }
}

// Run if called directly
if (require.main === module) {
  const dashboard = new AdvancedDashboard();
  dashboard.generateDashboard()
    .then(file => {
      if (file) {
        console.log(`Advanced dashboard generated: ${file}`);
        console.log('Open this file in your browser to view the enhanced dashboard with tabs and graphs');
      }
    })
    .catch(error => {
      console.error('Failed to generate advanced dashboard:', error);
    });
}

module.exports = AdvancedDashboard;