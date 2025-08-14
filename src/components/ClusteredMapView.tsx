
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapViewClustering from 'react-native-map-clustering';
import { Marker, Callout } from 'react-native-maps';
import { ChargingStation, UserLocation, Region } from '../types';
import colors from '../constants/colors';
import StationMarker from './StationMarker';

const { width, height } = Dimensions.get('window');

interface ClusteredMapViewProps {
  stations: ChargingStation[];
  userLocation: UserLocation | null;
  initialRegion: Region;
  onStationPress: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  isDarkMode?: boolean;
}

const ClusteredMapView: React.FC<ClusteredMapViewProps> = ({
  stations,
  userLocation,
  initialRegion,
  onStationPress,
  selectedStation,
  isDarkMode = false,
}) => {
  const mapRef = useRef<MapViewClustering>(null);

  // Light map style for the new design
  const lightMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    {
      featureType: 'administrative.locality',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#d59563' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'geometry',
      stylers: [{ color: '#e5e5e5' }],
    },
    {
      featureType: 'poi.park',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#212a37' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca5b3' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ color: '#f8f9fa' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry.stroke',
      stylers: [{ color: '#1f2937' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#f3d19c' }],
    },
    {
      featureType: 'transit',
      elementType: 'geometry',
      stylers: [{ color: '#f2f2f2' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#6b9a76' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ color: '#a2daf2' }],
    },
    {
      featureType: 'water',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9e9e9e' }],
    },
  ];

  const renderCluster = (cluster: any, onPress: () => void) => {
    const { pointCount, coordinate } = cluster;
    
    const getClusterStyle = (count: number) => {
      if (count >= 100) return { size: 70, color: colors.primary };
      if (count >= 50) return { size: 60, color: colors.primary };
      if (count >= 20) return { size: 50, color: colors.primary };
      return { size: 40, color: colors.primary };
    };

    const clusterStyle = getClusterStyle(pointCount);

    return (
      <Marker
        coordinate={coordinate}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={[
          styles.cluster,
          {
            width: clusterStyle.size,
            height: clusterStyle.size,
            borderRadius: clusterStyle.size / 2,
            backgroundColor: clusterStyle.color,
          }
        ]}>
          <View style={styles.clusterInner}>
            <View style={styles.clusterTextContainer}>
              <View style={styles.clusterText}>
                {pointCount > 99 ? '99+' : pointCount}
              </View>
            </View>
          </View>
        </View>
      </Marker>
    );
  };

  const renderStationMarker = (station: ChargingStation) => {
    if (!station.AddressInfo?.Latitude || !station.AddressInfo?.Longitude) {
      return null;
    }

    const coordinate = {
      latitude: station.AddressInfo.Latitude,
      longitude: station.AddressInfo.Longitude,
    };

    const isSelected = selectedStation?.ID === station.ID;

    return (
      <Marker
        key={station.ID}
        coordinate={coordinate}
        onPress={() => onStationPress(station)}
        tracksViewChanges={false}
      >
        <StationMarker
          station={station}
          isSelected={isSelected}
          onPress={() => onStationPress(station)}
        />
      </Marker>
    );
  };

  const handleClusterPress = (cluster: any, markers: any[]) => {
    if (mapRef.current) {
      const coordinates = markers.map(marker => ({
        latitude: marker.coordinate.latitude,
        longitude: marker.coordinate.longitude,
      }));

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapViewClustering
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={lightMapStyle}
        clusterColor={colors.primary}
        clusterTextColor={colors.white}
        clusterBorderColor={colors.white}
        clusterBorderWidth={2}
        extent={50}
        nodeSize={64}
        minZoom={1}
        maxZoom={20}
        renderCluster={renderCluster}
        onClusterPress={handleClusterPress}
        minPoints={2}
        spiralEnabled={true}
        preserveClusterPressBehavior={true}
        tracksViewChanges={false}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Konumunuz"
            description="Şu anki konumunuz"
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
              <View style={styles.userLocationPulse} />
            </View>
          </Marker>
        )}

        {/* Station markers */}
        {stations.map((station) => (
          <React.Fragment key={station.ID}>
            {renderStationMarker(station)}
          </React.Fragment>
        ))}
      </MapViewClustering>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  cluster: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  clusterTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  clusterText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userLocationMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '30',
    borderWidth: 2,
    borderColor: colors.primary + '50',
  },
});

export default ClusteredMapView;
