import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const scootAnimation = useRef(new Animated.Value(-100)).current;
  const roadAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Road animation (continuous)
    const roadLoop = Animated.loop(
      Animated.timing(roadAnimation, {
        toValue: -200,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    roadLoop.start();

    // Scooter animation (continuous)
    const scootLoop = Animated.loop(
      Animated.timing(scootAnimation, {
        toValue: width + 100,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    scootLoop.start();

    // Auto navigate after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(timer);
      roadLoop.stop();
      scootLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f6f8f6" barStyle="dark-content" />
      <Animated.View style={[styles.content, { opacity: fadeAnimation }]}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>🛒</Text>
            </View>
          </View>
          <Text style={styles.brandName}>Goat Goat</Text>
          <Text style={styles.tagline}>Seller App</Text>
        </View>

        {/* Animation Section */}
        <View style={styles.animationSection}>
          <View style={styles.roadContainer}>
            {/* Road */}
            <Animated.View
              style={[
                styles.road,
                {
                  transform: [{ translateX: roadAnimation }],
                },
              ]}
            />
            
            {/* Scooter */}
            <Animated.View
              style={[
                styles.scooter,
                {
                  transform: [{ translateX: scootAnimation }],
                },
              ]}
            >
              <Text style={styles.scooterIcon}>🛵</Text>
              <Text style={styles.packageIcon}>📦</Text>
            </Animated.View>
          </View>

          {/* Loading Badge */}
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBadge}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logo: {
    width: 128,
    height: 128,
    backgroundColor: '#3be340',
    borderRadius: 64,
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
  logoIcon: {
    fontSize: 48,
    color: 'white',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#3be340',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '500',
  },
  animationSection: {
    width: 256,
    alignItems: 'center',
  },
  roadContainer: {
    width: '100%',
    height: 64,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 32,
  },
  road: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width * 2,
    height: 4,
    backgroundColor: '#9ca3af',
  },
  scooter: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scooterIcon: {
    fontSize: 40,
    transform: [{ scaleX: -1 }],
  },
  packageIcon: {
    fontSize: 24,
    position: 'absolute',
    top: -12,
    right: -12,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingBadge: {
    backgroundColor: '#3be340',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default SplashScreen;
