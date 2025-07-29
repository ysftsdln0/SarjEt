import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE, 
  Region
} from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';
import { ChargingStation, UserLocation } from '../types';
import { StationMarker } from './StationMarker';
import colors from '../constants/colors';

interface ClusteredMapViewProps {
  stations: ChargingStation[];
  userLocation: UserLocation | null;
  initialRegion: Region;
  onStationPress: (station: ChargingStation) => void;
  onRegionChange?: (region: Region) => void;
  isDarkMode?: boolean;
}

const { width, height } = Dimensions.get('window');

export const ClusteredMapView: React.FC<ClusteredMapViewProps> = ({
  stations,
  userLocation,
  initialRegion,
  onStationPress,
  onRegionChange,
  isDarkMode = false
}) => {
  const mapRef = useRef<MapView>(null);

  // Custom cluster marker renderer
  const renderCluster = useCallback((cluster: { id: string; geometry: { coordinates: [number, number] }; properties: { point_count: number } }) => {
    const { geometry, properties } = cluster;
    const points = properties.point_count;
    
    // Determine cluster size and color based on point count
    const getClusterStyle = (count: number) => {
      if (count >= 100) {
        return {
          size: 70,
          backgroundColor: colors.error,
          borderColor: colors.gray300,
        };
      } else if (count >= 25) {
        return {
          size: 60,
          backgroundColor: colors.warning,
          borderColor: colors.gray300,
        };
      } else if (count >= 10) {
        return {
          size: 50,
          backgroundColor: colors.primary,
          borderColor: colors.gray300,
        };
      } else {
        return {
          size: 40,
          backgroundColor: colors.success,
          borderColor: colors.gray300,
        };
      }
    };

    const clusterStyle = getClusterStyle(points);

    return (
      <Marker
        key={`cluster-${geometry.coordinates[0]}-${geometry.coordinates[1]}`}
        coordinate={{
          longitude: geometry.coordinates[0],
          latitude: geometry.coordinates[1],
        }}
      >
        <View style={[
          styles.cluster,
          {
            width: clusterStyle.size,
            height: clusterStyle.size,
            backgroundColor: clusterStyle.backgroundColor,
            borderColor: clusterStyle.borderColor,
          }
        ]}>
          <Text style={[
            styles.clusterText,
            { fontSize: clusterStyle.size * 0.25 }
          ]}>
            {points}
          </Text>
        </View>
      </Marker>
    );
  }, []);

  // Custom station marker renderer
  const renderMarker = useCallback((station: ChargingStation) => {
    if (!station.AddressInfo) return null;

    return (
      <StationMarker
        key={`station-${station.ID}`}
      />
    );
  }, [onStationPress]);

  // User location marker
  const renderUserLocation = useCallback(() => {
    if (!userLocation) return null;

    return (
      <Marker
        key="user-location"
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        title="Konumunuz"
        description="Mevcut konum"
      >
        <View style={styles.userLocationMarker}>
          <View style={styles.userLocationInner} />
        </View>
      </Marker>
    );
  }, [userLocation]);

  const handleRegionChangeComplete = useCallback((region: Region) => {
    onRegionChange?.(region);
  }, [onRegionChange]);

  return (
    <View style={styles.container}>
      <MapViewClustering
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false} // We'll handle user location manually
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        loadingEnabled={true}
        toolbarEnabled={false}
        // Clustering configuration
        clusteringEnabled={true}
        clusterColor={colors.primary}
        clusterTextColor={colors.white}
        clusterFontFamily="System"
        radius={50} // Clustering radius in pixels
        maxZoom={15} // Max zoom level before clusters split
        minZoom={3} // Min zoom level
        extent={512} // Tile extent (defaults to 512)
        nodeSize={64} // Size of the KD-tree leaf node
        // Custom cluster marker
        renderCluster={renderCluster}
        // Animation settings
        animationEnabled={true}
        preserveClusterPressBehavior={false}
        // Map style for dark mode
        customMapStyle={isDarkMode ? darkMapStyle : []}
      >
        {/* Render individual station markers when not clustered */}
        {stations.map(renderMarker)}
        
        {/* Render user location */}
        {renderUserLocation()}
      </MapViewClustering>
    </View>
  );
};

const styles = StyleSheet.create({
  cluster: {
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 3,
    elevation: 5,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clusterText: {
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  map: {
    height: height,
    width: width,
  },
  userLocationInner: {
    backgroundColor: colors.white,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  userLocationMarker: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 3,
    elevation: 5,
    height: 20,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 20,
  },
});

// Dark mode map style (you can customize this further)
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#242f3e',
      },
    ],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#242f3e',
      },
    ],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#746855',
      },
    ],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [
      {
        color: '#263c3f',
      },
    ],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#6b9a76',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#38414e',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#212a37',
      },
    ],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#9ca5b3',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      {
        color: '#746855',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [
      {
        color: '#1f2835',
      },
    ],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#f3d19c',
      },
    ],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      {
        color: '#2f3948',
      },
    ],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#d59563',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      {
        color: '#17263c',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [
      {
        color: '#515c6d',
      },
    ],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [
      {
        color: '#17263c',
      },
    ],
  },
];
