import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { spin, pulse } from '../utils/animationUtils';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  type?: 'spinner' | 'skeleton' | 'pulse';
  showLogo?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Yükleniyor...',
  type = 'spinner',
  showLogo = true,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animasyonu
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Loading tipine göre animasyon başlat
    if (type === 'spinner') {
      spin(spinAnim).start();
    } else if (type === 'pulse') {
      pulse(pulseAnim).start();
    }
  }, []);

  const renderSpinner = () => (
    <View style={styles.spinnerContainer}>
      <Animated.View
        style={[
          styles.spinner,
          {
            transform: [
              {
                rotate: spinAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="refresh" size={40} color={colors.primary} />
      </Animated.View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {showLogo && (
        <Animated.View
          style={[
            styles.logo,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.logoText}>Şarjet</Text>
        </Animated.View>
      )}
      
      {/* Skeleton cards */}
      {[1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonLogo} />
            <View style={styles.skeletonInfo}>
              <View style={styles.skeletonTitle} />
              <View style={styles.skeletonSubtitle} />
            </View>
          </View>
          <View style={styles.skeletonMeta}>
            <View style={styles.skeletonRating} />
            <View style={styles.skeletonDistance} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderPulse = () => (
    <View style={styles.pulseContainer}>
      <Animated.View
        style={[
          styles.pulseCircle,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.1],
              outputRange: [1, 0.3],
            }),
          },
        ]}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {type === 'spinner' && renderSpinner()}
      {type === 'skeleton' && renderSkeleton()}
      {type === 'pulse' && renderPulse()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinnerContainer: {
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  pulseContainer: {
    alignItems: 'center',
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  skeletonContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  skeletonCard: {
    backgroundColor: colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    marginRight: 12,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    marginBottom: 8,
    width: '80%',
  },
  skeletonSubtitle: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    width: '60%',
  },
  skeletonMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonRating: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    width: 60,
  },
  skeletonDistance: {
    height: 12,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    width: 80,
  },
  message: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LoadingScreen;
