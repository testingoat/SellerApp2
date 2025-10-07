import { httpClient } from './httpClient';
import { offlineCacheService } from './offlineCacheService';
import NetInfo from '@react-native-community/netinfo';

// ============================================================================
// ORDER INTERFACES
// ============================================================================

/**
 * Order item interface matching server API
 */
export interface OrderItem {
  _id: string;
  item: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  count: number;
}

/**
 * Customer information interface
 */
export interface OrderCustomer {
  _id: string;
  name: string;
  phone: string;
  address?: string;
}

/**
 * Branch information interface
 */
export interface OrderBranch {
  _id: string;
  name: string;
  address: string;
}

/**
 * Location interface for delivery and pickup
 */
export interface OrderLocation {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Seller response tracking interface
 */
export interface SellerResponse {
  status: 'pending' | 'accepted' | 'rejected';
  responseTime?: string;
  rejectionReason?: string;
}

/**
 * Order status type
 */
export type OrderStatus = 
  | 'pending_seller_approval'
  | 'seller_rejected'
  | 'available'
  | 'confirmed'
  | 'arriving'
  | 'delivered'
  | 'cancelled';

/**
 * Complete order interface matching server API
 */
export interface Order {
  _id: string;
  orderId: string;
  customer: OrderCustomer;
  branch: OrderBranch;
  seller: string;
  items: OrderItem[];
  deliveryLocation: OrderLocation;
  pickupLocation: OrderLocation;
  status: OrderStatus;
  sellerResponse: SellerResponse;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  deliveryPartner?: {
    _id: string;
    name: string;
    phone: string;
  };
}

/**
 * Response interface for paginated orders list
 */
export interface OrdersResponse {
  orders: Order[];
  totalOrders: number;
  totalPages: number;
  currentPage: number;
}

/**
 * Response interface for pending orders
 */
export interface PendingOrdersResponse {
  orders: Order[];
}

/**
 * Response interface for order actions (accept/reject)
 */
export interface OrderActionResponse {
  message: string;
  order: Order;
}

// ============================================================================
// ORDER SERVICE CLASS
// ============================================================================

class OrderService {
  /**
   * Get all orders for the authenticated seller with pagination and filtering
   * 
   * @param page - Page number (default: 1)
   * @param limit - Number of orders per page (default: 10)
   * @param status - Filter by order status (optional)
   * @returns Promise with orders list and pagination info
   */
  async getOrders(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<OrdersResponse> {
    try {
      console.log('📦 OrderService: Fetching orders...', { page, limit, status });

      // Check network connectivity
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected && netState.isInternetReachable;

      // If offline, try to return cached data (only for first page, all statuses)
      if (!isOnline && page === 1 && !status) {
        console.log('📴 OrderService: Offline - attempting to load from cache...');
        const cachedOrders = await offlineCacheService.getCachedOrders();

        if (cachedOrders) {
          const cacheAge = await offlineCacheService.getCacheAge('@offline_cache_orders');
          console.log(`✅ OrderService: Loaded ${cachedOrders.length} orders from cache (${cacheAge} min old)`);
          return {
            orders: cachedOrders,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalOrders: cachedOrders.length,
              ordersPerPage: cachedOrders.length
            }
          };
        }
      }

      // Build query parameters
      const params: any = { page, limit };
      if (status) {
        params.status = status;
      }

      const response = await httpClient.get<OrdersResponse>(
        '/seller/orders',
        { params }
      );

      console.log(`✅ OrderService: Retrieved ${response.orders?.length || 0} orders`);

      // Cache orders for offline use (only first page, all statuses)
      if (response.orders && page === 1 && !status) {
        await offlineCacheService.cacheOrders(response.orders);
        console.log('💾 OrderService: Orders cached for offline use');
      }

      return response;
    } catch (error: any) {
      console.error('❌ OrderService: Failed to get orders:', error);

      // On error, try to return cached data as fallback (only for first page, all statuses)
      if (page === 1 && !status) {
        const cachedOrders = await offlineCacheService.getCachedOrders();
        if (cachedOrders) {
          const cacheAge = await offlineCacheService.getCacheAge('@offline_cache_orders');
          console.log(`⚠️ OrderService: API failed, using cached data (${cacheAge} min old)`);
          return {
            orders: cachedOrders,
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalOrders: cachedOrders.length,
              ordersPerPage: cachedOrders.length
            }
          };
        }
      }

      throw new Error(error.message || 'Failed to retrieve orders');
    }
  }

