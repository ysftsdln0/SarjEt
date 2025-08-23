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

  // Waypoint istasyonlarını stations array'ine ekle (görünür alan dışındaki waypoint'ler için)
  const enhancedStations = useMemo(() => {
    const waypointStations: ChargingStation[] = [];
    const waypointStops = plannedRoute?.points?.filter(p => p.type === 'waypoint') || [];
    
    console.log('=== WAYPOINT ENHANCEMENT DEBUG ===');
    console.log('Planned route exists:', !!plannedRoute);
    console.log('Planned route points:', plannedRoute?.points);
    console.log('Waypoint stops found:', waypointStops.length);
    console.log('Waypoint stops data:', waypointStops);
    
    for (const waypoint of waypointStops) {
      // Bu waypoint zaten stations içinde var mı?
      const existsInStations = stations.some(s => 
        s.AddressInfo?.Latitude === waypoint.latitude && 
        s.AddressInfo?.Longitude === waypoint.longitude
      );
      
      console.log(`Waypoint ${waypoint.title}: exists in stations = ${existsInStations}`);
      
      if (!existsInStations && waypoint.title) {
        // Waypoint için mock bir ChargingStation oluştur
        const waypointId = Math.floor(Math.random() * 999999) + 500000;
        const mockStation: ChargingStation = {
          ID: waypointId,
          UUID: `waypoint_${waypointId}`,
          DataProviderID: 999,
          OperatorID: 999,
          AddressInfo: {
            ID: waypointId + 1000000,
            Title: waypoint.title,
            AddressLine1: waypoint.title,
            Town: 'Waypoint',
            StateOrProvince: '',
            Postcode: '',
            CountryID: 229,
            Latitude: waypoint.latitude,
            Longitude: waypoint.longitude,
            Distance: 0
          },
          Connections: waypoint.powerKW ? [{ 
            ID: waypointId + 2000000,
            ConnectionTypeID: 25,
            PowerKW: waypoint.powerKW,
            LevelID: 2,
            CurrentTypeID: 20,
            Quantity: 1
          }] : [],
          NumberOfPoints: 1,
          StatusTypeID: 50,
          GeneralComments: 'Rota planlama waypoint istasyonu',
          UserComments: [],
          MediaItems: [],
          IsRecentlyVerified: true
        };
        waypointStations.push(mockStation);
        console.log('Created mock station for waypoint:', mockStation);
      }
    }
    
    // Test için Manuel waypoint istasyonları ekle (Harita dışında)
    const testWaypoints: ChargingStation[] = [
      {
        ID: 900001,
        UUID: 'test_waypoint_1',
        DataProviderID: 999,
        OperatorID: 999,
        AddressInfo: {
          ID: 900001,
          Title: 'TEST Waypoint İstasyon - Ankara',
          AddressLine1: 'Test Adresi',
          Town: 'Ankara',
          StateOrProvince: 'Ankara',
          Postcode: '06000',
          CountryID: 229,
          Latitude: 39.9208,
          Longitude: 32.8541,
          Distance: 0
        },
        Connections: [{
          ID: 900001,
          ConnectionTypeID: 25,
          PowerKW: 50,
          LevelID: 3,
          CurrentTypeID: 30,
          Quantity: 2
        }],
        NumberOfPoints: 1,
        StatusTypeID: 50,
        GeneralComments: 'Test waypoint istasyonu - Ankara',
        UserComments: [],
        MediaItems: [],
        IsRecentlyVerified: true
      },
      {
        ID: 900002,
        UUID: 'test_waypoint_2',
        DataProviderID: 999,
        OperatorID: 999,
        AddressInfo: {
          ID: 900002,
          Title: 'TEST Waypoint İstasyon - İzmir',
          AddressLine1: 'Test Adresi',
          Town: 'İzmir',
          StateOrProvince: 'İzmir',
          Postcode: '35000',
          CountryID: 229,
          Latitude: 38.4192,
          Longitude: 27.1287,
          Distance: 0
        },
        Connections: [{
          ID: 900002,
          ConnectionTypeID: 33,
          PowerKW: 75,
          LevelID: 3,
          CurrentTypeID: 30,
          Quantity: 1
        }],
        NumberOfPoints: 1,
        StatusTypeID: 50,
        GeneralComments: 'Test waypoint istasyonu - İzmir',
        UserComments: [],
        MediaItems: [],
        IsRecentlyVerified: true
      }
    ];
    
    console.log('Created', waypointStations.length, 'waypoint stations from route');
    console.log('Adding', testWaypoints.length, 'test waypoint stations');
    console.log('=== END WAYPOINT DEBUG ===');
    
    console.log('Created', waypointStations.length, 'waypoint stations from route');
    console.log('Adding', testWaypoints.length, 'test waypoint stations');
    console.log('=== END WAYPOINT DEBUG ===');
    
    // Orijinal stations ile waypoint stations'ları ve test stations'ları birleştir
    return [...stations, ...waypointStations, ...testWaypoints];
  }, [stations, plannedRoute?.points]);

  const stationFeatures = useMemo(() => {
    // enhancedStations kullan (waypoint mock'ları dahil)
    const feats = enhancedStations
      .filter(s => !!s.AddressInfo?.Latitude && !!s.AddressInfo?.Longitude)
      .map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.AddressInfo!.Longitude!, s.AddressInfo!.Latitude!] },
        properties: { 
          id: s.ID?.toString() || '0',
          stationId: s.ID,
          symbol: 'E',  // E for Electric - simple and clear
          isWaypoint: s.DataProviderID === 999 // Waypoint mock istasyonlarını işaretle
        },
      }));
    return {
      type: 'FeatureCollection',
      features: feats,
    } as const;
  }, [enhancedStations]);

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
      // enhancedStations içinden ara (waypoint mock'ları dahil)
      const st = enhancedStations.find(s => s.ID?.toString() === stationId);
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

          {/* Waypoint mock stations with different styling */}
          <MapboxGL.CircleLayer
            id="waypoint-points"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'isWaypoint'], true]
            ]}
            style={{
              circleColor: colors.warning,
              circleRadius: 18,
              circleStrokeColor: colors.white,
              circleStrokeWidth: 4,
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
            ] : [
              '==', 
              ['get', 'id'], 
              'NO_SELECTION'
            ]}
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

        {/* TEST MARKER - Geçici olarak kapalı */}
        {false && (
          <MapboxGL.PointAnnotation
            key="test-marker"
            id="test-marker"
            coordinate={[30.7030242, 36.8865728]} // Antalya yakınları
          >
            <View style={{
              backgroundColor: 'red',
              width: 30,
              height: 30,
              borderRadius: 15,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>T</Text>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* Planned route charging stops - Geçici olarak kapalı */}
        {false && (() => {
          // RoutePoint type'ında 'charging' yok, 'waypoint' var (bu şarj istasyonları)
          const chargingStops = plannedRoute?.points?.filter(p => p.type === 'waypoint') || [];
          console.log('=== MAPBOX CHARGING STOPS DEBUG ===');
          console.log('Planned route exists:', !!plannedRoute);
          console.log('Planned route points:', plannedRoute?.points);
          console.log('All points count:', plannedRoute?.points?.length || 0);
          console.log('Points types:', plannedRoute?.points?.map(p => ({ type: p.type, title: p.title })));
          console.log('Waypoint stops (charging) count:', chargingStops.length);
          console.log('Waypoint stops (charging):', chargingStops);
          console.log('=== END DEBUG ===');
          
          return chargingStops.map((stop, index) => {
            console.log(`Rendering charging stop ${index}:`, stop);
            return (
              <MapboxGL.PointAnnotation
                key={`charging-stop-${index}`}
                id={`charging-stop-${index}`}
                coordinate={[stop.longitude, stop.latitude]}
              >
                <View style={styles.chargingStopMarker}>
                  <Text style={styles.chargingStopText}>⚡{index + 1}</Text>
                </View>
              </MapboxGL.PointAnnotation>
            );
          });
        })()}

        {/* Start point marker - Geçici olarak kapalı */}
        {false && plannedRoute?.points?.find(p => p.type === 'start') && (
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

        {/* End point marker - Geçici olarak kapalı */}
        {false && plannedRoute?.points?.find(p => p.type === 'destination') && (
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

        {/* User location custom marker - Geçici olarak kapalı */}
        {false && userLocation && (
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
  chargingStopIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  chargingStopMarker: {
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 40,
  },
  chargingStopNumber: {
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    marginBottom: 2,
    width: 24,
  },
  chargingStopText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  container: { flex: 1 },
  endMarker: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 40,
  },
  endText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  startMarker: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 40,
  },
  startText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  userLocationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 10,
    borderWidth: 3,
    height: 20,
    width: 20,
  },
  userLocationMarker: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
});

export default MapboxClusteredMapView;
