// 🔔 FCM Management Dashboard - Standalone (like monitoring dashboard)
app.get('/admin/fcm-management', async (request, reply) => {
    try {
        // Get FCM token statistics
        const { Seller } = await import('./models/user.js');
        const totalSellers = await Seller.countDocuments();
        const sellersWithTokens = await Seller.countDocuments({ 'fcmTokens.0': { $exists: true } });
        
        // Get total FCM tokens across all sellers
        const tokenStats = await Seller.aggregate([
            { $unwind: { path: '$fcmTokens', preserveNullAndEmptyArrays: true } },
            { $group: { 
                _id: '$fcmTokens.platform', 
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 }}
        ]);
        
        const totalTokens = tokenStats.reduce((sum, stat) => sum + (stat.count || 0), 0);
        const androidTokens = tokenStats.find(s => s._id === 'android')?.count || 0;
        const iosTokens = tokenStats.find(s => s._id === 'ios')?.count || 0;
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔔 GoatGoat FCM Management</title>
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
            background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
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
            color: #f39c12;
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
        .status-warning {
            color: #ff9800;
        }
        .quick-links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .quick-link {
            display: block;
            padding: 15px;
            background: #3d3d3d;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid #555555;
        }
        .quick-link:hover {
            background: #4d4d4d;
            transform: translateY(-2px);
        }
        .send-notification {
            background: #2d2d2d;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #404040;
            margin-top: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #cccccc;
        }
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 10px;
            background: #404040;
            border: 1px solid #555555;
            border-radius: 5px;
            color: #ffffff;
            font-size: 14px;
        }
        .btn {
            background: #f39c12;
            color: white;
            padding: 12px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: #e67e22;
        }
        .btn-secondary {
            background: #6c757d;
        }
        .btn-secondary:hover {
            background: #5a6268;
        }
        .notification-log {
            background: #2d2d2d;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #404040;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }
        .log-entry {
            padding: 10px;
            background: #404040;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid #f39c12;
        }
        .log-timestamp {
            color: #888;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 GoatGoat FCM Management</h1>
            <p>Push notification management and analytics</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 FCM Token Statistics</h3>
                <div class="metric">
                    <span class="metric-label">Total Sellers:</span>
                    <span class="metric-value">${totalSellers}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Sellers with FCM:</span>
                    <span class="metric-value status-${sellersWithTokens > 0 ? 'healthy' : 'warning'}">${sellersWithTokens}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total FCM Tokens:</span>
                    <span class="metric-value">${totalTokens}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Android Tokens:</span>
                    <span class="metric-value">${androidTokens}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">iOS Tokens:</span>
                    <span class="metric-value">${iosTokens}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🔔 Notification Status</h3>
                <div class="metric">
                    <span class="metric-label">Firebase Status:</span>
                    <span class="metric-value status-healthy">Connected</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Notification:</span>
                    <span class="metric-value">Ready to send</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Success Rate:</span>
                    <span class="metric-value">--</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Environment:</span>
                    <span class="metric-value">${process.env.NODE_ENV || 'staging'}</span>
                </div>
            </div>
        </div>
        
        <div class="send-notification">
            <h3>📤 Send Push Notification</h3>
            <form id="notificationForm">
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="form-group">
                        <label for="title">Notification Title:</label>
                        <input type="text" id="title" name="title" placeholder="Enter notification title" required>
                    </div>
                    <div class="form-group">
                        <label for="target">Send To:</label>
                        <select id="target" name="target" required>
                            <option value="all">All Sellers (${totalTokens} tokens)</option>
                            <option value="android">Android Only (${androidTokens} tokens)</option>
                            <option value="ios">iOS Only (${iosTokens} tokens)</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="body">Message Body:</label>
                    <textarea id="body" name="body" rows="3" placeholder="Enter your notification message here..." required></textarea>
                </div>
                <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <button type="button" class="btn" onclick="sendNotification(false)">📤 Send Now</button>
                    <button type="button" class="btn btn-secondary" onclick="sendNotification(true)">🧪 Test Send</button>
                    <button type="button" class="btn btn-secondary" onclick="refreshStats()">🔄 Refresh Stats</button>
                </div>
            </form>
        </div>
        
        <div class="notification-log">
            <h3>📋 Recent Notifications</h3>
            <div id="logContainer">
                <div class="log-entry">
                    <div>Welcome to FCM Management Dashboard</div>
                    <div class="log-timestamp">${new Date().toLocaleString()}</div>
                </div>
            </div>
        </div>
        
        <div class="quick-links">
            <a href="/admin" class="quick-link">🏠 Admin Panel</a>
            <a href="/admin/monitoring-dashboard" class="quick-link">📊 Monitoring</a>
            <a href="/admin/fcm-management/tokens" class="quick-link">🔑 View All Tokens</a>
            <a href="/admin/resources/Seller" class="quick-link">👥 Manage Sellers</a>
        </div>
    </div>
    
    <script>
        async function sendNotification(isTest = false) {
            const form = document.getElementById('notificationForm');
            const formData = new FormData(form);
            
            const data = {
                title: formData.get('title'),
                body: formData.get('body'),
                target: formData.get('target'),
                isTest: isTest
            };
            
            if (!data.title || !data.body) {
                alert('Please fill in both title and message body');
                return;
            }
            
            try {
                const button = event.target;
                button.disabled = true;
                button.textContent = isTest ? '🧪 Sending Test...' : '📤 Sending...';
                
                const response = await fetch('/admin/fcm-management/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    addLogEntry(`${isTest ? 'Test' : 'Notification'} sent successfully: ${data.title} (${result.sentCount || 0} recipients)`);
                    if (!isTest) {
                        form.reset();
                    }
                } else {
                    addLogEntry(`Failed to send notification: ${result.error}`);
                }
            } catch (error) {
                addLogEntry(`Error sending notification: ${error.message}`);
            } finally {
                const button = event.target;
                button.disabled = false;
                button.textContent = isTest ? '🧪 Test Send' : '📤 Send Now';
            }
        }
        
        function addLogEntry(message) {
            const logContainer = document.getElementById('logContainer');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = `
                <div>${message}</div>
                <div class="log-timestamp">${new Date().toLocaleString()}</div>
            `;
            logContainer.insertBefore(entry, logContainer.firstChild);
            
            // Keep only last 10 entries
            while (logContainer.children.length > 10) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }
        
        async function refreshStats() {
            try {
                window.location.reload();
            } catch (error) {
                addLogEntry(`Error refreshing stats: ${error.message}`);
            }
        }
        
        // Auto-refresh every 30 seconds
        setInterval(() => {
            // Just refresh token count quietly
            fetch('/admin/fcm-management/stats')
                .then(response => response.json())
                .then(data => {
                    // Could update stats without full page reload
                    console.log('Stats updated:', data);
                })
                .catch(error => console.log('Stats refresh error:', error));
        }, 30000);
    </script>
</body>
</html>`;
        
        reply.type('text/html').send(html);
        
    } catch (error) {
        console.error('FCM Dashboard Error:', error);
        reply.status(500).send(`
            <html><body style="background: #1a1a1a; color: white; font-family: Arial; padding: 20px;">
                <h1>🚨 FCM Dashboard Error</h1>
                <p>Error loading FCM management dashboard: ${error.message}</p>
                <p><a href="/admin" style="color: #4CAF50;">← Back to Admin</a></p>
            </body></html>
        `);
    }
});

// 📤 FCM Management API Endpoints
app.post('/admin/fcm-management/send', async (request, reply) => {
    try {
        const { title, body, target, isTest = false } = request.body;
        
        if (!title || !body) {
            return reply.status(400).send({ success: false, error: 'Title and body are required' });
        }
        
        // Get FCM service
        const { sendBulkPushNotifications } = await import('./services/fcmService.js');
        const { Seller } = await import('./models/user.js');
        
        let query = { 'fcmTokens.0': { $exists: true } };
        
        // Apply platform filter
        if (target === 'android') {
            query['fcmTokens.platform'] = 'android';
        } else if (target === 'ios') {
            query['fcmTokens.platform'] = 'ios';
        }
        
        // Get sellers with FCM tokens
        const sellers = await Seller.find(query).select('fcmTokens');
        const tokens = [];
        
        sellers.forEach(seller => {
            seller.fcmTokens.forEach(tokenObj => {
                if (target === 'all' || tokenObj.platform === target) {
                    tokens.push(tokenObj.token);
                }
            });
        });
        
        if (tokens.length === 0) {
            return reply.send({ success: false, error: 'No FCM tokens found for the selected target' });
        }
        
        // Limit test sends to 5 tokens
        const tokensToSend = isTest ? tokens.slice(0, 5) : tokens;
        
        // Send notification
        const notificationPayload = {
            notification: {
                title: isTest ? `[TEST] ${title}` : title,
                body: body
            },
            data: {
                type: 'admin_notification',
                timestamp: new Date().toISOString()
            }
        };
        
        const result = await sendBulkPushNotifications(tokensToSend, notificationPayload);
        
        reply.send({
            success: true,
            sentCount: result.successCount,
            failureCount: result.failureCount,
            totalTokens: tokens.length,
            isTest: isTest
        });
        
    } catch (error) {
        console.error('FCM Send Error:', error);
        reply.status(500).send({ success: false, error: error.message });
    }
});

app.get('/admin/fcm-management/stats', async (request, reply) => {
    try {
        const { Seller } = await import('./models/user.js');
        const totalSellers = await Seller.countDocuments();
        const sellersWithTokens = await Seller.countDocuments({ 'fcmTokens.0': { $exists: true } });
        
        const tokenStats = await Seller.aggregate([
            { $unwind: { path: '$fcmTokens', preserveNullAndEmptyArrays: true } },
            { $group: { 
                _id: '$fcmTokens.platform', 
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 }}
        ]);
        
        const totalTokens = tokenStats.reduce((sum, stat) => sum + (stat.count || 0), 0);
        const androidTokens = tokenStats.find(s => s._id === 'android')?.count || 0;
        const iosTokens = tokenStats.find(s => s._id === 'ios')?.count || 0;
        
        reply.send({
            success: true,
            stats: {
                totalSellers,
                sellersWithTokens,
                totalTokens,
                androidTokens,
                iosTokens,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('FCM Stats Error:', error);
        reply.status(500).send({ success: false, error: error.message });
    }
});

app.get('/admin/fcm-management/tokens', async (request, reply) => {
    try {
        const { Seller } = await import('./models/user.js');
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        const sellers = await Seller.find({ 'fcmTokens.0': { $exists: true } })
            .select('name email fcmTokens createdAt')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        const totalCount = await Seller.countDocuments({ 'fcmTokens.0': { $exists: true } });
        
        reply.send({
            success: true,
            sellers: sellers,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
        
    } catch (error) {
        console.error('FCM Tokens Error:', error);
        reply.status(500).send({ success: false, error: error.message });
    }
});