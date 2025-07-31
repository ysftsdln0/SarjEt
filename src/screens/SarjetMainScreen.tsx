import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
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
import { StationPopup } from '../components/StationPopup';
import { chargingStationService } from '../services/chargingStationService';
import { LocationService } from '../services/locationService';
import { FilterService } from '../services/filterService';

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

  // Fetch user location and set the initial map region
  const initializeLocation = useCallback(async () => {
    setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
      setInitialRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.5, // Start with a wider view
        longitudeDelta: 0.5,
      });
    } catch (error) {
      console.error('Konum alınamadı:', error);
      Alert.alert('Konum Hatası', 'Konumunuz alınamadı. Varsayılan konum kullanılıyor.');
      const defaultLocation = { latitude: 41.0082, longitude: 28.9784 };
      setUserLocation(defaultLocation);
      setInitialRegion({ ...defaultLocation, latitudeDelta: 0.5, longitudeDelta: 0.5 });
    }
  }, []);

  // Load stations from the backend service
  const loadStations = useCallback(async (location: UserLocation) => {
    try {
      const fetchedStations = await chargingStationService.getNearbyStations(
        location.latitude, 
        location.longitude, 
        1000, // Fetch stations in a wide radius
        500   // Increase limit to get more data for clustering
      );
      
      const uniqueStations = fetchedStations.filter((station, index, self) => 
        index === self.findIndex(s => s.ID === station.ID)
      );

      setAllStations(uniqueStations);
      const filtered = FilterService.applyFilters(uniqueStations, filters);
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
  };

  // Close popup handler
  const handleClosePopup = () => {
    console.log('[SarjetMainScreen] Closing popup');
    setShowPopup(false);
    setSelectedStation(null);
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
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={initialRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
          >
            {stations.map((station) => (
              <Marker
                key={station.ID}
                coordinate={{
                  latitude: station.AddressInfo.Latitude,
                  longitude: station.AddressInfo.Longitude,
                }}
                onPress={() => handleStationPress(station)}
              >
                <View style={styles.markerContainer}>
                  <Ionicons 
                    name="flash" 
                    size={24} 
                    color={colors.primary}
                  />
                </View>
              </Marker>
            ))}
          </MapView>
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
});

export default SarjetMainScreen;