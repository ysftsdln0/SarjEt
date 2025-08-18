import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import colors from '../constants/colors';
import { ChargingStation, Region, UserLocation } from '../types';
import StationMarker from './StationMarker';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

type Props = {
  stations: ChargingStation[];
  userLocation: UserLocation | null;
  initialRegion: Region;
  onStationPress: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  isDarkMode?: boolean;
  plannedRoute?: { points?: Array<{ latitude: number; longitude: number; type?: string; title?: string; powerKW?: number }> } | null;
};

function deltasToZoom(lonDelta: number, screenWidth: number): number {
  // Approximate: world width 360 degrees -> zoom 0; double per zoom level
  const worldPixels = screenWidth; // not exact, but good enough for an initial camera
  const ratio = 360 / Math.max(lonDelta, 0.0001);
  const zoom = Math.log2(ratio * (worldPixels / screenWidth));
  // Clamp 2..16
  return Math.max(2, Math.min(16, zoom));
}

const MapboxClusteredMapView: React.FC<Props> = ({
  stations,
  userLocation,
  initialRegion,
  onStationPress,
  selectedStation,
  isDarkMode = false,
  plannedRoute,
}) => {
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const sourceRef = useRef<MapboxGL.ShapeSource>(null);

  const center = useMemo(() => [initialRegion.longitude, initialRegion.latitude] as [number, number], [initialRegion]);
  const zoomLevel = useMemo(
    () => deltasToZoom(initialRegion.longitudeDelta || 0.05, 375),
    [initialRegion.longitudeDelta]
  );

  const stationFeatures = useMemo(() => {
    const feats = stations
      .filter(s => !!s.AddressInfo?.Latitude && !!s.AddressInfo?.Longitude)
      .map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.AddressInfo!.Longitude!, s.AddressInfo!.Latitude!] },
        properties: { id: s.ID },
      }));
    return {
      type: 'FeatureCollection',
      features: feats,
    } as const;
  }, [stations]);

  const routeFeature = useMemo(() => {
    const pts = plannedRoute?.points || [];
    if (pts.length < 2) return null;
    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: pts.map(p => [p.longitude, p.latitude]),
      },
      properties: {},
    } as const;
  }, [plannedRoute]);

  const onClusterPress = async (e: any) => {
    const { features } = e;
    const cluster = features && features[0];
    if (!cluster || !cluster.properties || !cluster.properties.cluster) return;
    try {
      const zoom = await sourceRef.current?.getClusterExpansionZoom(cluster);
      const [lon, lat] = cluster.geometry.coordinates;
      cameraRef.current?.setCamera({ centerCoordinate: [lon, lat], zoomLevel: (zoom || 10) + 0.5, animationDuration: 400 });
    } catch (err) {
      // noop
    }
  };

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFill}
        styleURL={isDarkMode ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
        logoEnabled={false}
        compassEnabled
      >
        <MapboxGL.Camera ref={cameraRef} centerCoordinate={center} zoomLevel={zoomLevel} />

        {/* Clusters (only clusters rendered; unclustered points will be our custom PointAnnotations below) */}
        <MapboxGL.ShapeSource
          id="stations-source"
          ref={sourceRef}
          cluster
          clusterRadius={50}
          shape={stationFeatures as any}
          onPress={onClusterPress}
        >
          <MapboxGL.CircleLayer
            id="cluster-circles"
            filter={["has", "point_count"]}
            style={{
              circleColor: colors.primary,
              circleRadius: [
                'step',
                ['get', 'point_count'],
                16, 20, 20, 50, 24, 100, 28
              ],
              circleOpacity: 0.9,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 2,
            }}
          />
          <MapboxGL.SymbolLayer
            id="cluster-counts"
            filter={["has", "point_count"]}
            style={{
              textField: ['to-string', ['get', 'point_count']],
              textSize: 12,
              textColor: colors.white,
              textIgnorePlacement: true,
              textAllowOverlap: true,
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Planned route line */}
        {routeFeature && (
          <MapboxGL.ShapeSource id="route" shape={routeFeature as any}>
            <MapboxGL.LineLayer
              id="route-line"
              style={{ lineColor: '#4F46E5', lineWidth: 5, lineJoin: 'round', lineCap: 'round' }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* User location custom marker */}
        {userLocation && (
          <MapboxGL.PointAnnotation
            id="user"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
              <View style={styles.userLocationPulse} />
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Station markers as custom views to keep the same UI */}
        {(stations || []).map((station) => {
          const lat = station.AddressInfo?.Latitude;
          const lon = station.AddressInfo?.Longitude;
          if (!lat || !lon) return null;
          const isSelected = selectedStation?.ID === station.ID;
          return (
            <MapboxGL.PointAnnotation
              key={`st-${station.ID}`}
              id={`st-${station.ID}`}
              coordinate={[lon, lat]}
              onSelected={() => onStationPress(station)}
            >
              <StationMarker station={station} isSelected={isSelected} onPress={() => onStationPress(station)} />
            </MapboxGL.PointAnnotation>
          );
        })}
      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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

export default MapboxClusteredMapView;
