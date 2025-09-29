import express from 'express';
import bcrypt from 'bcryptjs';
import { configDotenv } from 'dotenv';
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isStaging = process.env.NODE_ENV === 'staging';
const isLocal = process.env.NODE_ENV === 'local';
console.log(`✅ Running in ${process.env.NODE_ENV || 'undefined'} mode`);
console.log('🚀 app.js script loaded');
import path from 'path';
// Development mode: Source files (.env.development)
// Production mode: Compiled files (.env.production)
if (isProduction) {
    console.log('📁 Loading production environment file...');
    const envProductionPath = path.resolve('.env.production');
    configDotenv({ path: envProductionPath });
    console.log(`🔐 Loaded production environment from: ${envProductionPath}`);
}
else if (isStaging) {
    console.log('📁 Loading staging environment file...');
    const envStagingPath = path.resolve('.env.staging');
    configDotenv({ path: envStagingPath });
    console.log(`🔐 Loaded staging environment from: ${envStagingPath}`);
}
else if (isDevelopment) {
    console.log('📁 Loading development environment file...');
    const envDevelopmentPath = path.resolve('.env.development');
    configDotenv({ path: envDevelopmentPath });
    console.log(`🔐 Loaded development environment from: ${envDevelopmentPath}`);
}
else if (isLocal) {
    console.log('📁 Loading local environment file...');
    const envLocalPath = path.resolve('.env.local');
    configDotenv({ path: envLocalPath });
    console.log(`🔐 Loaded local environment from: ${envLocalPath}`);
}
else {
    console.log('📁 Loading default (.env) environment file...');
    configDotenv();
    console.log(`🔐 Loaded default environment`);
}
// Check and report Firebase configuration
const disableFirebase = process.env.DISABLE_FIREBASE === 'true';
if (disableFirebase) {
    console.log('🚫 Firebase Admin SDK initialization skipped (DISABLE_FIREBASE=true)');
}
else if (process.env.FIREBASE_ADMIN_SDK_JSON) {
    console.log('✅ Firebase Admin SDK JSON configuration detected');
}
else {
    console.warn('⚠️ Firebase Admin SDK configuration missing - FCM features may not work');
}
// MongoDB connection
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
    console.log('DEBUG: JWT_ACCESS_SECRET exists:', !!process.env.JWT_ACCESS_SECRET);
    console.log('DEBUG: JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
    // 🔐 Add JWT fallback secrets for staging safety
    if (!process.env.JWT_ACCESS_SECRET) {
        console.warn('⚠️ JWT_ACCESS_SECRET not found, using fallback');
        process.env.JWT_ACCESS_SECRET = 'fallback-access-secret-staging-only';
    }
    if (!process.env.JWT_REFRESH_SECRET) {
        console.warn('⚠️ JWT_REFRESH_SECRET not found, using fallback');
        process.env.JWT_REFRESH_SECRET = 'fallback-refresh-secret-staging-only';
    }
    // Connect to MongoDB
    const isConnected = await connectDB();
    if (!isConnected) {
        console.error('❌ Failed to connect to MongoDB. Server will not start.');
        process.exit(1); // Exit gracefully if DB connection fails
    }
    // Create FastifyError-adjusted instance
    const app = fastify({ logger: false });
    // Add security headers - moved before CORS and static files
    app.addHook('onRequest', async (request, reply) => {
        // Set security headers
        reply.header('X-Frame-Options', 'DENY');
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        // Allow all origins for API access (adjust as needed for production)
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            reply.code(200).send();
            return;
        }
    });
    // Register websocket plugin
    await app.register(websocket);
    console.log('✅ WebSocket plugin registered');
    // Serve static files from src/public  
    await app.register(require('@fastify/static'), {
        root: path.join(process.cwd(), 'src', 'public'),
        prefix: '/', // serves files at the root URL
    });
    console.log('✅ Static files configured');
    // Build and register AdminJS
    const adminRouter = await buildAdminRouter();
    await app.register(adminRouter, {
        prefix: admin.options.rootPath,
    });
    console.log(`✅ AdminJS registered on ${admin.options.rootPath}`);
    // Register all API routes
    await registerRoutes(app);
    // Add health check endpoint for monitoring
    app.get('/health', async (_request, _reply) => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    });
    // Add test authentication endpoint
    app.get('/admin/test-session', async (_request, _reply) => {
        return {
            message: 'Session test endpoint working',
            user: 'test-user',
            timestamp: new Date().toISOString(),
            auth: 'Session-based auth should work'
        };
    });
    // Add database status endpoint
    app.get('/admin/db-status', async (_request, _reply) => {
        try {
            const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
            const stats = await mongoose.connection.db.stats();
            return {
                status: 'ok',
                database: {
                    status: dbStatus,
                    name: mongoose.connection.name,
                    collections: stats.collections,
                    dataSize: stats.dataSize,
                    objects: stats.objects
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    });
    // =========================================
    // 🔔 FCM MANAGEMENT API ENDPOINTS - PHASES 3-5.2 
    // =========================================
    console.log('🔔 Registering FCM API endpoints...');
    // 🔔 FCM API Endpoints - Phase 3.1: GET /tokens  
    app.get("/admin/fcm-management/api/tokens", async (_request, reply) => {
        try {
            // Import models dynamically to avoid circular dependencies
            const { Seller } = await import('./models/index.js');
            // Fetch sellers with their FCM tokens
            const sellersWithTokens = await Seller.find({
                'fcmTokens.0': { $exists: true } // Only sellers with at least one token
            }).select('name email phoneNumber fcmTokens');
            // Transform the data for frontend display
            const tokenData = [];
            sellersWithTokens.forEach((seller) => {
                seller.fcmTokens.forEach((fcmToken, index) => {
                    tokenData.push({
                        id: `${seller._id}-${index}`,
                        sellerId: seller._id,
                        sellerName: seller.name,
                        sellerEmail: seller.email,
                        sellerPhone: seller.phoneNumber,
                        token: fcmToken.token,
                        platform: fcmToken.platform || 'unknown',
                        version: fcmToken.version || 'N/A',
                        deviceInfo: fcmToken.deviceInfo || 'N/A',
                        createdAt: fcmToken.createdAt,
                        lastUsed: fcmToken.lastUsed
                    });
                });
            });
            // Set JSON content type and return data
            reply.type('application/json');
            return {
                success: true,
                count: tokenData.length,
                tokens: tokenData
            };
        }
        catch (error) {
            reply.status(500);
            return {
                success: false,
                error: error?.message || 'Failed to fetch FCM tokens',
                tokens: []
            };
        }
    });
    // 🔔 FCM API Endpoints - Phase 3.2: POST /send with LIVE/DRY-RUN capability
    app.post("/admin/fcm-management/api/send", async (request, reply) => {
        try {
            // Parse request body
            const { title, message, targetType, targetSellers, targetTokens } = request.body;
            // Phase 5.2: FCM Environment Controls & Kill-Switch
            const fcmLiveMode = process.env.FCM_LIVE_MODE === 'true';
            const maxTokensPerSend = Math.max(1, parseInt(process.env.FCM_MAX_TOKENS_PER_SEND) || 50);
            const isLiveMode = fcmLiveMode;
            console.log(`🔔 FCM Send Request - Mode: ${isLiveMode ? 'LIVE 🔴' : 'DRY-RUN 🧪'}`);
            console.log(`🔢 Safety Limit: ${maxTokensPerSend} tokens max per send`);
            // Validate required parameters
            if (!title || !message || !targetType) {
                reply.status(400);
                return {
                    success: false,
                    error: 'Missing required fields: title, message, or targetType',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }
            // Validate targetType
            if (!['all', 'sellers', 'tokens'].includes(targetType)) {
                reply.status(400);
                return {
                    success: false,
                    error: 'targetType must be "all", "sellers", or "tokens"',
                    mode: isLiveMode ? 'live' : 'dry-run'
                };
            }
            // Collect target tokens based on targetType
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
                
                // Log dry-run notification to database (non-blocking)
                try {
                    const { NotificationLog } = await import('./models/notificationLog.js');
                    
                    // Create a default admin user ObjectId if none provided
                    const mongoose = await import('mongoose');
                    const defaultAdminId = request.user?.id || new mongoose.default.Types.ObjectId('000000000000000000000000');
                    
                    await NotificationLog.create({
                        sentBy: defaultAdminId,
                        sentByEmail: request.user?.email || 'system@goatgoat.com',
                        targeting: targetType,
                        payload: {
                            title: title.trim(),
                            body: message.trim()
                        },
                        status: 'success', // Dry-run is always "successful"
                        totals: {
                            intendedCount: originalTokenCount,
                            sentCount: 0, // No actual sends in dry-run
                            failureCount: 0
                        },
                        startedAt: new Date(),
                        completedAt: new Date(),
                        metadata: {
                            mode: 'dry-run',
                            cappedByLimit: originalTokenCount > maxTokensPerSend,
                            maxTokensLimit: maxTokensPerSend,
                            wouldSendToCount: finalTargetTokens.length
                        }
                    });
                } catch (logError) {
                    console.error('⚠️ Failed to save dry-run notification log (non-blocking):', logError.message);
                }
                
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
                    
                    // Create a default admin user ObjectId if none provided
                    const mongoose = await import('mongoose');
                    const defaultAdminId = request.user?.id || new mongoose.default.Types.ObjectId('000000000000000000000000');
                    
                    await NotificationLog.create({
                        sentBy: defaultAdminId,
                        sentByEmail: request.user?.email || 'system@goatgoat.com',
                        targeting: targetType,
                        payload: {
                            title: title.trim(),
                            body: message.trim()
                        },
                        status: failureCount === 0 ? 'success' : (successCount === 0 ? 'failed' : 'partial'),
                        totals: {
                            intendedCount: originalTokenCount,
                            sentCount: finalTargetTokens.length,
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
                        id: notification.sentBy,
                        email: notification.sentByEmail || notification.sentBy?.email
                    },
                    targeting: notification.targeting,
                    title: notification.payload?.title || 'Untitled',
                    message: notification.payload?.body || 'No message',
                    status: notification.status,
                    mode: notification.metadata?.mode || 'unknown',
                    stats: {
                        intended: notification.totals?.intendedCount || 0,
                        sent: notification.totals?.sentCount || 0,
                        failures: notification.totals?.failureCount || 0
                    },
                    createdAt: notification.createdAt,
                    completedAt: notification.completedAt,
                    duration: notification.startedAt && notification.completedAt
                        ? Math.round((new Date(notification.completedAt) - new Date(notification.startedAt)) / 1000)
                        : null
                }))
            };
        }
        catch (error) {
            reply.status(500);
            return {
                success: false,
                error: error?.message || 'Failed to fetch notification history',
                notifications: [],
                count: 0,
                totalCount: 0
            };
        }
    });
    // 🔔 FCM API Endpoints - Phase 3.4: GET /stats  
    app.get("/admin/fcm-management/api/stats", async (_request, reply) => {
        try {
            // Import models dynamically
            const { Seller } = await import('./models/index.js');
            const { NotificationLog } = await import('./models/notificationLog.js');
            // Phase 5.2: FCM Environment Controls for Stats Display
            const fcmLiveMode = process.env.FCM_LIVE_MODE === 'true';
            const fcmMaxTokens = parseInt(process.env.FCM_MAX_TOKENS_PER_SEND) || 50;
            // Define time ranges for statistics
            const now = new Date();
            const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            // Run all queries in parallel for better performance
            const [
                totalTokenCount,
                sellersWithTokens,
                androidTokens,
                iosTokens,
                totalNotifications,
                last24hNotifications,
                last7dNotifications,
                last30dNotifications,
                successfulNotifications,
                failedNotifications,
                partialNotifications,
                recentNotifications
            ] = await Promise.all([
                // Token queries
                Seller.aggregate([
                    { $match: { 'fcmTokens.0': { $exists: true } } },
                    { $unwind: '$fcmTokens' },
                    { $count: 'count' }
                ]).then((result) => result[0]?.count || 0),
                Seller.countDocuments({ 'fcmTokens.0': { $exists: true } }),
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
    let server;
    try {
        server = await app.listen({ port: Number(PORT), host: '0.0.0.0' });
        console.log(`Grocery App running on http://localhost:${PORT}${admin.options.rootPath}`);
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
    
    // Initialize Socket.IO server with Fastify server instance
    const io = new SocketIOServer(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    
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