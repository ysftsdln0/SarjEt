import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';
import { LocationService } from '../services/locationService';
import { planRoute, PlanRouteRequest, PlannedRoutePoint } from '../services/routeService';
import { getRouteWithStops } from '../services/directionsService';
import { getPrimaryVehicle, PrimaryVehicle } from '../services/userVehicleService';

export interface RoutePoint {
  id: string;
  name: string;
  type: 'start' | 'destination' | 'waypoint';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  chargingStation?: ChargingStation;
}

export interface RouteInfo {
  distance: number;
  duration: number;
  transportMode: 'driving' | 'walking' | 'bicycling' | 'transit';
  waypoints: RoutePoint[];
  estimatedCost?: number;
  chargingStops: number;
  routeCoordinates?: [number, number][]; // Mapbox directions için gerçek rota koordinatları
}

interface RoutePlanningProps {
  visible: boolean;
  onClose: () => void;
  onRouteCreated: (route: RouteInfo) => void;
  userLocation: { latitude: number; longitude: number } | null;
  stations: ChargingStation[];
  presetDestination?: { name: string; latitude: number; longitude: number } | null;
  authToken?: string; // Token'ı props olarak al
}

const RoutePlanning: React.FC<RoutePlanningProps> = ({
  visible,
  onClose,
  onRouteCreated,
  userLocation,
  stations,
  presetDestination,
  authToken,
}) => {
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [waypoints, setWaypoints] = useState<RoutePoint[]>([]);
  const transportMode = 'driving'; // Sabit olarak araç modu
  const [selectedStations, setSelectedStations] = useState<ChargingStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<any>(null);
  
  // User vehicle data - otomatik olarak yüklenir
  const [userVehicle, setUserVehicle] = useState<PrimaryVehicle | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  
  // Sadece batarya yüzdeleri kullanıcıdan alınır
  const [currentSoC, setCurrentSoC] = useState<string>('80'); // %
  const [desiredArrivalSoC, setDesiredArrivalSoC] = useState<string>('20'); // %

  const transportModes = [
    { key: 'driving', label: 'Araç', icon: 'car', color: colors.primary },
    { key: 'walking', label: 'Yürüme', icon: 'footsteps', color: colors.success },
    { key: 'bicycling', label: 'Bisiklet', icon: 'bicycle', color: colors.warning },
    { key: 'transit', label: 'Toplu Taşıma', icon: 'bus', color: colors.secondary },
  ];

  useEffect(() => {
    if (userLocation) {
      setStartPoint({
        id: 'user-location',
        name: 'Mevcut Konum',
        type: 'start',
        coordinates: userLocation,
      });
    }
  }, [userLocation]);

  // Kullanıcının araç bilgilerini yükle
  useEffect(() => {
    if (visible && authToken) {
      loadUserVehicle();
    }
  }, [visible, authToken]);

  const loadUserVehicle = async () => {
    if (!authToken) return;
    
    setVehicleLoading(true);
    try {
      const vehicle = await getPrimaryVehicle(authToken);
      setUserVehicle(vehicle);
      // Mevcut batarya seviyesini araçtan al
      if (vehicle.currentBatteryLevel) {
        setCurrentSoC(vehicle.currentBatteryLevel.toString());
      }
    } catch (error) {
      console.error('Araç bilgileri yüklenirken hata:', error);
      Alert.alert(
        'Araç Bilgileri',
        'Araç bilgileriniz yüklenemedi. Lütfen profil ayarlarınızdan bir araç ekleyin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setVehicleLoading(false);
    }
  };

  useEffect(() => {
    if (visible && presetDestination) {
      setDestination({
        id: 'preset-destination',
        name: presetDestination.name,
        type: 'destination',
        coordinates: {
          latitude: presetDestination.latitude,
          longitude: presetDestination.longitude,
        },
      });
    }
    
    // Kullanıcının mevcut konumunu başlangıç noktası olarak otomatik seç
    if (visible && userLocation && !startPoint) {
      setStartPoint({
        id: 'current-location',
        name: 'Mevcut Konum',
        type: 'start',
        coordinates: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
      });
    }
  }, [visible, presetDestination, userLocation, startPoint]);

  const handleStationSelect = (station: ChargingStation) => {
    if (!destination) {
      setDestination({
        id: station.ID.toString(),
        name: station.AddressInfo?.Title || 'İstasyon',
        type: 'destination',
        coordinates: {
          latitude: station.AddressInfo?.Latitude || 0,
          longitude: station.AddressInfo?.Longitude || 0,
        },
        chargingStation: station,
      });
    } else {
      // Waypoint olarak ekle
      const newWaypoint: RoutePoint = {
        id: station.ID.toString(),
        name: station.AddressInfo?.Title || 'İstasyon',
        type: 'waypoint',
        coordinates: {
          latitude: station.AddressInfo?.Latitude || 0,
          longitude: station.AddressInfo?.Longitude || 0,
        },
        chargingStation: station,
      };
      setWaypoints(prev => [...prev, newWaypoint]);
      setSelectedStations(prev => [...prev, station]);
    }
  };

  const removeWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
    setSelectedStations(prev => prev.filter(station => station.ID.toString() !== id));
  };

  const calculateRoute = async () => {
    if (!startPoint || !destination) {
      Alert.alert('Hata', 'Başlangıç ve hedef noktaları seçilmelidir.');
      return;
    }

    if (!userVehicle) {
      Alert.alert('Hata', 'Araç bilgileri yüklenmelidir. Lütfen profil ayarlarınızdan bir araç ekleyin.');
      return;
    }

    setIsLoading(true);
    try {
      // Flowchart'a göre backend route planner'ı çağır - araç bilgilerini otomatik al
      const request: PlanRouteRequest = {
        start: {
          latitude: startPoint.coordinates.latitude,
          longitude: startPoint.coordinates.longitude
        },
        end: {
          latitude: destination.coordinates.latitude,
          longitude: destination.coordinates.longitude
        },
        vehicle: {
          maxRangeKm: userVehicle.range // Kullanıcının aracının menzili
        },
        currentSocPercent: parseInt(currentSoC) || 80,
        reservePercent: 10, // Sabit değer
        chargeAfterStopPercent: 80, // Sabit değer 
        corridorKm: 30, // Sabit değer
        maxStops: 8 // Sabit değer
      };

      const response = await planRoute(request);
      
      if (response.success && response.data) {
        setRouteResult(response.data);
        
        console.log('=== BACKEND RESPONSE DEBUG ===');
        console.log('Full response:', JSON.stringify(response.data, null, 2));
        console.log('Points array:', response.data.points);
        console.log('Points count:', response.data.points?.length);
        console.log('=== END DEBUG ===');
        
        // Backend'den gelen noktaları RoutePoint formatına çevir
        const routeWaypoints: RoutePoint[] = (response.data.points || [])
          .filter(p => p.type === 'charging')
          .map((point, index) => {
            console.log('Processing charging point:', point);
            return {
              id: point.stationId?.toString() || `waypoint-${index}`,
              name: point.title || 'Şarj İstasyonu',
              type: 'waypoint' as const,
              coordinates: {
                latitude: point.latitude,
                longitude: point.longitude
              }
            };
          });

        console.log('Route planning successful, getting real road route...');
        console.log('Processed route waypoints:', routeWaypoints);
        
        // Mapbox Directions API'den gerçek yol rotasını al
        const chargingStops = (response.data.points || [])
          .filter(p => p.type === 'charging')
          .map(p => ({ 
            latitude: p.latitude, 
            longitude: p.longitude, 
            title: p.title || 'Şarj İstasyonu'
          }));

        console.log('Charging stops for directions:', chargingStops);

        const directionsResult = await getRouteWithStops(
          startPoint.coordinates,
          destination.coordinates,
          chargingStops
        );

        const mockRoute: RouteInfo = {
          distance: directionsResult?.distance ? directionsResult.distance / 1000 : response.data.summary.distanceKm, // m'den km'ye çevir
          duration: directionsResult?.duration ? directionsResult.duration / 60 : response.data.summary.durationMin, // s'den dk'ya çevir
          transportMode,
          waypoints: [startPoint, ...routeWaypoints, destination],
          estimatedCost: 0, // Araç için her zaman 0
          chargingStops: response.data.summary.chargingStops,
          routeCoordinates: directionsResult?.coordinates || undefined, // Gerçek rota koordinatları
        };

        // Backend'den gelen waypoint'leri local state'e de ekle (Google Maps için)
        setWaypoints(routeWaypoints);

        console.log('Route created with real coordinates:', mockRoute.routeCoordinates?.length, 'points');
        console.log('Updated waypoints state for Google Maps:', routeWaypoints);

        onRouteCreated(mockRoute);
        onClose();
      } else {
        Alert.alert('Hata', response.error || 'Rota hesaplanırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Route planning error:', error);
      Alert.alert('Hata', 'Rota hesaplanırken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const openInMaps = async () => {
    if (!startPoint || !destination) return;
    const way = waypoints.map(w => w.coordinates);
    const url = LocationService.getDirectionsUrlMulti(startPoint.coordinates, destination.coordinates, way);
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Hata', 'Harita uygulaması açılamadı.');
    }
  };

  const getTransportModeIcon = (mode: string) => {
    const modeInfo = transportModes.find(m => m.key === mode);
    return modeInfo?.icon || 'car';
  };

  const getTransportModeColor = (mode: string) => {
    const modeInfo = transportModes.find(m => m.key === mode);
    return modeInfo?.color || colors.primary;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Rota Planlama</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              style={[styles.createButton, (!startPoint || !destination) && styles.createButtonDisabled]} 
              onPress={calculateRoute}
              disabled={!startPoint || !destination || isLoading}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? 'Hesaplanıyor...' : 'Oluştur'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createButton, (!startPoint || !destination) && styles.createButtonDisabled]} 
              onPress={openInMaps}
              disabled={!startPoint || !destination}
            >
              <Text style={styles.createButtonText}>Yolculuğa Başla</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Vehicle and Battery Settings - Güzelleştirilmiş tasarım */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Araç ve Batarya Ayarları</Text>
            
            {/* Vehicle Info Display */}
            {vehicleLoading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="car" size={24} color={colors.primary} />
                <Text style={styles.loadingText}>Araç bilgileri yükleniyor...</Text>
              </View>
            ) : userVehicle ? (
              <View style={styles.vehicleInfoCard}>
                <View style={styles.vehicleHeader}>
                  <Ionicons name="car-sport" size={24} color={colors.primary} />
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.vehicleTitle}>
                      {userVehicle.brand} {userVehicle.model}
                    </Text>
                    <Text style={styles.vehicleSubtitle}>
                      {userVehicle.variant} ({userVehicle.year})
                    </Text>
                  </View>
                </View>
                <View style={styles.vehicleSpecs}>
                  <View style={styles.specItem}>
                    <Ionicons name="speedometer" size={16} color={colors.gray600} />
                    <Text style={styles.specText}>{userVehicle.range} km</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Ionicons name="battery-charging" size={16} color={colors.gray600} />
                    <Text style={styles.specText}>{userVehicle.batteryCapacity} kWh</Text>
                  </View>
                </View>
                {userVehicle.nickname && (
                  <View style={styles.nicknameContainer}>
                    <Ionicons name="heart" size={14} color={colors.primary} />
                    <Text style={styles.vehicleNickname}>"{userVehicle.nickname}"</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noVehicleCard}>
                <Ionicons name="warning" size={24} color={colors.warning} />
                <Text style={styles.noVehicleText}>
                  Araç bilgileri bulunamadı. Lütfen profil ayarlarınızdan bir araç ekleyin.
                </Text>
              </View>
            )}
            
            {/* Enhanced Battery Settings */}
            <View style={styles.batterySettingsCard}>
              <Text style={styles.batterySettingsTitle}>Batarya Ayarları</Text>
              
              <View style={styles.batteryInputsContainer}>
                <View style={styles.batteryInputCard}>
                  <View style={styles.batteryInputHeader}>
                    <Ionicons name="battery-half" size={20} color={colors.success} />
                    <Text style={styles.batteryInputLabel}>Mevcut Batarya</Text>
                  </View>
                  <View style={styles.batteryInputWrapper}>
                    <TextInput
                      style={styles.batteryInput}
                      value={currentSoC}
                      onChangeText={setCurrentSoC}
                      keyboardType="numeric"
                      placeholder="80"
                      maxLength={3}
                    />
                    <Text style={styles.batteryUnit}>%</Text>
                  </View>
                  <View style={styles.batteryProgressBar}>
                    <View 
                      style={[
                        styles.batteryProgress, 
                        { width: `${Math.min(parseInt(currentSoC) || 0, 100)}%` }
                      ]} 
                    />
                  </View>
                </View>
                
                <View style={styles.batteryInputCard}>
                  <View style={styles.batteryInputHeader}>
                    <Ionicons name="flag" size={20} color={colors.primary} />
                    <Text style={styles.batteryInputLabel}>Varış Bataryası</Text>
                  </View>
                  <View style={styles.batteryInputWrapper}>
                    <TextInput
                      style={styles.batteryInput}
                      value={desiredArrivalSoC}
                      onChangeText={setDesiredArrivalSoC}
                      keyboardType="numeric"
                      placeholder="20"
                      maxLength={3}
                    />
                    <Text style={styles.batteryUnit}>%</Text>
                  </View>
                  <View style={styles.batteryProgressBar}>
                    <View 
                      style={[
                        styles.batteryProgress, 
                        { 
                          width: `${Math.min(parseInt(desiredArrivalSoC) || 0, 100)}%`,
                          backgroundColor: colors.primary 
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Route Points */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rota Noktaları</Text>
            
            {/* Start Point */}
            <View style={styles.routePoint}>
              <View style={[styles.pointIcon, { backgroundColor: colors.success }]}>
                <Ionicons name="location" size={16} color={colors.white} />
              </View>
              <View style={styles.pointInfo}>
                <Text style={styles.pointName}>
                  {startPoint?.name || 'Başlangıç noktası seçilmedi'}
                </Text>
                <Text style={styles.pointType}>Başlangıç</Text>
              </View>
            </View>

            {/* Waypoints */}
            {waypoints.map((waypoint, index) => (
              <View key={waypoint.id} style={styles.routePoint}>
                <View style={[styles.pointIcon, { backgroundColor: colors.warning }]}>
                  <Text style={styles.waypointNumber}>{index + 1}</Text>
                </View>
                <View style={styles.pointInfo}>
                  <Text style={styles.pointName}>{waypoint.name}</Text>
                  <Text style={styles.pointType}>Şarj İstasyonu</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => removeWaypoint(waypoint.id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Destination */}
            <View style={styles.routePoint}>
              <View style={[styles.pointIcon, { backgroundColor: colors.error }]}>
                <Ionicons name="flag" size={16} color={colors.white} />
              </View>
              <View style={styles.pointInfo}>
                <Text style={styles.pointName}>
                  {destination?.name || 'Hedef nokta seçilmedi'}
                </Text>
                <Text style={styles.pointType}>Hedef</Text>
              </View>
            </View>
          </View>

          {/* Available Stations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mevcut İstasyonlar</Text>
            <Text style={styles.sectionSubtitle}>
              Rota üzerine istasyon eklemek için tıklayın
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stationsScroll}>
              {stations.map((station) => (
                <TouchableOpacity
                  key={station.ID}
                  style={[
                    styles.stationCard,
                    selectedStations.some(s => s.ID === station.ID) && styles.stationCardSelected,
                  ]}
                  onPress={() => handleStationSelect(station)}
                >
                  <View style={styles.stationCardHeader}>
                    <Text style={styles.stationCardName} numberOfLines={2}>
                      {station.AddressInfo?.Title || 'İsimsiz İstasyon'}
                    </Text>
                    <View style={styles.stationCardType}>
                      <Ionicons name="flash" size={16} color={colors.primary} />
                      <Text style={styles.stationCardTypeText}>DC</Text>
                    </View>
                  </View>
                  <Text style={styles.stationCardDistance}>
                    {station.AddressInfo?.Distance?.toFixed(1) || '0'} km
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Route Preview */}
          {(startPoint && destination) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rota Önizlemesi</Text>
              <View style={styles.routePreview}>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="map" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Mesafe:</Text>
                  <Text style={styles.routeInfoValue}>
                    {routeResult ? `${routeResult.summary.distanceKm} km` : '~25.5 km'}
                  </Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Süre:</Text>
                  <Text style={styles.routeInfoValue}>
                    {routeResult ? `${routeResult.summary.durationMin} dk` : '~45 dk'}
                  </Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="battery-charging" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Şarj Durakları:</Text>
                  <Text style={styles.routeInfoValue}>
                    {routeResult ? routeResult.summary.chargingStops : waypoints.length}
                  </Text>
                </View>
                {/* Toplu taşıma modu kaldırıldı */}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
  },
  closeButton: {
    padding: 4,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 16,
  },
  transportModesGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  transportModeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: colors.white,
  },
  transportModeActive: {
    backgroundColor: colors.primary,
  },
  transportModeLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray600,
  },
  transportModeLabelActive: {
    color: colors.white,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 8,
  },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  waypointNumber: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  pointInfo: {
    flex: 1,
  },
  pointName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
  },
  pointType: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  stationsScroll: {
    marginTop: 12,
  },
  stationCard: {
    width: 160,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stationCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  stationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationCardName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    flex: 1,
    marginRight: 8,
  },
  stationCardType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationCardTypeText: {
    fontSize: 12,
    color: colors.primary,
    marginLeft: 4,
  },
  stationCardDistance: {
    fontSize: 12,
    color: colors.gray600,
  },
  routePreview: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfoLabel: {
    fontSize: 14,
    color: colors.gray600,
    marginLeft: 8,
    marginRight: 8,
  },
  routeInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
    marginLeft: 'auto',
  },
  // Yeni eklenen stiller - Vehicle Settings için
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  settingItem: {
    flex: 1,
    minWidth: '45%',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  // Yeni stiller - Basitleştirilmiş araç ve batarya ayarları için
  loadingText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    padding: 16,
  },
  vehicleInfo: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  vehicleNickname: {
    fontSize: 14,
    color: colors.primary,
    fontStyle: 'italic',
  },
  noVehicleInfo: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  noVehicleText: {
    fontSize: 14,
    color: colors.warning,
    textAlign: 'center',
  },
  batterySettings: {
    flexDirection: 'row',
    gap: 12,
  },
  batterySettingItem: {
    flex: 1,
  },
  batteryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 8,
  },
  batteryInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.white,
    textAlign: 'center',
  },
  // Yeni güzelleştirilmiş stiller
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 16,
  },
  vehicleInfoCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleDetails: {
    marginLeft: 12,
    flex: 1,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  vehicleSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  specText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginLeft: 6,
  },
  nicknameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  noVehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  batterySettingsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  batterySettingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  batteryInputsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  batteryInputCard: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  batteryInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  batteryInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.black,
    marginLeft: 8,
  },
  batteryInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  batteryUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray600,
    marginLeft: 8,
  },
  batteryProgressBar: {
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  batteryProgress: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
});

export default RoutePlanning; 