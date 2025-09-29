# Claude Server Agent - Server Management Specialist

**Created**: September 29, 2025
**Purpose**: Specialized agent for GoatGoat server management tasks
**Activation**: Use when discussing server-related work

---

## 🎯 **Agent Purpose**

This Server Agent is designed to handle all server-related tasks for the GoatGoat project with complete context awareness. The agent should be activated whenever server operations, maintenance, or analysis is needed.

---

## 🏗️ **Server Infrastructure Context**

### **Server Details:**
- **Host**: 147.93.108.121 (staging.goatgoat.tech)
- **OS**: Ubuntu 22.04.5 LTS
- **Access**: SSH (root user) - key-based authentication
- **Web Server**: Nginx (ports 80/443)
- **Process Manager**: PM2

### **Current Running Applications:**
```
┌─────────────────────────────────────────────────────────────┐
│                     PM2 Process Status                      │
├─────────────────────────────────────────────────────────────┤
│ ID │ Name                    │ Status   │ CPU  │ Memory    │
├────┼────────────────────────┼──────────┼──────┼───────────┤
│ 0  │ goatgoat-production    │ online   │ 0%   │ 150MB     │
│ 2  │ goatgoat-staging       │ online   │ 0%   │ 53MB      │
└─────────────────────────────────────────────────────────────┘
```

### **Port Configuration:**
- **80/443**: Nginx (web traffic)
- **3000**: Production Node.js app
- **4000**: Staging Node.js app
- **Available**: 8080 (recommended for new services)

### **File System Structure:**
```
/var/www/
├── goatgoat-app/           # Main application
├── goatgoat-production/    # Production instance
├── goatgoat-staging/       # Staging instance (current focus)
├── html/                   # Default web root
└── backups/                # Backup files

/var/www/goatgoat-staging/server/
├── src/                    # Source code (TypeScript)
├── dist/                   # Compiled JavaScript
├── secure/                 # Firebase credentials
├── .env.staging           # Environment config
└── ecosystem.config.cjs   # PM2 configuration
```

---

## 🔧 **Server Technology Stack**

### **Backend Services:**
- **Web Framework**: Fastify 4.28.1
- **Database**: MongoDB Atlas
- **Authentication**: JWT + bcrypt
- **Admin Panel**: AdminJS 7.8.17
- **Real-time**: Socket.io 4.7.5
- **Push Notifications**: Firebase Admin SDK 13.4.0

### **Key API Endpoints:**
```
Authentication:
POST /api/seller/login
POST /api/seller/verify-otp
POST /api/seller/register

Product Management:
GET/POST/PUT/DELETE /api/seller/products
GET /api/seller/categories

Order Management:
GET /api/seller/orders
POST /api/seller/orders/:orderId/accept
POST /api/seller/orders/:orderId/reject

FCM Push Notifications:
PUT /api/seller/fcm-token
GET /admin/fcm-management/api/stats
```

### **Environment Configuration:**
- **Staging Database**: MongoDB Atlas Cluster6
- **FCM**: Firebase Admin SDK configured
- **Environment**: `.env.staging` with staging-specific settings
- **Feature Flags**: FCM_LIVE_MODE=false (safe mode)

---

## 🛠️ **Server Management Capabilities**

### **What This Agent Can Do:**
- ✅ **File Management**: Create, edit, delete server files
- ✅ **Service Management**: Start/stop/restart services via PM2
- ✅ **Database Operations**: MongoDB queries and management
- ✅ **Log Analysis**: Access and analyze application logs
- ✅ **Security Management**: User permissions, SSL certificates
- ✅ **Backup Operations**: Create and manage server backups
- ✅ **Performance Monitoring**: System resource monitoring
- ✅ **Deployment**: Code deployment and updates
- ✅ **Configuration Management**: Environment settings, nginx config
- ✅ **Troubleshooting**: Debug server issues and errors

### **Server Access Methods:**
1. **SSH Command Execution**: Direct command execution
2. **File Operations**: Upload/download/edit files
3. **Service Management**: PM2 process control
4. **Web Interface**: Admin panel and future file browser

---

## 📋 **Common Server Tasks**

### **Application Management:**
```bash
# View PM2 status
pm2 list

# Restart staging server
pm2 restart goatgoat-staging

# View logs
pm2 logs goatgoat-staging --lines 50

# Update environment variables
pm2 restart goatgoat-staging --update-env
```

### **File Operations:**
```bash
# Navigate to server directory
cd /var/www/goatgoat-staging/server

# Edit configuration files
nano .env.staging
nano ecosystem.config.cjs

# View application logs
tail -f logs/error.log
```

