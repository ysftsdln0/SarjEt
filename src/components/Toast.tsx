import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { fadeIn, fadeOut, slideUp, slideDown } from '../utils/animationUtils';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  onHide: () => void;
  onPress?: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  duration = 3000,
  onHide,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Toast göster
      fadeIn(fadeAnim);
      slideUp(slideAnim);
      
      // Otomatik gizle
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    fadeOut(fadeAnim);
    slideDown(slideAnim);
    setTimeout(() => {
      onHide();
    }, 300);
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: colors.success, icon: 'checkmark-circle' };
      case 'error':
        return { backgroundColor: colors.error, icon: 'close-circle' };
      case 'warning':
        return { backgroundColor: colors.warning, icon: 'warning' };
      case 'info':
        return { backgroundColor: colors.primary, icon: 'information-circle' };
      default:
        return { backgroundColor: colors.primary, icon: 'information-circle' };
    }
  };

  const toastStyle = getToastStyle();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.toast, { backgroundColor: toastStyle.backgroundColor }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Ionicons name={toastStyle.icon as any} size={24} color={colors.white} />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
});

export default Toast; 