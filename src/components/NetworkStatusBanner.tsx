import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNetwork } from '../context/NetworkContext';

const { width } = Dimensions.get('window');

interface NetworkStatusBannerProps {
  showConnectionType?: boolean;
}

const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  showConnectionType = true,
}) => {
  const { isConnected, isInternetReachable, connectionType } = useNetwork();
  const [slideAnim] = useState(new Animated.Value(-60)); // Start above screen
  const [isVisible, setIsVisible] = useState(false);

  // Determine if we should show the banner
  const shouldShowBanner = !isConnected || !isInternetReachable;

  useEffect(() => {
    if (shouldShowBanner && !isVisible) {
      // Show banner - slide down
      setIsVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else if (!shouldShowBanner && isVisible) {
      // Hide banner - slide up
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setIsVisible(false);
      });
    }
  }, [shouldShowBanner, isVisible, slideAnim]);

  // Don't render if not visible and animation is complete
  if (!isVisible && !shouldShowBanner) {
    return null;
  }

  // Determine connection status text
  const getConnectionText = () => {
    if (!isConnected) {
      return 'No Internet Connection';
    }
    if (!isInternetReachable) {
      return 'Connected but No Internet Access';
    }
    return 'Back Online';
  };

  // Get connection type icon and text with quality indicator
  const getConnectionTypeInfo = () => {
    if (!showConnectionType || !isConnected) {
      return null;
    }

    let icon = 'signal-cellular-alt';
    let text = '';
    let quality = '';

    switch (connectionType) {
      case 'wifi':
        icon = 'wifi';
        text = 'WiFi';
        quality = 'Fast';
        break;
      case 'cellular':
        icon = 'signal-cellular-alt';
        text = '4G/5G';
        quality = 'Good';
        break;
      case '3g':
        icon = 'signal-cellular-alt';
        text = '3G';
        quality = 'Slow';
        break;
      case '2g':
        icon = 'signal-cellular-alt';
        text = '2G';
        quality = 'Very Slow';
        break;
      case 'ethernet':
        icon = 'settings-ethernet';
        text = 'Ethernet';
        quality = 'Fast';
        break;
      default:
        return null;
    }

    return { icon, text, quality };
  };

  const connectionTypeInfo = getConnectionTypeInfo();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Icon
            name={shouldShowBanner ? 'wifi-off' : 'wifi'}
            size={20}
            color="#92400E"
            style={styles.icon}
          />
          <Text style={styles.text}>{getConnectionText()}</Text>
        </View>

        {connectionTypeInfo && !shouldShowBanner && (
          <View style={styles.rightSection}>
            <Icon
              name={connectionTypeInfo.icon}
              size={16}
              color="#92400E"
              style={styles.smallIcon}
            />
            <Text style={styles.connectionTypeText}>
              {connectionTypeInfo.text}
            </Text>
            {connectionTypeInfo.quality && (
              <Text style={styles.qualityText}>
                • {connectionTypeInfo.quality}
              </Text>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0), // Account for status bar
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  content: {
    backgroundColor: '#FEF3C7', // Warning yellow
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  icon: {
    marginRight: 8,
  },
  smallIcon: {
    marginRight: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E', // Dark brown
    fontFamily: 'Work Sans',
    flex: 1,
  },
  connectionTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    fontFamily: 'Work Sans',
  },
  qualityText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#92400E',
    fontFamily: 'Work Sans',
    marginLeft: 4,
  },
});

export default NetworkStatusBanner;

