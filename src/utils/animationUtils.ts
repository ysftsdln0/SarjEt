import { Animated, Easing } from 'react-native';

// Smooth easing functions
const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
const bounceEasing = Easing.bezier(0.68, -0.55, 0.265, 1.55);
const elasticEasing = Easing.bezier(0.175, 0.885, 0.32, 1.275);

// Fade animations
export const fadeIn = (value: Animated.Value, duration: number = 400) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: smoothEasing,
    useNativeDriver: true,
  });
};

export const fadeOut = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: smoothEasing,
    useNativeDriver: true,
  });
};

// Slide animations with spring-like feel
export const slideUp = (value: Animated.Value, duration: number = 500) => {
  return Animated.spring(value, {
    toValue: 0,
    useNativeDriver: true,
    tension: 100,
    friction: 8,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  });
};

export const slideDown = (value: Animated.Value, duration: number = 500) => {
  return Animated.spring(value, {
    toValue: 1,
    useNativeDriver: true,
    tension: 100,
    friction: 8,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  });
};

// Scale animations
export const scaleIn = (value: Animated.Value, duration: number = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: elasticEasing,
    useNativeDriver: true,
  });
};

export const scaleOut = (value: Animated.Value, duration: number = 200) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: smoothEasing,
    useNativeDriver: true,
  });
};

// Bounce animation with elastic feel
export const bounce = (value: Animated.Value) => {
  const sequence = Animated.sequence([
    Animated.timing(value, {
      toValue: 1.2,
      duration: 150,
      easing: bounceEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.9,
      duration: 150,
      easing: bounceEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1.05,
      duration: 100,
      easing: bounceEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
  ]);
  
  return sequence;
};

// Pulse animation
export const pulse = (value: Animated.Value) => {
  const pulseAnim = Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.1,
        duration: 800,
        easing: smoothEasing,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 1,
        duration: 800,
        easing: smoothEasing,
        useNativeDriver: true,
      }),
    ])
  );
  
  return pulseAnim;
};

// Shake animation
export const shake = (value: Animated.Value) => {
  const shakeAnim = Animated.sequence([
    Animated.timing(value, {
      toValue: 10,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -10,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 10,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -10,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
  ]);
  
  return shakeAnim;
};

// Marker popup animation
export const markerPopup = (value: Animated.Value) => {
  const popupAnim = Animated.sequence([
    Animated.timing(value, {
      toValue: 0,
      duration: 0,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1.3,
      duration: 200,
      easing: elasticEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 150,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
  ]);
  
  return popupAnim;
};

// Card slide animation
export const cardSlide = (value: Animated.Value, direction: 'left' | 'right' = 'right') => {
  const startValue = direction === 'right' ? 100 : -100;
  value.setValue(startValue);
  
  return Animated.spring(value, {
    toValue: 0,
    useNativeDriver: true,
    tension: 120,
    friction: 9,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  });
};

// Spin animation
export const spin = (value: Animated.Value) => {
  const spinAnim = Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
  
  return spinAnim;
};

// Stagger animation for multiple elements
export const stagger = (values: Animated.Value[], delay: number = 100) => {
  const animations = values.map((value, index) =>
    Animated.timing(value, {
      toValue: 1,
      duration: 300,
      delay: index * delay,
      easing: smoothEasing,
      useNativeDriver: true,
    })
  );
  
  return Animated.parallel(animations);
};

// Parallax effect
export const parallax = (value: Animated.Value, scrollValue: Animated.Value, factor: number = 0.5) => {
  return Animated.multiply(scrollValue, factor);
};

// Morph animation (smooth transition between shapes)
export const morph = (value: Animated.Value, toValue: number, duration: number = 500) => {
  return Animated.timing(value, {
    toValue,
    duration,
    easing: smoothEasing,
    useNativeDriver: true,
  });
};

// Wave animation
export const wave = (value: Animated.Value) => {
  const waveAnim = Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.2,
        duration: 600,
        easing: smoothEasing,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0.8,
        duration: 600,
        easing: smoothEasing,
        useNativeDriver: true,
      }),
    ])
  );
  
  return waveAnim;
};

// Elastic bounce
export const elasticBounce = (value: Animated.Value) => {
  const elasticAnim = Animated.sequence([
    Animated.timing(value, {
      toValue: 1.4,
      duration: 200,
      easing: elasticEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.7,
      duration: 200,
      easing: elasticEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1.1,
      duration: 150,
      easing: elasticEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.95,
      duration: 150,
      easing: elasticEasing,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      easing: smoothEasing,
      useNativeDriver: true,
    }),
  ]);
  
  return elasticAnim;
};

// Floating animation
export const float = (value: Animated.Value) => {
  const floatAnim = Animated.loop(
    Animated.sequence([
      Animated.timing(value, {
        toValue: 1.05,
        duration: 1000,
        easing: smoothEasing,
        useNativeDriver: true,
      }),
      Animated.timing(value, {
        toValue: 0.95,
        duration: 1000,
        easing: smoothEasing,
        useNativeDriver: true,
      }),
    ])
  );
  
  return floatAnim;
};
