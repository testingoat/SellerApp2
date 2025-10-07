import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeTheme } from '../hooks/useSafeTheme';
import { withNetworkErrorBoundary } from '../components/NetworkErrorBoundary';

interface TopProduct {
  id: string;
  name: string;
  unitsSold: number;
  revenue: string;
  image: string;
}

interface CategorySale {
  name: string;
  percentage: number;
}

const SalesAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors, isDarkMode } = useSafeTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'Today' | 'Week' | 'Month' | 'Custom'>('Today');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDownload = () => {
    console.log('Download analytics report');
  };

  const periods = ['Today', 'Week', 'Month', 'Custom'] as const;

  const topProducts: TopProduct[] = [
    {
      id: '1',
      name: 'Organic Bananas',
      unitsSold: 150,
      revenue: '₹120.50',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOIJU4GsJmy182AvQgvyoWBxaNTD0e_biAiZq_fU6dzQm-ve-9r6lMsRUlLkWW7MEMerSzkGJSD11g438MTK7LHb4ugoAtwZ24y7eyBUy43zSNBEkzpE7rKvDVHiZopy5U99Pu1eia2NXeL-aed8nxmRm6zPF9OrfUV3K1c3uzR4c-GW7G0JjfU7miN-RJ677yFOVps6ohFWXn6boeWpzO-3C2HRP_8ERRLfLewDBZYqDfwxb9crokVFNL5D4yVyQkZWqPMrLoaU4',
    },
    {
      id: '2',
      name: 'Fresh Strawberries',
      unitsSold: 120,
      revenue: '₹98.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7mYZ9lvAAPQ5gFEYdietNlR2JbJPg3T0WvPJYXFabTFrRpnIv3Hv60zoSR21baJiugQj8hnY_BL1Tdi2mbIulwwjkN4UARX6dLpzMVMnpqXoik8NXnMQBQ9ZoX7uAwlWiXwHMjeyKcWCume821xSqHJeTBQUET46OyNuHAC56f89gY7OTkuoTi-eSdCujXIGJ_FBDvhwuiHnoYPr3MwX4J9XQBLwjd7xXq02-ylz4FoShF6TamzZXEFM2vlN-oy6MDKWeNp_U_1U',
    },
    {
      id: '3',
      name: 'Whole Milk',
      unitsSold: 100,
      revenue: '₹85.20',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADHT76Y0CHlM1U65LKkuQKQO6PLaZc319fiA7l3wGZZvZ_wb7csJR779-6oDIGYKHZCkT_ggnAv3sa7k0vIh9rzrzCT_u-vVb_fBTONW9kpbQTXH9d1shatV4j489Yu6C_DQrkEk8Xia4b4FE2flFuL_y6XjINzq1rwlzV7rsLmReG7sDE9IFqebsMnedY_jNwkMvUnD46bVYquKXePVm8DT0wu9_mLhr5AFzajoOb9_ZlEvtz4IBK7uwWD6hKiLGJ6riDj-hdOas',
    },
  ];

  const categorySales: CategorySale[] = [
    { name: 'Produce', percentage: 80 },
    { name: 'Dairy', percentage: 65 },
    { name: 'Bakery', percentage: 50 },
  ];

  const renderPeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && { backgroundColor: colors.primary }
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            { color: selectedPeriod === period ? '#000' : colors.textSecondary },
          ]}>
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMetricsCards = () => (
    <View style={styles.metricsGrid}>
      <View style={[styles.metricCard, { backgroundColor: colors.primary + '30' }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>₹2,345</Text>
      </View>
      <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Orders</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>120</Text>
      </View>
      <View style={[styles.metricCard, styles.fullWidth, { backgroundColor: colors.surface }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Average Order Value</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>₹19.54</Text>
      </View>
    </View>
  );

  const renderSalesTrends = () => (
    <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Sales Trends</Text>
      <View style={styles.chartContainer}>
        {/* Placeholder for chart - in a real app, you'd use a charting library */}
        <View style={[styles.chartPlaceholder, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.chartPlaceholderText, { color: colors.primary }]}>Sales Chart</Text>
          <Text style={[styles.chartPlaceholderSubtext, { color: colors.textSecondary }]}>Chart visualization would go here</Text>
        </View>
        <View style={styles.chartLabels}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <Text key={day} style={[styles.chartLabel, { color: colors.textSecondary }]}>{day}</Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTopProducts = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Selling Products</Text>
      <View style={styles.productsList}>
        {topProducts.map((product) => (
          <View key={product.id} style={styles.productItem}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
              <Text style={[styles.productUnits, { color: colors.textSecondary }]}>{product.unitsSold} units sold</Text>
            </View>
            <Text style={[styles.productRevenue, { color: colors.text }]}>{product.revenue}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCategorySales = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Category Sales</Text>
      <View style={styles.categoryList}>
        {categorySales.map((category) => (
          <View key={category.name} style={styles.categoryItem}>
            <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarBackground, { backgroundColor: colors.border }]}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${category.percentage}%`, backgroundColor: colors.primary }
                  ]} 
                />
              </View>
            </View>
            <Text style={[styles.categoryPercentage, { color: colors.text }]}>{category.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background + 'CC' }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Icon name="file-download" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Coming Soon Overlay */}
        <View style={[styles.comingSoonOverlay, { backgroundColor: colors.background + 'F0' }]}>
          <View style={[styles.comingSoonCard, { backgroundColor: colors.card }]}>
            <Icon name="analytics" size={64} color={colors.primary} />
            <Text style={[styles.comingSoonTitle, { color: colors.text }]}>Coming Soon</Text>
            <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
              Advanced analytics and insights are on the way!
            </Text>
            <Text style={[styles.comingSoonSubtext, { color: colors.textSecondary }]}>
              We're building powerful analytics tools to help you understand your business better.
            </Text>
            <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="schedule" size={16} color={colors.primary} />
              <Text style={[styles.comingSoonBadgeText, { color: colors.primary }]}>Available Soon</Text>
            </View>
          </View>
        </View>

        <View style={[styles.content, styles.blurred]}>
          {renderPeriodSelector()}
          {renderMetricsCards()}
          {renderSalesTrends()}
          {renderTopProducts()}
          {renderCategorySales()}
        </View>
      </ScrollView>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backdropFilter: 'blur(10px)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  downloadButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    height: 48,
    alignItems: 'center',
  },
  periodButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metricCard: {
    borderRadius: 8,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  fullWidth: {
    minWidth: '100%',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  chartSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 16,
  },
  chartPlaceholder: {
    height: 150,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    marginTop: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  productsList: {
    gap: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productUnits: {
    fontSize: 14,
  },
  productRevenue: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 60,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
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
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  comingSoonSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  comingSoonBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  blurred: {
    opacity: 0.3,
  },
});

export default withNetworkErrorBoundary(SalesAnalyticsScreen, {
  showErrorOnOffline: false, // Let banner handle general offline state
});
