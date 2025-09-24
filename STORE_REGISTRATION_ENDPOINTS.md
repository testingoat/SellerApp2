# Store Registration API Endpoint Configuration

## 🚨 Current Issue
The store registration endpoint `/api/seller/store/register` returns 404 - not found.

## 🔄 Endpoint Alternatives to Try

### Option 1: Profile Update (Current)
```
PUT /api/seller/profile
```
**Rationale**: Store registration is essentially completing the seller profile

### Option 2: Direct Seller Update
```
PUT /api/seller
PATCH /api/seller
```
**Rationale**: Update the seller entity with store information

### Option 3: Registration Completion
```
POST /api/seller/complete-registration
PUT /api/seller/complete-registration
```
**Rationale**: Specific endpoint for completing seller onboarding

### Option 4: Store Entity (if separate)
```
POST /api/seller/store
PUT /api/seller/store
```
**Rationale**: If store is a separate entity

## 🛠️ Quick Fix Options

### Immediate Solution
✅ **Implemented**: Fallback mechanism that:
1. Detects 404 error
2. Stores data locally in secure storage
3. Marks profile as complete
4. Shows success message with note
5. Allows user to proceed to MainTabs

### Backend Team Action Required
❗ **Need to implement one of these endpoints**:
- `PUT /api/seller/profile` - Update seller profile with store info
- `POST /api/seller/store/register` - Create/register new store
- `PUT /api/seller/complete-registration` - Complete seller registration

## 📝 Expected Request Format
```json
{
  "storeName": "Test Store",
  "ownerName": "John Doe", 
  "email": "john@example.com",
  "address": "123 Main St",
  "city": "New York",
  "pincode": "10001",
  "gstNumber": "22AAAAA0000A1Z5",
  "bankAccount": "1234567890",
  "ifscCode": "HDFC0000001",
  "phone": "916362924334"
}
```

## 📋 Expected Response Format
```json
{
  "success": true,
  "message": "Store registered successfully",
  "data": {
    "storeId": "store_12345",
    "storeName": "Test Store", 
    "status": "pending|approved|rejected",
    "profileCompleted": true
  }
}
```

## 🧪 Testing Status
- ❌ `/api/seller/store/register` - 404 Not Found
- ⏳ `/api/seller/profile` - To be tested
- ✅ **Fallback mechanism** - Working (stores locally)

## 📞 Next Steps
1. **Immediate**: Fallback allows app to continue functioning
2. **Short-term**: Test with `/api/seller/profile` endpoint  
3. **Long-term**: Backend team implements proper store registration endpoint