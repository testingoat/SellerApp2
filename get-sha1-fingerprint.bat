@echo off
echo ========================================
echo Getting SHA-1 Fingerprint for Android App
echo ========================================
echo.

echo Debug Keystore SHA-1 Fingerprint:
echo ----------------------------------
cd android\app
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
echo.

echo ========================================
echo IMPORTANT: Copy the SHA1 fingerprint from above
echo You'll need this for Google Cloud Console API key restrictions
echo.
echo Package Name: com.sellerapp2
echo SHA-1: [Copy from above output]
echo ========================================
pause
