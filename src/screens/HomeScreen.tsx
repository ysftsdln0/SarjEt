import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { ChargingStation, UserLocation, SearchFilters } from '../types';
import { ChargingStationService } from '../services/chargingStationService';
import { LocationService } from '../services/locationService';
import { MapComponent } from '../components/MapComponent';
import { SearchComponent } from '../components/SearchComponent';
import { StationList } from '../components/StationList';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [refreshing, setRefreshing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const stationService = new ChargingStationService('6ce97f56-cef6-4f87-b772-00b99fdb9547');

  // Kullanıcı konumunu al
  const getUserLocation = useCallback(async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      Alert.alert(
        'Konum Hatası',
        'Konumunuz alınamadı. Varsayılan olarak İstanbul gösterilecek.',
        [{ text: 'Tamam' }]
      );
    }
  }, []);

  // Yakındaki şarj istasyonlarını yükle
  const loadNearbyStations = useCallback(async (location?: UserLocation) => {
    if (!location && !userLocation) return;

    const targetLocation = location || userLocation!;
    setLoading(true);
    setIsOfflineMode(false);

    try {
      const nearbyStations = await stationService.getNearbyStations(
        targetLocation.latitude,
        targetLocation.longitude,
        25, // 25 km yarıçap
        100 // Maksimum 100 istasyon
      );

      // İlk 5 istasyonun mesafesi 100'den büyükse offline mode olabilir
      const avgDistance = nearbyStations.slice(0, 5).reduce((sum, station) => 
        sum + (station.AddressInfo.Distance || 0), 0) / 5;
      
      if (avgDistance > 100 || nearbyStations.length === 5) {
        setIsOfflineMode(true);
      }

      // Mesafeyi hesapla ve istasyonlara ekle (sadece gerçek API'den geliyorsa)
      const stationsWithDistance = nearbyStations.map(station => ({
        ...station,
        AddressInfo: {
          ...station.AddressInfo,
          Distance: station.AddressInfo.Distance || LocationService.calculateDistance(
            targetLocation.latitude,
            targetLocation.longitude,
            station.AddressInfo.Latitude,
            station.AddressInfo.Longitude
          ),
        },
      }));

      // Mesafeye göre sırala
      stationsWithDistance.sort((a, b) => 
        (a.AddressInfo.Distance || 0) - (b.AddressInfo.Distance || 0)
      );

      setStations(stationsWithDistance);
    } catch (error) {
      console.error('İstasyonlar yüklenemedi:', error);
      Alert.alert(
        'Veri Hatası',
        'Şarj istasyonları yüklenemedi. İnternet bağlantınızı kontrol edin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // Arama fonksiyonu
  const handleSearch = useCallback(async (filters: SearchFilters) => {
    if (!userLocation) {
      Alert.alert('Konum Hatası', 'Önce konumunuz alınmalı.');
      return;
    }

    setLoading(true);

    try {
      let searchResults: ChargingStation[] = [];

      // Şehir adına göre arama
      if (filters.query.trim()) {
        searchResults = await stationService.searchStationsByCity(filters.query);
      } else {
        // Normal yakındaki istasyonlar
        searchResults = await stationService.getNearbyStations(
          userLocation.latitude,
          userLocation.longitude,
          filters.maxDistance,
          100
        );
      }

      // Filtreleri uygula
      let filteredStations = searchResults;

      if (filters.fastChargeOnly) {
        filteredStations = stationService.filterFastCharging(filteredStations);
      }

      if (filters.freeOnly) {
        filteredStations = filteredStations.filter(station =>
          station.AddressInfo?.Title?.toLowerCase().includes('ücretsiz') ||
          station.AddressInfo?.Title?.toLowerCase().includes('free')
        );
      }

      // Operasyonel istasyonları filtrele
      filteredStations = stationService.filterOperational(filteredStations);

      // Mesafeyi hesapla
      const stationsWithDistance = filteredStations.map(station => ({
        ...station,
        AddressInfo: {
          ...station.AddressInfo,
          Distance: LocationService.calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            station.AddressInfo.Latitude,
            station.AddressInfo.Longitude
          ),
        },
      }));

      // Mesafeye göre sırala
      stationsWithDistance.sort((a, b) => 
        (a.AddressInfo.Distance || 0) - (b.AddressInfo.Distance || 0)
      );

      setStations(stationsWithDistance);
    } catch (error) {
      console.error('Arama hatası:', error);
      Alert.alert(
        'Arama Hatası',
        'Arama sonuçları yüklenemedi.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setLoading(false);
    }
  }, [userLocation]);

  // İstasyon detayına git
  const handleStationPress = useCallback((station: ChargingStation) => {
    navigation.navigate('StationDetail', { station });
  }, [navigation]);

  // Yenile
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNearbyStations();
    setRefreshing(false);
  }, [loadNearbyStations]);

  // Component mount edildiğinde
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Konum alındığında istasyonları yükle
  useEffect(() => {
    if (userLocation) {
      loadNearbyStations();
    }
  }, [userLocation, loadNearbyStations]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Şarjet</Text>
            <Text style={styles.headerSubtitle}>
              {stations.length > 0 
                ? `${stations.length} şarj istasyonu` 
                : 'Şarj istasyonları yükleniyor...'}
            </Text>
            {isOfflineMode && (
              <View style={styles.offlineIndicator}>
                <Text style={styles.offlineText}>📴 Demo Modu</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.locationButton}
            onPress={getUserLocation}
            disabled={loading}
          >
            <Text style={styles.locationButtonText}>📍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Arama bileşeni */}
      <SearchComponent onSearch={handleSearch} loading={loading} />

      {/* Görünüm modu seçici */}
      <View style={styles.viewModeSelector}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'map' && styles.activeViewModeButton,
          ]}
          onPress={() => setViewMode('map')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'map' && styles.activeViewModeText,
          ]}>
            Harita
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'list' && styles.activeViewModeButton,
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[
            styles.viewModeText,
            viewMode === 'list' && styles.activeViewModeText,
          ]}>
            Liste
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ana içerik */}
      <View style={styles.content}>
        {loading && stations.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Şarj istasyonları yükleniyor...</Text>
          </View>
        ) : viewMode === 'map' ? (
          <MapComponent
            userLocation={userLocation}
            stations={stations}
            onStationPress={handleStationPress}
            loading={loading}
          />
        ) : (
          <StationList
            stations={stations}
            onStationPress={handleStationPress}
            userLocation={userLocation}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  locationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeViewModeButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeViewModeText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  offlineIndicator: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  offlineText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
});
