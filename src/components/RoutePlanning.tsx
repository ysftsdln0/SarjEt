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
}

const RoutePlanning: React.FC<RoutePlanningProps> = ({
  visible,
  onClose,
  onRouteCreated,
  userLocation,
  stations,
}) => {
  const [startPoint, setStartPoint] = useState<RoutePoint | null>(null);
  const [destination, setDestination] = useState<RoutePoint | null>(null);
  const [waypoints, setWaypoints] = useState<RoutePoint[]>([]);
  const [transportMode, setTransportMode] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving');
  const [selectedStations, setSelectedStations] = useState<ChargingStation[]>([]);

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
    setSelectedStations(prev => prev.filter(station => station.ID !== id));
  };

  const calculateRoute = async () => {
    if (!startPoint || !destination) {
      Alert.alert('Hata', 'Başlangıç ve hedef noktaları seçilmelidir.');
      return;
    }

    try {
      // TODO: Implement actual route calculation with Google Maps API
      const mockRoute: RouteInfo = {
        distance: 25.5,
        duration: 45,
        transportMode,
        waypoints: [startPoint, ...waypoints, destination],
        estimatedCost: transportMode === 'transit' ? 15 : 0,
        chargingStops: waypoints.length,
      };

      onRouteCreated(mockRoute);
      onClose();
    } catch (error) {
      Alert.alert('Hata', 'Rota hesaplanırken bir hata oluştu.');
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
            style={[styles.createButton, (!startPoint || !destination) && styles.createButtonDisabled]} 
            onPress={calculateRoute}
            disabled={!startPoint || !destination}
          >
            <Text style={styles.createButtonText}>Oluştur</Text>
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
                  <Text style={styles.routeInfoValue}>~25.5 km</Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Süre:</Text>
                  <Text style={styles.routeInfoValue}>~45 dk</Text>
                </View>
                <View style={styles.routeInfoRow}>
                  <Ionicons name="battery-charging" size={20} color={colors.primary} />
                  <Text style={styles.routeInfoLabel}>Şarj Durakları:</Text>
                  <Text style={styles.routeInfoValue}>{waypoints.length}</Text>
                </View>
                {transportMode === 'transit' && (
                  <View style={styles.routeInfoRow}>
                    <Ionicons name="card" size={20} color={colors.primary} />
                    <Text style={styles.routeInfoLabel}>Tahmini Ücret:</Text>
                    <Text style={styles.routeInfoValue}>~15 ₺</Text>
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