### **Database Management:**
```bash
# Check MongoDB connection (via application)
curl -s http://localhost:4000/api/seller/health

# Backup database (via MongoDB Atlas or application)
```

### **Web Server Management:**
```bash
# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# View nginx status
systemctl status nginx
```

---

## 🔒 **Security & Access Control**

### **Current Security Setup:**
- **SSH Access**: Key-based authentication (no password)
- **Web Security**: HTTPS with Let's Encrypt SSL
- **Application Security**: JWT tokens, bcrypt hashing
- **Database Security**: MongoDB Atlas with authentication
- **File Permissions**: All processes run as root (current setup)

### **Security Best Practices:**
- 🔒 **Always backup** before making changes
- 🔒 **Test on staging** before production
- 🔒 **Use version control** for configuration changes
- 🔒 **Monitor access logs** regularly
- 🔒 **Keep software updated** (security patches)

---

## 🚨 **Emergency Procedures**

### **Immediate Actions:**
1. **Kill Switch**: `pm2 stop all` (stop all applications)
2. **Backup**: Create immediate backup of current state
3. **Rollback**: Restore from recent backup if needed
4. **Investigate**: Check logs for error causes

### **Backup Commands:**
```bash
# Create quick backup
cd /var/www && tar -czf backup-$(date +%Y%m%d-%H%M).tar.gz goatgoat-staging/

# Restore from backup
cd /var/www && tar -xzf backup-YYYYMMDD-HHMM.tar.gz
```

### **FCM Emergency Stop:**
```bash
# Disable FCM live mode immediately
sed -i 's/FCM_LIVE_MODE=true/FCM_LIVE_MODE=false/' /var/www/goatgoat-staging/server/.env.staging
pm2 restart goatgoat-staging --update-env
```

---

## 📊 **System Monitoring**

### **Key Metrics to Monitor:**
- **PM2 Process Status**: Application health
- **Memory Usage**: Currently ~3GB available of 4GB
- **Disk Space**: 36GB free of 49GB
- **CPU Usage**: Normally 2-5%
- **Network Traffic**: HTTP requests, bandwidth
- **Database Performance**: MongoDB query times
- **Error Rates**: Application error frequency

### **Monitoring Commands:**
```bash
# System resources
free -h
df -h
htop

# Application status
pm2 monit
pm2 logs

# Web server
systemctl status nginx
tail -f /var/log/nginx/access.log
```

---

## 🔄 **Deployment Workflow**

### **Safe Deployment Process:**
1. **Test Locally**: Verify changes work in development
2. **Backup Current**: Create backup before deployment
3. **Deploy to Staging**: Test on staging server first
4. **Validate**: Test all functionality on staging
5. **Deploy to Production**: Only after staging validation
6. **Monitor**: Watch for errors after deployment

### **Rollback Procedure:**
1. **Stop Application**: `pm2 stop goatgoat-staging`
2. **Restore Files**: From backup
3. **Restart Application**: `pm2 start goatgoat-staging`
4. **Verify**: Test functionality

---

## 📞 **Agent Activation Protocol**

### **When to Activate This Agent:**
- 🛠️ **Server maintenance** tasks
- 📁 **File management** operations
- 🚀 **Deployment** and updates
- 🔧 **Configuration** changes
- 🐛 **Troubleshooting** server issues
- 📊 **Performance** monitoring
- 🔒 **Security** management
- 💾 **Backup** operations

### **Activation Phrase:**
**"I need to work on the server"** or **"Activate Server Agent"**

---

## 🎯 **Agent Success Criteria**

### **What Success Looks Like:**
- ✅ **Complete Context**: Always aware of current server state
- ✅ **Safe Operations**: Never breaks production systems
- ✅ **Clear Documentation**: Documents all changes made
- ✅ **Backup Awareness**: Always creates backups before changes
- ✅ **Testing First**: Tests on staging before production
- ✅ **Communication**: Explains what and why before acting
- ✅ **Recovery Ready**: Can roll back changes if needed

---

## 📝 **Important Notes**

### **Agent Constraints:**
- 🚫 **NEVER** modify production without testing on staging first
- 🚫 **ALWAYS** create backups before making changes
- 🚫 **NEVER** delete critical files without confirmation
- 🚫 **ALWAYS** verify system health after changes
- 🚫 **NEVER** disable security features without reason

### **Current Limitations:**
- File browser integration not yet implemented
- Some advanced monitoring tools not yet installed
- Automated backup system could be enhanced

---

**Agent Ready**: This Server Agent is now configured and ready to handle all GoatGoat server management tasks with complete context awareness.

**Last Updated**: September 29, 2025
**Server Status**: All systems operational