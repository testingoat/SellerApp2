import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { productService, Product, Category } from '../services/productService';
import { useAuthStore } from '../state/authStore';
import { MainStackParamList } from '../config/navigationTypes';
import { useSafeTheme } from '../hooks/useSafeTheme';
import { withNetworkErrorBoundary } from '../components/NetworkErrorBoundary';
import { ProductListSkeleton } from '../components/SkeletonLoader';
import { ProductCard } from '../components/ProductCard';
import { useHaptic } from '../hooks/useHaptic';

type ProductListNavigationProp = StackNavigationProp<MainStackParamList>;

interface ProductListScreenProps {
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onBack?: () => void;
}

const ProductListScreen: React.FC<ProductListScreenProps> = ({
  onAddProduct,
  onEditProduct,
  onBack,
}) => {
  const navigation = useNavigation<ProductListNavigationProp>();
  const { user, token, isAuthenticated } = useAuthStore();
  const { colors, isDarkMode } = useSafeTheme();
  const { triggerSuccess, triggerError, triggerLight } = useHaptic();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get filter options with counts
  const getFilterOptions = () => {
    const stats = productService.getProductStats(products);
    return [
      { key: 'all', label: 'All', count: stats.total },
      { key: 'pending', label: 'Pending', count: stats.pending },
      { key: 'approved', label: 'Approved', count: stats.approved },
      { key: 'rejected', label: 'Rejected', count: stats.rejected },
      { key: 'active', label: 'Active', count: stats.active },
      { key: 'inactive', label: 'Inactive', count: stats.inactive },
    ];
  };

  // Load initial data
  const loadData = async () => {
    if (!token || !isAuthenticated) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    // Safety timeout to prevent infinite loading (30 seconds)
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ ProductListScreen: Loading timeout - forcing loading state to false');
      setLoading(false);
      setError('Loading timed out. Please try again.');
    }, 30000);

    try {
      setError(null);
      setLoading(true);

      console.log('🔄 ProductListScreen: Loading initial data...');
      const [productsResponse, categoriesResponse] = await Promise.all([
        productService.getSellerProducts(),
        productService.getCategories()
      ]);

      // Clear timeout if successful
      clearTimeout(loadingTimeout);

      if (productsResponse.success && productsResponse.data) {
        console.log(`✅ ProductListScreen: Loaded ${productsResponse.data.length} products`);

        // Debug: Log product statuses
        productsResponse.data.forEach(product => {
          console.log(`📦 Product "${product.name}": status = "${product.status}"`);
        });

        setProducts(productsResponse.data);
      } else {
        throw new Error(productsResponse.message || 'Failed to load products');
      }

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories([{ _id: 'all', name: 'All', image: '' }, ...categoriesResponse.data]);
      } else {
        throw new Error(categoriesResponse.message || 'Failed to load categories');
      }
    } catch (err) {
      // Clear timeout on error
      clearTimeout(loadingTimeout);

      console.error('Error loading data:', err);
      console.log('Using mock data for development');

      // Use mock data when API is not available
      const mockProducts: Product[] = [
        {
          _id: '1',
          name: 'Organic Apples',
          price: 2.99,
          discountPrice: 2.49,
          quantity: '1 lb',
          category: { _id: 'cat1', name: 'Fruits' },
          description: 'Fresh organic apples',
          stock: 50,
          image: 'https://via.placeholder.com/150x150?text=Apple',
          isActive: true,
          approvalStatus: 'approved',
          rejectionReason: undefined,
          sellerId: 'seller1',
          sellerName: 'Fresh Farm Store',
          createdBy: 'seller',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Fresh Carrots',
          price: 1.49,
          quantity: '1 bunch',
          category: { _id: 'cat2', name: 'Vegetables' },
          description: 'Fresh carrots from local farm',
          stock: 30,
          image: 'https://via.placeholder.com/150x150?text=Carrot',
          isActive: true,
          status: 'pending',
          sellerId: 'seller1',
          sellerName: 'Fresh Farm Store',
          createdBy: 'seller',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '3',
          name: 'Whole Milk',
          price: 3.79,
          quantity: '1 gallon',
          category: { _id: 'cat3', name: 'Dairy' },
          description: 'Fresh whole milk',
          stock: 0,
          image: 'https://via.placeholder.com/150x150?text=Milk',
          isActive: false,
          status: 'rejected',
          rejectionReason: 'Quality standards not met',
          sellerId: 'seller1',
          sellerName: 'Fresh Farm Store',
          createdBy: 'seller',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const mockCategories: Category[] = [
        { _id: 'all', name: 'All', image: '' },
        { _id: 'cat1', name: 'Fruits', image: 'https://via.placeholder.com/50x50?text=🍎' },
        { _id: 'cat2', name: 'Vegetables', image: 'https://via.placeholder.com/50x50?text=🥕' },
        { _id: 'cat3', name: 'Dairy', image: 'https://via.placeholder.com/50x50?text=🥛' },
      ];

      setProducts(mockProducts);
      setCategories(mockCategories);
      setError('Using demo data - API not available');
    } finally {
      // Always clear timeout and loading state
      clearTimeout(loadingTimeout);
      setLoading(false);
      console.log('✅ ProductListScreen: Loading complete, loading state set to false');
    }
  };

  // Refresh data
  const refreshData = async () => {
    if (!token || !isAuthenticated) return;

    try {
      setRefreshing(true);
      setError(null);

      console.log('🔄 ProductListScreen: Refreshing products data...');
      const productsResponse = await productService.getSellerProducts();

      if (productsResponse.success && productsResponse.data) {
        console.log(`✅ ProductListScreen: Received ${productsResponse.data.length} products`);

        // Debug: Log product statuses
        productsResponse.data.forEach(product => {
          console.log(`📦 Product "${product.name}": status = "${product.status}"`);
        });

        setProducts(productsResponse.data);
        console.log('✅ ProductListScreen: Products state updated successfully');
      } else {
        throw new Error(productsResponse.message || 'Failed to refresh products');
      }
    } catch (err) {
      console.error('❌ ProductListScreen: Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category?.name?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || (
      selectedStatus === 'pending' && product.status === 'pending' ||
      selectedStatus === 'approved' && product.status === 'approved' ||
      selectedStatus === 'rejected' && product.status === 'rejected' ||
      selectedStatus === 'active' && product.status === 'approved' && product.isActive === true ||
      selectedStatus === 'inactive' && product.status === 'approved' && product.isActive === false
    );
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle product active status
  const toggleProductStatus = async (product: Product) => {
    if (!token || !isAuthenticated) return;

    triggerLight(); // Haptic feedback for toggle

    try {
      const response = await productService.toggleProductStatus(
        product._id,
        !product.isActive
      );

      if (response.success) {
        triggerSuccess(); // Haptic feedback for successful toggle
        setProducts(prev =>
          prev.map(p => p._id === product._id ? { ...p, isActive: !p.isActive } : p)
        );
      } else {
        triggerError(); // Haptic feedback for error
        throw new Error(response.message || 'Failed to update product status');
      }
    } catch (err) {
      triggerError(); // Haptic feedback for error
      console.error('Error toggling product status:', err);
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  // Load data on mount and when screen is focused
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (isInitialLoad) {
      loadData();
      setIsInitialLoad(false);
    }
  }, [token, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      // Only refresh if not initial load
      if (token && isAuthenticated && !isInitialLoad) {
        refreshData();
      }
    }, [token, isAuthenticated, isInitialLoad])
  );

  // Memoize handlers to prevent unnecessary re-renders
  const handleAddProduct = useCallback(() => {
    triggerLight(); // Haptic feedback for button press
    if (onAddProduct) {
      onAddProduct();
    } else {
      navigation.navigate('AddEditProduct', {});
    }
  }, [onAddProduct, navigation, triggerLight]);

  const handleEditProduct = useCallback((product: Product) => {
    triggerLight(); // Haptic feedback for button press
    if (onEditProduct) {
      onEditProduct(product);
    } else {
      navigation.navigate('AddEditProduct', { product });
    }
  }, [onEditProduct, navigation, triggerLight]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  }, [onBack, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Products</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshData}
          disabled={refreshing}
        >
          <Icon
            name="refresh"
            size={24}
            color={refreshing ? colors.textSecondary : colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.card, 
              color: colors.text,
              shadowColor: isDarkMode ? '#000' : '#000',
            }]}
            placeholder="Search products"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
          {getFilterOptions().map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: selectedStatus === option.key ? colors.primary : colors.card, 
                  borderColor: selectedStatus === option.key ? colors.primary : colors.border 
                }
              ]}
              onPress={() => setSelectedStatus(option.key as any)}
            >
              <Text style={[
                styles.categoryButtonText,
                { 
                  color: selectedStatus === option.key ? '#000' : colors.textSecondary,
                  fontWeight: selectedStatus === option.key ? '600' : '500'
                }
              ]}>
                {option.label} ({option.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
          contentContainerStyle={styles.categoryContent}
        >
        {categories.map((category) => (
            <TouchableOpacity
              key={category._id || category.name}
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: selectedCategory === category.name ? colors.primary : colors.card, 
                  borderColor: selectedCategory === category.name ? colors.primary : colors.border 
                }
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[
                styles.categoryButtonText,
                { 
                  color: selectedCategory === category.name ? '#000' : colors.textSecondary,
                  fontWeight: selectedCategory === category.name ? '600' : '500'
                }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Refresh Hint */}
        {!loading && !refreshing && (
          <View style={styles.refreshHint}>
            <Icon name="info" size={16} color={colors.textSecondary} />
            <Text style={[styles.refreshHintText, { color: colors.textSecondary }]}>
              Pull down or tap refresh button to update product status
            </Text>
          </View>
        )}

        {/* Loading State - Skeleton Loader */}
        {loading && (
          <ProductListSkeleton count={6} />
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Products List */}
        {!loading && !error && (
          <ScrollView 
            style={styles.productsList} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refreshData}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressBackgroundColor={colors.card}
              />
            }
          >
            <View style={styles.productsContainer}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="inventory" size={64} color={colors.textSecondary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No products found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                    {products.length === 0 
                      ? 'Add your first product to get started'
                      : 'Try adjusting your filters or search term'}
                  </Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onPress={handleEditProduct}
                    onToggleStatus={toggleProductStatus}
                  />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Floating Add Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={[styles.floatingButton, { 
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        }]} onPress={handleAddProduct}>
          <Icon name="add" size={32} color="#000" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  refreshButton: {
    padding: 8,
  },
  refreshHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  refreshHintText: {
    fontSize: 12,
    marginLeft: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  searchInput: {
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryContainer: {
    marginBottom: 16,
    maxHeight: 36,
  },
  categoryContent: {
    paddingHorizontal: 0,
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    minWidth: 60,
  },
  categoryButtonText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 18,
  },
  productsList: {
    flex: 1,
  },
  productsContainer: {
    paddingBottom: 100,
    gap: 12,
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
  },
  stockStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  productCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  productCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  approvedBadge: {
    backgroundColor: '#dcfce7',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  rejectedBadge: {
    backgroundColor: '#fecaca',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  approvedText: {
    color: '#16a34a',
  },
  pendingText: {
    color: '#d97706',
  },
  rejectedText: {
    color: '#dc2626',
  },
  productActions: {
    alignItems: 'flex-end',
  },
  statusToggle: {
    padding: 12,
    marginLeft: 8,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  floatingButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default withNetworkErrorBoundary(ProductListScreen, {
  showErrorOnOffline: false, // Let banner handle general offline state
});
