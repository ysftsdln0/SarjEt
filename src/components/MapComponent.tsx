import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { ChargingStation, UserLocation } from '../types';
import { StationUtils } from '../utils/stationUtils';

// Web platformu için fallback component
const WebMapFallback = ({ stations }: { stations: ChargingStation[] }) => (
  <View style={styles.webFallback}>
    <View style={styles.fallbackContent}>
      <Text style={styles.fallbackIcon}>🗺️</Text>
      <Text style={styles.fallbackTitle}>Harita Görünümü</Text>
      <Text style={styles.fallbackText}>
        Harita özelliği web sürümünde desteklenmemektedir.
      </Text>
      <Text style={styles.fallbackSubtext}>
        {stations.length} şarj istasyonu liste görünümünde mevcuttur.
      </Text>
      <Text style={styles.fallbackNote}>
        Tam harita deneyimi için mobil uygulamayı kullanın.
      </Text>
    </View>
  </View>
);

interface MapComponentProps {
  userLocation: UserLocation | null;
  stations: ChargingStation[];
  onStationPress: (station: ChargingStation) => void;
  loading?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  userLocation,
  stations,
  onStationPress,
  loading = false
}) => {
  // Web platformunda fallback göster
  if (Platform.OS === 'web') {
    return <WebMapFallback stations={stations} />;
  }

  // Native platformlarda harita yüklemeyi dene
  try {
    // Dynamic import for react-native-maps (sadece native)
    const MapView = require('react-native-maps').default;
    const { Marker, PROVIDER_GOOGLE } = require('react-native-maps');

    const handleMarkerPress = (station: ChargingStation) => {
      onStationPress(station);
    };

    const getMarkerColor = (station: ChargingStation): string => {
      return StationUtils.getSpeedColor(station);
    };

    const defaultRegion = {
      latitude: userLocation?.latitude || 41.0082,
      longitude: userLocation?.longitude || 28.9784,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };

    return (
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={defaultRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
          loadingEnabled={loading}
        >
          {/* Şarj istasyonu marker'ları */}
          {stations.map((station) => (
            <Marker
              key={`station-${station.ID}`}
              coordinate={{
                latitude: station.AddressInfo.Latitude,
                longitude: station.AddressInfo.Longitude,
              }}
              title={station.AddressInfo.Title || 'Şarj İstasyonu'}
              description={`${StationUtils.getChargingSpeed(station)} • ${StationUtils.formatDistance(station.AddressInfo.Distance)}`}
              pinColor={getMarkerColor(station)}
              onPress={() => handleMarkerPress(station)}
            />
          ))}
        </MapView>
      </View>
    );
  } catch (error) {
    // react-native-maps yüklenemezse fallback göster
    console.warn('react-native-maps could not be loaded:', error);
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Harita yüklenemedi</Text>
          <Text style={styles.errorSubtext}>
            Liste görünümünü kullanın
          </Text>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webFallback: {
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
  fallbackContent: {
    alignItems: 'center',
    padding: 40,
    maxWidth: 400,
  },
  fallbackIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#3b82f6',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  fallbackNote: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
