import { Animated, Easing } from 'react-native';

// Smooth fade in/out animasyonları
export const fadeIn = (value: Animated.Value, duration: number = 300) => {
  value.setValue(0);
  Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }).start();
};

export const fadeOut = (value: Animated.Value, duration: number = 300) => {
  Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.cubic),
  }).start();
};

// Slide animasyonları
export const slideUp = (value: Animated.Value, duration: number = 300) => {
  value.setValue(100);
  Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }).start();
};

export const slideDown = (value: Animated.Value, duration: number = 300) => {
  Animated.timing(value, {
    toValue: 100,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.cubic),
  }).start();
};

// Scale animasyonları
export const scaleIn = (value: Animated.Value, duration: number = 200) => {
  value.setValue(0.8);
  Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.back(1.2)),
  }).start();
};

export const scaleOut = (value: Animated.Value, duration: number = 200) => {
  Animated.timing(value, {
    toValue: 0.8,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.back(1.2)),
  }).start();
};

// Bounce animasyonu
export const bounce = (value: Animated.Value) => {
  value.setValue(1);
  Animated.sequence([
    Animated.timing(value, {
      toValue: 1.2,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }),
  ]).start();
};

// Pulse animasyonu
export const pulse = (value: Animated.Value) => {
  value.setValue(1);
  Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ])
  ).start();
};

// Shake animasyonu
export const shake = (value: Animated.Value) => {
  value.setValue(0);
  Animated.sequence([
    Animated.timing(value, { toValue: 10, duration: 100, useNativeDriver: true }),
    Animated.timing(value, { toValue: -10, duration: 100, useNativeDriver: true }),
    Animated.timing(value, { toValue: 10, duration: 100, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0, duration: 100, useNativeDriver: true }),
  ]).start();
};

// Marker popup animasyonu
export const markerPopup = (value: Animated.Value) => {
  value.setValue(0);
  Animated.sequence([
    Animated.timing(value, {
      toValue: 1.2,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.2)),
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.in(Easing.cubic),
    }),
  ]).start();
};

// Card slide animasyonu
export const cardSlide = (value: Animated.Value, direction: 'left' | 'right' = 'right') => {
  const startValue = direction === 'left' ? -100 : 100;
  value.setValue(startValue);
  Animated.timing(value, {
    toValue: 0,
    duration: 400,
    useNativeDriver: true,
    easing: Easing.out(Easing.cubic),
  }).start();
};

// Loading spinner animasyonu
export const spin = (value: Animated.Value) => {
  value.setValue(0);
  Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.linear,
    })
  ).start();
};
