#!/usr/bin/env node

/**
 * Monitoring Configuration Manager
 * Easy management of monitoring targets and settings
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

class MonitoringConfigManager {
  constructor() {
    this.configPath = path.join(__dirname, 'monitoring-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('❌ Failed to load config:', error.message);
    }

    // Return default config if file doesn't exist or is invalid
    return {
      version: "1.0.0",
      environments: { production: {}, staging: {} },
      targets: [],
      schedules: {},
      globalSettings: {},
      templates: {}
    };
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('✅ Configuration saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to save config:', error.message);
      return false;
    }
  }

  // Add a new monitoring target
  addTarget(targetConfig) {
    const target = {
      id: targetConfig.id || this.generateTargetId(targetConfig.path),
      name: targetConfig.name || this.generateTargetName(targetConfig.path),
      environment: targetConfig.environment || 'production',
      path: targetConfig.path,
      enabled: targetConfig.enabled !== false,
      priority: targetConfig.priority || 'medium',
      tags: targetConfig.tags || [],
      ...targetConfig
    };

    // Validate target
    if (!target.path) {
      throw new Error('Target path is required');
    }

    if (!this.config.environments[target.environment]) {
      throw new Error(`Unknown environment: ${target.environment}`);
    }

    // Check if target already exists
    const existingIndex = this.config.targets.findIndex(t => t.id === target.id);
    if (existingIndex >= 0) {
      console.log(`🔄 Updating existing target: ${target.id}`);
      this.config.targets[existingIndex] = target;
    } else {
      console.log(`➕ Adding new target: ${target.id}`);
      this.config.targets.push(target);
    }

    return target;
  }

  // Remove a monitoring target
  removeTarget(targetId) {
    const index = this.config.targets.findIndex(t => t.id === targetId);
    if (index >= 0) {
      const removed = this.config.targets.splice(index, 1)[0];
      console.log(`➖ Removed target: ${targetId}`);
      return removed;
    }
    throw new Error(`Target not found: ${targetId}`);
  }

  // List all targets
  listTargets(environment = null, enabled = null) {
    let targets = this.config.targets;

    if (environment) {
      targets = targets.filter(t => t.environment === environment);
    }

    if (enabled !== null) {
      targets = targets.filter(t => t.enabled === enabled);
    }

    return targets;
  }

  // Enable/disable a target
  toggleTarget(targetId, enabled) {
    const target = this.config.targets.find(t => t.id === targetId);
    if (!target) {
      throw new Error(`Target not found: ${targetId}`);
    }

    target.enabled = enabled;
    console.log(`${enabled ? '✅' : '❌'} ${enabled ? 'Enabled' : 'Disabled'} target: ${targetId}`);
    return target;
  }

  // Add targets from a sitemap or list
  addTargetsFromList(paths, environment = 'production', template = 'adminPage') {
    const addedTargets = [];

    for (const path of paths) {
      try {
        const targetConfig = {
          path,
          environment,
          template
        };

        const target = this.addTarget(targetConfig);
        addedTargets.push(target);
      } catch (error) {
        console.error(`❌ Failed to add target ${path}:`, error.message);
      }
    }

    return addedTargets;
  }

  // Discover and add pages from a website
  async discoverPages(baseUrl, environment = 'production', maxPages = 50) {
    console.log(`🔍 Discovering pages on ${baseUrl}...`);

    // This would use a web scraping library in a real implementation
    // For now, return common admin pages
    const commonPages = [
      '/admin',
      '/admin/dashboard',
      '/admin/users',
      '/admin/orders',
      '/admin/products',
      '/admin/settings',
      '/admin/analytics',
      '/admin/logs',
      '/admin/system',
      '/login',
      '/register',
      '/profile',
      '/help'
    ];

    const discovered = [];
    for (const page of commonPages) {
      discovered.push({
        path: page,
        environment,
        priority: 'medium',
        tags: ['auto-discovered']
      });
    }

    return discovered.slice(0, maxPages);
  }

  // Generate target ID from path
  generateTargetId(path) {
    return path
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  // Generate target name from path
  generateTargetName(path) {
    return path
      .split('/')
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  // Validate configuration
  validateConfig() {
    const errors = [];
    const warnings = [];

    // Check environments
    Object.keys(this.config.environments).forEach(env => {
      const envConfig = this.config.environments[env];
      if (!envConfig.baseUrl) {
        warnings.push(`Environment ${env} has no baseUrl configured`);
      }
    });

    // Check targets
    this.config.targets.forEach((target, index) => {
      if (!target.id) {
        errors.push(`Target at index ${index} has no id`);
      }

      if (!target.path) {
        errors.push(`Target ${target.id} has no path`);
      }

      if (!target.environment) {
        errors.push(`Target ${target.id} has no environment`);
      } else if (!this.config.environments[target.environment]) {
        errors.push(`Target ${target.id} references unknown environment: ${target.environment}`);
      }

      if (!target.monitoring) {
        warnings.push(`Target ${target.id} has no monitoring configuration`);
      }
    });

    return { errors, warnings };
  }

  // Get configuration summary
  getSummary() {
    const summary = {
      version: this.config.version,
      environments: Object.keys(this.config.environments).length,
      targets: {
        total: this.config.targets.length,
        enabled: this.config.targets.filter(t => t.enabled).length,
        disabled: this.config.targets.filter(t => !t.enabled).length
      },
      byEnvironment: {},
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };

    // Count by environment
    Object.keys(this.config.environments).forEach(env => {
      summary.byEnvironment[env] = this.config.targets.filter(t => t.environment === env).length;
    });

    // Count by priority
    this.config.targets.forEach(target => {
      const priority = target.priority || 'medium';
      if (summary.byPriority[priority] !== undefined) {
        summary.byPriority[priority]++;
      }
    });

    return summary;
  }

  // Export configuration
  exportConfig(format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(this.config, null, 2);

      case 'yaml':
        // YAML export would require a yaml library
        return '# YAML export not implemented yet\n' + JSON.stringify(this.config, null, 2);

      case 'csv':
        return this.exportTargetsCSV();

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Export targets as CSV
  exportTargetsCSV() {
    const headers = ['id', 'name', 'environment', 'path', 'enabled', 'priority', 'tags'];
    const rows = this.config.targets.map(target => [
      target.id,
      target.name,
      target.environment,
      target.path,
      target.enabled,
      target.priority,
      (target.tags || []).join(';')
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Import targets from CSV
  importTargetsCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const target = {};

        headers.forEach((header, index) => {
          if (values[index]) {
            switch (header.toLowerCase()) {
              case 'enabled':
                target[header] = values[index].toLowerCase() === 'true';
                break;
              case 'tags':
                target[header] = values[index].split(';').map(t => t.trim()).filter(t => t);
                break;
              default:
                target[header] = values[index];
            }
          }
        });

        const addedTarget = this.addTarget(target);
        imported.push(addedTarget);
      } catch (error) {
        errors.push({ line: i + 1, error: error.message });
      }
    }

    return { imported, errors };
  }

  // Add environment
  addEnvironment(id, config) {
    if (!config.baseUrl) {
      throw new Error('Environment baseUrl is required');
    }

    this.config.environments[id] = {
      baseUrl: config.baseUrl,
      priority: config.priority || 'medium',
      ...config
    };

    console.log(`➕ Added environment: ${id}`);
    return this.config.environments[id];
  }

  // Remove environment
  removeEnvironment(id) {
    // Check if any targets use this environment
    const targetsUsingEnv = this.config.targets.filter(t => t.environment === id);
    if (targetsUsingEnv.length > 0) {
      throw new Error(`Cannot remove environment ${id}: ${targetsUsingEnv.length} targets are using it`);
    }

    delete this.config.environments[id];
    console.log(`➖ Removed environment: ${id}`);
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new MonitoringConfigManager();

  async function handleCommand(command, args) {
    try {
      switch (command) {
        case 'add':
          const targetConfig = {
            path: args[0],
            name: args[1],
            environment: args[2] || 'production',
            priority: args[3] || 'medium'
          };
          manager.addTarget(targetConfig);
          manager.saveConfig();
          break;

        case 'remove':
          manager.removeTarget(args[0]);
          manager.saveConfig();
          break;

        case 'list':
          const targets = manager.listTargets(args[1], args[2] === 'true' ? true : args[2] === 'false' ? false : null);
          console.log('📋 Monitoring Targets:');
          targets.forEach(target => {
            console.log(`  ${target.enabled ? '✅' : '❌'} ${target.id} (${target.environment}) - ${target.path}`);
          });
          break;

        case 'enable':
          manager.toggleTarget(args[0], true);
          manager.saveConfig();
          break;

        case 'disable':
          manager.toggleTarget(args[0], false);
          manager.saveConfig();
          break;

        case 'summary':
          const summary = manager.getSummary();
          console.log('📊 Configuration Summary:');
          console.log(`  Version: ${summary.version}`);
          console.log(`  Environments: ${summary.environments}`);
          console.log(`  Targets: ${summary.targets.total} total, ${summary.targets.enabled} enabled, ${summary.targets.disabled} disabled`);
          console.log('  By Environment:', summary.byEnvironment);
          console.log('  By Priority:', summary.byPriority);
          break;

        case 'validate':
          const validation = manager.validateConfig();
          if (validation.errors.length > 0) {
            console.log('❌ Validation Errors:');
            validation.errors.forEach(error => console.log(`  - ${error}`));
          }
          if (validation.warnings.length > 0) {
            console.log('⚠️ Validation Warnings:');
            validation.warnings.forEach(warning => console.log(`  - ${warning}`));
          }
          if (validation.errors.length === 0 && validation.warnings.length === 0) {
            console.log('✅ Configuration is valid');
          }
          break;

        case 'export':
          const format = args[0] || 'json';
          const exported = manager.exportConfig(format);
          console.log(exported);
          break;

        case 'import':
          if (args[0] === 'csv' && args[1]) {
            const csvContent = fs.readFileSync(args[1], 'utf8');
            const result = manager.importTargetsCSV(csvContent);
            console.log(`✅ Imported ${result.imported.length} targets`);
            if (result.errors.length > 0) {
              console.log('❌ Import errors:');
              result.errors.forEach(error => console.log(`  Line ${error.line}: ${error.error}`));
            }
            manager.saveConfig();
          } else {
            console.log('Usage: import csv <filename>');
          }
          break;

        default:
          console.log('Available commands:');
          console.log('  add <path> [name] [environment] [priority] - Add new target');
          console.log('  remove <id> - Remove target');
          console.log('  list [environment] [enabled] - List targets');
          console.log('  enable <id> - Enable target');
          console.log('  disable <id> - Disable target');
          console.log('  summary - Show configuration summary');
          console.log('  validate - Validate configuration');
          console.log('  export [format] - Export configuration (json|yaml|csv)');
          console.log('  import csv <filename> - Import targets from CSV');
      }
    } catch (error) {
      console.error('❌ Command failed:', error.message);
      process.exit(1);
    }
  }

  const command = args[0];
  if (command) {
    handleCommand(command, args.slice(1));
  } else {
    console.log('Monitoring Configuration Manager');
    console.log('Usage: node monitoring-config-manager.js <command> [args]');
    console.log('');
    console.log('Commands: add, remove, list, enable, disable, summary, validate, export, import');
  }
}

module.exports = MonitoringConfigManager;