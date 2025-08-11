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
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Region } from 'react-native-maps';
import { ChargingStation, UserLocation } from '../types';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import LoadingScreen from '../components/LoadingScreen';
import { ProfileModal } from '../components/ProfileModal';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import AdvancedFilterModal, { AdvancedFilterOptions } from '../components/AdvancedFilterModal';
import RoutePlanning, { RouteInfo } from '../components/RoutePlanning';
import SocialFeatures from '../components/SocialFeatures';
import Toast, { ToastType } from '../components/Toast';
import ThemeSettings from '../components/ThemeSettings';
import { chargingStationService } from '../services/chargingStationService';
import { LocationService } from '../services/locationService';
import { FilterService } from '../services/filterService';
import NotificationService from '../services/NotificationService';
import AnalyticsService from '../services/AnalyticsService';
import { ClusteredMapView } from '../components/ClusteredMapView';
import { StationDetailsCard } from '../components/StationDetailsCard';
import { BottomNavigation } from '../components/BottomNavigation';
import { useTheme } from '../contexts/ThemeContext';
import { 
  fadeIn, 
  fadeOut, 
  slideUp, 
  slideDown, 
  bounce, 
  markerPopup 
} from '../utils/animationUtils';

const { width, height } = Dimensions.get('window');

const SarjetMainScreen: React.FC = () => {
  const { isDarkMode, colors: themeColors } = useTheme();
  
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [allStations, setAllStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal visibility states
  const [profileVisible, setProfileVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [routePlanningVisible, setRoutePlanningVisible] = useState(false);
  const [socialFeaturesVisible, setSocialFeaturesVisible] = useState(false);
  const [themeSettingsVisible, setThemeSettingsVisible] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>(FilterService.getDefaultFilters());
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterOptions>({
    connectionTypes: [],
    maxDistance: 50,
    priceRange: { min: 0, max: 100 },
    workingHours: { isOpenNow: false, is24Hours: false },
    rating: { min: 0, max: 5 },
    showFavorites: false,
    showRecentlyUsed: false,
    showAvailableOnly: true,
    greenEnergy: false,
    fastCharging: false,
    freeCharging: false,
  });
  
  // Filter state for quick filter buttons
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  
  // Popup state
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: ToastType;
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Analytics
  const sessionId = useRef(Date.now().toString()).current;
  const userId = useRef('user-' + Math.random().toString(36).substr(2, 9)).current;

  // Fetch user location and set the initial map region
  const initializeLocation = useCallback(async () => {
    setLoading(true);
    try {
      if (__DEV__) {
        console.log('[SarjetMainScreen] Getting user location...');
      }
      
      // Analytics: Session start
      AnalyticsService.trackUserBehavior(userId, sessionId, 'session_start');
      
      const location = await LocationService.getCurrentLocation();
      if (__DEV__) {
        console.log('[SarjetMainScreen] User location received:', location);
      }
      
      setUserLocation(location);
      const region = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
      setInitialRegion(region);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      showToast('Konum alınamadı. Varsayılan konum kullanılıyor.', 'warning');
      const defaultLocation = { latitude: 41.0082, longitude: 28.9784 };
      const defaultRegion = { ...defaultLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 };
      setUserLocation(defaultLocation);
      setInitialRegion(defaultRegion);
    }
  }, []);

  // Load stations from the backend service
  const loadStations = useCallback(async (location: UserLocation) => {
    try {
      if (__DEV__) {
        console.log('[SarjetMainScreen] Loading stations for location:', location);
      }
      
      const fetchedStations = await chargingStationService.getNearbyStations(
        location.latitude, 
        location.longitude, 
        450,
        100
      );
      
      const uniqueStations = fetchedStations.filter((station, index, self) => 
        index === self.findIndex(s => s.ID === station.ID)
      );

      setAllStations(uniqueStations);
      const filtered = FilterService.applyFilters(uniqueStations, filters);
      setStations(filtered);

      // Analytics: Stations loaded
      AnalyticsService.trackUserBehavior(userId, sessionId, 'stations_loaded', {
        count: uniqueStations.length,
        location: location,
      });

      showToast(`${uniqueStations.length} istasyon bulundu`, 'success');
    } catch (error) {
      console.error('İstasyon verileri yüklenirken hata:', error);
      showToast('İstasyonlar yüklenemedi. Lütfen daha sonra tekrar deneyin.', 'error');
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
    showToast('Filtreler uygulandı', 'success');
  };

  const applyAdvancedFilters = (newAdvancedFilters: AdvancedFilterOptions) => {
    setAdvancedFilters(newAdvancedFilters);
    // TODO: Implement advanced filtering logic
    showToast('Gelişmiş filtreler uygulandı', 'success');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = FilterService.applyFilters(allStations, filters);
    const searched = FilterService.searchStations(filtered, query);
    setStations(searched);
    
    // Analytics: Search performed
    AnalyticsService.trackUserBehavior(userId, sessionId, 'search_performed', { query });
  };

  // Quick filter handling
  const handleQuickFilterPress = (filterType: string) => {
    setActiveQuickFilters(prev => {
      if (prev.includes(filterType)) {
        return prev.filter(f => f !== filterType);
      } else {
        return [...prev, filterType];
      }
    });
    
    // Analytics: Quick filter used
    AnalyticsService.trackUserBehavior(userId, sessionId, 'quick_filter_used', { filterType });
  };

  // Station marker press handler
  const handleStationPress = (station: ChargingStation) => {
    if (__DEV__) {
      console.log('[SarjetMainScreen] Station marker pressed:', station.ID);
    }
    setSelectedStation(station);
    
    // Analytics: Station viewed
    AnalyticsService.updateStationAnalytics(station.ID.toString(), 'view');
    AnalyticsService.trackUserBehavior(userId, sessionId, 'station_viewed', { stationId: station.ID });
    
    // Animation
    bounce(fadeAnim);
  };

  // Bottom navigation handling
  const handleTabPress = (tab: string) => {
    switch (tab) {
      case 'route':
        setRoutePlanningVisible(true);
        break;
      case 'explore':
        setAdvancedFilterVisible(true);
        break;
      case 'profile':
        setProfileVisible(true);
        break;
      default:
        console.log('Tab pressed:', tab);
    }
    
    // Analytics: Tab navigation
    AnalyticsService.trackUserBehavior(userId, sessionId, 'tab_navigation', { tab });
  };

  const handleCenterActionPress = () => {
    if (selectedStation) {
      // Start charging
      showToast('Şarj işlemi başlatılıyor...', 'info');
      
      // Analytics: Charging started
      AnalyticsService.trackUserBehavior(userId, sessionId, 'charging_started', { 
        stationId: selectedStation.ID 
      });
    } else {
      showToast('Lütfen önce bir istasyon seçin', 'warning');
    }
  };

  // Route planning
  const handleRouteCreated = (route: RouteInfo) => {
    showToast('Rota oluşturuldu!', 'success');
    
    // Analytics: Route created
    AnalyticsService.trackUserBehavior(userId, sessionId, 'route_created', { 
      route: route 
    });
  };

  // Toast helper
  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  // Social features
  const handleSocialFeatures = () => {
    if (selectedStation) {
      setSocialFeaturesVisible(true);
    } else {
      showToast('Lütfen önce bir istasyon seçin', 'warning');
    }
  };

  // If data is not ready, show a loading screen.
  if (!initialRegion) {
    return <LoadingScreen message="Konum bilgisi alınıyor..." type="spinner" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={themeColors.background} 
      />
      
      {/* Toast Messages */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
      
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSearch={() => handleSearch(searchQuery)}
        onShowFilters={() => setFilterVisible(true)}
        placeholder="Konum veya İstasyon ara"
        filterCount={FilterService.getActiveFilterCount(filters)}
        isDarkMode={isDarkMode}
        onFilterPress={handleQuickFilterPress}
        activeFilters={activeQuickFilters}
      />
      
      {/* Map Area */}
      <Animated.View 
        style={[
          styles.mapContainer,
          { opacity: fadeAnim }
        ]}
      >
        <ClusteredMapView
          stations={stations}
          initialRegion={initialRegion}
          onStationPress={handleStationPress}
          isDarkMode={isDarkMode}
        />
        
        {/* Right side action buttons */}
        <View style={styles.mapActionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setAdvancedFilterVisible(true)}
          >
            <Ionicons name="heart-outline" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setThemeSettingsVisible(true)}
          >
            <Ionicons name="layers-outline" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleRefresh}
          >
            <Ionicons name="locate" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setRoutePlanningVisible(true)}
          >
            <Ionicons name="swap-horizontal" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSocialFeatures}
          >
            <Ionicons name="information-circle-outline" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Station Details Card */}
      <StationDetailsCard
        stations={stations}
        onStationPress={handleStationPress}
        isDarkMode={isDarkMode}
      />

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab="map"
        onTabPress={handleTabPress}
        onCenterActionPress={handleCenterActionPress}
        isDarkMode={isDarkMode}
      />

      {/* Modals */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={filters}
        onApplyFilters={applyFilters}
        stations={allStations}
        isDarkMode={isDarkMode}
      />

      <AdvancedFilterModal
        visible={advancedFilterVisible}
        onClose={() => setAdvancedFilterVisible(false)}
        onApplyFilters={applyAdvancedFilters}
        currentFilters={advancedFilters}
        stations={allStations}
      />

      <RoutePlanning
        visible={routePlanningVisible}
        onClose={() => setRoutePlanningVisible(false)}
        onRouteCreated={handleRouteCreated}
        userLocation={userLocation}
        stations={stations}
      />

      {selectedStation && (
        <SocialFeatures
          station={selectedStation}
          onClose={() => setSocialFeaturesVisible(false)}
        />
      )}

      <ThemeSettings
        visible={themeSettingsVisible}
        onClose={() => setThemeSettingsVisible(false)}
      />

      <ProfileModal 
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
        userLocation={userLocation}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => {}}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapActionButtons: {
    position: 'absolute',
    right: 16,
    top: '30%',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default SarjetMainScreen;