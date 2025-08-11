
import React, { useRef, useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE, 
  Region,
  MapPressEvent
} from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';
import { ChargingStation } from '../types';
import { StationMarker } from './StationMarker';
import colors from '../constants/colors';

// Define the shape of the data item that MapViewClustering expects
// It must have a `location` property with latitude and longitude
interface MapDataItem extends ChargingStation {
  location: {
    latitude: number;
    longitude: number;
  };
}

interface ClusteredMapViewProps {
  stations: ChargingStation[];
  initialRegion: Region;
  onStationPress: (station: ChargingStation) => void;
  onRegionChange?: (region: Region) => void;
  isDarkMode?: boolean;
}

const { width, height } = Dimensions.get('window');

// This component is now ONLY responsible for displaying clustered stations.
// The user's location marker will be rendered separately in the parent screen.
export const ClusteredMapView: React.FC<ClusteredMapViewProps> = ({
  stations,
  initialRegion,
  onStationPress,
  onRegionChange,
  isDarkMode = false
}) => {
  const mapRef = useRef<MapView>(null);

  // Memoize and transform station data to prevent re-calculations and to filter invalid data.
  // This is a critical step for performance and stability.
  const mapData: MapDataItem[] = useMemo(() => {
    if (!stations) return [];
    return stations
      .filter(station => 
        station &&
        station.AddressInfo &&
        typeof station.AddressInfo.Latitude === 'number' &&
        typeof station.AddressInfo.Longitude === 'number'
      )
      .map(station => ({
        ...station,
        location: {
          latitude: station.AddressInfo.Latitude,
          longitude: station.AddressInfo.Longitude,
        },
      }));
  }, [stations]);

  const handleStationPress = useCallback((station: ChargingStation) => {
    onStationPress?.(station);
  }, [onStationPress]);

  // Renders a single station marker.
  const renderMarker = useCallback((item: MapDataItem) => (
    <Marker
      key={item.ID}
      coordinate={item.location}
      onPress={() => handleStationPress(item)}
      tracksViewChanges={false}
    >
      <StationMarker 
        isAvailable={item.StatusType?.IsOperational !== false} 
        station={item}
      />
    </Marker>
  ), [handleStationPress]);

  // Renders a cluster marker.
  const renderCluster = useCallback((cluster: any) => {
    const { id, geometry, onPress, properties } = cluster;
    const pointCount = properties.point_count;

    const getClusterStyle = (count: number) => {
      if (count >= 100) return { size: 70, color: colors.primary };
      if (count >= 50) return { size: 60, color: colors.primary };
      if (count >= 20) return { size: 50, color: colors.primary };
      return { size: 40, color: colors.primary };
    };
    const { size, color } = getClusterStyle(pointCount);

    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{ longitude: geometry.coordinates[0], latitude: geometry.coordinates[1] }}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={[styles.cluster, { width: size, height: size, backgroundColor: color }]}>
          <Text style={styles.clusterText}>{pointCount}</Text>
        </View>
      </Marker>
    );
  }, []);

  return (
    <View style={styles.container}>
      <MapViewClustering
        // @ts-ignore - The library's types are incomplete and don't include the 'data' prop.
        data={mapData}
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChange}
        onPress={() => {}} // Empty handler to prevent errors
        renderMarker={renderMarker}
        renderCluster={renderCluster}
        showsMyLocationButton={false}
        showsCompass={true}
        customMapStyle={lightMapStyle} // Resimdeki gibi light mode
        radius={60}
        minZoom={10}
        maxZoom={20}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  cluster: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clusterText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

// Resimdeki gibi light mode harita stili
const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];
