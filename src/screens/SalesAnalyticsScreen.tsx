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
      revenue: '$120.50',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOIJU4GsJmy182AvQgvyoWBxaNTD0e_biAiZq_fU6dzQm-ve-9r6lMsRUlLkWW7MEMerSzkGJSD11g438MTK7LHb4ugoAtwZ24y7eyBUy43zSNBEkzpE7rKvDVHiZopy5U99Pu1eia2NXeL-aed8nxmRm6zPF9OrfUV3K1c3uzR4c-GW7G0JjfU7miN-RJ677yFOVps6ohFWXn6boeWpzO-3C2HRP_8ERRLfLewDBZYqDfwxb9crokVFNL5D4yVyQkZWqPMrLoaU4',
    },
    {
      id: '2',
      name: 'Fresh Strawberries',
      unitsSold: 120,
      revenue: '$98.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7mYZ9lvAAPQ5gFEYdietNlR2JbJPg3T0WvPJYXFabTFrRpnIv3Hv60zoSR21baJiugQj8hnY_BL1Tdi2mbIulwwjkN4UARX6dLpzMVMnpqXoik8NXnMQBQ9ZoX7uAwlWiXwHMjeyKcWCume821xSqHJeTBQUET46OyNuHAC56f89gY7OTkuoTi-eSdCujXIGJ_FBDvhwuiHnoYPr3MwX4J9XQBLwjd7xXq02-ylz4FoShF6TamzZXEFM2vlN-oy6MDKWeNp_U_1U',
    },
    {
      id: '3',
      name: 'Whole Milk',
      unitsSold: 100,
      revenue: '$85.20',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADHT76Y0CHlM1U65LKkuQKQO6PLaZc319fiA7l3wGZZvZ_wb7csJR779-6oDIGYKHZCkT_ggnAv3sa7k0vIh9rzrzCT_u-vVb_fBTONW9kpbQTXH9d1shatV4j489Yu6C_DQrkEk8Xia4b4FE2flFuL_y6XjINzq1rwlzV7rsLmReG7sDE9IFqebsMnedY_jNwkMvUnD46bVYquKXePVm8DT0wu9_mLhr5AFzajoOb9_ZlEvtz4IBK7uwWD6hKiLGJ6riDj-hdOas',
    },
  ];

  const categorySales: CategorySale[] = [
    { name: 'Produce', percentage: 80 },
    { name: 'Dairy', percentage: 65 },
    { name: 'Bakery', percentage: 50 },
  ];

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMetricsCards = () => (
    <View style={styles.metricsGrid}>
      <View style={[styles.metricCard, styles.revenueCard]}>
        <Text style={styles.metricLabel}>Total Revenue</Text>
        <Text style={styles.metricValue}>$2,345</Text>
      </View>
      <View style={styles.metricCard}>
        <Text style={styles.metricLabel}>Total Orders</Text>
        <Text style={styles.metricValue}>120</Text>
      </View>
      <View style={[styles.metricCard, styles.fullWidth]}>
        <Text style={styles.metricLabel}>Average Order Value</Text>
        <Text style={styles.metricValue}>$19.54</Text>
      </View>
    </View>
  );

  const renderSalesTrends = () => (
    <View style={styles.chartSection}>
      <Text style={styles.sectionTitle}>Sales Trends</Text>
      <View style={styles.chartContainer}>
        {/* Placeholder for chart - in a real app, you'd use a charting library */}
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>Sales Chart</Text>
          <Text style={styles.chartPlaceholderSubtext}>Chart visualization would go here</Text>
        </View>
        <View style={styles.chartLabels}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <Text key={day} style={styles.chartLabel}>{day}</Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTopProducts = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Selling Products</Text>
      <View style={styles.productsList}>
        {topProducts.map((product) => (
          <View key={product.id} style={styles.productItem}>
            <Image source={{ uri: product.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productUnits}>{product.unitsSold} units sold</Text>
            </View>
            <Text style={styles.productRevenue}>{product.revenue}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCategorySales = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category Sales</Text>
      <View style={styles.categoryList}>
        {categorySales.map((category) => (
          <View key={category.name} style={styles.categoryItem}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${category.percentage}%` }
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
          </View>
        ))}
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
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <Icon name="file-download" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
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
    backgroundColor: '#f6f8f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(246, 248, 246, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
  periodButtonActive: {
    backgroundColor: '#3be340',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(31, 41, 55, 0.6)',
  },
  periodButtonTextActive: {
    color: '#1f2937',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    minWidth: '45%',
  },
  revenueCard: {
    backgroundColor: 'rgba(59, 227, 64, 0.2)',
  },
  fullWidth: {
    minWidth: '100%',
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(31, 41, 55, 0.8)',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  chartSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartContainer: {
    marginTop: 16,
  },
  chartPlaceholder: {
    height: 150,
    backgroundColor: 'rgba(59, 227, 64, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3be340',
  },
  chartPlaceholderSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(31, 41, 55, 0.6)',
  },
  section: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  productUnits: {
    fontSize: 14,
    color: 'rgba(31, 41, 55, 0.6)',
  },
  productRevenue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
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
    color: '#1f2937',
    minWidth: 60,
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3be340',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    minWidth: 40,
    textAlign: 'right',
  },

});

export default SalesAnalyticsScreen;
