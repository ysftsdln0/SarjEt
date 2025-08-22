import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import colors from '../constants/colors';
import { ChargingStation, Region, UserLocation } from '../types';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '');

type Props = {
  stations: ChargingStation[];
  userLocation: UserLocation | null;
  initialRegion: Region;
  onStationPress: (station: ChargingStation) => void;
  selectedStation: ChargingStation | null;
  isDarkMode?: boolean;
  plannedRoute?: { points?: Array<{ latitude: number; longitude: number; type?: string; title?: string; powerKW?: number }> } | null;
  centerTo?: { latitude: number; longitude: number; zoomLevel?: number } | null;
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
  centerTo,
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

  useEffect(() => {
    if (centerTo && centerTo.latitude && centerTo.longitude) {
      cameraRef.current?.setCamera({
        centerCoordinate: [centerTo.longitude, centerTo.latitude],
        zoomLevel: centerTo.zoomLevel ?? 12,
        animationDuration: 500,
      });
    }
  }, [centerTo]);

  const onSourcePress = async (e: any) => {
    const { features } = e;
    const feat = features && features[0];
    if (!feat || !feat.properties) return;
    if (feat.properties.cluster) {
      try {
        const zoom = await sourceRef.current?.getClusterExpansionZoom(feat);
        const [lon, lat] = feat.geometry.coordinates;
        cameraRef.current?.setCamera({ centerCoordinate: [lon, lat], zoomLevel: (zoom || 10) + 0.5, animationDuration: 400 });
      } catch {
        // noop
      }
    } else {
      const stationId = feat.properties.id;
      const st = stations.find(s => s.ID === stationId);
      if (st) onStationPress(st);
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

        {/* Clusters and unclustered points via layers */}
        <MapboxGL.ShapeSource
          id="stations-source"
          ref={sourceRef}
          cluster
          clusterRadius={60}
          shape={stationFeatures as any}
          onPress={onSourcePress}
        >
          <MapboxGL.CircleLayer
            id="cluster-circles"
            filter={["has", "point_count"]}
            style={{
              circleColor: colors.primary,
              circleRadius: [
                'step',
                ['get', 'point_count'],
                18, 20, 20, 50, 26, 100, 32
              ],
              circleOpacity: 0.95,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 3,
            }}
          />
          <MapboxGL.SymbolLayer
            id="cluster-counts"
            filter={["has", "point_count"]}
            style={{
              textField: ['to-string', ['get', 'point_count']],
              textSize: 16,
              textColor: colors.white,
              textIgnorePlacement: true,
              textAllowOverlap: true,
              textFont: ['Open Sans Bold'],
              textHaloColor: colors.primary,
              textHaloWidth: 1,
            }}
          />

          {/* Unclustered stations as circles */}
          <MapboxGL.CircleLayer
            id="unclustered-points"
            filter={["!", ["has", "point_count"]]}
            style={{
              circleColor: isDarkMode ? colors.secondary : colors.primary,
              circleRadius: 15,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 3,
              circleOpacity: 0.9,
            }}
          />

          {/* Selected station highlight */}
          {selectedStation && (
            <MapboxGL.CircleLayer
              id="selected-point"
              filter={[
                'all',
                ['!', ['has', 'point_count']],
                ['==', ['get', 'id'], selectedStation.ID]
              ] as any}
              style={{
                circleColor: colors.accent1,
                circleRadius: 15,
                circleStrokeColor: colors.white,
                circleStrokeWidth: 4,
                circleOpacity: 1,
              }}
            />
          )}
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
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  userLocationMarker: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  userLocationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 6,
    borderWidth: 3,
    height: 12,
    width: 12,
    zIndex: 2,
  },
  userLocationPulse: {
    backgroundColor: colors.primary + '30',
    borderColor: colors.primary + '50',
    borderRadius: 20,
    borderWidth: 2,
    height: 40,
    position: 'absolute',
    width: 40,
    zIndex: 1,
  },
});

export default MapboxClusteredMapView;
