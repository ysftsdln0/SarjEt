import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { ChargingStation, UserLocation } from '../types';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { StationMarker, StationCallout } from '../components/StationMarker';
import { LoadingScreen } from '../components/LoadingScreen';
import { StationList } from '../components/StationList';
import { ProfileModal } from '../components/ProfileModal';
import { ChargingStationService } from '../services/chargingStationService';
import { LocationService } from '../services/locationService';

interface SarjetMainScreenProps {}

const SarjetMainScreen: React.FC<SarjetMainScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  // OpenChargeMap API servisi
  const stationService = new ChargingStationService('6ce97f56-cef6-4f87-b772-00b99fdb9547');

  // Kullanıcı konumunu al
  const getUserLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      Alert.alert(
        'Konum Hatası',
        'Konumunuz alınamadı. Varsayılan olarak İstanbul gösterilecek.',
        [{ text: 'Tamam' }]
      );
      // Varsayılan İstanbul konumu
      setUserLocation({
        latitude: 41.0082,
        longitude: 28.9784,
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Mesafe hesaplama fonksiyonu
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Yakındaki şarj istasyonlarını yükle
  const loadNearbyStations = async (location?: UserLocation) => {
    const currentLocation = location || userLocation;
    if (!currentLocation) {
      console.log('❌ Konum bilgisi mevcut değil');
      return;
    }

    try {
      setLoading(true);
      console.log('📍 Türkiye geneli şarj istasyonları yükleniyor...');

      // Türkiye geneli tüm istasyonları getir
      const allStations = await stationService.getAllStationsInTurkey(10000);
      
      console.log('🔋 Türkiye geneli bulunan istasyon sayısı:', allStations.length);
      
      // Sadece operasyonel istasyonları filtrele
      const operationalStations = stationService.filterOperational(allStations);
      console.log('✅ Operasyonel istasyon sayısı:', operationalStations.length);
      
      // Kullanıcı konumuna göre mesafeleri hesapla ve sırala
      const stationsWithDistance = operationalStations.map(station => {
        if (station.AddressInfo && currentLocation) {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            station.AddressInfo.Latitude,
            station.AddressInfo.Longitude
          );
          return {
            ...station,
            AddressInfo: {
              ...station.AddressInfo,
              Distance: distance
            }
          };
        }
        return station;
      });

      // Duplike istasyonları kaldır (aynı ID'ye sahip olanları)
      const uniqueStations = stationsWithDistance.filter((station, index, self) => 
        index === self.findIndex(s => s.ID === station.ID)
      );

      // Mesafeye göre sırala
      const sortedStations = uniqueStations.sort((a, b) => {
        const distanceA = a.AddressInfo?.Distance || 999999;
        const distanceB = b.AddressInfo?.Distance || 999999;
        return distanceA - distanceB;
      });

      console.log('🧹 Duplike temizleme:', {
        originalCount: stationsWithDistance.length,
        uniqueCount: uniqueStations.length,
        duplicatesRemoved: stationsWithDistance.length - uniqueStations.length
      });

      setStations(sortedStations);

      if (stationsWithDistance.length === 0) {
        Alert.alert(
          'İstasyon Bulunamadı',
          'Türkiye\'de şarj istasyonu bulunamadı. Lütfen daha sonra tekrar deneyin.',
          [
            {
              text: 'Tekrar Dene',
              onPress: () => loadNearbyStations(currentLocation)
            },
            { text: 'Tamam' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ İstasyon verileri yüklenirken hata:', error);
      Alert.alert(
        'Veri Hatası',
        'Şarj istasyonu verileri yüklenirken bir hata oluştu. İnternet bağlantınızı kontrol edin.',
        [
          {
            text: 'Tekrar Dene',
            onPress: () => loadNearbyStations(currentLocation)
          },
          { text: 'Tamam' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde konum al ve istasyonları yükle
  useEffect(() => {
    const initializeApp = async () => {
      await getUserLocation();
    };
    initializeApp();
  }, []);

  // Konum alındığında istasyonları yükle
  useEffect(() => {
    if (userLocation && !locationLoading) {
      loadNearbyStations(userLocation);
    }
  }, [userLocation, locationLoading]);

  // Yenile fonksiyonu
  const handleRefresh = async () => {
    setRefreshing(true);
    await getUserLocation();
    if (userLocation) {
      await loadNearbyStations();
    }
    setRefreshing(false);
  };

  const getStationPowerKW = (station: ChargingStation): number => {
    return station.Connections?.[0]?.PowerKW || 0;
  };

  const getStationStatus = (station: ChargingStation): string => {
    return station.StatusType?.Title || 'Bilinmiyor';
  };

  const isStationAvailable = (station: ChargingStation): boolean => {
    return station.StatusType?.IsOperational !== false;
  };

  const handleStationPress = (station: ChargingStation) => {
    console.log('Station pressed:', station.AddressInfo.Title);
    // Navigation to detail screen can be implemented here
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const searchResults = await stationService.searchStationsByCity(searchQuery.trim(), 30);
      const operationalResults = stationService.filterOperational(searchResults);
      setStations(operationalResults);
    } catch (error) {
      console.error('Arama hatası:', error);
      Alert.alert(
        'Arama Hatası',
        'Arama yaparken bir hata oluştu.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShowFilters = () => {
    Alert.alert(
      'Filtreler',
      'Gelişmiş filtreleme özellikleri yakında gelecek!',
      [
        {
          text: 'Hızlı Şarj',
          onPress: () => {
            const fastStations = stationService.filterFastCharging(stations);
            setStations(fastStations);
          }
        },
        {
          text: 'Tümü',
          onPress: () => loadNearbyStations()
        },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const handleProfilePress = () => {
    setProfileVisible(true);
  };

  const handleViewModeChange = (index: number) => {
    setViewMode(index === 0 ? 'map' : 'list');
  };

  const handleLocationPress = async () => {
    await handleRefresh();
  };

  const renderMapView = () => {
    if (loading || locationLoading) {
      return <LoadingScreen message="Şarj istasyonları yükleniyor..." />;
    }

    if (!userLocation) {
      return <LoadingScreen message="Konum bilgisi alınıyor..." />;
    }

    return (
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        mapType="standard"
      >
        {stations.map((station, index) => (
          <Marker
            key={`${station.ID}-${index}`}
            coordinate={{
              latitude: station.AddressInfo.Latitude,
              longitude: station.AddressInfo.Longitude,
            }}
            onPress={() => handleStationPress(station)}
          >
            <StationMarker isAvailable={isStationAvailable(station)} />
            
            <Callout style={styles.callout}>
              <StationCallout
                title={station.AddressInfo.Title}
                powerKW={getStationPowerKW(station)}
                status={getStationStatus(station)}
                isAvailable={isStationAvailable(station)}
                station={station}
              />
            </Callout>
          </Marker>
        ))}
      </MapView>
    );
  };

  const renderLocationButton = () => (
    <TouchableOpacity 
      style={styles.locationButton}
      onPress={handleLocationPress}
    >
      <Ionicons name="locate" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#263238" />
      
      <Header title="Şarjet" onProfilePress={handleProfilePress} />
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={handleSearch}
        onShowFilters={handleShowFilters}
        placeholder="Şehir veya ilçe ile arayın..."
      />
      
      <SegmentedControl
        options={['Harita', 'Liste']}
        selectedIndex={viewMode === 'map' ? 0 : 1}
        onSelectionChange={handleViewModeChange}
      />
      
      <View style={styles.contentContainer}>
        {viewMode === 'map' ? renderMapView() : (
          <StationList 
            stations={stations} 
            onStationPress={handleStationPress}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            userLocation={userLocation}
          />
        )}
        {viewMode === 'map' && renderLocationButton()}
      </View>

      <ProfileModal 
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        userLocation={userLocation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#263238',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 320,
  },
  locationButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default SarjetMainScreen;
