// Web için react-native-maps fallback
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Mock MapView component for web
const MapView = ({ children, style, onPress, ...props }: any) => {
  return (
    <View style={[styles.mapFallback, style]} {...props}>
      <View style={styles.fallbackContent}>
        <Text style={styles.fallbackIcon}>🗺️</Text>
        <Text style={styles.fallbackTitle}>
          Harita Görünümü
        </Text>
        <Text style={styles.fallbackText}>
          Harita özelliği web sürümünde desteklenmemektedir.
        </Text>
        <Text style={styles.fallbackSubtext}>
          Tam deneyim için mobil uygulamayı kullanın.
        </Text>
      </View>
      {children}
    </View>
  );
};

// Mock Marker component for web
export const Marker = ({ children, coordinate, title, description, onPress, ...props }: any) => {
  if (Platform.OS !== 'web') return null;
  
  return (
    <View style={styles.markerFallback}>
      <Text style={styles.markerText}>📍</Text>
      {title && <Text style={styles.markerTitle}>{title}</Text>}
      {description && <Text style={styles.markerDescription}>{description}</Text>}
    </View>
  );
};

// Mock constants
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  mapFallback: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  fallbackContent: {
    alignItems: 'center',
    padding: 40,
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
  markerFallback: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerText: {
    fontSize: 16,
  },
  markerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  markerDescription: {
    fontSize: 11,
    color: '#6b7280',
  },
});

export default MapView;