  /**
   * Get pending orders awaiting seller approval
   * 
   * @returns Promise with list of pending orders
   */
  async getPendingOrders(): Promise<PendingOrdersResponse> {
    try {
      console.log('⏳ OrderService: Fetching pending orders...');
      
      const response = await httpClient.get<PendingOrdersResponse>(
        '/seller/orders/pending'
      );

      console.log(`✅ OrderService: Retrieved ${response.orders?.length || 0} pending orders`);
      
      return response;
    } catch (error: any) {
      console.error('❌ OrderService: Failed to get pending orders:', error);
      throw new Error(error.message || 'Failed to retrieve pending orders');
    }
  }

  /**
   * Accept an order
   * 
   * @param orderId - The ID of the order to accept
   * @param estimatedTime - Optional estimated preparation time in minutes
   * @returns Promise with success message and updated order
   */
  async acceptOrder(
    orderId: string,
    estimatedTime?: number
  ): Promise<OrderActionResponse> {
    try {
      console.log('✅ OrderService: Accepting order:', orderId);
      
      const data: any = {};
      if (estimatedTime) {
        data.estimatedTime = estimatedTime;
      }

      const response = await httpClient.post<OrderActionResponse>(
        `/seller/orders/${orderId}/accept`,
        data
      );

      console.log('✅ OrderService: Order accepted successfully');
      
      return response;
    } catch (error: any) {
      console.error('❌ OrderService: Failed to accept order:', error);
      throw new Error(error.message || 'Failed to accept order');
    }
  }

  /**
   * Reject an order with a reason
   * 
   * @param orderId - The ID of the order to reject
   * @param reason - Reason for rejection (required)
   * @returns Promise with success message and updated order
   */
  async rejectOrder(
    orderId: string,
    reason: string
  ): Promise<OrderActionResponse> {
    try {
      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      console.log('❌ OrderService: Rejecting order:', orderId);
      
      const response = await httpClient.post<OrderActionResponse>(
        `/seller/orders/${orderId}/reject`,
        { reason: reason.trim() }
      );

      console.log('✅ OrderService: Order rejected successfully');
      
      return response;
    } catch (error: any) {
      console.error('❌ OrderService: Failed to reject order:', error);
      throw new Error(error.message || 'Failed to reject order');
    }
  }

  /**
   * Get a single order by ID
   * Helper method to fetch specific order details
   * 
   * @param orderId - The ID of the order to fetch
   * @returns Promise with order details or null if not found
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      console.log('🔍 OrderService: Fetching order by ID:', orderId);
      
      // Fetch all orders and find the specific one
      const response = await this.getOrders(1, 100);
      const order = response.orders.find(o => o._id === orderId || o.orderId === orderId);
      
      if (order) {
        console.log('✅ OrderService: Order found');
      } else {
        console.log('⚠️ OrderService: Order not found');
      }
      
      return order || null;
    } catch (error: any) {
      console.error('❌ OrderService: Failed to get order by ID:', error);
      throw new Error(error.message || 'Failed to retrieve order');
    }
  }

  /**
   * Helper method to format order status for display
   */
  formatOrderStatus(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      'pending_seller_approval': 'Pending Approval',
      'seller_rejected': 'Rejected',
      'available': 'Available for Pickup',
      'confirmed': 'Confirmed',
      'arriving': 'Out for Delivery',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };

    return statusMap[status] || status;
  }

  /**
   * Helper method to get status color for UI
   */
  getStatusColor(status: OrderStatus): string {
    const colorMap: Record<OrderStatus, string> = {
      'pending_seller_approval': '#f97316',
      'seller_rejected': '#ef4444',
      'available': '#3b82f6',
      'confirmed': '#22c55e',
      'arriving': '#8b5cf6',
      'delivered': '#10b981',
      'cancelled': '#6b7280',
    };

    return colorMap[status] || '#6b7280';
  }
}

// Export singleton instance
export const orderService = new OrderService();

// Export class for testing
export { OrderService };

