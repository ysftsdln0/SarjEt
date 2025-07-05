// Web için react-native-maps mock
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Mock MapView component
const MapView = ({ children, style, ...props }) => {
  return (
    <View style={[styles.webMapContainer, style]}>
      <View style={styles.webMapContent}>
        <Text style={styles.webMapIcon}>🗺️</Text>
        <Text style={styles.webMapTitle}>Harita Görünümü</Text>
        <Text style={styles.webMapText}>
          Harita özelliği web sürümünde desteklenmemektedir.
        </Text>
        <Text style={styles.webMapSubtext}>
          Mobil uygulamayı kullanarak tam harita deneyimini yaşayın.
        </Text>
      </View>
    </View>
  );
};

// Mock Marker component
export const Marker = () => null;

// Mock constants
export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  webMapContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
  },
  webMapContent: {
    alignItems: 'center',
    padding: 40,
    maxWidth: 400,
  },
  webMapIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  webMapTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  webMapText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  webMapSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default MapView;
