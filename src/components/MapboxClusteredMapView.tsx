import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
  plannedRoute?: { 
    points?: Array<{ latitude: number; longitude: number; type?: string; title?: string; powerKW?: number }>;
    routeCoordinates?: [number, number][]; // Gerçek rota koordinatları
  } | null;
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
        properties: { 
          id: s.ID?.toString() || '0',
          stationId: s.ID,
          symbol: 'E'  // E for Electric - simple and clear
        },
      }));
    return {
      type: 'FeatureCollection',
      features: feats,
    } as const;
  }, [stations]);

  const routeFeature = useMemo(() => {
    // Önce gerçek rota koordinatlarını kontrol et
    if (plannedRoute?.routeCoordinates && plannedRoute.routeCoordinates.length >= 2) {
      console.log('Using real route coordinates:', plannedRoute.routeCoordinates.length, 'points');
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: plannedRoute.routeCoordinates,
        },
        properties: {},
      } as const;
    }
    
    // Fallback: düz çizgi rota
    const pts = plannedRoute?.points || [];
    if (pts.length < 2) return null;
    
    console.log('Using fallback direct route with', pts.length, 'points');
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
      const st = stations.find(s => s.ID?.toString() === stationId);
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

          {/* Unclustered stations as circles with enhanced design */}
          <MapboxGL.CircleLayer
            id="unclustered-points"
            filter={["!", ["has", "point_count"]]}
            style={{
              circleColor: isDarkMode ? colors.secondary : colors.success,
              circleRadius: 16,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 3,
              circleOpacity: 1.0,
            }}
          />

          {/* Selected station highlight */}
          <MapboxGL.CircleLayer
            id="selected-point"
            filter={selectedStation ? [
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'id'], selectedStation.ID?.toString() || '0']
            ] : ['==', ['literal', false], ['literal', true]]}
            style={{
              circleColor: colors.accent1,
              circleRadius: 20,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 4,
              circleOpacity: 1,
            }}
          />
        </MapboxGL.ShapeSource>

        {/* Planned route line */}
        {routeFeature && (
          <MapboxGL.ShapeSource id="route" shape={routeFeature as any}>
            {/* Ana rota çizgisi */}
            <MapboxGL.LineLayer
              id="route-line-casing"
              style={{
                lineColor: '#FFFFFF',
                lineWidth: 8,
                lineJoin: 'round',
                lineCap: 'round',
                lineOpacity: 0.8,
              }}
            />
            <MapboxGL.LineLayer
              id="route-line"
              style={{
                lineColor: '#4F46E5',
                lineWidth: 5,
                lineJoin: 'round',
                lineCap: 'round',
                lineOpacity: 1,
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Planned route charging stops */}
        {plannedRoute?.points?.filter(p => p.type === 'charging').map((stop, index) => (
          <MapboxGL.PointAnnotation
            key={`charging-stop-${index}`}
            id={`charging-stop-${index}`}
            coordinate={[stop.longitude, stop.latitude]}
          >
            <View style={styles.chargingStopMarker}>
              <Text style={styles.chargingStopText}>{index + 1}</Text>
              <Text style={styles.chargingStopEmoji}>⚡</Text>
            </View>
          </MapboxGL.PointAnnotation>
        ))}

        {/* Start point marker */}
        {plannedRoute?.points?.find(p => p.type === 'start') && (
          <MapboxGL.PointAnnotation
            id="route-start"
            coordinate={[
              plannedRoute.points.find(p => p.type === 'start')!.longitude,
              plannedRoute.points.find(p => p.type === 'start')!.latitude
            ]}
          >
            <View style={styles.startMarker}>
              <Text style={styles.startText}>S</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* End point marker */}
        {plannedRoute?.points?.find(p => p.type === 'destination') && (
          <MapboxGL.PointAnnotation
            id="route-end"
            coordinate={[
              plannedRoute.points.find(p => p.type === 'destination')!.longitude,
              plannedRoute.points.find(p => p.type === 'destination')!.latitude
            ]}
          >
            <View style={styles.endMarker}>
              <Text style={styles.endText}>F</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* User location custom marker */}
        {userLocation && (
          <MapboxGL.PointAnnotation
            id="user"
            coordinate={[userLocation.longitude, userLocation.latitude]}
          >
            <View style={styles.userLocationMarker}>
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
    justifyContent: 'center',
    width: 20,
    height: 20,
  },
  userLocationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 3,
    height: 20,
    width: 20,
  },
  chargingStopMarker: {
    backgroundColor: colors.warning,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  chargingStopNumber: {
    backgroundColor: colors.warning,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  chargingStopText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  chargingStopIcon: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chargingStopEmoji: {
    fontSize: 8,
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  startMarker: {
    backgroundColor: colors.success,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  endMarker: {
    backgroundColor: colors.error,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  endText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
});

export default MapboxClusteredMapView;
