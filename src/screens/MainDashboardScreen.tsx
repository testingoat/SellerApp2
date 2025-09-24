import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const MainDashboardScreen: React.FC = () => {
  console.log('🏠 MainDashboardScreen is rendering!');
  const navigation = useNavigation<any>();
  const [storeOpen, setStoreOpen] = useState(true);

  const summaryData = [
    { label: 'Total Orders', value: '250' },
    { label: 'Revenue', value: '$12,500' },
    { label: 'Pending Orders', value: '15' },
    { label: 'Low Stock Items', value: '8' },
  ];

  const recentOrders = [
    { customer: 'Sarah', orderId: '12345', amount: '$55' },
    { customer: 'David', orderId: '12346', amount: '$78' },
    { customer: 'Emily', orderId: '12347', amount: '$42' },
  ];

  const weeklyData = [
    { day: 'Mon', height: 70 },
    { day: 'Tue', height: 100 },
    { day: 'Wed', height: 20 },
    { day: 'Thu', height: 10 },
    { day: 'Fri', height: 20 },
    { day: 'Sat', height: 50 },
    { day: 'Sun', height: 80 },
  ];

  const handleNotifications = () => {
    navigation.navigate('Notifications' as never);
  };

  const handleSettings = () => {
    navigation.navigate('ProfileSettings' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNotifications}>
            <Icon name="notifications" size={24} color="#1f2937" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Icon name="settings" size={24} color="#1f2937" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Store Status */}
        <View style={styles.storeStatusCard}>
          <View style={styles.storeStatusInfo}>
            <Text style={styles.storeStatusTitle}>Store Status</Text>
            <Text style={styles.storeStatusSubtitle}>
              Store is currently {storeOpen ? 'open' : 'closed'}
            </Text>
          </View>
          <Switch
            value={storeOpen}
            onValueChange={setStoreOpen}
            trackColor={{ false: '#e5e7eb', true: '#3be340' }}
            thumbColor={storeOpen ? '#ffffff' : '#f4f3f4'}
          />
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.summaryGrid}>
            {summaryData.map((item, index) => (
              <View key={index} style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{item.label}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('AddEditProduct')}
            >
              <Text style={styles.primaryButtonText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.secondaryButtonText}>View Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <View style={styles.ordersList}>
            {recentOrders.map((order, index) => (
              <View key={index} style={styles.orderCard}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderCustomer}>Customer: {order.customer}</Text>
                  <Text style={styles.orderId}>Order #{order.orderId}</Text>
                </View>
                <Text style={styles.orderAmount}>{order.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Sales Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Sales Performance</Text>
          <View style={styles.performanceCard}>
            <View style={styles.performanceHeader}>
              <Text style={styles.performanceLabel}>This Week</Text>
              <Text style={styles.performanceValue}>$3,500</Text>
            </View>
            <View style={styles.chartContainer}>
              {weeklyData.map((item, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${item.height}%` }
                    ]}
                  />
                  <Text style={styles.chartLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
  },
  header: {
    backgroundColor: '#f6f8f6',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  storeStatusCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  storeStatusInfo: {
    flex: 1,
  },
  storeStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  storeStatusSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3be340',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '700',
  },
  ordersList: {
    gap: 8,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  performanceHeader: {
    marginBottom: 16,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2937',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 192,
    gap: 8,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartBar: {
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    width: '100%',
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default MainDashboardScreen;
