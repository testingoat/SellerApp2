@echo off
echo 🚀 Starting monitoring system refresh...
echo.

cd /d "C:\Seller App 2\SellerApp2"

echo Step 1: Running monitoring system...
node accurate-monitoring-system.js --single
echo.

echo Step 2: Generating dashboard...
node advanced-dashboard.js
echo.

echo ✅ Monitoring refresh completed!
echo 📊 Opening dashboard...
start monitoring-data/dashboard/dashboard.html

echo.
echo 🔄 Your dashboard has been refreshed with the latest data!
echo 🌐 Dashboard will open in your browser automatically.
echo.

pause