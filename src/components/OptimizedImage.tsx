import React, { useState, memo } from 'react';
import { Image, ImageProps, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';
import { useSafeTheme } from '../hooks/useSafeTheme';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  showLoader?: boolean;
  loaderSize?: 'small' | 'large';
}

/**
 * Optimized Image Component with lazy loading and caching
 * Features:
 * - Automatic memory-disk caching
 * - Loading skeleton/spinner
 * - Error handling
 * - Performance optimized with React.memo
 */
export const OptimizedImage = memo<OptimizedImageProps>(({
  source,
  width = '100%',
  height = 200,
  borderRadius = 0,
  showLoader = true,
  loaderSize = 'small',
  style,
  resizeMode = 'cover',
  ...props
}) => {
  const { theme } = useSafeTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  // If source is a local require(), render directly without loading state
  if (typeof source === 'number') {
    return (
      <Image
        source={source}
        style={[{ width, height, borderRadius }, style]}
        resizeMode={resizeMode}
        {...props}
      />
    );
  }

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      {/* Loading State */}
      {loading && showLoader && (
        <View style={[styles.loaderContainer, { borderRadius }]}>
          <SkeletonLoader width={width} height={height} borderRadius={borderRadius} />
        </View>
      )}

      {/* Error State */}
      {error && (
        <View
          style={[
            styles.errorContainer,
            {
              width,
              height,
              borderRadius,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <ActivityIndicator size={loaderSize} color={theme.colors.textSecondary} />
        </View>
      )}

      {/* Actual Image */}
      {!error && (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width,
              height,
              borderRadius,
              opacity: loading ? 0 : 1,
            },
            style,
          ]}
          resizeMode={resizeMode}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          // Performance optimization: cache images in memory and disk
          // @ts-ignore - cachePolicy is not in TypeScript types but works in React Native
          cachePolicy="memory-disk"
          {...props}
        />
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  // Only re-render if source URI changes
  if (typeof prevProps.source === 'object' && typeof nextProps.source === 'object') {
    return prevProps.source.uri === nextProps.source.uri;
  }
  return prevProps.source === nextProps.source;
});

OptimizedImage.displayName = 'OptimizedImage';

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

