import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useSafeTheme } from '../hooks/useSafeTheme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Reusable Skeleton Loader Component with shimmer animation
 * Used to show loading placeholders while content is being fetched
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { theme } = useSafeTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.isDark ? '#2a2a2a' : '#e0e0e0',
          opacity,
        },
        style,
      ]}
    />
  );
};

/**
 * Product Card Skeleton - matches ProductCard layout
 */
export const ProductCardSkeleton: React.FC = () => {
  const { theme } = useSafeTheme();

  return (
    <View style={[styles.productCard, { backgroundColor: theme.colors.card }]}>
      {/* Image skeleton */}
      <SkeletonLoader width="100%" height={120} borderRadius={8} />
      
      {/* Content skeleton */}
      <View style={styles.productContent}>
        {/* Title */}
        <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
        
        {/* Category */}
        <SkeletonLoader width="50%" height={12} style={{ marginBottom: 8 }} />
        
        {/* Price */}
        <SkeletonLoader width="40%" height={18} style={{ marginBottom: 8 }} />
        
        {/* Status badge */}
        <SkeletonLoader width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

/**
 * Dashboard Card Skeleton - matches dashboard stat cards
 */
export const DashboardCardSkeleton: React.FC = () => {
  const { theme } = useSafeTheme();

  return (
    <View style={[styles.dashboardCard, { backgroundColor: theme.colors.card }]}>
      {/* Icon skeleton */}
      <SkeletonLoader width={40} height={40} borderRadius={20} style={{ marginBottom: 12 }} />
      
      {/* Value */}
      <SkeletonLoader width="60%" height={24} style={{ marginBottom: 8 }} />
      
      {/* Label */}
      <SkeletonLoader width="80%" height={14} />
    </View>
  );
};

/**
 * List Item Skeleton - for order lists, notification lists, etc.
 */
export const ListItemSkeleton: React.FC = () => {
  const { theme } = useSafeTheme();

  return (
    <View style={[styles.listItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.listItemLeft}>
        {/* Icon/Image */}
        <SkeletonLoader width={50} height={50} borderRadius={8} />
      </View>
      
      <View style={styles.listItemContent}>
        {/* Title */}
        <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
        
        {/* Subtitle */}
        <SkeletonLoader width="50%" height={12} style={{ marginBottom: 6 }} />
        
        {/* Meta info */}
        <SkeletonLoader width="40%" height={10} />
      </View>
      
      <View style={styles.listItemRight}>
        {/* Status or action */}
        <SkeletonLoader width={60} height={28} borderRadius={14} />
      </View>
    </View>
  );
};

/**
 * Product List Skeleton - shows multiple product cards
 */
export const ProductListSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <View style={styles.productList}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Dashboard Skeleton - shows multiple dashboard cards
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <View style={styles.dashboardGrid}>
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
      <DashboardCardSkeleton />
    </View>
  );
};

/**
 * List Skeleton - shows multiple list items
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <ListItemSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  productCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productContent: {
    marginTop: 12,
  },
  dashboardCard: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  listItemLeft: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemRight: {
    marginLeft: 12,
  },
  productList: {
    padding: 16,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  list: {
    padding: 16,
  },
});

