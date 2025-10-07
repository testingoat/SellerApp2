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
import { useTheme } from '../context/ThemeContext';
import { withNetworkErrorBoundary } from '../components/NetworkErrorBoundary';

const MainDashboardScreen: React.FC = () => {
  console.log('🏠 MainDashboardScreen is rendering!');
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [storeOpen, setStoreOpen] = useState(true);

  const summaryData = [
    { label: 'Total Orders', value: '250' },
    { label: 'Revenue', value: '₹12,500' },
    { label: 'Pending Orders', value: '15' },
    { label: 'Low Stock Items', value: '8' },
  ];

  const recentOrders = [
    { customer: 'Sarah', orderId: '12345', amount: '₹55' },
    { customer: 'David', orderId: '12346', amount: '₹78' },
    { customer: 'Emily', orderId: '12347', amount: '₹42' },
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar backgroundColor={theme.colors.background} barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerLeft} />
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleNotifications}>
            <Icon name="notifications" size={24} color={theme.colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettings}>
            <Icon name="settings" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coming Soon Overlay */}
        <View style={[styles.comingSoonOverlay, { backgroundColor: theme.colors.background + 'F0' }]}>
          <View style={[styles.comingSoonCard, { backgroundColor: theme.colors.card }]}>
            <Icon name="construction" size={64} color={theme.colors.primary} />
            <Text style={[styles.comingSoonTitle, { color: theme.colors.text }]}>Coming Soon</Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              Dashboard analytics are being prepared for you.
            </Text>
            <Text style={[styles.comingSoonSubtext, { color: theme.colors.textMuted }]}>
              We're working hard to bring you detailed insights and metrics.
            </Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="schedule" size={16} color={theme.colors.primary} />
              <Text style={[styles.comingSoonBadgeText, { color: theme.colors.primary }]}>Available Soon</Text>
            </View>
          </View>
        </View>

        {/* Store Status - Blurred Background */}
        <View style={[styles.storeStatusCard, styles.blurred, { backgroundColor: theme.colors.card }]}>
          <View style={styles.storeStatusInfo}>
            <Text style={[styles.storeStatusTitle, { color: theme.colors.text }]}>Store Status</Text>
            <Text style={[styles.storeStatusSubtitle, { color: theme.colors.textSecondary }]}>
              Store is currently {storeOpen ? 'open' : 'closed'}
            </Text>
          </View>
          <Switch
            value={storeOpen}
            onValueChange={setStoreOpen}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={storeOpen ? '#ffffff' : '#f4f3f4'}
            disabled={true}
          />
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Summary</Text>
          <View style={styles.summaryGrid}>
            {summaryData.map((item, index) => (
              <View key={index} style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('AddEditProduct')}
            >
              <Text style={styles.primaryButtonText}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>View Orders</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Orders</Text>
          <View style={styles.ordersList}>
            {recentOrders.map((order, index) => (
              <View key={index} style={[styles.orderCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.orderInfo}>
                  <Text style={[styles.orderCustomer, { color: theme.colors.text }]}>Customer: {order.customer}</Text>
                  <Text style={[styles.orderId, { color: theme.colors.textSecondary }]}>Order #{order.orderId}</Text>
                </View>
                <Text style={[styles.orderAmount, { color: theme.colors.primary }]}>{order.amount}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Sales Performance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weekly Sales Performance</Text>
          <View style={[styles.performanceCard, { backgroundColor: theme.colors.card }]}>
            <View style={styles.performanceHeader}>
              <Text style={[styles.performanceLabel, { color: theme.colors.textSecondary }]}>This Week</Text>
              <Text style={[styles.performanceValue, { color: theme.colors.text }]}>₹3,500</Text>
            </View>
            <View style={styles.chartContainer}>
              {weeklyData.map((item, index) => (
                <View key={index} style={styles.chartColumn}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${item.height}%`, backgroundColor: theme.colors.primary }
                    ]}
                  />
                  <Text style={[styles.chartLabel, { color: theme.colors.textMuted }]}>{item.day}</Text>
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
    // backgroundColor removed - using theme
  },
  header: {
    // backgroundColor removed - using theme
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
    // color removed - using theme
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
    // backgroundColor removed - using theme
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
    // color removed - using theme
    marginBottom: 4,
  },
  storeStatusSubtitle: {
    fontSize: 14,
    // color removed - using theme
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    // color removed - using theme
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryCard: {
    // backgroundColor removed - using theme
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
    // color removed - using theme
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    // color removed - using theme
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  primaryButton: {
    flex: 1,
    // backgroundColor removed - using theme
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
    // backgroundColor removed - using theme
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    // color removed - using theme
    fontSize: 16,
    fontWeight: '700',
  },
  ordersList: {
    gap: 8,
  },
  orderCard: {
    // backgroundColor removed - using theme
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
    // color removed - using theme
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    // color removed - using theme
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: '700',
    // color removed - using theme
  },
  performanceCard: {
    // backgroundColor removed - using theme
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
    // color removed - using theme
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 32,
    fontWeight: '700',
    // color removed - using theme
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
    // backgroundColor removed - using theme (applied inline)
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    width: '100%',
  },
  chartLabel: {
    fontSize: 12,
    // color removed - using theme
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonCard: {
    // backgroundColor removed - using theme
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 320,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontWeight: '700',
    // color removed - using theme
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    // color removed - using theme
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  comingSoonSubtext: {
    fontSize: 14,
    // color removed - using theme
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor removed - using theme
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  comingSoonBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    // color removed - using theme
  },
  blurred: {
    opacity: 0.3,
  },
});

export default withNetworkErrorBoundary(MainDashboardScreen, {
  showErrorOnOffline: false, // Let banner handle general offline state
});
