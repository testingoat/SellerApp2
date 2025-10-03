# 📦 Orders Page Implementation Plan
## Comprehensive Roadmap for Seller Order Management

**Document Version:** 1.0  
**Created:** October 2, 2025  
**Status:** Planning Phase  
**Target Server:** Staging (https://staging.goatgoat.tech)  
**Priority:** HIGH

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Phases](#implementation-phases)
5. [Database Schema Updates](#database-schema-updates)
6. [Server-Side Implementation](#server-side-implementation)
7. [Client-Side Implementation](#client-side-implementation)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Plan](#deployment-plan)
10. [Risk Assessment](#risk-assessment)

---

## 1. Executive Summary

### **Objective**
Implement a complete order management system for sellers in the SellerApp2, enabling them to:
- View all orders assigned to their store
- Accept or reject incoming orders
- Track order status and history
- View order details and customer information
- Monitor order metrics and statistics

### **Current Gap**
- ✅ Order model exists in database
- ✅ Customer and delivery partner order flows work
- ❌ **Seller order management is NOT implemented**
- ❌ **No seller-order relationship in database**
- ❌ **No seller order API endpoints**
- ❌ **No mobile app screens for orders**

### **Expected Outcome**
A fully functional order management system that allows sellers to efficiently manage incoming orders, improving order fulfillment speed and customer satisfaction.

---

## 2. Current State Analysis

### **2.1 What Exists**

#### **Database Models:**
- ✅ **Order Model** (`/server/src/models/order.js`)
  - Basic order structure with customer, items, status
  - Delivery partner assignment
  - Branch reference
  - Status tracking

- ✅ **Branch Model** (`/server/src/models/branch.js`)
  - Store location and details
  - Operating hours
  - Contact information

- ✅ **Seller Model** (`/server/src/models/user.js`)
  - Seller authentication
  - Profile information
  - FCM tokens for notifications

#### **Existing Order Statuses:**
```javascript
status: ['available', 'confirmed', 'arriving', 'delivered', 'cancelled']
```

### **2.2 What's Missing**

#### **Database Schema Gaps:**
1. **Order Model:**
   - ❌ No `seller` field (can't link orders to sellers)
   - ❌ No `sellerResponse` object (can't track acceptance/rejection)
   - ❌ No seller-specific statuses

2. **Branch Model:**
   - ❌ No `seller` reference (can't link branches to sellers)

#### **API Endpoints Missing:**
- ❌ `GET /seller/orders` - List all orders
- ❌ `GET /seller/orders/pending` - Get pending orders
- ❌ `PUT /seller/orders/:id/accept` - Accept order
- ❌ `PUT /seller/orders/:id/reject` - Reject order
- ❌ `GET /seller/dashboard/metrics` - Order statistics

#### **Mobile App Screens Missing:**
- ❌ OrdersScreen.tsx - List view
- ❌ OrderDetailsScreen.tsx - Detail view
- ❌ Order status management UI
- ❌ Order service layer

---

## 3. Architecture Overview

### **3.1 System Flow**

```
Customer Places Order
        ↓
Order Created in Database
        ↓
Assigned to Seller's Branch
        ↓
[NEW] Seller Receives Notification
        ↓
[NEW] Seller Views Order in App
        ↓
[NEW] Seller Accepts/Rejects Order
        ↓
If Accepted → Assign to Delivery Partner
        ↓
Order Fulfillment Process
```

### **3.2 Data Relationships**

```
Order
├── customer (ObjectId → Customer)
├── seller (ObjectId → Seller) [NEW]
├── branch (ObjectId → Branch)
├── deliveryPartner (ObjectId → DeliveryPartner)
├── items (Array of OrderItems)
├── sellerResponse [NEW]
│   ├── status ('pending', 'accepted', 'rejected')
│   ├── responseTime (Date)
│   └── rejectionReason (String)
└── status (String)
```

---

## 4. Implementation Phases

### **Phase 1: Database Schema Updates** ⏱️ 1-2 hours
**Priority:** CRITICAL  
**Risk:** MEDIUM  
**Dependencies:** None

**Tasks:**
1. Update Order model with seller fields
2. Update Branch model with seller reference
3. Create data migration script
4. Test schema changes on staging

### **Phase 2: Server API Endpoints** ⏱️ 2-3 hours
**Priority:** HIGH  
**Risk:** LOW  
**Dependencies:** Phase 1 complete

**Tasks:**
1. Create seller order controller
2. Implement order listing endpoint
3. Implement order acceptance endpoint
4. Implement order rejection endpoint
5. Implement dashboard metrics endpoint
6. Add authentication middleware
7. Test all endpoints with Postman

### **Phase 3: Mobile App Implementation** ⏱️ 3-4 hours
**Priority:** HIGH  
**Risk:** LOW  
**Dependencies:** Phase 2 complete

**Tasks:**
1. Create order service layer
2. Implement OrdersScreen component
3. Implement OrderDetailsScreen component
4. Add navigation routes
5. Implement order actions (accept/reject)
6. Add loading and error states
7. Test on emulator and device

### **Phase 4: Testing & Validation** ⏱️ 1-2 hours
**Priority:** CRITICAL  
**Risk:** LOW  
**Dependencies:** All phases complete

**Tasks:**
1. Database testing
2. API endpoint testing
3. Mobile app testing
4. Integration testing
5. Performance testing
6. User acceptance testing

---

## 5. Database Schema Updates

### **5.1 Order Model Changes**

**File:** `/var/www/goatgoat-staging/server/src/models/order.js`

**Add These Fields:**

```javascript
// ADD: Seller reference
seller: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Seller',
  required: true,
  index: true  // For fast seller queries
},

// ADD: Seller response tracking
sellerResponse: {
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  responseTime: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  },
  acceptedBy: { 
    type: String  // Seller name who accepted
  },
  estimatedTime: {
    type: Number  // Minutes until ready
  }
},

// UPDATE: Status enum to include seller-specific statuses
status: {
  type: String,
  enum: [
    'pending_seller',      // NEW: Waiting for seller acceptance
    'accepted_by_seller',  // NEW: Seller accepted
    'rejected_by_seller',  // NEW: Seller rejected
    'available',           // Existing
    'confirmed',
    'arriving',
    'delivered',
    'cancelled'
  ],
  default: 'pending_seller'
}
```

### **5.2 Branch Model Changes**

**File:** `/var/www/goatgoat-staging/server/src/models/branch.js`

**Add This Field:**

```javascript
// ADD: Seller reference
seller: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Seller',
  required: true,
  index: true
}
```

### **5.3 Data Migration Script**

**File:** `/var/www/goatgoat-staging/server/scripts/migrate-orders-to-sellers.js`

```javascript
import mongoose from 'mongoose';
import { connectDB } from '../src/config/connect.js';
import Order from '../src/models/order.js';
import Branch from '../src/models/branch.js';

const migrateOrdersToSellers = async () => {
  try {
    console.log('🔄 Starting order-seller migration...');
    
    await connectDB();
    
    // Get all orders with branch populated
    const orders = await Order.find({}).populate('branch');
    
    let updated = 0;
    let skipped = 0;
    
    for (const order of orders) {
      if (order.branch && order.branch.seller) {
        // Link order to seller
        order.seller = order.branch.seller;
        
        // Assume existing orders are accepted
        order.sellerResponse = {
          status: 'accepted',
          responseTime: order.createdAt,
          acceptedBy: 'Migration Script'
        };
        
        // Update status if needed
        if (order.status === 'available') {
          order.status = 'accepted_by_seller';
        }
        
        await order.save();
        updated++;
      } else {
        console.warn(`⚠️ Order ${order._id} has no branch or seller`);
        skipped++;
      }
    }
    
    console.log(`✅ Migration complete!`);
    console.log(`   Updated: ${updated} orders`);
    console.log(`   Skipped: ${skipped} orders`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateOrdersToSellers();
```

**Run Migration:**
```bash
cd /var/www/goatgoat-staging/server
node scripts/migrate-orders-to-sellers.js
```

---

## 6. Server-Side Implementation

### **6.1 Create Seller Order Controller**

**File:** `/var/www/goatgoat-staging/server/src/controllers/seller/sellerOrder.js`

```javascript
import Order from '../../models/order.js';
import mongoose from 'mongoose';

// GET /seller/orders - List all orders for authenticated seller
export const getSellerOrders = async (request, reply) => {
  try {
    const { userId } = request.user;
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = request.query;
    
    // Build query
    const query = { seller: userId };
    if (status) {
      query['sellerResponse.status'] = status;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Fetch orders
    const orders = await Order.find(query)
      .populate('customer', 'name phone')
      .populate('items.item', 'name price image category')
      .populate('branch', 'name address')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count
    const total = await Order.countDocuments(query);
    
    return reply.send({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching seller orders:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch orders'
    });
  }
};

// GET /seller/orders/pending - Get pending orders requiring action
export const getPendingOrders = async (request, reply) => {
  try {
    const { userId } = request.user;
    
    const orders = await Order.find({
      seller: userId,
      'sellerResponse.status': 'pending'
    })
      .populate('customer', 'name phone')
      .populate('items.item', 'name price image')
      .sort({ createdAt: -1 })
      .lean();
    
    return reply.send({
      success: true,
      orders,
      count: orders.length
    });
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch pending orders'
    });
  }
};

// PUT /seller/orders/:id/accept - Accept an order
export const acceptOrder = async (request, reply) => {
  try {
    const { userId } = request.user;
    const { id } = request.params;
    const { estimatedTime } = request.body;  // Minutes until ready
    
    // Validate order exists and belongs to seller
    const order = await Order.findOne({
      _id: id,
      seller: userId,
      'sellerResponse.status': 'pending'
    });
    
    if (!order) {
      return reply.status(404).send({
        success: false,
        message: 'Order not found or already processed'
      });
    }
    
    // Update order
    order.sellerResponse.status = 'accepted';
    order.sellerResponse.responseTime = new Date();
    order.sellerResponse.estimatedTime = estimatedTime || 30;
    order.status = 'accepted_by_seller';
    
    await order.save();
    
    // TODO: Send notification to customer
    // TODO: Trigger delivery partner assignment
    
    return reply.send({
      success: true,
      message: 'Order accepted successfully',
      order
    });
  } catch (error) {
    console.error('Error accepting order:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to accept order'
    });
  }
};

// PUT /seller/orders/:id/reject - Reject an order
export const rejectOrder = async (request, reply) => {
  try {
    const { userId } = request.user;
    const { id } = request.params;
    const { reason } = request.body;
    
    if (!reason || reason.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        message: 'Rejection reason is required'
      });
    }
    
    // Validate order exists and belongs to seller
    const order = await Order.findOne({
      _id: id,
      seller: userId,
      'sellerResponse.status': 'pending'
    });
    
    if (!order) {
      return reply.status(404).send({
        success: false,
        message: 'Order not found or already processed'
      });
    }
    
    // Update order
    order.sellerResponse.status = 'rejected';
    order.sellerResponse.responseTime = new Date();
    order.sellerResponse.rejectionReason = reason.trim();
    order.status = 'rejected_by_seller';
    
    await order.save();
    
    // TODO: Send notification to customer
    // TODO: Trigger refund process if payment was made
    
    return reply.send({
      success: true,
      message: 'Order rejected successfully',
      order
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to reject order'
    });
  }
};

// GET /seller/dashboard/metrics - Get order statistics
export const getDashboardMetrics = async (request, reply) => {
  try {
    const { userId } = request.user;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalOrders,
      pendingOrders,
      acceptedOrders,
      rejectedOrders,
      todayOrders,
      todayRevenue
    ] = await Promise.all([
      // Total orders
      Order.countDocuments({ seller: userId }),
      
      // Pending orders
      Order.countDocuments({ 
        seller: userId, 
        'sellerResponse.status': 'pending' 
      }),
      
      // Accepted orders
      Order.countDocuments({ 
        seller: userId, 
        'sellerResponse.status': 'accepted' 
      }),
      
      // Rejected orders
      Order.countDocuments({ 
        seller: userId, 
        'sellerResponse.status': 'rejected' 
      }),
      
      // Today's orders
      Order.countDocuments({
        seller: userId,
        createdAt: { $gte: today }
      }),
      
      // Today's revenue
      Order.aggregate([
        {
          $match: {
            seller: new mongoose.Types.ObjectId(userId),
            createdAt: { $gte: today },
            'sellerResponse.status': 'accepted'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ])
    ]);
    
    return reply.send({
      success: true,
      metrics: {
        totalOrders,
        pendingOrders,
        acceptedOrders,
        rejectedOrders,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return reply.status(500).send({
      success: false,
      message: 'Failed to fetch metrics'
    });
  }
};
```

### **6.2 Register Routes**

**File:** `/var/www/goatgoat-staging/server/src/routes/seller.js`

**Add These Routes:**

```javascript
import {
  getSellerOrders,
  getPendingOrders,
  acceptOrder,
  rejectOrder,
  getDashboardMetrics
} from '../controllers/seller/sellerOrder.js';

// Order management routes
export const sellerRoutes = async (fastify, options) => {
  // ... existing routes ...
  
  // Order routes
  fastify.get('/seller/orders', { 
    preHandler: [verifyToken] 
  }, getSellerOrders);
  
  fastify.get('/seller/orders/pending', { 
    preHandler: [verifyToken] 
  }, getPendingOrders);
  
  fastify.put('/seller/orders/:id/accept', { 
    preHandler: [verifyToken] 
  }, acceptOrder);
  
  fastify.put('/seller/orders/:id/reject', { 
    preHandler: [verifyToken] 
  }, rejectOrder);
  
  fastify.get('/seller/dashboard/metrics', { 
    preHandler: [verifyToken] 
  }, getDashboardMetrics);
};
```

---

## 7. Client-Side Implementation

### **7.1 Create Order Service**

**File:** `src/services/orderService.ts`

```typescript
import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '../config';

export interface OrderItem {
  item: {
    _id: string;
    name: string;
    price: number;
    image: string;
    category: string;
  };
  count: number;
}

export interface Order {
  _id: string;
  orderId: string;
  customer: {
    _id: string;
    name: string;
    phone: string;
  };
  items: OrderItem[];
  totalPrice: number;
  status: string;
  sellerResponse: {
    status: 'pending' | 'accepted' | 'rejected';
    responseTime?: string;
    rejectionReason?: string;
    estimatedTime?: number;
  };
  deliveryLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  branch: {
    _id: string;
    name: string;
    address: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  success: boolean;
  orders: Order[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DashboardMetrics {
  totalOrders: number;
  pendingOrders: number;
  acceptedOrders: number;
  rejectedOrders: number;
  todayOrders: number;
  todayRevenue: number;
}

class OrderService {
  async getOrders(
    page = 1, 
    limit = 20, 
    status?: string
  ): Promise<OrderListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    return httpClient.get<OrderListResponse>(
      `/seller/orders?${params.toString()}`
    );
  }
  
  async getPendingOrders(): Promise<OrderListResponse> {
    return httpClient.get<OrderListResponse>('/seller/orders/pending');
  }
  
  async acceptOrder(orderId: string, estimatedTime: number): Promise<any> {
    return httpClient.put(`/seller/orders/${orderId}/accept`, {
      estimatedTime
    });
  }
  
  async rejectOrder(orderId: string, reason: string): Promise<any> {
    return httpClient.put(`/seller/orders/${orderId}/reject`, {
      reason
    });
  }
  
  async getDashboardMetrics(): Promise<{ metrics: DashboardMetrics }> {
    return httpClient.get('/seller/dashboard/metrics');
  }
}

export const orderService = new OrderService();
```

### **7.2 Create OrdersScreen Component**

**File:** `src/screens/OrdersScreen.tsx`

```typescript
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { orderService, Order } from '../services/orderService';
import { colors, typography } from '../theme';

type FilterType = 'all' | 'pending' | 'accepted' | 'rejected';

const OrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const loadOrders = useCallback(async (pageNum = 1, filterType = filter) => {
    if (pageNum === 1) {
      setLoading(true);
    }
    
    try {
      const response = await orderService.getOrders(
        pageNum,
        20,
        filterType === 'all' ? undefined : filterType
      );
      
      if (pageNum === 1) {
        setOrders(response.orders);
      } else {
        setOrders(prev => [...prev, ...response.orders]);
      }
      
      setHasMore(
        response.pagination ? 
        response.pagination.page < response.pagination.pages : 
        false
      );
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);
  
  useEffect(() => {
    loadOrders(1, filter);
  }, [filter]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadOrders(1, filter);
  };
  
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadOrders(nextPage, filter);
    }
  };
  
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };
  
  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{item.orderId}</Text>
        <View 
          style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.sellerResponse.status) }
          ]}
        >
          <Text style={styles.statusText}>
            {item.sellerResponse.status.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.customerName}>{item.customer.name}</Text>
      <Text style={styles.customerPhone}>{item.customer.phone}</Text>
      
      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>
          {item.items.length} item{item.items.length > 1 ? 's' : ''}
        </Text>
        <Text style={styles.orderPrice}>₹{item.totalPrice.toFixed(2)}</Text>
      </View>
      
      <Text style={styles.orderTime}>
        {new Date(item.createdAt).toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No orders found</Text>
      <Text style={styles.emptySubtext}>
        {filter === 'pending' 
          ? 'No pending orders at the moment' 
          : 'Orders will appear here once customers place them'}
      </Text>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'pending' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>
            Pending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'accepted' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('accepted')}
        >
          <Text style={[styles.filterText, filter === 'accepted' && styles.activeFilterText]}>
            Accepted
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'rejected' && styles.activeFilterTab]}
          onPress={() => handleFilterChange('rejected')}
        >
          <Text style={[styles.filterText, filter === 'rejected' && styles.activeFilterText]}>
            Rejected
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Orders List */}
      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            loading && page > 1 ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.footerLoader} />
            ) : null
          }
          contentContainerStyle={orders.length === 0 ? styles.emptyListContainer : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: colors.white,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    ...typography.h3,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  customerName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerPhone: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCount: {
    ...typography.body,
    color: colors.textSecondary,
  },
  orderPrice: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  orderTime: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  footerLoader: {
    marginVertical: 16,
  },
});

export default OrdersScreen;
```

---

## 8. Testing Strategy

### **8.1 Database Testing**
- [ ] Verify schema updates applied correctly
- [ ] Test data migration script
- [ ] Check indexes created
- [ ] Validate data integrity

### **8.2 API Testing**
- [ ] Test all endpoints with Postman
- [ ] Verify authentication works
- [ ] Test pagination
- [ ] Test filtering
- [ ] Test error handling
- [ ] Test edge cases (invalid IDs, unauthorized access)

### **8.3 Mobile App Testing**
- [ ] Test order list loading
- [ ] Test filtering functionality
- [ ] Test pagination and infinite scroll
- [ ] Test pull-to-refresh
- [ ] Test accept/reject actions
- [ ] Test navigation to order details
- [ ] Test error states
- [ ] Test loading states
- [ ] Test empty states

### **8.4 Integration Testing**
- [ ] End-to-end order flow
- [ ] Real-time updates
- [ ] Notification integration
- [ ] Performance under load

---

## 9. Deployment Plan

### **9.1 Pre-Deployment Checklist**
- [ ] All code reviewed
- [ ] All tests passing
- [ ] Database backup created
- [ ] Migration script tested
- [ ] Rollback plan prepared

### **9.2 Deployment Steps**

1. **Database Migration:**
   ```bash
   # Backup database
   mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)
   
   # Run migration
   cd /var/www/goatgoat-staging/server
   node scripts/migrate-orders-to-sellers.js
   ```

2. **Server Deployment:**
   ```bash
   # Pull latest code
   cd /var/www/goatgoat-staging/server
   git pull origin main
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   
   # Restart server
   pm2 restart goatgoat-staging
   ```

3. **Mobile App Deployment:**
   ```bash
   # Build debug APK for testing
   cd android
   ./gradlew assembleDebug
   
   # Test on device
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

### **9.3 Post-Deployment Verification**
- [ ] Server health check
- [ ] API endpoints responding
- [ ] Mobile app connects successfully
- [ ] Orders loading correctly
- [ ] Actions working (accept/reject)
- [ ] No errors in logs

---

## 10. Risk Assessment

### **10.1 High-Risk Areas**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data migration fails | HIGH | LOW | Test on staging first, create backups, have rollback plan |
| Breaking existing order flow | HIGH | MEDIUM | Maintain backward compatibility, test thoroughly |
| Performance issues with large datasets | MEDIUM | MEDIUM | Add database indexes, implement pagination |
| AdminJS panel breaks | HIGH | LOW | Don't modify AdminJS config, test admin panel after changes |

### **10.2 Mitigation Strategies**

1. **Database Changes:**
   - Always backup before migration
   - Test migration on staging first
   - Have rollback script ready
   - Monitor database performance

2. **API Changes:**
   - Maintain backward compatibility
   - Version API if needed
   - Comprehensive error handling
   - Rate limiting for protection

3. **Mobile App:**
   - Graceful error handling
   - Offline support considerations
   - Loading states for better UX
   - Retry mechanisms

---

## 11. Timeline & Milestones

| Phase | Duration | Start | End | Status |
|-------|----------|-------|-----|--------|
| Phase 1: Database Schema | 1-2 hours | TBD | TBD | ⏳ Pending |
| Phase 2: Server API | 2-3 hours | TBD | TBD | ⏳ Pending |
| Phase 3: Mobile App | 3-4 hours | TBD | TBD | ⏳ Pending |
| Phase 4: Testing | 1-2 hours | TBD | TBD | ⏳ Pending |
| **Total** | **7-11 hours** | TBD | TBD | ⏳ Pending |

---

## 12. Success Criteria

### **Functional Requirements:**
- ✅ Sellers can view all their orders
- ✅ Sellers can filter orders by status
- ✅ Sellers can accept orders with estimated time
- ✅ Sellers can reject orders with reason
- ✅ Sellers can view order details
- ✅ Dashboard shows order metrics

### **Non-Functional Requirements:**
- ✅ API response time < 500ms
- ✅ Mobile app loads orders in < 2 seconds
- ✅ No breaking changes to existing functionality
- ✅ AdminJS panel remains functional
- ✅ Zero data loss during migration

---

## 13. Next Steps

1. **Get User Approval** for this implementation plan
2. **Schedule Implementation** based on user availability
3. **Prepare Development Environment** (staging server access)
4. **Begin Phase 1** (Database Schema Updates)
5. **Proceed Sequentially** through all phases
6. **Conduct User Acceptance Testing**
7. **Deploy to Production** after successful staging tests

---

**Document Status:** ✅ Ready for Review  
**Approval Required:** YES  
**Estimated Effort:** 7-11 hours  
**Risk Level:** MEDIUM  
**Priority:** HIGH

---

*This document will be updated as implementation progresses.*

