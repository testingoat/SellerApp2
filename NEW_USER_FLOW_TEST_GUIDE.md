# New User Flow Testing Guide

## 🎯 Issue Fixed
The app was not properly handling the new user registration flow. Users with `profileCompleted: false` were being taken directly to the MainTabs instead of the StoreRegistrationScreen.

## 🔧 Changes Made

### 1. AppNavigator Logic Update
- Added `needsRegistration` condition: `isAuthenticated && (isNewUser || !user?.profileCompleted)`
- Created separate navigation flow for users who need registration
- Proper conditional rendering based on user profile completion status

### 2. OTP Verification Simplification  
- Removed complex navigation logic from OTPVerificationScreen
- Let AppNavigator handle navigation based on auth state changes
- State-driven navigation instead of manual navigation calls

### 3. Enhanced Profile Completion Tracking
- `updateUserProfile()` now updates both in-memory state and secure storage
- Properly updates `isNewUser` flag when profile is completed
- Async profile update with error handling

## 🧪 Testing Scenarios

### Scenario 1: New User (No Profile)
**Expected Flow**: Login → OTP → **Store Registration** → MainTabs

1. **Login** with phone number (e.g., `6362924334`)
2. **Enter OTP** - API returns `profileCompleted: false`
3. **Should show**: StoreRegistrationScreen
4. **Complete registration** - Fill all required fields
5. **Should navigate**: To MainTabs after successful registration

**Expected Logs**:
```
🔍 User state: { isNewUser: true, profileCompleted: false, needsRegistration: true }
🔍 Navigation will show: STORE_REGISTRATION  
🏪 User is authenticated but needs registration - showing StoreRegistration
```

### Scenario 2: Existing User (Profile Complete)
**Expected Flow**: Login → OTP → **MainTabs** (skip registration)

1. **Login** with phone number of existing user
2. **Enter OTP** - API returns `profileCompleted: true`  
3. **Should navigate**: Directly to MainTabs

**Expected Logs**:
```
🔍 User state: { isNewUser: false, profileCompleted: true, needsRegistration: false }
🔍 Navigation will show: MAIN_TABS
🚀 User is authenticated and profile complete - showing MainTabs
```

### Scenario 3: Profile Completion
**Expected Flow**: Registration → Profile Update → Navigation

1. **Complete** store registration form
2. **Submit** registration successfully  
3. **Should update**: User profile to `profileCompleted: true`
4. **Should navigate**: To MainTabs automatically

**Expected Logs**:
```
🎆 StoreRegistration: Registration successful, updating profile status
💾 AuthStore: Updating user profile completion status: true
✅ AuthStore: User data updated in secure storage
🏆 Store registration completed - navigating to MainTabs
```

## 🚨 Debug Points

### Check These Logs:
1. **AppNavigator render logs** - Shows current user state and navigation decision
2. **Auth service logs** - Shows API response with `profileCompleted` status
3. **AuthStore logs** - Shows state updates after OTP verification
4. **StoreRegistration logs** - Shows profile update process

### Common Issues to Watch:
- ❌ `needsRegistration: false` when user has `profileCompleted: false`
- ❌ Navigation showing `MAIN_TABS` when it should show `STORE_REGISTRATION`  
- ❌ `isNewUser` not being updated after profile completion
- ❌ State not persisting in secure storage

## 📱 Test Phones

Based on the provided logs, test with these numbers:
- **6362924334**: Should trigger new user flow
- **8050343816**: Should trigger new user flow  

Both should go through Store Registration before accessing MainTabs.

## ✅ Success Criteria

1. **New users** must complete store registration before accessing MainTabs
2. **Existing users** with complete profiles go directly to MainTabs
3. **Profile completion** properly updates user state and storage
4. **Navigation** is state-driven and automatic (no manual navigation)
5. **App restart** maintains correct user state and navigation

---
**Test both scenarios thoroughly before considering the fix complete.**