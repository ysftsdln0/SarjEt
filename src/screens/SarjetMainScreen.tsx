import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import SuperCluster from 'supercluster';
import { ChargingStation, UserLocation } from '../types';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { StationMarker, StationCallout } from '../components/StationMarker';
import { LoadingScreen } from '../components/LoadingScreen';
import { StationList } from '../components/StationList';
import { ProfileModal } from '../components/ProfileModal';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import { chargingStationService } from '../services/chargingStationService';
import { LocationService } from '../services/locationService';
import { FilterService } from '../services/filterService';

interface SarjetMainScreenProps {}

const SarjetMainScreen: React.FC<SarjetMainScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [allStations, setAllStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    ...FilterService.getDefaultFilters(),
    maxDistance: 1000 // Türkiye geneli için 1000km
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mapRegion, setMapRegion] = useState<any>(null);

  // SuperCluster instance'ı oluştur
  const superCluster = useMemo(() => {
    const cluster = new SuperCluster({
      radius: 40,
      maxZoom: 16,
      minZoom: 0,
      extent: 512,
      nodeSize: 64
    });
    return cluster;
  }, []);

  // Stations'ları GeoJSON formatına çevir
  const stationsAsGeoJSON = useMemo(() => {
    return stations
      .filter(station => 
        station.AddressInfo && 
        typeof station.AddressInfo.Latitude === 'number' && 
        typeof station.AddressInfo.Longitude === 'number'
      )
      .map(station => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          stationId: station.ID,
          station: station
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [station.AddressInfo.Longitude, station.AddressInfo.Latitude]
        }
      }));
  }, [stations]);

  // Clusters'ları hesapla
  const clusters = useMemo(() => {
    if (!mapRegion || stationsAsGeoJSON.length === 0) return [];
    
    try {
      superCluster.load(stationsAsGeoJSON);
      
      const bbox: [number, number, number, number] = [
        mapRegion.longitude - mapRegion.longitudeDelta,
        mapRegion.latitude - mapRegion.latitudeDelta,
        mapRegion.longitude + mapRegion.longitudeDelta,
        mapRegion.latitude + mapRegion.latitudeDelta,
      ];
      
      const zoom = Math.round(Math.log(360 / mapRegion.longitudeDelta) / Math.LN2);
      return superCluster.getClusters(bbox, Math.min(zoom, 16));
    } catch (error) {
      console.warn('Clustering error:', error);
      return stationsAsGeoJSON;
    }
  }, [superCluster, stationsAsGeoJSON, mapRegion]);

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
      console.log('📍 Kullanıcı konumu etrafındaki şarj istasyonları yükleniyor...');

      // Kullanıcı konumu etrafındaki istasyonları getir (500km radius)
      const allStations = await chargingStationService.getNearbyStations(
        currentLocation.latitude, 
        currentLocation.longitude, 
        500, // 500km radius - Türkiye geneli kapsama
        100  // maksimum 100 istasyon
      );
      
      console.log('🔋 Kullanıcı konumu etrafında bulunan istasyon sayısı:', allStations.length);
      
      // Sadece operasyonel istasyonları filtrele
      const operationalStations = chargingStationService.filterOperational(allStations);
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

      // Tüm istasyonları sakla (filtreleme için)
      setAllStations(sortedStations);
      
      // Filtreleri uygula
      const filteredStations = FilterService.applyFilters(sortedStations, filters);
      setStations(filteredStations);

      if (sortedStations.length === 0) {
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

  // Filtreleme işlemleri
  const applyFilters = (newFilters: FilterOptions) => {
    console.log('🔍 Filtre uygulanıyor:', newFilters);
    setFilters(newFilters);
    
    const filteredStations = FilterService.applyFilters(allStations, newFilters);
    console.log('� Filtreleme sonucu:', {
      originalCount: allStations.length,
      filteredCount: filteredStations.length,
      activeFilters: FilterService.getActiveFilterCount(newFilters),
      summary: FilterService.getFilterSummary(newFilters),
      sampleFilteredStation: filteredStations[0]?.AddressInfo?.Title || 'Yok'
    });
    
    setStations(filteredStations);
  };

  const resetFilters = () => {
    const defaultFilters = FilterService.getDefaultFilters();
    setFilters(defaultFilters);
    setStations(allStations);
  };

  // Arama işlemi
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      // Arama boşsa filtreleri uygula
      const filteredStations = FilterService.applyFilters(allStations, filters);
      setStations(filteredStations);
      return;
    }

    // Önce filtreleri uygula, sonra arama yap
    const filteredStations = FilterService.applyFilters(allStations, filters);
    const searchResults = filteredStations.filter(station => {
      const searchText = query.toLowerCase();
      return (
        station.AddressInfo?.Title?.toLowerCase().includes(searchText) ||
        station.AddressInfo?.Town?.toLowerCase().includes(searchText) ||
        station.AddressInfo?.StateOrProvince?.toLowerCase().includes(searchText) ||
        station.OperatorInfo?.Title?.toLowerCase().includes(searchText)
      );
    });
    
    setStations(searchResults);
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

  const handleCitySearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const searchResults = await chargingStationService.searchStationsByCity(searchQuery.trim(), 30);
      const operationalResults = chargingStationService.filterOperational(searchResults);
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
            const fastStations = chargingStationService.filterFastCharging(stations);
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

    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return <LoadingScreen message="Konum bilgisi alınıyor..." />;
    }

    // Harita region'ını belirle - öncelik kullanıcı konumunda
    let initialMapRegion = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    // İlk kez map region'ı set et
    if (!mapRegion) {
      setMapRegion(initialMapRegion);
    }

    // Eğer sadece birkaç istasyon varsa ve kullanıcıya yakınsa, haritayı bu istasyonları da gösterecek şekilde ayarla
    if (stations.length > 0 && stations.length <= 10) {
      const latitudes = [userLocation.latitude, ...stations.map(s => s.AddressInfo.Latitude)];
      const longitudes = [userLocation.longitude, ...stations.map(s => s.AddressInfo.Longitude)];
      
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      // Minimum zoom seviyesi için sınır koy
      let latDelta = Math.max((maxLat - minLat) * 1.3, 0.05);
      let lngDelta = Math.max((maxLng - minLng) * 1.3, 0.05);
      
      // Maximum zoom seviyesi için sınır koy (çok geniş olmasın)
      latDelta = Math.min(latDelta, 1);
      lngDelta = Math.min(lngDelta, 1);

      const adjustedMapRegion = {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      };
      
      if (!mapRegion) {
        setMapRegion(adjustedMapRegion);
      }
    }

    const currentMapRegion = mapRegion || initialMapRegion;

    console.log('🗺️ Harita render ediliyor:', {
      stationCount: stations.length,
      region: {
        lat: currentMapRegion.latitude.toFixed(4),
        lng: currentMapRegion.longitude.toFixed(4),
        latDelta: currentMapRegion.latitudeDelta.toFixed(4),
        lngDelta: currentMapRegion.longitudeDelta.toFixed(4)
      },
      sampleStation: stations[0]?.AddressInfo?.Title || 'Yok',
      firstFewStations: stations.slice(0, 3).map(s => ({
        name: s.AddressInfo?.Title,
        lat: s.AddressInfo?.Latitude,
        lng: s.AddressInfo?.Longitude
      }))
    });

    return (
      <MapView
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        region={currentMapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        mapType="standard"
        onRegionChangeComplete={(region) => {
          setMapRegion(region);
        }}
      >
        {clusters.map((cluster: any, index) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const { cluster: isCluster, point_count: pointCount } = cluster.properties;

          if (isCluster) {
            // Render cluster
            const size = Math.min(60, 30 + Math.log(pointCount || 1) * 5);
            return (
              <Marker
                key={`cluster-${cluster.id || index}`}
                coordinate={{ latitude, longitude }}
                onPress={() => {
                  // Cluster'a tıklandığında zoom yap
                  if (cluster.id) {
                    const expansionZoom = Math.min(superCluster.getClusterExpansionZoom(cluster.id), 16);
                    const currentZoom = Math.round(Math.log(360 / mapRegion.longitudeDelta) / Math.LN2);
                    const zoomDiff = expansionZoom - currentZoom;
                    const zoomFactor = Math.pow(2, zoomDiff);
                    
                    setMapRegion({
                      latitude,
                      longitude,
                      latitudeDelta: mapRegion.latitudeDelta / zoomFactor,
                      longitudeDelta: mapRegion.longitudeDelta / zoomFactor,
                    });
                  }
                }}
              >
                <View style={[
                  styles.clusterContainer,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: (pointCount || 0) > 10 ? '#FF6B6B' : (pointCount || 0) > 5 ? '#4ECDC4' : '#007AFF',
                  }
                ]}>
                  <Text style={[styles.clusterText, { fontSize: (pointCount || 0) > 99 ? 12 : 14 }]}>
                    {(pointCount || 0) > 99 ? '99+' : (pointCount || 0)}
                  </Text>
                </View>
              </Marker>
            );
          } else {
            // Render individual station
            const station = cluster.properties.station;
            return (
              <Marker
                key={`station-${station.ID}`}
                coordinate={{ latitude, longitude }}
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
            );
          }
        })}
      </MapView>
    );
  };

  const renderLocationButton = () => (
    <TouchableOpacity 
      style={styles.locationButton}
      onPress={handleLocationPress}
    >
      <Ionicons name="locate" size={24} color={colors.darkText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.lightContainer]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? colors.darkBg : colors.lightBg} 
      />
      
      <Header title="Şarjet" onProfilePress={handleProfilePress} isDarkMode={isDarkMode} />
      
      <SearchBar
        value={searchQuery}
        onChangeText={handleSearch}
        onSearch={handleCitySearch}
        onShowFilters={() => setFilterVisible(true)}
        placeholder="Şehir veya ilçe ile arayın..."
        filterCount={FilterService.getActiveFilterCount(filters)}
        isDarkMode={isDarkMode}
      />
      
      <SegmentedControl
        options={['Harita', 'Liste']}
        selectedIndex={viewMode === 'map' ? 0 : 1}
        onSelectionChange={handleViewModeChange}
        isDarkMode={isDarkMode}
      />
      
      <View style={styles.contentContainer}>
        <View style={styles.mapContainer}>
          {viewMode === 'map' ? renderMapView() : (
            <StationList 
              stations={stations} 
              onStationPress={handleStationPress}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              userLocation={userLocation}
            />
          )}
        </View>
        {viewMode === 'map' && renderLocationButton()}
      </View>

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApplyFilters={applyFilters}
        stations={allStations}
        isDarkMode={isDarkMode}
      />

      <ProfileModal 
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        userLocation={userLocation}
        isDarkMode={isDarkMode}
        onToggleDarkMode={setIsDarkMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBg,
  },
  lightContainer: {
    backgroundColor: colors.lightBg,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    padding: 16,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.darkCard,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 320,
  },
  locationButton: {
    position: 'absolute',
    bottom: 46,
    right: 36,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  clusterContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  clusterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default SarjetMainScreen;
