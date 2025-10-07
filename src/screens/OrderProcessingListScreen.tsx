import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { orderService, Order } from '../services/orderService';
import { useTheme } from '../context/ThemeContext';
import { withNetworkErrorBoundary } from '../components/NetworkErrorBoundary';

const OrderProcessingListScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'new' | 'progress' | 'completed' | 'cancelled'>('new');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  // Fetch orders when component mounts or tab changes
  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusFilter = getStatusFilter();
      const response = await orderService.getOrders(1, 50, statusFilter);

      setOrders(response.orders || []);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders');
      Alert.alert('Error', err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getStatusFilter = (): string => {
    switch (activeTab) {
      case 'new':
        return 'pending_seller_approval';
      case 'progress':
        return 'available,confirmed,arriving';
      case 'completed':
        return 'delivered';
      case 'cancelled':
        return 'cancelled,seller_rejected';
      default:
        return '';
    }
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order._id?.toLowerCase().includes(query) ||
        order.customer?.name?.toLowerCase().includes(query) ||
        order.customer?.phone?.includes(query) ||
        order.totalAmount?.toString().includes(query)
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);

        switch (dateFilter) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return (b.totalAmount || 0) - (a.totalAmount || 0);
      }
    });

    return filtered;
  }, [orders, searchQuery, dateFilter, sortBy]);

  const handleBack = () => {
    navigation.goBack();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('all');
    setSortBy('date');
    setShowFilterModal(false);
  };

  const handleCall = (phone: string, customer: any) => {
    navigation.navigate('CustomerCommunication' as never, {
      customer: {
        name: customer.name,
        phone: phone,
        orderId: '#12345',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDJBqFh46510iKZFPrdLzARQWIS4Rkzyzl0mHywgmmQDw-11DSk_sUqvvPd7GJfJ_hSArIQDMXDXJ5zLqlpPdy4EJpHZFxy6FtSGFVAWZ2yxRM69rwijXCYO00nEvaiWwZ0WI2GZSItefDbghccRPEhFVQbvMU_WfIEvvvcRT2mbiZ75a6xdlfNWxNN2jOKvO9JW4SM93_YhilH6gujkiB5uSaorK78chpihBg_XURZUIA5E8-b0PP8jNyQgcF45mLn6wkCqAnNp08'
      }
    });
  };

  const handleReject = async (orderId: string) => {
    Alert.prompt(
      'Reject Order',
      'Please provide a reason for rejection:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason || reason.trim().length === 0) {
              Alert.alert('Error', 'Please provide a rejection reason');
              return;
            }

            try {
              await orderService.rejectOrder(orderId, reason);
              Alert.alert('Success', 'Order rejected successfully');
              fetchOrders(); // Refresh the list
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject order');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleAccept = async (orderId: string) => {
    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              await orderService.acceptOrder(orderId);
              Alert.alert('Success', 'Order accepted successfully');
              fetchOrders(); // Refresh the list
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to accept order');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (orderId: string) => {
    navigation.navigate('OrderTimeline' as never, { orderId });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return '#f97316';
      case 'Ready': return '#22c55e';
      case 'In Progress': return '#3b82f6';
      case 'Completed': return '#10b981';
      case 'Cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'New': return 'rgba(249, 115, 22, 0.2)';
      case 'Ready': return 'rgba(34, 197, 94, 0.2)';
      case 'In Progress': return 'rgba(59, 130, 246, 0.2)';
      case 'Completed': return 'rgba(16, 185, 129, 0.2)';
      case 'Cancelled': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  };

  const tabs = [
    { key: 'new', label: 'New Orders' },
    { key: 'progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatPrice = (price: number): string => {
    return `₹${price.toFixed(2)}`;
  };

  const getDisplayStatus = (order: Order): string => {
    return orderService.formatOrderStatus(order.status);
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <View style={[styles.orderCard, { backgroundColor: theme.colors.card }]}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={[styles.orderId, { color: theme.colors.text }]}>#{item.orderId}</Text>
          <Text style={[styles.orderTime, { color: theme.colors.textSecondary }]}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: orderService.getStatusColor(item.status) + '33' }]}>
          <Text style={[styles.statusText, { color: orderService.getStatusColor(item.status) }]}>
            {getDisplayStatus(item)}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <View style={styles.customerRow}>
            <Icon name="person" size={20} color={theme.colors.textMuted} />
            <View style={styles.customerDetails}>
              <Text style={[styles.customerName, { color: theme.colors.text }]}>{item.customer.name}</Text>
              <Text style={[styles.customerPhone, { color: theme.colors.textSecondary }]}>{item.customer.phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.callButton, { backgroundColor: theme.colors.primary + '20' }]}
            onPress={() => handleCall(item.customer.phone, item.customer)}
          >
            <Icon name="call" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.addressRow}>
          <Icon name="location-on" size={20} color={theme.colors.textMuted} />
          <Text style={[styles.addressText, { color: theme.colors.textSecondary }]}>{item.deliveryLocation.address || 'No address provided'}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsSection}>
        <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>Items</Text>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={[styles.itemText, { color: theme.colors.textSecondary }]}>
            {orderItem.count}x {orderItem.item.name} - {formatPrice(orderItem.item.price)}
          </Text>
        ))}
        <Text style={[styles.totalText, { color: theme.colors.text }]}>Total: {formatPrice(item.totalPrice)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {item.status === 'pending_seller_approval' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }]}
              onPress={() => handleReject(item._id)}
            >
              <Icon name="close" size={20} color={theme.colors.error} />
              <Text style={[styles.rejectButtonText, { color: theme.colors.error }]}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleAccept(item._id)}
            >
              <Icon name="check" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => handleViewDetails(item._id)}
          >
            <Icon name="visibility" size={20} color="white" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: theme.colors.background }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.activeTab, { backgroundColor: theme.colors.primary }]
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              { color: theme.colors.textMuted },
              activeTab === tab.key && [styles.activeTabText, { color: '#fff' }]
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and Filter Bar */}
      <View style={[styles.searchFilterContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Icon name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="Search by order ID, customer, phone..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { 
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border 
          }]}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon name="filter-list" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Active Filters Display */}
      {(dateFilter !== 'all' || sortBy !== 'date') && (
        <View style={[styles.activeFiltersContainer, { backgroundColor: theme.colors.primary + '10' }]}>
          <Text style={[styles.activeFiltersText, { color: theme.colors.text }]}>
            Filters: {dateFilter !== 'all' && `${dateFilter} • `}
            {sortBy === 'amount' && 'Sorted by amount'}
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={[styles.clearFiltersText, { color: theme.colors.primary }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.colors.primary }]} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={64} color={theme.colors.textMuted} />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {searchQuery || dateFilter !== 'all' ? 'No matching orders found' : 'No orders found'}
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            {searchQuery || dateFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Orders will appear here when customers place them'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Date Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Date Range</Text>
              <View style={styles.filterOptions}>
                {['all', 'today', 'week', 'month'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                      dateFilter === option && [styles.filterOptionActive, { backgroundColor: theme.colors.primary }]
                    ]}
                    onPress={() => setDateFilter(option as any)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: theme.colors.text },
                      dateFilter === option && [styles.filterOptionTextActive, { color: '#fff' }]
                    ]}>
                      {option === 'all' ? 'All Time' : option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Sort By</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'amount', label: 'Amount' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
                      sortBy === option.key && [styles.filterOptionActive, { backgroundColor: theme.colors.primary }]
                    ]}
                    onPress={() => setSortBy(option.key as any)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: theme.colors.text },
                      sortBy === option.key && [styles.filterOptionTextActive, { color: '#fff' }]
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={clearFilters}
              >
                <Text style={[styles.clearButtonText, { color: theme.colors.text }]}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 32,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f6f8f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3be340',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3be340',
  },
  ordersList: {
    padding: 16,
    paddingBottom: 16,
    gap: 16,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  orderTime: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  customerSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerDetails: {
    gap: 2,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  customerPhone: {
    fontSize: 14,
    color: '#6b7280',
  },
  callButton: {
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  itemText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'right',
    marginTop: 8,
  },
  actionsSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  acceptButton: {
    backgroundColor: '#3be340',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  viewButton: {
    backgroundColor: '#3be340',
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  // Search and Filter styles
  searchFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    padding: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  activeFiltersText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '500',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#3be340',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#3be340',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#15803d',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  applyButton: {
    backgroundColor: '#3be340',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112112',
  },

});

export default withNetworkErrorBoundary(OrderProcessingListScreen, {
  showErrorOnOffline: false, // Let banner handle general offline state
});
