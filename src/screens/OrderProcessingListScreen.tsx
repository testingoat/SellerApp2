import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface OrderItem {
  id: string;
  time: string;
  status: 'New' | 'Ready' | 'In Progress' | 'Completed' | 'Cancelled';
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: string[];
  total: string;
}

const OrderProcessingListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'new' | 'progress' | 'completed' | 'cancelled'>('new');

  const mockOrders: OrderItem[] = [
    {
      id: '#12345',
      time: '10:30 AM',
      status: 'New',
      customer: {
        name: 'Sarah Chen',
        phone: '(555) 123-4567',
        address: '123 Main St, Anytown',
      },
      items: ['2x Organic Bananas', '1x Almond Milk', '3x Avocados'],
      total: '₹25.50',
    },
    {
      id: '#67890',
      time: '11:15 AM',
      status: 'Ready',
      customer: {
        name: 'David Lee',
        phone: '(555) 987-6543',
        address: '456 Oak Ave, Anytown',
      },
      items: ['1x Whole Milk', '2x Bread Loaves'],
      total: '₹12.30',
    },
  ];

  const handleBack = () => {
    navigation.goBack();
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

  const handleReject = (orderId: string) => {
    console.log('Rejecting order:', orderId);
  };

  const handleAccept = (orderId: string) => {
    console.log('Accepting order:', orderId);
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

  const renderOrderCard = ({ item }: { item: OrderItem }) => (
    <View style={styles.orderCard}>
      {/* Order Header */}
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={styles.orderTime}>{item.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.customerSection}>
        <View style={styles.customerInfo}>
          <View style={styles.customerRow}>
            <Icon name="person" size={20} color="#6b7280" />
            <View style={styles.customerDetails}>
              <Text style={styles.customerName}>{item.customer.name}</Text>
              <Text style={styles.customerPhone}>{item.customer.phone}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => handleCall(item.customer.phone, item.customer)}
          >
            <Icon name="call" size={20} color="#3be340" />
          </TouchableOpacity>
        </View>
        <View style={styles.addressRow}>
          <Icon name="location-on" size={20} color="#6b7280" />
          <Text style={styles.addressText}>{item.customer.address}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items</Text>
        {item.items.map((itemText, index) => (
          <Text key={index} style={styles.itemText}>{itemText}</Text>
        ))}
        <Text style={styles.totalText}>Total: {item.total}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {item.status === 'New' ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleReject(item.id)}
            >
              <Icon name="close" size={20} color="#ef4444" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAccept(item.id)}
            >
              <Icon name="check" size={20} color="white" />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleViewDetails(item.id)}
          >
            <Icon name="visibility" size={20} color="white" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={mockOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
      />


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

});

export default OrderProcessingListScreen;
