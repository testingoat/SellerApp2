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

    try {
      setError(null);
      setLoading(true);

      console.log('🔄 ProductListScreen: Loading initial data...');
      const [productsResponse, categoriesResponse] = await Promise.all([
        productService.getSellerProducts(),
        productService.getCategories()
      ]);

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
      setLoading(false);
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

    try {
      const response = await productService.toggleProductStatus(
        product._id,
        !product.isActive
      );
      
      if (response.success) {
        setProducts(prev => 
          prev.map(p => p._id === product._id ? { ...p, isActive: !p.isActive } : p)
        );
      } else {
        throw new Error(response.message || 'Failed to update product status');
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      Alert.alert('Error', 'Failed to update product status');
    }
  };

  // Load data on mount and when screen is focused
  useEffect(() => {
    loadData();
  }, [token, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (token && isAuthenticated) {
        refreshData();
      }
    }, [token, isAuthenticated])
  );

  const handleAddProduct = () => {
    if (onAddProduct) {
      onAddProduct();
    } else {
      navigation.navigate('AddEditProduct', {});
    }
  };

  const handleEditProduct = (product: Product) => {
    if (onEditProduct) {
      onEditProduct(product);
    } else {
      navigation.navigate('AddEditProduct', { product });
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshData}
          disabled={refreshing}
        >
          <Icon
            name="refresh"
            size={24}
            color={refreshing ? "#9ca3af" : "#3be340"}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products"
            placeholderTextColor="#6b7280"
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
                selectedStatus === option.key && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedStatus(option.key as any)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedStatus === option.key && styles.categoryButtonTextActive
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
                selectedCategory === category.name && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.name && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Refresh Hint */}
        {!loading && !refreshing && (
          <View style={styles.refreshHint}>
            <Icon name="info" size={16} color="#6b7280" />
            <Text style={styles.refreshHintText}>
              Pull down or tap refresh button to update product status
            </Text>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3be340" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
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
                colors={['#3be340']}
                tintColor="#3be340"
              />
            }
          >
            <View style={styles.productsContainer}>
              {filteredProducts.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="inventory" size={64} color="#9ca3af" />
                  <Text style={styles.emptyTitle}>No products found</Text>
                  <Text style={styles.emptySubtitle}>
                    {products.length === 0 
                      ? 'Add your first product to get started'
                      : 'Try adjusting your filters or search term'}
                  </Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <View key={product._id} style={styles.productCard}>
                    <TouchableOpacity
                      style={styles.productCardContent}
                      onPress={() => handleEditProduct(product)}
                    >
                      <View style={styles.productImageContainer}>
                        {product.image ? (
                          <Image 
                            source={{ uri: product.image }} 
                            style={styles.productImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Icon name="image" size={32} color="#9ca3af" />
                        )}
                      </View>

                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{product.name}</Text>
                        <Text style={styles.productPrice}>${product.price}</Text>
                        <Text style={styles.productCategory}>{product.category?.name}</Text>
                        
                        {/* Admin Approval Status */}
                        <View style={styles.statusContainer}>
                          <View style={[
                            styles.statusBadge,
                            product.status === 'approved' ? styles.approvedBadge :
                            product.status === 'rejected' ? styles.rejectedBadge : styles.pendingBadge
                          ]}>
                            <Text style={[
                              styles.statusText,
                              product.status === 'approved' ? styles.approvedText :
                              product.status === 'rejected' ? styles.rejectedText : styles.pendingText
                            ]}>
                              {product.status === 'approved' ? 'Approved' :
                               product.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.productActions}>
                        <Text style={[
                          styles.stockStatus,
                          product.stock > 0 ? styles.inStock : styles.outOfStock
                        ]}>
                          Stock: {product.stock}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Active/Inactive Toggle - only for approved products */}
                    {product.status === 'approved' && (
                      <TouchableOpacity
                        style={styles.statusToggle}
                        onPress={() => toggleProductStatus(product)}
                      >
                        <Icon
                          name={product.isActive ? 'visibility' : 'visibility-off'}
                          size={24}
                          color={product.isActive ? '#10b981' : '#6b7280'}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Floating Add Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.floatingButton} onPress={handleAddProduct}>
          <Icon name="add" size={32} color="#000" />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f6f8f6',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
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
    color: '#6b7280',
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
    backgroundColor: 'white',
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryContainer: {
    marginBottom: 16,
    maxHeight: 36, // Fixed height to prevent stretching
  },
  categoryContent: {
    paddingHorizontal: 0,
    alignItems: 'center', // Center items vertically
    flexDirection: 'row', // Ensure horizontal layout
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 36, // Fixed height
    borderRadius: 18, // Half of height for perfect pill shape
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12, // Better spacing
    minWidth: 60, // Minimum width for better appearance
  },
  categoryButtonActive: {
    backgroundColor: '#3be340',
    borderColor: '#3be340',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18, // Better text alignment
  },
  categoryButtonTextActive: {
    color: '#112112',
    fontWeight: '600',
  },
  productsList: {
    flex: 1,
  },
  productsContainer: {
    paddingBottom: 100,
    gap: 12,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productImageContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: '#6b7280',
  },
  stockStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  inStock: {
    color: '#10b981',
  },
  outOfStock: {
    color: '#ef4444',
  },
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3be340',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty state
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
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Enhanced product card
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
    color: '#9ca3af',
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
    backgroundColor: '#3be340',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3be340',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default ProductListScreen;
