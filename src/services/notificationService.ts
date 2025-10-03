import { httpClient } from './httpClient';
import { API_ENDPOINTS } from '../config';

export interface SellerNotification {
  _id: string;
  title: string;
  message?: string;
  type?: 'order' | 'stock' | 'payment' | 'system' | 'update' | string;
  icon?: string;
  isRead: boolean;
  sellerId: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  notifications: SellerNotification[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class NotificationService {
  async getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
    const query = `?page=${page}&limit=${limit}`;
    const result = await httpClient.get<any>(`${API_ENDPOINTS.NOTIFICATIONS}${query}`);

    // Handle both shapes: { success, data: { ... } } or { notifications, ... }
    const payload = result?.data || result;

    return {
      notifications: payload.notifications || [],
      unreadCount: payload.unreadCount ?? 0,
      pagination: payload.pagination,
    };
  }

  async markAsRead(id: string): Promise<boolean> {
    const url = API_ENDPOINTS.NOTIFICATION_MARK_READ.replace(':id', id);
    const result = await httpClient.put<any>(url, {});
    return result?.success ?? true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const url = API_ENDPOINTS.NOTIFICATION_DELETE.replace(':id', id);
    const result = await httpClient.delete<any>(url);
    return result?.success ?? true;
  }

  async markAllRead(): Promise<boolean> {
    const result = await httpClient.put<any>(API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ, {});
    return result?.success ?? true;
  }
}

export const notificationService = new NotificationService();
