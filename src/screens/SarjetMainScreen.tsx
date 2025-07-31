import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Text,
  Dimensions,
  Animated,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewClustering from 'react-native-map-clustering';
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Region } from 'react-native-maps';
import { ChargingStation, UserLocation } from '../types';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { LoadingScreen } from '../components/LoadingScreen';
import { StationList } from '../components/StationList';
import { ProfileModal } from '../components/ProfileModal';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import StationPopup from '../components/StationPopup';
import { StationMarker } from '../components/StationMarker';
import { chargingStationService } from '../services/chargingStationService';
import { LocationService } from '../services/locationService';
import { FilterService } from '../services/filterService';

const { width, height } = Dimensions.get('window');

// Define the shape of the data item that MapViewClustering expects
interface MapDataItem extends ChargingStation {
  location: {
    latitude: number;
    longitude: number;
  };
}

const SarjetMainScreen: React.FC = () => {
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [allStations, setAllStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal visibility states
  const [profileVisible, setProfileVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>(FilterService.getDefaultFilters());
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Popup state
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const slideAnim = useRef(new Animated.Value(500)).current; // Start below screen (increased)
  
  const mapRef = useRef<MapView>(null);

  // Memoize and transform station data for clustering
  const mapData: MapDataItem[] = useMemo(() => {
    console.log('[SarjetMainScreen] Creating mapData from stations:', stations?.length || 0);
    
    if (!stations) {
      console.log('[SarjetMainScreen] No stations available');
      return [];
    }
    
    const validStations = stations.filter(station => {
      const isValid = station &&
        station.AddressInfo &&
        typeof station.AddressInfo.Latitude === 'number' &&
        typeof station.AddressInfo.Longitude === 'number' &&
        !isNaN(station.AddressInfo.Latitude) &&
        !isNaN(station.AddressInfo.Longitude);
      
      if (!isValid) {
        console.log('[SarjetMainScreen] Invalid station filtered out:', station?.ID, station?.AddressInfo);
      }
      
      return isValid;
    });
    
    console.log('[SarjetMainScreen] Valid stations for map:', validStations.length);
    
    const transformedData = validStations.map(station => ({
      ...station,
      location: {
        latitude: station.AddressInfo.Latitude,
        longitude: station.AddressInfo.Longitude,
      },
    }));
    
    console.log('[SarjetMainScreen] MapData sample:', transformedData.slice(0, 2));
    
    return transformedData;
  }, [stations]);

  // Fetch user location and set the initial map region
  const initializeLocation = useCallback(async () => {
    setLoading(true);
    try {
      console.log('[SarjetMainScreen] Getting user location...');
      const location = await LocationService.getCurrentLocation();
      console.log('[SarjetMainScreen] User location received:', location);
      
      setUserLocation(location);
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1, // Smaller delta for closer view
        longitudeDelta: 0.1,
      };
      console.log('[SarjetMainScreen] Setting initial region:', region);
      setInitialRegion(region);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      Alert.alert('Konum Hatası', 'Konumunuz alınamadı. Varsayılan konum kullanılıyor.');
      const defaultLocation = { latitude: 41.0082, longitude: 28.9784 };
      const defaultRegion = { ...defaultLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 };
      console.log('[SarjetMainScreen] Using default location:', defaultRegion);
      setUserLocation(defaultLocation);
      setInitialRegion(defaultRegion);
    }
  }, []);

  // Load stations from the backend service
  const loadStations = useCallback(async (location: UserLocation) => {
    try {
      console.log('[SarjetMainScreen] Loading stations for location:', location);
      
      const fetchedStations = await chargingStationService.getNearbyStations(
        location.latitude, 
        location.longitude, 
        450, // Reduced radius to stay under 500km limit
        100   // Reduced limit
      );
      
      console.log('[SarjetMainScreen] Fetched stations count:', fetchedStations.length);
      console.log('[SarjetMainScreen] First 3 stations:', fetchedStations.slice(0, 3));
      
      const uniqueStations = fetchedStations.filter((station, index, self) => 
        index === self.findIndex(s => s.ID === station.ID)
      );

      console.log('[SarjetMainScreen] Unique stations count:', uniqueStations.length);
      
      setAllStations(uniqueStations);
      const filtered = FilterService.applyFilters(uniqueStations, filters);
      console.log('[SarjetMainScreen] Filtered stations count:', filtered.length);
      setStations(filtered);

    } catch (error) {
      console.error('İstasyon verileri yüklenirken hata:', error);
      Alert.alert('Veri Hatası', 'İstasyonlar yüklenemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // Initial load effect
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // Effect to load stations when location is available
  useEffect(() => {
    if (initialRegion) {
      loadStations({ latitude: initialRegion.latitude, longitude: initialRegion.longitude });
    }
  }, [initialRegion, loadStations]);

  const handleRefresh = () => {
    setRefreshing(true);
    initializeLocation();
  };

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    const filteredStations = FilterService.applyFilters(allStations, newFilters);
    setStations(filteredStations);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = FilterService.applyFilters(allStations, filters);
    const searched = FilterService.searchStations(filtered, query);
    setStations(searched);
  };

  // Station marker press handler
  const handleStationPress = (station: ChargingStation) => {
    console.log('[SarjetMainScreen] Station marker pressed:', station.ID);
    setSelectedStation(station);
    setShowPopup(true);
    
    // Animate popup slide up
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Close popup handler
  const handleClosePopup = () => {
    console.log('[SarjetMainScreen] Closing popup');
    
    // Animate popup slide down
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowPopup(false);
      setSelectedStation(null);
    });
  };

  // Renders a single station marker for clustering
  const renderMarker = useCallback((item: MapDataItem) => {
    console.log('[SarjetMainScreen] Rendering marker for station:', item.ID, item.location);
    
    return (
      <Marker
        key={item.ID}
        coordinate={item.location}
        onPress={() => handleStationPress(item)}
        tracksViewChanges={false}
      >
        <StationMarker isAvailable={item.StatusTypeID === 50 || item.StatusTypeID === 75} />
      </Marker>
    );
  }, []);

  // Renders a cluster marker
  const renderCluster = useCallback((cluster: any) => {
    const { id, geometry, onPress, properties } = cluster;
    const pointCount = properties.point_count;

    const getClusterStyle = (count: number) => {
      if (count >= 100) return { size: 70, color: colors.error };
      if (count >= 50) return { size: 60, color: colors.warning };
      if (count >= 20) return { size: 50, color: colors.primary };
      return { size: 40, color: colors.success };
    };
    const { size, color } = getClusterStyle(pointCount);

    return (
      <Marker
        key={`cluster-${id}`}
        coordinate={{ longitude: geometry.coordinates[0], latitude: geometry.coordinates[1] }}
        onPress={onPress}
        tracksViewChanges={false}
      >
        <View style={[styles.cluster, { width: size, height: size, backgroundColor: color }]}>
          <Text style={styles.clusterText}>{pointCount}</Text>
        </View>
      </Marker>
    );
  }, []);

  // Handle map press to close popup
  const onMapPress = (event: any) => {
    if (event.nativeEvent.action !== 'marker-press') {
      handleClosePopup();
    }
  };

  // If data is not ready, show a loading screen.
  // This is the ultimate guard against crashes.
  if (!initialRegion) {
    return <LoadingScreen message="Konum bilgisi alınıyor..." />;
  }

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.lightContainer]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={isDarkMode ? colors.darkBg : colors.lightBg} 
      />
      
      <Header title="Şarjet" onProfilePress={() => setProfileVisible(true)} isDarkMode={isDarkMode} />
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={() => handleSearch(searchQuery)}
        onShowFilters={() => setFilterVisible(true)}
        placeholder="İstasyon veya şehir ara..."
        filterCount={FilterService.getActiveFilterCount(filters)}
        isDarkMode={isDarkMode}
      />
      
      <SegmentedControl
        options={['Harita', 'Liste']}
        selectedIndex={viewMode === 'map' ? 0 : 1}
        onSelectionChange={(index) => setViewMode(index === 0 ? 'map' : 'list')}
        isDarkMode={isDarkMode}
      />
      
      <View style={styles.contentContainer}>
        {viewMode === 'map' ? (
          <View style={styles.map}>
            {/* Temporary: Use basic MapView instead of clustering to debug */}
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={PROVIDER_GOOGLE}
              initialRegion={initialRegion}
              onPress={onMapPress}
              showsUserLocation={true}
              showsMyLocationButton={true}
              showsCompass={true}
              customMapStyle={isDarkMode ? darkMapStyle : []}
              onMapReady={() => {
                console.log('[SarjetMainScreen] Basic Map is ready, mapData count:', mapData.length);
              }}
            >
              {mapData.map((station) => {
                console.log('[SarjetMainScreen] Rendering basic marker for:', station.ID, station.location);
                return (
                  <Marker
                    key={station.ID}
                    coordinate={station.location}
                    onPress={() => handleStationPress(station)}
                  >
                    <StationMarker isAvailable={station.StatusTypeID === 50 || station.StatusTypeID === 75} />
                  </Marker>
                );
              })}
            </MapView>
          </View>
        ) : (
          <StationList 
            stations={stations} 
            onStationPress={(station) => Alert.alert(station.AddressInfo.Title)} // Placeholder action
            refreshing={refreshing}
            onRefresh={handleRefresh}
            userLocation={userLocation}
          />
        )}
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

      {/* Station Popup */}
      {selectedStation && (
        <StationPopup
          station={selectedStation}
          visible={showPopup}
          slideAnim={slideAnim}
          onClose={handleClosePopup}
        />
      )}
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
    padding: 16,
  },
  map: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  markerContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cluster: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clusterText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

export default SarjetMainScreen;