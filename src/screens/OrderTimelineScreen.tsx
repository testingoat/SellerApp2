import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { orderService, Order } from '../services/orderService';

interface TimelineStep {
  id: string;
  title: string;
  time: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

const OrderTimelineScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route.params?.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const orderData = await orderService.getOrderById(orderId);

      if (orderData) {
        setOrder(orderData);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const generateTimeline = (order: Order): TimelineStep[] => {
    const steps: TimelineStep[] = [];

    // Step 1: Order Placed
    steps.push({
      id: '1',
      title: 'Order Placed',
      time: formatTime(order.createdAt),
      icon: 'inventory-2',
      completed: true,
      active: false,
    });

    // Step 2: Order Accepted/Rejected
    if (order.sellerResponse.status === 'accepted') {
      steps.push({
        id: '2',
        title: 'Order Accepted',
        time: order.sellerResponse.responseTime ? formatTime(order.sellerResponse.responseTime) : 'Pending',
        icon: 'done',
        completed: true,
        active: order.status === 'available',
      });
    } else if (order.sellerResponse.status === 'rejected') {
      steps.push({
        id: '2',
        title: 'Order Rejected',
        time: order.sellerResponse.responseTime ? formatTime(order.sellerResponse.responseTime) : 'Pending',
        icon: 'close',
        completed: true,
        active: false,
      });
      return steps; // Stop here if rejected
    } else {
      steps.push({
        id: '2',
        title: 'Awaiting Acceptance',
        time: 'Pending',
        icon: 'schedule',
        completed: false,
        active: true,
      });
      return steps; // Stop here if pending
    }

    // Step 3: Confirmed
    if (order.status === 'confirmed' || order.status === 'arriving' || order.status === 'delivered') {
      steps.push({
        id: '3',
        title: 'Order Confirmed',
        time: formatTime(order.updatedAt),
        icon: 'check-circle',
        completed: true,
        active: order.status === 'confirmed',
      });
    } else {
      steps.push({
        id: '3',
        title: 'Order Confirmed',
        time: 'Pending',
        icon: 'check-circle',
        completed: false,
        active: false,
      });
    }

    // Step 4: In Transit
    if (order.status === 'arriving' || order.status === 'delivered') {
      steps.push({
        id: '4',
        title: 'In Transit',
        time: formatTime(order.updatedAt),
        icon: 'local-shipping',
        completed: true,
        active: order.status === 'arriving',
      });
    } else {
      steps.push({
        id: '4',
        title: 'In Transit',
        time: 'Pending',
        icon: 'local-shipping',
        completed: false,
        active: false,
      });
    }

    // Step 5: Delivered
    if (order.status === 'delivered') {
      steps.push({
        id: '5',
        title: 'Delivered',
        time: formatTime(order.updatedAt),
        icon: 'home',
        completed: true,
        active: true,
      });
    } else {
      steps.push({
        id: '5',
        title: 'Delivered',
        time: 'Pending',
        icon: 'home',
        completed: false,
        active: false,
      });
    }

    return steps;
  };

  const timelineSteps: TimelineStep[] = order ? generateTimeline(order) : [];

  const handleBack = () => {
    navigation.goBack();
  };

  const renderTimelineStep = (step: TimelineStep, index: number) => {
    const isLast = index === timelineSteps.length - 1;
    
    return (
      <View key={step.id} style={styles.timelineRow}>
        <View style={styles.timelineLeft}>
          <View style={[
            styles.timelineIcon,
            step.completed && styles.timelineIconCompleted,
            step.active && styles.timelineIconActive,
          ]}>
            <Icon 
              name={step.icon} 
              size={16} 
              color={step.completed ? 'white' : '#3be340'} 
            />
          </View>
          {!isLast && (
            <View style={[
              styles.timelineLine,
              step.completed && styles.timelineLineCompleted,
            ]} />
          )}
        </View>
        <View style={styles.timelineRight}>
          <Text style={[
            styles.timelineTitle,
            !step.completed && styles.timelineTitlePending,
          ]}>
            {step.title}
          </Text>
          <Text style={[
            styles.timelineTime,
            !step.completed && styles.timelineTimePending,
          ]}>
            {step.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order?.orderId || orderId}</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : order ? (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Order Info Card */}
            <View style={styles.orderInfoCard}>
              <Text style={styles.orderInfoTitle}>Order Details</Text>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Customer:</Text>
                <Text style={styles.orderInfoValue}>{order.customer.name}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Phone:</Text>
                <Text style={styles.orderInfoValue}>{order.customer.phone}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Total:</Text>
                <Text style={styles.orderInfoValue}>₹{order.totalPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Status:</Text>
                <Text style={[styles.orderInfoValue, { color: orderService.getStatusColor(order.status) }]}>
                  {orderService.formatOrderStatus(order.status)}
                </Text>
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timeline}>
              {timelineSteps.map((step, index) => renderTimelineStep(step, index))}
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MainDashboard' as never)}>
          <Icon name="dashboard" size={24} color="#6b7280" />
          <Text style={styles.navText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProductList' as never)}>
          <Icon name="inventory" size={24} color="#6b7280" />
          <Text style={styles.navText}>Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <View style={styles.activeNavIcon}>
            <Icon name="receipt-long" size={24} color="#3be340" />
          </View>
          <Text style={[styles.navText, styles.activeNavText]}>Orders</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('SalesAnalytics' as never)}>
          <Icon name="bar-chart" size={24} color="#6b7280" />
          <Text style={styles.navText}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ProfileSettings' as never)}>
          <Icon name="person" size={24} color="#6b7280" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 227, 64, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
    paddingRight: 40,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconCompleted: {
    backgroundColor: '#3be340',
  },
  timelineIconActive: {
    backgroundColor: '#3be340',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(59, 227, 64, 0.3)',
    marginTop: 8,
    marginBottom: 8,
  },
  timelineLineCompleted: {
    backgroundColor: 'rgba(59, 227, 64, 0.3)',
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 32,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  timelineTitlePending: {
    color: 'rgba(31, 41, 55, 0.4)',
  },
  timelineTime: {
    fontSize: 14,
    color: 'rgba(31, 41, 55, 0.6)',
  },
  timelineTimePending: {
    color: 'rgba(31, 41, 55, 0.4)',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f6f8f6',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 227, 64, 0.2)',
    paddingVertical: 8,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    flex: 1,
  },
  activeNavItem: {
    // Active state styling handled by activeNavIcon and activeNavText
  },
  activeNavIcon: {
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeNavText: {
    color: '#3be340',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  orderInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
});

export default OrderTimelineScreen;
