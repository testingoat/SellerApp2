#!/usr/bin/env node

/**
 * Trend Analysis and Historical Data Module
 * Provides historical data analysis, trend detection, and predictive insights
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

class TrendAnalysis {
  constructor() {
    this.dataPath = path.join(__dirname, 'monitoring-data');
    this.trendsPath = path.join(this.dataPath, 'trends');
    this.historyPath = path.join(this.dataPath, 'history');
    this.predictionsPath = path.join(this.dataPath, 'predictions');

    this.ensureDirectories();

    this.targets = [
      'prod-seller',
      'prod-fcm',
      'staging-seller',
      'staging-fcm'
    ];

    this.metrics = {
      health: { weight: 0.3, ideal: 95 },
      loadTime: { weight: 0.25, ideal: 2000 },
      firstContentfulPaint: { weight: 0.15, ideal: 1000 },
      layoutShift: { weight: 0.1, ideal: 0.05 },
      errorCount: { weight: 0.15, ideal: 0 },
      accessibility: { weight: 0.05, ideal: 100 }
    };
  }

  ensureDirectories() {
    [this.trendsPath, this.historyPath, this.predictionsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async analyzeTrendsForTarget(targetId, days = 30) {
    console.log(`📈 Analyzing trends for ${targetId} over ${days} days`);

    try {
      const historicalData = await this.loadHistoricalData(targetId, days);

      if (historicalData.length < 2) {
        return {
          targetId,
          status: 'insufficient_data',
          message: `Only ${historicalData.length} data points available, need at least 2 for trend analysis`,
          dataPoints: historicalData.length
        };
      }

      const analysis = {
        targetId,
        period: `${days} days`,
        dataPoints: historicalData.length,
        analysisDate: new Date().toISOString(),
        trends: {},
        insights: [],
        predictions: {},
        recommendations: []
      };

      // Analyze each metric
      for (const [metricName, metricConfig] of Object.entries(this.metrics)) {
        const metricData = historicalData.map(d => this.extractMetric(d, metricName)).filter(v => v !== null);

        if (metricData.length >= 2) {
          analysis.trends[metricName] = this.analyzeMetricTrend(metricData, metricConfig);
          analysis.predictions[metricName] = this.predictNextValue(metricData);

          // Generate insights for significant trends
          const insight = this.generateMetricInsight(metricName, analysis.trends[metricName]);
          if (insight) {
            analysis.insights.push(insight);
          }
        }
      }

      // Overall trend analysis
      analysis.overall = this.analyzeOverallTrend(historicalData);

      // Generate recommendations
      analysis.recommendations = this.generateTrendRecommendations(analysis);

      // Save analysis
      await this.saveTrendAnalysis(targetId, analysis);

      console.log(`✅ Trend analysis completed for ${targetId}`);
      return analysis;

    } catch (error) {
      console.error(`❌ Trend analysis failed for ${targetId}:`, error.message);
      return {
        targetId,
        status: 'error',
        message: error.message
      };
    }
  }

  async loadHistoricalData(targetId, days) {
    const historyFile = path.join(this.historyPath, `${targetId}-history.json`);

    if (!fs.existsSync(historyFile)) {
      console.log(`  📁 No historical data file found for ${targetId}`);
      return [];
    }

    try {
      const allData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      return allData.filter(d => new Date(d.timestamp) > cutoffDate)
                   .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error(`  ❌ Failed to load historical data for ${targetId}:`, error.message);
      return [];
    }
  }

  extractMetric(dataPoint, metricName) {
    switch (metricName) {
      case 'health':
        return dataPoint.health;
      case 'loadTime':
        return dataPoint.performance?.navigation?.loadComplete;
      case 'firstContentfulPaint':
        return dataPoint.performance?.paint?.firstContentfulPaint;
      case 'layoutShift':
        return dataPoint.performance?.layout?.cumulativeLayoutShift;
      case 'errorCount':
        return dataPoint.console?.errors?.length || 0;
      case 'accessibility':
        return dataPoint.accessibility?.score;
      default:
        return null;
    }
  }

  analyzeMetricTrend(data, config) {
    if (data.length < 2) {
      return { status: 'insufficient_data' };
    }

    const analysis = {
      status: 'success',
      dataPoints: data.length,
      current: data[data.length - 1],
      previous: data[data.length - 2],
      oldest: data[0],
      average: data.reduce((sum, val) => sum + val, 0) / data.length,
      min: Math.min(...data),
      max: Math.max(...data),
      trend: this.calculateTrendDirection(data),
      change: this.calculateChange(data),
      volatility: this.calculateVolatility(data),
      stability: this.calculateStability(data, config)
    };

    // Calculate trend strength
    analysis.trendStrength = this.calculateTrendStrength(data, analysis.trend);

    // Detect anomalies
    analysis.anomalies = this.detectAnomalies(data);

    // Calculate performance relative to ideal
    if (config.ideal !== undefined) {
      analysis.performanceVsIdeal = ((analysis.current / config.ideal) - 1) * 100;
    }

    return analysis;
  }

  calculateTrendDirection(data) {
    if (data.length < 3) return 'insufficient_data';

    // Simple linear regression
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'improving' : 'degrading';
  }

  calculateChange(data) {
    if (data.length < 2) return 0;
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    return ((current - previous) / previous) * 100;
  }

  calculateVolatility(data) {
    if (data.length < 2) return 0;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return (stdDev / mean) * 100; // Coefficient of variation
  }

  calculateStability(data, config) {
    if (data.length < 2) return 0;

    const recent = data.slice(-5); // Last 5 data points
    const older = data.slice(0, -5);

    if (older.length === 0) return 100;

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;

    return Math.max(0, 100 - change);
  }

  calculateTrendStrength(data, direction) {
    if (data.length < 3) return 0;

    // Calculate how consistent the trend is
    let consistentSteps = 0;
    let totalSteps = 0;

    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];

      if (direction === 'improving' && change > 0) {
        consistentSteps++;
      } else if (direction === 'degrading' && change < 0) {
        consistentSteps++;
      } else if (direction === 'stable' && Math.abs(change) < 0.01 * data[i - 1]) {
        consistentSteps++;
      }

      totalSteps++;
    }

    return totalSteps > 0 ? (consistentSteps / totalSteps) * 100 : 0;
  }

  detectAnomalies(data) {
    if (data.length < 5) return [];

    const anomalies = [];
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const stdDev = Math.sqrt(data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length);

    const threshold = 2 * stdDev; // 2 standard deviations

    data.forEach((value, index) => {
      if (Math.abs(value - mean) > threshold) {
        anomalies.push({
          index,
          value,
          deviation: Math.abs(value - mean) / stdDev,
          severity: Math.abs(value - mean) > 3 * stdDev ? 'high' : 'medium'
        });
      }
    });

    return anomalies;
  }

  predictNextValue(data) {
    if (data.length < 3) {
      return {
        method: 'insufficient_data',
        predicted: null,
        confidence: 0
      };
    }

    // Simple linear regression for prediction
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumXX = x.reduce((total, xi) => total + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predicted = slope * n + intercept;

    // Calculate confidence based on trend consistency and volatility
    const trend = this.calculateTrendDirection(data);
    const volatility = this.calculateVolatility(data);
    const trendStrength = this.calculateTrendStrength(data, trend);

    let confidence = 50; // Base confidence
    confidence += trendStrength * 0.3;
    confidence -= volatility * 0.2;
    confidence = Math.max(0, Math.min(100, confidence));

    return {
      method: 'linear_regression',
      predicted: Math.round(predicted * 100) / 100,
      confidence: Math.round(confidence),
      trend,
      slope: Math.round(slope * 1000) / 1000
    };
  }

  generateMetricInsight(metricName, trend) {
    if (trend.status !== 'success') return null;

    const insights = [];

    // Trend insights
    if (trend.trendStrength > 70) {
      if (trend.trend === 'improving') {
        insights.push(`Strong improving trend in ${metricName} with ${trend.trendStrength}% consistency`);
      } else if (trend.trend === 'degrading') {
        insights.push(`Concerning degrading trend in ${metricName} with ${trend.trendStrength}% consistency`);
      }
    }

    // Anomaly insights
    if (trend.anomalies.length > 0) {
      const highSeverityAnomalies = trend.anomalies.filter(a => a.severity === 'high').length;
      if (highSeverityAnomalies > 0) {
        insights.push(`${highSeverityAnomalies} high-severity anomalies detected in ${metricName}`);
      }
    }

    // Volatility insights
    if (trend.volatility > 20) {
      insights.push(`High volatility (${trend.volatility.toFixed(1)}%) detected in ${metricName}`);
    }

    // Performance insights
    if (trend.performanceVsIdeal !== undefined) {
      if (trend.performanceVsIdeal > 20) {
        insights.push(`${metricName} is ${trend.performanceVsIdeal.toFixed(1)}% worse than ideal`);
      } else if (trend.performanceVsIdeal < -10) {
        insights.push(`${metricName} is ${Math.abs(trend.performanceVsIdeal).toFixed(1)}% better than ideal`);
      }
    }

    return insights.length > 0 ? {
      metric: metricName,
      insights
    } : null;
  }

  analyzeOverallTrend(historicalData) {
    if (historicalData.length < 2) {
      return { status: 'insufficient_data' };
    }

    // Calculate overall health trend
    const healthScores = historicalData.map(d => d.health || 0);
    const healthTrend = this.analyzeMetricTrend(healthScores, this.metrics.health);

    // Calculate overall performance score
    const performanceScores = historicalData.map(d => this.calculateOverallPerformanceScore(d));
    const performanceTrend = this.analyzeMetricTrend(performanceScores, { ideal: 90 });

    // Calculate reliability (success rate)
    const successRate = historicalData.filter(d => d.status === 'success').length / historicalData.length * 100;

    return {
      healthTrend,
      performanceTrend,
      reliability: {
        current: successRate,
        trend: this.calculateTrendDirection(performanceScores)
      },
      dataQuality: {
        completeness: (historicalData.filter(d => d.health !== undefined).length / historicalData.length) * 100,
        consistency: this.calculateDataConsistency(historicalData)
      }
    };
  }

  calculateOverallPerformanceScore(dataPoint) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [metricName, metricConfig] of Object.entries(this.metrics)) {
      const value = this.extractMetric(dataPoint, metricName);
      if (value !== null) {
        let score = 0;

        if (metricName === 'layoutShift') {
          // Lower is better for layout shift
          score = Math.max(0, 100 - (value / metricConfig.ideal) * 100);
        } else if (metricName === 'errorCount') {
          // Lower is better for errors
          score = Math.max(0, 100 - (value * 20)); // Each error reduces score by 20%
        } else {
          // Higher is better for other metrics
          score = Math.min(100, (value / metricConfig.ideal) * 100);
        }

        totalScore += score * metricConfig.weight;
        totalWeight += metricConfig.weight;
      }
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  calculateDataConsistency(data) {
    if (data.length < 2) return 100;

    let consistencyScores = [];

    for (const [metricName] of Object.entries(this.metrics)) {
      const metricData = data.map(d => this.extractMetric(d, metricName)).filter(v => v !== null);
      if (metricData.length >= 2) {
        const volatility = this.calculateVolatility(metricData);
        const consistency = Math.max(0, 100 - volatility);
        consistencyScores.push(consistency);
      }
    }

    return consistencyScores.length > 0 ?
      consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length : 100;
  }

  generateTrendRecommendations(analysis) {
    const recommendations = [];

    // Health trend recommendations
    if (analysis.trends.health?.trend === 'degrading' && analysis.trends.health?.trendStrength > 60) {
      recommendations.push({
        priority: 'high',
        category: 'health',
        metric: 'health',
        recommendation: 'Health score is consistently declining - investigate root causes immediately',
        actions: ['Review recent deployments', 'Check for resource exhaustion', 'Analyze error patterns']
      });
    }

    // Performance trend recommendations
    if (analysis.trends.loadTime?.trend === 'degrading' && analysis.trends.loadTime?.trendStrength > 50) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        metric: 'loadTime',
        recommendation: 'Page load times are consistently increasing - performance optimization required',
        actions: ['Profile resource loading', 'Optimize images and assets', 'Consider CDN implementation']
      });
    }

    // Error trend recommendations
    if (analysis.trends.errorCount?.trend === 'improving' && analysis.trends.errorCount?.current > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'reliability',
        metric: 'errorCount',
        recommendation: 'Error count is improving but still present - continue debugging efforts',
        actions: ['Review error logs', 'Implement error tracking', 'Add more defensive coding']
      });
    }

    // Volatility recommendations
    const highVolatilityMetrics = Object.entries(analysis.trends)
      .filter(([_, trend]) => trend.volatility > 25)
      .map(([metric, _]) => metric);

    if (highVolatilityMetrics.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'stability',
        metric: highVolatilityMetrics.join(', '),
        recommendation: `High volatility detected in ${highVolatilityMetrics.join(', ')} - investigate inconsistent performance`,
        actions: ['Monitor external dependencies', 'Review caching strategies', 'Check for resource contention']
      });
    }

    // Prediction-based recommendations
    const concerningPredictions = Object.entries(analysis.predictions)
      .filter(([_, pred]) => pred.confidence > 70 && this.isPredictionConcerning(pred))
      .map(([metric, pred]) => ({ metric, prediction: pred }));

    if (concerningPredictions.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'predictive',
        metric: concerningPredictions.map(cp => cp.metric).join(', '),
        recommendation: 'Predictive analysis indicates future performance issues - take preventive action',
        actions: ['Schedule maintenance window', 'Prepare rollback plan', 'Increase monitoring frequency']
      });
    }

    return recommendations;
  }

  isPredictionConcerning(prediction) {
    // Define what makes a prediction concerning based on metric type
    // This is a simplified version - in practice, you'd have more sophisticated logic
    return prediction.predicted !== null && (
      prediction.slope > 100 || // Rapidly increasing trend for metrics where lower is better
      prediction.slope < -50   // Rapidly decreasing trend for metrics where higher is better
    );
  }

  async saveTrendAnalysis(targetId, analysis) {
    const analysisFile = path.join(this.trendsPath, `${targetId}-latest-analysis.json`);
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

    // Also save to historical analysis
    const historyAnalysisFile = path.join(this.trendsPath, `${targetId}-analysis-history.json`);
    let history = [];

    if (fs.existsSync(historyAnalysisFile)) {
      history = JSON.parse(fs.readFileSync(historyAnalysisFile, 'utf8'));
    }

    history.push({
      timestamp: analysis.analysisDate,
      ...analysis
    });

    // Keep only last 90 days of analysis
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    history = history.filter(h => new Date(h.timestamp) > ninetyDaysAgo);

    fs.writeFileSync(historyAnalysisFile, JSON.stringify(history, null, 2));
  }

  async addHistoricalDataPoint(targetId, monitoringResult) {
    const historyFile = path.join(this.historyPath, `${targetId}-history.json`);
    let history = [];

    if (fs.existsSync(historyFile)) {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    const dataPoint = {
      timestamp: monitoringResult.timestamp,
      sessionId: monitoringResult.sessionId || 'unknown',
      health: monitoringResult.health,
      status: monitoringResult.status,
      performance: monitoringResult.performance,
      console: monitoringResult.console,
      network: monitoringResult.network,
      accessibility: monitoringResult.accessibility,
      alerts: monitoringResult.alerts?.length || 0
    };

    history.push(dataPoint);

    // Keep only last 90 days of data
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    history = history.filter(h => new Date(h.timestamp) > ninetyDaysAgo);

    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }

  async generateTrendReport(days = 30) {
    console.log(`📊 Generating comprehensive trend report for ${days} days`);

    const report = {
      reportId: createHash('md5').update(new Date().toISOString()).digest('hex').substring(0, 8),
      generatedAt: new Date().toISOString(),
      period: `${days} days`,
      targets: [],
      summary: {},
      insights: [],
      recommendations: []
    };

    // Analyze each target
    for (const targetId of this.targets) {
      const analysis = await this.analyzeTrendsForTarget(targetId, days);
      report.targets.push(analysis);

      // Collect insights and recommendations
      if (analysis.insights) {
        report.insights.push(...analysis.insights);
      }
      if (analysis.recommendations) {
        report.recommendations.push(...analysis.recommendations);
      }
    }

    // Generate summary
    report.summary = this.generateReportSummary(report);

    // Save report
    const reportFile = path.join(this.trendsPath, `trend-report-${report.reportId}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Generate markdown report
    const markdownFile = path.join(this.trendsPath, `trend-report-${report.reportId}.md`);
    const markdown = this.generateMarkdownTrendReport(report);
    fs.writeFileSync(markdownFile, markdown);

    console.log(`📄 Trend report generated: ${markdownFile}`);
    return report;
  }

  generateReportSummary(report) {
    const successfulTargets = report.targets.filter(t => t.status !== 'error');

    if (successfulTargets.length === 0) {
      return {
        status: 'no_data',
        message: 'No successful trend analysis completed'
      };
    }

    const summary = {
      totalTargets: report.targets.length,
      successfulTargets: successfulTargets.length,
      dataPoints: successfulTargets.reduce((sum, t) => sum + (t.dataPoints || 0), 0),
      insights: report.insights.length,
      recommendations: report.recommendations.length,
      trendDistribution: {
        improving: 0,
        degrading: 0,
        stable: 0
      },
      overallHealth: 'unknown'
    };

    // Count trend distributions
    successfulTargets.forEach(target => {
      if (target.overall?.healthTrend?.trend) {
        summary.trendDistribution[target.overall.healthTrend.trend]++;
      }
    });

    // Calculate overall health
    const avgHealthScores = successfulTargets
      .map(t => t.trends.health?.average)
      .filter(score => score !== undefined);

    if (avgHealthScores.length > 0) {
      const avgHealth = avgHealthScores.reduce((sum, score) => sum + score, 0) / avgHealthScores.length;

      if (avgHealth >= 90) summary.overallHealth = 'excellent';
      else if (avgHealth >= 80) summary.overallHealth = 'good';
      else if (avgHealth >= 70) summary.overallHealth = 'fair';
      else summary.overallHealth = 'poor';
    }

    return summary;
  }

  generateMarkdownTrendReport(report) {
    const { summary, targets, insights, recommendations } = report;

    return `# Website Trend Analysis Report

**Report ID:** ${report.reportId}
**Generated:** ${new Date(report.generatedAt).toLocaleString()}
**Period:** ${report.period}
**Data Points:** ${summary.dataPoints}

## Executive Summary

- **Overall Health:** ${summary.overallHealth.toUpperCase()}
- **Targets Analyzed:** ${summary.successfulTargets}/${summary.totalTargets}
- **Total Insights:** ${summary.insights}
- **Recommendations:** ${summary.recommendations}

### Trend Distribution
- **Improving:** ${summary.trendDistribution.improving}
- **Degrading:** ${summary.trendDistribution.degrading}
- **Stable:** ${summary.trendDistribution.stable}

## Target Analysis

${targets.map(target => `
### ${target.targetId?.replace('-', ' ').toUpperCase() || 'Unknown Target'}

**Status:** ${target.status || 'unknown'}
**Data Points:** ${target.dataPoints || 0}

${target.status === 'success' ? `
#### Health Score Trend
- **Trend:** ${target.trends.health?.trend || 'unknown'}
- **Current:** ${target.trends.health?.current || 'N/A'}
- **Average:** ${target.trends.health?.average?.toFixed(1) || 'N/A'}
- **Change:** ${target.trends.health?.change?.toFixed(1) || 'N/A'}%
- **Stability:** ${target.trends.health?.stability?.toFixed(1) || 'N/A'}%

#### Performance Metrics
${Object.entries(target.trends).map(([metric, trend]) => {
  if (trend.status === 'success') {
    return `- **${metric}:** ${trend.trend} (${trend.change?.toFixed(1) || 'N/A'}% change, ${(trend.volatility || 0).toFixed(1)}% volatility)`;
  }
  return '';
}).filter(Boolean).join('\n')}

#### Key Insights
${target.insights?.map(insight =>
  insight.insights.map(i => `- ${i}`).join('\n')
).join('\n') || 'No significant insights'}

${target.recommendations?.length > 0 ? `
#### Recommendations
${target.recommendations.map(rec =>
  `- **${rec.priority.toUpperCase()}:** ${rec.recommendation}`
).join('\n')}
` : ''}
` : `**Error:** ${target.message || 'Analysis failed'}`}
`).join('\n')}

## Key Insights Across All Targets

${insights.map(insight =>
  `### ${insight.metric}
${insight.insights.map(i => `- ${i}`).join('\n')}`
).join('\n') || 'No significant insights detected.'}

## Priority Recommendations

${recommendations
  .sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  })
  .map(rec => `
### ${rec.priority.toUpperCase()}: ${rec.category}
- **Metric:** ${rec.metric}
- **Recommendation:** ${rec.recommendation}
- **Actions:**
${rec.actions.map(action => `  - ${action}`).join('\n')}
`).join('') || 'No recommendations at this time.'}

## Predictive Analysis

${targets.map(target => {
  if (target.predictions && Object.keys(target.predictions).length > 0) {
    const significantPredictions = Object.entries(target.predictions)
      .filter(([_, pred]) => pred.confidence > 70);

    if (significantPredictions.length > 0) {
      return `
### ${target.targetId}
${significantPredictions.map(([metric, pred]) =>
  `- **${metric}:** Predicted ${pred.predicted?.toFixed(1)} (${pred.confidence}% confidence, ${pred.trend} trend)`
).join('\n')}`;
    }
  }
  return '';
}).filter(Boolean).join('\n') || 'No significant predictions available.'}

---

*Report generated by Trend Analysis System*
*Analysis based on ${summary.dataPoints} data points over ${report.period}*
`;
  }
}

module.exports = TrendAnalysis;