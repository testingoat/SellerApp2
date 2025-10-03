#!/bin/bash

# Fix FCM Notifications to appear in app's notification list
# This script adds code to create individual Notification records for sellers

FILE="/var/www/goatgoat-staging/server/src/app.ts"
BACKUP_FILE="/var/www/goatgoat-staging/server/src/app.ts.backup-notification-fix"

echo "🔧 Fixing FCM notification persistence..."

# Create backup
cp "$FILE" "$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

# Find the line number where we need to insert the code
# We're looking for the line after "console.log('✅ Notification logged to history successfully');"
LINE_NUM=$(grep -n "console.log('✅ Notification logged to history successfully');" "$FILE" | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
    echo "❌ Could not find insertion point in file"
    exit 1
fi

echo "📍 Found insertion point at line $LINE_NUM"

# Calculate insertion line (after the console.log and the closing brace of the try-catch)
INSERT_LINE=$((LINE_NUM + 4))

echo "📝 Inserting notification persistence code at line $INSERT_LINE..."

# Create the code to insert
cat > /tmp/notification-fix-code.txt << 'EOF'

                    // 🔔 Create individual notification records for sellers (for in-app notification list)
                    // This ensures notifications appear in the app's NotificationsScreen
                    if ((targetType === 'sellers' || targetType === 'all') && sendResult.successCount > 0) {
                        try {
                            const { default: Notification } = await import('./models/notification.js');
                            const { Seller } = await import('./models/index.js');
                            
                            // Get seller IDs that have the tokens we successfully sent to
                            const sellers = await Seller.find({
                                'fcmTokens.token': { $in: targetTokens }
                            }).select('_id');
                            
                            const sellerIds = sellers.map((s: any) => s._id);
                            
                            if (sellerIds.length > 0) {
                                // Create notification record for each seller
                                const notificationPromises = sellerIds.map((sellerId: any) =>
                                    Notification.create({
                                        sellerId,
                                        title: title.trim(),
                                        message: message.trim(),
                                        type: 'system',
                                        icon: 'notifications',
                                        isRead: false,
                                        data: {
                                            sentViaFCM: true,
                                            sentAt: new Date().toISOString(),
                                            targetType
                                        }
                                    })
                                );
                                
                                await Promise.all(notificationPromises);
                                console.log(`✅ Created ${sellerIds.length} in-app notification records for sellers`);
                            }
                        } catch (notifError: any) {
                            console.error('⚠️ Failed to create in-app notifications:', notifError.message);
                            // Don't fail the whole operation if this fails - it's non-blocking
                        }
                    }
EOF

# Insert the code at the calculated line
head -n $INSERT_LINE "$FILE" > /tmp/app-modified.ts
cat /tmp/notification-fix-code.txt >> /tmp/app-modified.ts
tail -n +$((INSERT_LINE + 1)) "$FILE" >> /tmp/app-modified.ts

# Replace the original file
mv /tmp/app-modified.ts "$FILE"

echo "✅ Code inserted successfully"
echo "📦 Building TypeScript..."

# Build the project
cd /var/www/goatgoat-staging/server
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
    echo "🔄 Restarting PM2 process..."
    pm2 restart goatgoat-staging
    echo "✅ Server restarted"
    echo ""
    echo "🎉 Fix applied successfully!"
    echo "📝 Test by sending a notification via FCM dashboard"
else
    echo "❌ Build failed! Restoring backup..."
    cp "$BACKUP_FILE" "$FILE"
    echo "✅ Backup restored"
    exit 1
fi

