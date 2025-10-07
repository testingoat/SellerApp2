import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../services/productService';
import { useSafeTheme } from '../hooks/useSafeTheme';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
}

/**
 * Memoized Product Card Component
 * Only re-renders when product data changes
 */
export const ProductCard = memo<ProductCardProps>(({ product, onPress, onToggleStatus }) => {
  const { theme } = useSafeTheme();

  // Memoize callbacks to prevent re-renders
  const handlePress = useCallback(() => {
    onPress(product);
  }, [product, onPress]);

  const handleToggleStatus = useCallback(() => {
    onToggleStatus(product);
  }, [product, onToggleStatus]);

  return (
    <View
      style={[
        styles.productCard,
        {
          backgroundColor: theme.colors.card,
          shadowColor: theme.isDark ? '#000' : '#000',
        },
      ]}
    >
      <TouchableOpacity style={styles.productCardContent} onPress={handlePress}>
        <View style={[styles.productImageContainer, { backgroundColor: theme.colors.surface }]}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="cover"
              // Performance optimization
              cachePolicy="memory-disk"
            />
          ) : (
            <Icon name="image" size={32} color={theme.colors.textSecondary} />
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: theme.colors.text }]}>{product.name}</Text>
          <Text style={[styles.productPrice, { color: theme.colors.textSecondary }]}>
            ${product.price}
          </Text>
          <Text style={[styles.productCategory, { color: theme.colors.textSecondary }]}>
            {product.category?.name}
          </Text>

          {/* Admin Approval Status */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                product.status === 'approved'
                  ? styles.approvedBadge
                  : product.status === 'rejected'
                  ? styles.rejectedBadge
                  : styles.pendingBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  product.status === 'approved'
                    ? styles.approvedText
                    : product.status === 'rejected'
                    ? styles.rejectedText
                    : styles.pendingText,
                ]}
              >
                {product.status === 'approved'
                  ? 'Approved'
                  : product.status === 'rejected'
                  ? 'Rejected'
                  : 'Pending Review'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.productActions}>
          <Text
            style={[
              styles.stockStatus,
              { color: product.stock > 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            Stock: {product.stock}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Active/Inactive Toggle - only for approved products */}
      {product.status === 'approved' && (
        <TouchableOpacity style={styles.statusToggle} onPress={handleToggleStatus}>
          <Icon
            name={product.isActive ? 'visibility' : 'visibility-off'}
            size={24}
            color={product.isActive ? theme.colors.success : theme.colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  // Only re-render if product data actually changed
  return (
    prevProps.product._id === nextProps.product._id &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.status === nextProps.product.status &&
    prevProps.product.isActive === nextProps.product.isActive &&
    prevProps.product.image === nextProps.product.image
  );
});

ProductCard.displayName = 'ProductCard';

const styles = StyleSheet.create({
  productCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productCardContent: {
    flexDirection: 'row',
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: '#d4edda',
  },
  rejectedBadge: {
    backgroundColor: '#f8d7da',
  },
  pendingBadge: {
    backgroundColor: '#fff3cd',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  approvedText: {
    color: '#155724',
  },
  rejectedText: {
    color: '#721c24',
  },
  pendingText: {
    color: '#856404',
  },
  productActions: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusToggle: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
});

