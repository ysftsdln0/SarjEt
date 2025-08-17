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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';
import { planRoute as planSmartRoute, PlanRouteResponse } from '../services/routeService';

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
}

interface RoutePlanningProps {
  visible: boolean;
  onClose: () => void;
  onRouteCreated: (route: RouteInfo) => void;
  userLocation: { latitude: number; longitude: number } | null;
  stations: ChargingStation[];
  // Optional preselected destination from main search
  initialDestination?: { name: string; latitude: number; longitude: number } | null;
}

const RoutePlanning: React.FC<RoutePlanningProps> = ({
  visible,
  onClose,
  onRouteCreated,
  userLocation,
  stations,
  initialDestination,
}) => {
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [waypoints, setWaypoints] = useState<RoutePoint[]>([]);
  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving');
  const [selectedStations, setSelectedStations] = useState<ChargingStation[]>([]);
  // EV-specific planning inputs
  const [vehicleRangeKm, setVehicleRangeKm] = useState<string>('300');
  const [currentSocPercent, setCurrentSocPercent] = useState<string>('80');
  const [reservePercent, setReservePercent] = useState<string>('10');
  const [planning, setPlanning] = useState(false);
  const [lastPlan, setLastPlan] = useState<PlanRouteResponse['data'] | null>(null);

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

  // If a destination is provided externally (from main search), set it when modal opens
  useEffect(() => {
    if (visible && initialDestination && initialDestination.latitude && initialDestination.longitude) {
      setDestination({
        id: `dest-${initialDestination.latitude.toFixed(6)}-${initialDestination.longitude.toFixed(6)}`,
        name: initialDestination.name || 'Hedef',
        type: 'destination',
        coordinates: {
          latitude: initialDestination.latitude,
          longitude: initialDestination.longitude,
        },
      });
    }
  }, [visible, initialDestination]);

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

    try {
      // Validate EV inputs
      const rangeNum = Number(vehicleRangeKm);
      const socNum = Number(currentSocPercent);
      const reserveNum = Number(reservePercent);
      if (!isFinite(rangeNum) || rangeNum <= 0) {
        Alert.alert('Hata', 'Araç menzili (km) geçerli bir sayı olmalıdır.');
        return;
      }
      if (!isFinite(socNum) || socNum < 0 || socNum > 100) {
        Alert.alert('Hata', 'Mevcut şarj yüzdesi 0-100 arasında olmalıdır.');
        return;
      }
      if (!isFinite(reserveNum) || reserveNum < 0 || reserveNum > 50) {
        Alert.alert('Hata', 'Yedek pay 0-50 arasında olmalıdır.');
        return;
      }

      setPlanning(true);

      // Call backend planner according to flowchart
      const res = await planSmartRoute({
        start: startPoint.coordinates,
        end: destination.coordinates,
        vehicle: { maxRangeKm: rangeNum },
        currentSocPercent: socNum,
        reservePercent: reserveNum,
        corridorKm: 2, // rota dışı sapma ≤ ~2 km öncelikli
        maxStops: 8,
        chargeAfterStopPercent: 90,
      });

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Rota planlama başarısız');
      }

      setLastPlan(res.data);

      // Map response to RouteInfo for analytics and parent callback
      const routeForParent: RouteInfo = {
        distance: res.data.summary.distanceKm,
        duration: res.data.summary.durationMin,
        transportMode,
        waypoints: res.data.points.map((p, idx) => ({
          id: `${idx}-${p.type || 'pt'}`,
          name: p.type === 'start' ? 'Başlangıç' : p.type === 'destination' ? 'Hedef' : p.title || 'Şarj İstasyonu',
          type: (p.type as any) || 'waypoint',
          coordinates: { latitude: p.latitude, longitude: p.longitude },
        })),
        estimatedCost: transportMode === 'transit' ? 15 : 0,
        chargingStops: res.data.summary.chargingStops,
      };

      onRouteCreated(routeForParent);
      // Kapatmak yerine kullanıcıya önizleme bırak (son plan alanında gösteriliyor)
    } catch (error) {
      let msg = 'Rota hesaplanırken bir hata oluştu.';
      if (error && typeof error === 'object' && 'message' in error) {
        msg = String((error as any).message);
      }
      Alert.alert('Hata', msg);
    } finally {
      setPlanning(false);
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
          <TouchableOpacity 
            style={[styles.createButton, (!startPoint || !destination || planning) && styles.createButtonDisabled]} 
            onPress={calculateRoute}
            disabled={!startPoint || !destination || planning}
          >
            <Text style={styles.createButtonText}>{planning ? 'Hesaplanıyor…' : 'Oluştur'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transport Mode Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ulaşım Modu</Text>
            <View style={styles.transportModesGrid}>
              {transportModes.map((mode) => (
                <TouchableOpacity
                  key={mode.key}
                  style={[
                    styles.transportModeButton,
                    transportMode === mode.key && styles.transportModeActive,
                    { borderColor: mode.color },
                  ]}
                  onPress={() => setTransportMode(mode.key as any)}
                >
                  <Ionicons 
                    name={mode.icon as any} 
                    size={24} 
                    color={transportMode === mode.key ? colors.white : mode.color} 
                  />
                  <Text style={[
                    styles.transportModeLabel,
                    transportMode === mode.key && styles.transportModeLabelActive,
                  ]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
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

          {/* EV Inputs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Araç ve Şarj Bilgileri</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Araç Menzili (km)</Text>
                <TextInput
                  value={vehicleRangeKm}
                  onChangeText={setVehicleRangeKm}
                  keyboardType="numeric"
                  placeholder="300"
                  style={styles.textInput}
                />
              </View>
              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Şarj %</Text>
                <TextInput
                  value={currentSocPercent}
                  onChangeText={setCurrentSocPercent}
                  keyboardType="numeric"
                  placeholder="80"
                  style={styles.textInput}
                />
              </View>
              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Yedek %</Text>
                <TextInput
                  value={reservePercent}
                  onChangeText={setReservePercent}
                  keyboardType="numeric"
                  placeholder="10"
                  style={styles.textInput}
                />
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Rota dışı sapma ≤ 2 km olacak şekilde hızlı şarj öncelikli duraklar seçilir.</Text>
          </View>

          {/* Available Stations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mevcut İstasyonlar</Text>
            <Text style={styles.sectionSubtitle}>
              Rota üzerine istasyon eklemek için tıklayın
            </Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stationsScroll}>
              {stations.slice(0, 10).map((station) => (
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
                    {lastPlan ? `${lastPlan.summary.distanceKm.toFixed(1)} km` : '~—'}
                  </Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Süre:</Text>
                  <Text style={styles.routeInfoValue}>
                    {lastPlan ? `~${lastPlan.summary.durationMin} dk` : '~—'}
                  </Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="battery-charging" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Şarj Durakları:</Text>
                  <Text style={styles.routeInfoValue}>
                    {lastPlan ? lastPlan.summary.chargingStops : waypoints.length}
                  </Text>
                </View>
                {lastPlan && lastPlan.points?.length > 0 && (
                  <View>
                    {lastPlan.points.map((p, idx) => (
                      <View key={`${idx}-${p.latitude}`} style={styles.routeInfoRow}>
                        <Ionicons name={p.type === 'charging' ? 'flash' : p.type === 'destination' ? 'flag' : 'location'} size={18} color={colors.primary} />
                        <Text style={styles.routeInfoLabel}>
                          {p.type === 'start' ? 'Başlangıç' : p.type === 'destination' ? 'Hedef' : (p.title || 'Şarj İstasyonu')}
                        </Text>
                        <Text style={styles.routeInfoValue}>
                          {p.type === 'charging' && p.powerKW ? `${p.powerKW} kW` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
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
  inputLabel: {
    fontSize: 12,
    color: colors.gray600,
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
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
});

export default RoutePlanning; 