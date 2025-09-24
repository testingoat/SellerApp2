import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

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
  const orderId = route.params?.orderId || '#12345';

  const timelineSteps: TimelineStep[] = [
    {
      id: '1',
      title: 'Order Placed',
      time: '10:00 AM',
      icon: 'inventory-2',
      completed: true,
      active: false,
    },
    {
      id: '2',
      title: 'Order Accepted',
      time: '10:15 AM',
      icon: 'done',
      completed: true,
      active: false,
    },
    {
      id: '3',
      title: 'In Transit',
      time: '10:45 AM',
      icon: 'local-shipping',
      completed: true,
      active: true,
    },
    {
      id: '4',
      title: 'Delivered',
      time: 'Pending',
      icon: 'home',
      completed: false,
      active: false,
    },
    {
      id: '5',
      title: 'Completed',
      time: 'Pending',
      icon: 'check-circle',
      completed: false,
      active: false,
    },
  ];

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
        <Text style={styles.headerTitle}>Order {orderId}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.timeline}>
            {timelineSteps.map((step, index) => renderTimelineStep(step, index))}
          </View>
        </View>
      </ScrollView>

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
});

export default OrderTimelineScreen;
