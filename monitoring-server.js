#!/usr/bin/env node

/**
 * Monitoring Server - Provides API endpoints for the dashboard
 * Allows dashboard to trigger monitoring system refreshes
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'monitoring-data', 'dashboard')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run monitoring system endpoint
app.post('/api/refresh-monitoring', async (req, res) => {
  try {
    console.log('🚀 Starting monitoring system refresh...');

    // Run the monitoring system
    const monitoringProcess = spawn('node', ['accurate-monitoring-system.js', '--single'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    monitoringProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    monitoringProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    const result = await new Promise((resolve, reject) => {
      monitoringProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output, code });
        } else {
          reject(new Error(`Monitoring failed with code ${code}: ${error}`));
        }
      });

      monitoringProcess.on('error', (err) => {
        reject(err);
      });
    });

    // Generate new dashboard
    console.log('📊 Generating new dashboard...');
    const dashboardProcess = spawn('node', ['advanced-dashboard.js'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    await new Promise((resolve, reject) => {
      dashboardProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Dashboard generation failed with code ${code}`));
        }
      });

      dashboardProcess.on('error', reject);
    });

    // Get latest session data
    const latestSessionFile = path.join(__dirname, 'monitoring-data', 'latest-session.json');
    let sessionData = null;

    if (fs.existsSync(latestSessionFile)) {
      const latestSession = JSON.parse(fs.readFileSync(latestSessionFile, 'utf8'));
      const sessionFile = path.join(__dirname, 'monitoring-data', `session-${latestSession.sessionId}.json`);

      if (fs.existsSync(sessionFile)) {
        sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      }
    }

    console.log('✅ Monitoring refresh completed successfully');

    res.json({
      success: true,
      message: 'Monitoring system refreshed successfully',
      timestamp: new Date().toISOString(),
      sessionData: sessionData,
      monitoringOutput: output
    });

  } catch (error) {
    console.error('❌ Monitoring refresh failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh monitoring system',
      error: error.message
    });
  }
});

// Get latest session data
app.get('/api/latest-session', (req, res) => {
  try {
    const latestSessionFile = path.join(__dirname, 'monitoring-data', 'latest-session.json');

    if (!fs.existsSync(latestSessionFile)) {
      return res.status(404).json({ error: 'No session data found' });
    }

    const latestSession = JSON.parse(fs.readFileSync(latestSessionFile, 'utf8'));
    const sessionFile = path.join(__dirname, 'monitoring-data', `session-${latestSession.sessionId}.json`);

    if (!fs.existsSync(sessionFile)) {
      return res.status(404).json({ error: 'Session file not found' });
    }

    const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

    res.json({
      success: true,
      sessionData: sessionData
    });

  } catch (error) {
    console.error('Error getting latest session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Monitoring Server running at http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard.html`);
  console.log(`🔗 API endpoints:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/refresh-monitoring - Run monitoring system`);
  console.log(`   GET  /api/latest-session - Get latest session data`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down monitoring server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down monitoring server...');
  process.exit(0);
});

module.exports = app;