import React, { useEffect, useRef } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import { fadeIn, fadeOut, slideUp, slideDown } from '../utils/animationUtils';

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
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Toast göster
      fadeIn(fadeAnim).start();
      slideUp(slideAnim).start();
      
      // Otomatik gizle
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    fadeOut(fadeAnim).start();
    slideDown(slideAnim).start();
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
          top: insets.top + 10, // Safe area'ya uygun pozisyon
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
                <Ionicons name={toastStyle.icon as keyof typeof Ionicons['glyphMap']} size={24} color={colors.white} />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 4,
  },
  container: {
    left: 20,
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  message: {
    color: colors.white,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  toast: {
    alignItems: 'center',
    borderRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Toast; 