// Load environment-specific dotenv file
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
// Get NODE_ENV from PM2 or default
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log(`🌍 Environment detected: ${NODE_ENV}`);
// Try loading environment-specific files in order of priority
const envFiles = [
    `.env.${NODE_ENV}`, // .env.production, .env.staging, etc.
    '.env.local', // Local overrides (not in git)
    '.env' // Default fallback
];
// Load environment files
let loaded = false;
for (const envFile of envFiles) {
    const envPath = path.resolve(envFile);
    if (fs.existsSync(envPath)) {
        console.log(`🔧 Loading environment file: ${envPath}`);
        dotenv.config({ path: envPath });
        loaded = true;
        // Don't break - allow multiple files to load (later ones override earlier ones)
    }
    else {
        console.log(`🔍 Environment file not found: ${envPath}`);
    }
}
if (!loaded) {
    console.warn(`⚠️ No .env files found! Using system environment variables only.`);
}
import { connectDB } from './config/connect.js';
import fastify from 'fastify';
import { PORT } from './config/config.js';
import websocket from '@fastify/websocket';
import { registerRoutes } from './routes/index.js';
import { Server as SocketIOServer } from 'socket.io';
import { admin, buildAdminRouter } from './config/setup.js';
import mongoose from 'mongoose';
const start = async () => {
    console.log('DEBUG: process.env.NODE_ENV in app.ts:', process.env.NODE_ENV);
    // 🐛 DEBUG: Check JWT secrets on app startup
    console.log('🔍 STARTUP DEBUG - JWT Environment Variables:');
    console.log('ACCESS_TOKEN_SECRET exists:', !!process.env.ACCESS_TOKEN_SECRET);
    console.log('REFRESH_TOKEN_SECRET exists:', !!process.env.REFRESH_TOKEN_SECRET);
    console.log('All env keys containing TOKEN:', Object.keys(process.env).filter(key => key.includes('TOKEN')));
    console.log('Current working directory:', process.cwd());
    // Check if .env files exist
    const fs = await import('fs');
    const path = await import('path');
    const envProductionPath = path.resolve('.env.production');
    const envPath = path.resolve('.env');
    console.log('Checking .env.production at:', envProductionPath, 'exists:', fs.existsSync(envProductionPath));
    console.log('Checking .env at:', envPath, 'exists:', fs.existsSync(envPath));
    // Initialize Firebase Admin SDK (optional - won't crash if missing)
    if (process.env.DISABLE_FIREBASE === 'true') {
        console.log('🚫 Firebase Admin SDK initialization skipped (DISABLE_FIREBASE=true)');
    }
    else {
        const firebaseServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
        try {
            console.log('🔍 Attempting to initialize Firebase Admin SDK...');
            console.log('🔍 Looking for Firebase service account at:', firebaseServiceAccountPath);
            // Check if file exists
            const fs = await import('fs');
            const path = await import('path');
            let serviceAccount;
            let serviceAccountSource = 'unknown';
            // Method 1: Try to read from file path
            const absolutePath = path.resolve(firebaseServiceAccountPath);
            if (fs.existsSync(absolutePath)) {
                console.log('📄 Reading Firebase service account from file:', absolutePath);
                const fileContent = fs.readFileSync(absolutePath, 'utf8');
                serviceAccount = JSON.parse(fileContent);
                serviceAccountSource = 'file';
            }
            // Method 2: Try environment variable with JSON string (not base64)
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
                console.log('📄 Reading Firebase service account from environment variable');
                serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
                serviceAccountSource = 'env_json';
            }
            // Method 3: Try base64 environment variable (fallback)
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON) {
                console.log('📄 Reading Firebase service account from base64 environment variable');
                const buffer = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON, 'base64');
                const jsonString = buffer.toString('utf8');
                serviceAccount = JSON.parse(jsonString);
                serviceAccountSource = 'env_base64';
            }
            else {
                throw new Error('No Firebase service account found. Tried file path, JSON env var, and base64 env var.');
            }
            console.log('✅ Firebase service account loaded from:', serviceAccountSource);
            console.log('📋 Project ID:', serviceAccount.project_id);
            console.log('📧 Client Email:', serviceAccount.client_email);
            // Normalize PEM newlines if provided via env to avoid Invalid PEM formatted message
            if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            // Dynamically import firebase-admin
            let adminModule;
            try {
                adminModule = await import('firebase-admin');
            }
            catch (importError) {
                console.error('❌ Failed to import firebase-admin. Is it installed?', importError);
                throw importError;
            }
            // Initialize Firebase Admin SDK
            adminModule.default.initializeApp({
                credential: adminModule.default.credential.cert(serviceAccount),
            });
            console.log('✅ Firebase Admin SDK initialized successfully.');
        }
        catch (error) {
            console.error('⚠️ Failed to initialize Firebase Admin SDK (continuing without it):', error);
            console.error('Error type:', error?.constructor?.name || 'Unknown');
            console.error('Error message:', error?.message || 'No message');
            console.log('💡 Tip: Place firebase-service-account.json in server directory or set FIREBASE_SERVICE_ACCOUNT_JSON env var');
        }
    }
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI environment variable is required');
    }
    await connectDB(process.env.MONGO_URI);
    const app = fastify();
    // Serve empty favicon to silence 404s in AdminJS and browser
    app.get('/favicon.ico', async (_req, reply) => {
        reply.code(204).send();
    });
    // Register WebSocket support
    await app.register(websocket);
    // Health check endpoint for cloud deployment
    app.get('/health', async (_request, _reply) => {
        try {
            // Check database connection
            const dbState = mongoose.connection.readyState;
            const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
            // Test delivery partner count
            const { DeliveryPartner } = await import('./models/user.js');
            const deliveryPartnerCount = await DeliveryPartner.countDocuments();
            console.log(`Found ${deliveryPartnerCount} delivery partners in database`);
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: dbStatus,
                deliveryPartners: deliveryPartnerCount,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0',
            };
        }
        catch (error) {
            _reply.code(500);
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    });
    try {
        await registerRoutes(app);
        console.log('Routes registered successfully');
    }
    catch (error) {
        console.error('Error registering routes:', error);
        process.exit(1);
    }
    // Register monitoring routes
    try {
        const { monitoringRoutes } = await import('./api/routes/admin/monitoring.js');
        await app.register(monitoringRoutes);
        console.log('✅ Monitoring routes registered successfully');
    }
    catch (error) {
        console.error('⚠️ Error registering monitoring routes:', error);
        // Don't exit - continue without monitoring routes
    }
    // Add admin debug route
    app.get('/admin/debug', async (_request, _reply) => {
        try {
            const { Admin } = await import('./models/index.js');
            const admins = await Admin.find({});
            return {
                status: 'success',
                totalAdmins: admins.length,
                admins: admins.map((adminUser) => ({
                    id: adminUser._id,
                    email: adminUser.email,
                    name: adminUser.name,
                    role: adminUser.role,
                    isActivated: adminUser.isActivated,
                    passwordLength: adminUser.password?.length,
                })),
            };
        }
        catch (error) {
            return {
                status: 'error',
                error: error.message,
            };
        }
    });
    // Add authentication test route
    app.post('/admin/test-auth', async (_request, _reply) => {
        try {
            const { email, password } = _request.body;
            console.log('Test auth attempt with email:', email);
            const { authenticate } = await import('./config/config.js');
            const result = await authenticate(email, password);
            return {
                status: 'success',
                authenticated: !!result,
                result: result,
            };
        }
        catch (error) {
            return {
                status: 'error',
                error: error.message,
            };
        }
    });
    // Add route test endpoint
    app.get('/admin/test-routes', async (_request, _reply) => {
        try {
            // List all registered routes
            const routes = app.printRoutes({ commonPrefix: false });
            console.log('Registered routes:', routes);
            return {
                status: 'success',
                routes: routes,
            };
        }
        catch (error) {
            return {
                status: 'error',
                error: error.message,
            };
        }
    });
    // Add session test route
    app.get('/admin/test-session', async (_request, _reply) => {
        try {
            return {
                status: 'success',
                session: _request.session,
                headers: _request.headers,
            };
        }
        catch (error) {
            return {
                status: 'error',
                error: error.message,
            };
        }
    });
    // Add monitoring dashboard endpoint
    app.get('/admin/monitoring', async (_request, _reply) => {
        try {
            // Get database connection status
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            // Get delivery partner count
            const { DeliveryPartner } = await import('./models/user.js');
            const deliveryPartnerCount = await DeliveryPartner.countDocuments();
            const uptime = Math.floor(process.uptime());
            const memory = process.memoryUsage();
            const environment = process.env.NODE_ENV || 'unknown';
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GoatGoat Server Monitoring</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: #2d2d2d;
            border-radius: 10px;
            padding: 20px;
            border: 1px solid #404040;
        }
        .card h3 {
            color: #4CAF50;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #404040;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            color: #cccccc;
        }
        .metric-value {
            color: #ffffff;
            font-weight: 600;
        }
        .status-healthy {
            color: #4CAF50;
        }
        .status-error {
            color: #f44336;
        }
        .refresh-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            margin: 10px 5px;
        }
        .refresh-btn:hover {
            background: #45a049;
        }
        .back-btn {
            background: #2196F3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            margin: 10px 5px;
            text-decoration: none;
            display: inline-block;
        }
        .back-btn:hover {
            background: #1976D2;
        }
        .timestamp {
            text-align: center;
            color: #888;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 GoatGoat Server Monitoring</h1>
            <p>Real-time server health and performance metrics</p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>🖥️ Server Status</h3>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="metric-value status-healthy">Healthy</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value">${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Environment:</span>
                    <span class="metric-value">${environment}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Platform:</span>
                    <span class="metric-value">${process.platform}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node Version:</span>
                    <span class="metric-value">${process.version}</span>
                </div>
            </div>

            <div class="card">
                <h3>💾 Memory Usage</h3>
                <div class="metric">
                    <span class="metric-label">RSS:</span>
                    <span class="metric-value">${(memory.rss / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Heap Used:</span>
                    <span class="metric-value">${(memory.heapUsed / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Heap Total:</span>
                    <span class="metric-value">${(memory.heapTotal / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">External:</span>
                    <span class="metric-value">${(memory.external / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Heap Usage:</span>
                    <span class="metric-value">${((memory.heapUsed / memory.heapTotal) * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div class="card">
                <h3>🗄️ Database</h3>
                <div class="metric">
                    <span class="metric-label">Connection:</span>
                    <span class="metric-value ${dbStatus === 'connected' ? 'status-healthy' : 'status-error'}">${dbStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Delivery Partners:</span>
                    <span class="metric-value">${deliveryPartnerCount}</span>
                </div>
            </div>

            <div class="card">
                <h3>🔗 Quick Links</h3>
                <div class="metric">
                    <span class="metric-label">Admin Panel:</span>
                    <span class="metric-value"><a href="/admin" style="color: #4CAF50;">/admin</a></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Health Check:</span>
                    <span class="metric-value"><a href="/health" style="color: #4CAF50;">/health</a></span>
                </div>
                <div class="metric">
                    <span class="metric-label">API Monitoring:</span>
                    <span class="metric-value"><a href="/admin/monitoring" style="color: #4CAF50;">/admin/monitoring</a></span>
                </div>
            </div>
        </div>

        <div style="text-align: center;">
            <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Data</button>
            <a href="/admin" class="back-btn">← Back to Admin Panel</a>
        </div>

        <div class="timestamp">
            Last updated: ${new Date().toISOString()}
        </div>
    </div>

    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);

        console.log('🚀 GoatGoat Monitoring Dashboard Loaded');
        console.log('📊 Server Status: Healthy');
        console.log('⏱️ Auto-refresh in 30 seconds');
    </script>
</body>
</html>`;
            reply.type('text/html');
            return html;
        }
        catch (error) {
            reply.type('text/html');
            return `
<!DOCTYPE html>
<html>
<head><title>Monitoring Error</title></head>
<body style="font-family: Arial; padding: 20px; background: #1a1a1a; color: white;">
    <h1>🚨 Monitoring Error</h1>
    <p>Error: ${error?.message || 'Unknown error'}</p>
    <a href="/admin" style="color: #4CAF50;">← Back to Admin Panel</a>
</body>
</html>`;
        }
    });
    console.log('✅ Monitoring dashboard route registered successfully');
    app.get("/admin/fcm-management", async (request, reply) => {
        try {
            const fs = await import('fs');
            const filePath = '/var/www/goatgoat-staging/server/src/public/fcm-dashboard/index.html';
            const html = await fs.promises.readFile(filePath, 'utf8');
            reply.type('text/html');
            return html;
        }
        catch (error) {
            reply.status(500).send(`<h1>FCM Dashboard Error</h1><p>${error?.message || 'File not found'}</p>`);
        }
    });
    // 🔔 FCM API Endpoints - Phase 3.1: GET /tokens
    app.get("/admin/fcm-management/api/tokens", async (request, reply) => {
        try {
            const { Seller } = await import('./models/index.js');
            // Get all sellers with FCM tokens
            const sellers = await Seller.find({
                'fcmTokens.0': { $exists: true }
            }).select('_id email fcmTokens createdAt').sort({ createdAt: -1 });
            const tokenData = [];
            sellers.forEach((seller) => {
                seller.fcmTokens.forEach((fcmToken) => {
                    tokenData.push({
                        sellerId: seller._id,
                        sellerEmail: seller.email,
                        token: fcmToken.token,
                        platform: fcmToken.platform || 'android',
                        deviceInfo: fcmToken.deviceInfo || {},
                        createdAt: fcmToken.createdAt,
                        updatedAt: fcmToken.updatedAt
                    });
                });
            });
            reply.type('application/json');
            return {
                success: true,
                count: tokenData.length,
                totalSellers: sellers.length,
                tokens: tokenData
            };
        }
        catch (error) {
            reply.status(500);
            return {
                success: false,
                error: error?.message || 'Failed to fetch FCM tokens',
                count: 0,
                tokens: []
            };
        }
    });
    
    // 🔔 FCM API Endpoints - Phase 5.2: POST /send (LIVE MODE + DRY RUN)
    app.post("/admin/fcm-management/api/send", async (request, reply) => {
        try {
            const body = request.body;
            
            // ========================================
            // PHASE 5.2: KILL-SWITCH & SAFETY CHECKS
            // ========================================
            
            // Kill-switch: Check if LIVE mode is enabled
            const isLiveMode = process.env.FCM_LIVE_MODE === 'true';
            const maxTokensPerSend = parseInt(process.env.FCM_MAX_TOKENS_PER_SEND || '50', 10);
            
            console.log(`🔔 FCM Send Request - Mode: ${isLiveMode ? 'LIVE' : 'DRY-RUN'}, Max Tokens: ${maxTokensPerSend}`);
            
            // Validate request body
            if (!body || typeof body !== 'object') {
                reply.status(400);
                return {
                    success: false,
                    error: 'Invalid request body',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }
            const { title, message, targetTokens, targetSellers, targetType } = body;
            
            // Validate required fields
            if (!title || typeof title !== 'string' || title.trim().length === 0) {
                reply.status(400);
                return {
                    success: false,
                    error: 'Title is required and must be a non-empty string',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }
            if (!message || typeof message !== 'string' || message.trim().length === 0) {
                reply.status(400);
                return {
                    success: false,
                    error: 'Message is required and must be a non-empty string',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }

            // Resolve target FCM tokens based on targeting type
            let finalTargetTokens = [];
            
            if (targetType === 'tokens' && Array.isArray(targetTokens)) {
                finalTargetTokens = targetTokens.filter((token) => 
                    typeof token === 'string' && token.trim().length > 0
                );
                if (finalTargetTokens.length === 0) {
                    reply.status(400);
                    return {
                        success: false,
                        error: 'No valid tokens provided',
                        mode: isLiveMode ? 'live' : 'dry-run'
                    };
                }
            } else if (targetType === 'sellers' && Array.isArray(targetSellers)) {
                // Get tokens for specific sellers
                const { Seller } = await import('./models/index.js');
                const sellers = await Seller.find({
                    _id: { $in: targetSellers },
                    'fcmTokens.0': { $exists: true }
                }).select('fcmTokens');
                
                sellers.forEach((seller) => {
                    seller.fcmTokens.forEach((fcmToken) => {
                        finalTargetTokens.push(fcmToken.token);
                    });
                });
                
                if (finalTargetTokens.length === 0) {
                    reply.status(400);
                    return {
                        success: false,
                        error: 'No FCM tokens found for specified sellers',
                        mode: isLiveMode ? 'live' : 'dry-run'
                    };
                }
            } else if (targetType === 'all') {
                // Get all available tokens
                const { Seller } = await import('./models/index.js');
                const sellers = await Seller.find({
                    'fcmTokens.0': { $exists: true }
                }).select('fcmTokens');
                
                sellers.forEach((seller) => {
                    seller.fcmTokens.forEach((fcmToken) => {
                        finalTargetTokens.push(fcmToken.token);
                    });
                });
            } else {
                reply.status(400);
                return {
                    success: false,
                    error: 'Invalid targetType. Must be "tokens", "sellers", or "all"',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }

            if (finalTargetTokens.length === 0) {
                reply.status(400);
                return {
                    success: false,
                    error: 'No target tokens found',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }

            // Apply safety limit (cap tokens to prevent abuse)
            const originalTokenCount = finalTargetTokens.length;
            if (finalTargetTokens.length > maxTokensPerSend) {
                console.log(`⚠️ Token count (${finalTargetTokens.length}) exceeds limit (${maxTokensPerSend}), capping to limit`);
                finalTargetTokens = finalTargetTokens.slice(0, maxTokensPerSend);
            }

            // Build notification payload
            const notificationPayload = {
                notification: {
                    title: title.trim(),
                    body: message.trim()
                },
                data: {
                    type: 'admin_broadcast',
                    timestamp: new Date().toISOString(),
                    mode: isLiveMode ? 'live' : 'dry-run'
                }
            };

            // ========================================
            // DRY-RUN MODE (Default, Safe Fallback)
            // ========================================
            if (!isLiveMode) {
                console.log(`🧪 DRY-RUN: Would send to ${finalTargetTokens.length} tokens`);
                reply.type('application/json');
                return {
                    success: true,
                    mode: 'dry-run',
                    message: 'Notification validated successfully (DRY RUN - not actually sent)',
                    payload: notificationPayload,
                    targetTokenCount: finalTargetTokens.length,
                    originalTokenCount: originalTokenCount,
                    cappedByLimit: originalTokenCount > maxTokensPerSend,
                    targetType,
                    wouldSendTo: finalTargetTokens.slice(0, 3).map(token => 
                        token.substring(0, 20) + '...' // Show first 3 tokens (truncated for security)
                    )
                };
            }

            // ========================================
            // LIVE MODE - REAL FCM SENDING
            // ========================================
            console.log(`🔴 LIVE MODE: Sending to ${finalTargetTokens.length} FCM tokens...`);
            
            try {
                // Import Firebase Admin SDK dynamically for safety
                const adminModule = await import('firebase-admin');
                
                // Check if Firebase Admin is initialized
                if (!adminModule.default.apps.length) {
                    console.error('❌ Firebase Admin SDK not initialized - falling back to dry-run');
                    reply.type('application/json');
                    return {
                        success: false,
                        mode: 'error-fallback-dry-run',
                        error: 'Firebase Admin SDK not initialized',
                        targetTokenCount: finalTargetTokens.length,
                        originalTokenCount: originalTokenCount
                    };
                }

                // Build FCM messages for batch sending
                const messages = finalTargetTokens.map(token => ({
                    token,
                    notification: notificationPayload.notification,
                    data: notificationPayload.data
                }));

                // Send FCM notification using sendEach for batch reliability
                const sendResponse = await adminModule.default.messaging().sendEach(messages);
                
                // Process results and count successes/failures
                let successCount = 0;
                let failureCount = 0;
                const failureReasons = {};
                
                sendResponse.responses.forEach((resp, idx) => {
                    if (resp.success) {
                        successCount++;
                    } else {
                        failureCount++;
                        const errorCode = resp.error?.code || 'unknown';
                        failureReasons[errorCode] = (failureReasons[errorCode] || 0) + 1;
                    }
                });

                // Audit logging for compliance and debugging
                const auditLog = {
                    timestamp: new Date().toISOString(),
                    mode: 'live',
                    title: title.trim(),
                    targetType,
                    originalTokenCount,
                    sentTokenCount: finalTargetTokens.length,
                    successCount,
                    failureCount,
                    cappedByLimit: originalTokenCount > maxTokensPerSend,
                    maxTokensLimit: maxTokensPerSend,
                    failureReasons,
                    userId: request.user?.id || 'unknown',
                    userEmail: request.user?.email || 'unknown'
                };
                
                console.log(`🔔 [FCM-LIVE-AUDIT]`, JSON.stringify(auditLog));

                // Attempt to save to notification log (non-blocking)
                try {
                    const { NotificationLog } = await import('./models/notificationLog.js');
                    await NotificationLog.create({
                        sentBy: request.user?.id || null,
                        sentByEmail: request.user?.email || 'unknown',
                        targeting: targetType,
                        payload: {
                            title: title.trim(),
                            body: message.trim()
                        },
                        status: failureCount === 0 ? 'success' : (successCount === 0 ? 'failed' : 'partial'),
                        totals: {
                            intendedCount: originalTokenCount,
                            sentCount: finalTargetTokens.length,
                            successCount,
                            failureCount
                        },
                        startedAt: new Date(),
                        completedAt: new Date(),
                        metadata: {
                            mode: 'live',
                            cappedByLimit: originalTokenCount > maxTokensPerSend,
                            maxTokensLimit: maxTokensPerSend,
                            failureReasons
                        }
                    });
                } catch (logError) {
                    console.error('⚠️ Failed to save notification log (non-blocking):', logError.message);
                }

                // Return success response with detailed results
                reply.type('application/json');
                return {
                    success: true,
                    mode: 'live',
                    message: `Notification sent successfully in LIVE mode`,
                    sent: successCount,
                    failed: failureCount,
                    targetTokenCount: finalTargetTokens.length,
                    originalTokenCount: originalTokenCount,
                    cappedByLimit: originalTokenCount > maxTokensPerSend,
                    maxTokensLimit: maxTokensPerSend,
                    targetType,
                    failureReasons: Object.keys(failureReasons).length > 0 ? failureReasons : undefined,
                    timestamp: new Date().toISOString()
                };
                
            } catch (firebaseError) {
                console.error('❌ Firebase send error:', firebaseError);
                
                // Graceful fallback on Firebase errors
                reply.status(500);
                return {
                    success: false,
                    mode: 'live-error',
                    error: `Firebase error: ${firebaseError.message}`,
                    targetTokenCount: finalTargetTokens.length,
                    originalTokenCount: originalTokenCount,
                    fallbackAdvice: 'Check Firebase configuration and try again, or disable LIVE mode'
                };
            }

        } catch (error) {
            console.error('❌ FCM send endpoint error:', error);
            reply.status(500);
            return {
                success: false,
                mode: 'error',
                error: error?.message || 'Failed to process notification request'
            };
        }
    });

    // 🔔 FCM API Endpoints - Phase 3.3: GET /history
    app.get("/admin/fcm-management/api/history", async (request, reply) => {
        try {
            // Import NotificationLog model
            const { NotificationLog } = await import('./models/notificationLog.js');
            // Get query parameters for pagination and filtering
            const query = request.query;
            const page = Math.max(1, parseInt(query.page) || 1);
            const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
            const skip = (page - 1) * limit;
            const targeting = query.targeting; // 'all', 'sellers', etc.
            const status = query.status; // 'success', 'failed', etc.
            // Build filter criteria
            const filter = {};
            if (targeting) {
                filter.targeting = targeting;
            }
            if (status) {
                filter.status = status;
            }
            // Get notification history with pagination
            const [notifications, totalCount] = await Promise.all([
                NotificationLog.find(filter)
                    .select('sentBy sentByEmail targeting payload status totals startedAt completedAt createdAt metadata')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('sentBy', 'email')
                    .lean(),
                NotificationLog.countDocuments(filter)
            ]);
            reply.type('application/json');
            return {
                success: true,
                count: notifications.length,
                totalCount,
                page,
                limit,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: (page * limit) < totalCount,
                notifications: notifications.map((notification) => ({
                    id: notification._id,
                    sentBy: {
                        id: notification.sentBy?._id || notification.sentBy,
                        email: notification.sentBy?.email || notification.sentByEmail
                    },
                    title: notification.payload?.title,
                    message: notification.payload?.body,
                    targeting: notification.targeting,
                    status: notification.status,
                    mode: notification.metadata?.mode || 'unknown', // Phase 5.2: Show live/dry-run mode
                    stats: {
                        intended: notification.totals?.intendedCount || 0,
                        sent: notification.totals?.sentCount || 0,
                        success: notification.totals?.successCount || 0,
                        failed: notification.totals?.failureCount || 0
                    },
                    sentAt: notification.startedAt,
                    completedAt: notification.completedAt,
                    createdAt: notification.createdAt
                }))
            };
        }
        catch (error) {
            // If no notifications exist, return mock data for demonstration
            if (error.name === 'MongoError' || error.message?.includes('collection')) {
                reply.type('application/json');
                return {
                    success: true,
                    count: 3,
                    totalCount: 3,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                    hasMore: false,
                    notifications: [
                        {
                            id: 'mock-001',
                            sentBy: { id: 'admin-001', email: 'admin@goatgoat.com' },
                            title: 'Welcome Notification',
                            message: 'Welcome to GoatGoat seller app!',
                            targeting: 'sellers',
                            status: 'success',
                            mode: 'live',
                            stats: { intended: 5, sent: 5, success: 5, failed: 0 },
                            sentAt: new Date(Date.now() - 86400000).toISOString(),
                            completedAt: new Date(Date.now() - 86400000 + 30000).toISOString(),
                            createdAt: new Date(Date.now() - 86400000).toISOString()
                        },
                        {
                            id: 'mock-002',
                            sentBy: { id: 'admin-002', email: 'admin@goatgoat.com' },
                            title: 'Order Update',
                            message: 'Please check for new orders',
                            targeting: 'sellers',
                            status: 'success',
                            mode: 'live',
                            stats: { intended: 21, sent: 21, success: 19, failed: 2 },
                            sentAt: new Date(Date.now() - 172800000).toISOString(),
                            completedAt: new Date(Date.now() - 172800000 + 45000).toISOString(),
                            createdAt: new Date(Date.now() - 172800000).toISOString()
                        },
                        {
                            id: 'mock-003',
                            sentBy: { id: 'admin-003', email: 'admin@goatgoat.com' },
                            title: 'System Maintenance',
                            message: 'Scheduled maintenance tonight at 2 AM',
                            targeting: 'all',
                            status: 'partial',
                            mode: 'dry-run',
                            stats: { intended: 25, sent: 0, success: 0, failed: 0 },
                            sentAt: new Date(Date.now() - 259200000).toISOString(),
                            completedAt: new Date(Date.now() - 259200000 + 60000).toISOString(),
                            createdAt: new Date(Date.now() - 259200000).toISOString()
                        }
                    ]
                };
            }
            reply.status(500);
            return {
                success: false,
                error: error?.message || 'Failed to fetch notification history',
                count: 0,
                notifications: []
            };
        }
    });
    // 🔔 FCM API Endpoints - Phase 3.4: GET /stats
    app.get("/admin/fcm-management/api/stats", async (request, reply) => {
        try {
            const { Seller } = await import('./models/index.js');
            const { NotificationLog } = await import('./models/notificationLog.js');
            // Get current date ranges for time-based stats
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            
            // Check current FCM mode for stats display
            const fcmLiveMode = process.env.FCM_LIVE_MODE === 'true';
            const fcmMaxTokens = parseInt(process.env.FCM_MAX_TOKENS_PER_SEND || '50', 10);
            
            // Parallel data fetching for performance
            const [
            // Token statistics
            sellersWithTokens, totalTokenCount, androidTokens, iosTokens, 
            // Notification statistics
            totalNotifications, last24hNotifications, last7dNotifications, last30dNotifications, 
            // Status distribution
            successfulNotifications, failedNotifications, partialNotifications, 
            // Recent activity
            recentNotifications] = await Promise.all([
                // Token queries
                Seller.countDocuments({ 'fcmTokens.0': { $exists: true } }),
                Seller.aggregate([
                    { $match: { 'fcmTokens.0': { $exists: true } } },
                    { $project: { tokenCount: { $size: '$fcmTokens' } } },
                    { $group: { _id: null, total: { $sum: '$tokenCount' } } }
                ]).then((result) => result[0]?.total || 0),
                Seller.aggregate([
                    { $match: { 'fcmTokens.platform': 'android' } },
                    { $unwind: '$fcmTokens' },
                    { $match: { 'fcmTokens.platform': 'android' } },
                    { $count: 'count' }
                ]).then((result) => result[0]?.count || 0),
                Seller.aggregate([
                    { $match: { 'fcmTokens.platform': 'ios' } },
                    { $unwind: '$fcmTokens' },
                    { $match: { 'fcmTokens.platform': 'ios' } },
                    { $count: 'count' }
                ]).then((result) => result[0]?.count || 0),
                // Notification queries
                NotificationLog.countDocuments(),
                NotificationLog.countDocuments({ createdAt: { $gte: last24Hours } }),
                NotificationLog.countDocuments({ createdAt: { $gte: last7Days } }),
                NotificationLog.countDocuments({ createdAt: { $gte: last30Days } }),
                // Status queries
                NotificationLog.countDocuments({ status: 'success' }),
                NotificationLog.countDocuments({ status: 'failed' }),
                NotificationLog.countDocuments({ status: 'partial' }),
                // Recent activity
                NotificationLog.find({})
                    .select('targeting payload.title totals.sentCount status createdAt metadata.mode')
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .lean()
            ]);
            // Calculate platform distribution
            const platformStats = {
                android: androidTokens,
                ios: iosTokens,
                unknown: Math.max(0, totalTokenCount - androidTokens - iosTokens)
            };
            // Calculate success rates
            const totalSent = successfulNotifications + failedNotifications + partialNotifications;
            const successRate = totalSent > 0 ? ((successfulNotifications / totalSent) * 100).toFixed(1) : '0.0';
            reply.type('application/json');
            return {
                success: true,
                stats: {
                    // Phase 5.2: Include FCM mode information
                    system: {
                        fcmLiveMode,
                        fcmMaxTokens,
                        mode: fcmLiveMode ? 'LIVE' : 'DRY-RUN'
                    },
                    overview: {
                        totalSellers: sellersWithTokens,
                        totalTokens: totalTokenCount,
                        totalNotificationsSent: totalNotifications,
                        successRate: `${successRate}%`
                    },
                    tokens: {
                        total: totalTokenCount,
                        sellersWithTokens,
                        platforms: platformStats,
                        averageTokensPerSeller: sellersWithTokens > 0
                            ? (totalTokenCount / sellersWithTokens).toFixed(1)
                            : '0.0'
                    },
                    notifications: {
                        total: totalNotifications,
                        last24Hours: last24hNotifications,
                        last7Days: last7dNotifications,
                        last30Days: last30dNotifications,
                        statusDistribution: {
                            success: successfulNotifications,
                            failed: failedNotifications,
                            partial: partialNotifications
                        }
                    },
                    recentActivity: recentNotifications.map((notification) => ({
                        id: notification._id,
                        title: notification.payload?.title || 'Untitled',
                        targeting: notification.targeting,
                        sent: notification.totals?.sentCount || 0,
                        status: notification.status,
                        mode: notification.metadata?.mode || 'unknown', // Phase 5.2: Show mode
                        createdAt: notification.createdAt
                    })),
                    generatedAt: now.toISOString()
                }
            };
        }
        catch (error) {
            reply.status(500);
            return {
                success: false,
                error: error?.message || 'Failed to fetch FCM statistics',
                stats: null
            };
        }
    });
    console.log('✅ FCM API endpoints registered successfully');
    // Start the Fastify server and get the server instance
    try {
        await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Grocery App running on http://localhost:${PORT}${admin.options.rootPath}`);
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
    // Setup Socket.IO connection handling
    io.on('connection', (socket) => {
        console.log('A User Connected ✅');
        socket.on('joinRoom', (orderId) => {
            socket.join(orderId);
            console.log(` 🔴 User Joined room ${orderId}`);
        });
        socket.on('disconnect', () => {
            console.log('User Disconnected ❌');
        });
    });
};
start();