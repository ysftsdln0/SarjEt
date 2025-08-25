import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
} from 'react-native';
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation, UserLocation, FilterOptions, Region } from '../types';
import { SearchBar } from '../components/SearchBar';
import LoadingScreen from '../components/LoadingScreen';
import { ProfileModal } from '../components/ProfileModal';
import { FilterModal } from '../components/FilterModal';
import AdvancedFilterModal, { AdvancedFilterOptions } from '../components/AdvancedFilterModal';
import EnhancedFilterSystem, { EnhancedFilterOptions } from '../components/EnhancedFilterSystem';
import QuickFilterBar from '../components/QuickFilterBar';
import RoutePlanning, { RouteInfo } from '../components/RoutePlanning';

import Toast, { ToastType } from '../components/Toast';
import ThemeSettings from '../components/ThemeSettings';
import StationReviewsModal from '../components/StationReviewsModal';
import { chargingStationService } from '../services/chargingStationService';
import { searchPlaces } from '../services/geocodingService';
import { LocationService } from '../services/locationService';
import { FilterService } from '../services/filterService';
import EnhancedFilterService from '../services/enhancedFilterService';
import AnalyticsService from '../services/AnalyticsService';
import MapboxClusteredMapView from '../components/MapboxClusteredMapView';
import { BottomNavigation } from '../components/BottomNavigation';
import { useTheme } from '../contexts/ThemeContext';
import { Linking } from 'react-native';
import { 
  bounce, 
} from '../utils/animationUtils';

const { height } = Dimensions.get('window');

const SarjetMainScreen: React.FC<{
  authToken: string | null;
  user: { name?: string; email?: string } | null;
  onLogout: () => void;
}> = ({ authToken, user, onLogout }) => {
  const { isDarkMode, colors: themeColors } = useTheme();
  
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [allStations, setAllStations] = useState<ChargingStation[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [initialRegion, setInitialRegion] = useState<Region | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal visibility states
  const [profileVisible, setProfileVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  const [enhancedFilterVisible, setEnhancedFilterVisible] = useState(false);
  const [routePlanningVisible, setRoutePlanningVisible] = useState(false);

  const [themeSettingsVisible, setThemeSettingsVisible] = useState(false);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  
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
  
  const [enhancedFilters, setEnhancedFilters] = useState<EnhancedFilterOptions>(
    EnhancedFilterService.getDefaultFilters()
  );
  
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

  // Responsive map height
  const [mapHeight, setMapHeight] = useState(height);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [presetDestination, setPresetDestination] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<{ name: string; latitude: number; longitude: number } | null>(null);
  const [plannedRoute, setPlannedRoute] = useState<{ 
    points: Array<{ latitude: number; longitude: number; type?: string; title?: string }>;
    routeCoordinates?: [number, number][];
  } | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Analytics
  const sessionId = useRef(Date.now().toString()).current;
  const userId = useRef('user-' + Math.random().toString(36).substr(2, 9)).current;

  // Fetch user location and set the initial map region
  const initializeLocation = useCallback(async () => {
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
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setInitialRegion(region);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      showToast('Konum alınamadı. Varsayılan konum kullanılıyor.', 'warning');
      
      // Default location (Istanbul)
      const defaultLocation = { latitude: 41.0082, longitude: 28.9784 };
      const defaultRegion = { ...defaultLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      
      setUserLocation(defaultLocation);
      setInitialRegion(defaultRegion);
    } finally {
      // Loading completed
    }
  }, []);

  // Load charging stations
  const loadStations = useCallback(async () => {
    if (!userLocation) return;
    
    try {
      if (__DEV__) {
        console.log('[SarjetMainScreen] Loading stations for location:', userLocation);
      }
      
      const nearbyStations = await chargingStationService.getNearbyStations(
        userLocation.latitude,
        userLocation.longitude,
        200 // Daha geniş radius - 200km
      );
      
      setAllStations(nearbyStations);
      setStations(nearbyStations);
      
      if (__DEV__) {
        console.log('[SarjetMainScreen] Loaded', nearbyStations.length, 'stations');
      }
    } catch (error) {
      console.error('İstasyonlar yüklenemedi:', error);
      showToast('İstasyonlar yüklenemedi', 'error');
    }
  }, [userLocation]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    await loadStations();
  }, [loadStations]);

  // Apply filters
  const applyFilters = useCallback((newFilters: FilterOptions) => {
    const filteredStations = FilterService.applyFilters(allStations, newFilters);
    setStations(filteredStations);
    setFilters(newFilters);
    setFilterVisible(false);
  }, [allStations]);

  // Apply advanced filters
  const applyAdvancedFilters = useCallback((newFilters: AdvancedFilterOptions) => {
    setAdvancedFilters(newFilters);
    setAdvancedFilterVisible(false);
    
    // Apply advanced filters logic here
    showToast('Gelişmiş filtreler uygulandı', 'success');
  }, []);

  // Handle search input change
  const handleSearchInputChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setPresetDestination(null); // Clear suggestion when search is cleared
      setStations(allStations); // Show all stations when search is cleared
    } else {
      // Only do real-time filtering for stations, not geocoding
      const filtered = allStations.filter(station =>
        station.AddressInfo?.Title?.toLowerCase().includes(text.toLowerCase()) ||
        station.AddressInfo?.AddressLine1?.toLowerCase().includes(text.toLowerCase())
      );
      setStations(filtered);
    }
  }, [allStations]);

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStations(allStations);
      setPresetDestination(null);
      return;
    }
    
    // Şehir/ilçe için geocoding yap ve üstte bir hedef seçimi öner
    try {
      const results = await searchPlaces(query, 'tr', 1);
      if (results[0]) {
        // Haritayı o konuma odakla
        setMapCenter({ latitude: results[0].latitude, longitude: results[0].longitude });
        // Kullanıcıya hedef olarak seçme butonu için preset sakla
        setPresetDestination({ name: results[0].displayName, latitude: results[0].latitude, longitude: results[0].longitude });
        showToast('Hedef olarak belirlemek için "Hedef Seç" butonuna dokunun', 'info');
      }
    } catch {}
    AnalyticsService.trackUserBehavior(userId, sessionId, 'search_performed', { query });
  }, [allStations]);

  // Handle quick filter press
  const handleQuickFilterPress = useCallback((filter: string) => {
    setActiveQuickFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      } else {
        return [...prev, filter];
      }
    });
    
    AnalyticsService.trackUserBehavior(userId, sessionId, 'quick_filter_used', { filter });
  }, []);

  // Handle station press
  const handleStationPress = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
    setReviewsModalVisible(true);
    AnalyticsService.updateStationAnalytics(station.ID.toString(), 'view');
    AnalyticsService.trackUserBehavior(userId, sessionId, 'station_viewed', { stationId: station.ID });
    bounce(fadeAnim).start();
  }, []);

  // Handle tab press
  const handleTabPress = useCallback((tab: string) => {
    switch (tab) {
      case 'route':
        setRoutePlanningVisible(true);
        if (selectedDestination) {
          showToast('Hedefi seçili rota planlama açılıyor', 'info');
        }
        break;
      case 'campaigns':
        showToast('Kampanyalar çok yakında!', 'info');
        break;
      case 'profile':
        setProfileVisible(true);
        break;
      default:
        console.log('Tab pressed:', tab);
    }
    AnalyticsService.trackUserBehavior(userId, sessionId, 'tab_navigation', { tab });
  }, []);

  // Handle center action press
  const handleCenterActionPress = useCallback(() => {
    if (selectedStation) {
      showToast('Şarj işlemi başlatılıyor...', 'info');
      AnalyticsService.trackUserBehavior(userId, sessionId, 'charging_started', { stationId: selectedStation.ID });
    } else {
      showToast('Lütfen önce bir istasyon seçin', 'warning');
    }
  }, [selectedStation]);

  // Handle route created
  const handleRouteCreated = useCallback((route: RouteInfo) => {
    showToast('Rota oluşturuldu!', 'success');
    
    console.log('=== ROUTE CREATED DEBUG ===');
    console.log('Route received:', route);
    console.log('Route waypoints:', route.waypoints);
    console.log('Route waypoints count:', route.waypoints?.length);
    
    // Her waypoint'in detaylarını logla
    route.waypoints?.forEach((w, index) => {
      console.log(`Waypoint ${index}:`, {
        type: w.type,
        name: w.name,
        coordinates: w.coordinates
      });
    });
    
    // Backend'den gelen şarj durakları ile birlikte tüm nokta bilgilerini al
    const allPoints = route.waypoints.map(w => ({ 
      latitude: w.coordinates.latitude, 
      longitude: w.coordinates.longitude,
      type: w.type,
      title: w.name
    }));
    
    console.log('Processed points:', allPoints);
    console.log('Waypoint points (charging stops):', allPoints.filter(p => p.type === 'waypoint'));
    
    // Gerçek rota koordinatları varsa onları kullan, yoksa fallback olarak waypoint'leri kullan
    const routeData = { 
      points: allPoints,
      routeCoordinates: route.routeCoordinates // Mapbox Directions'dan gelen gerçek rota
    };
    
    console.log('Setting planned route:', routeData);
    console.log('Route data points count:', routeData.points?.length);
    console.log('Route coordinates count:', routeData.routeCoordinates?.length);
    setPlannedRoute(routeData);
    setSelectedDestination(null); // Clear selected destination after route is created
    console.log('=== END ROUTE DEBUG ===');
    
    AnalyticsService.trackUserBehavior(userId, sessionId, 'route_created', { route });
  }, []);

  // Show toast
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  }, []);

  // Handle suggestion select for destination
  const handleSuggestionSelect = useCallback((suggestion: { name: string; latitude: number; longitude: number }) => {
    setMapCenter({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setSelectedDestination(suggestion); // Store selected destination for route planning
    showToast(`${suggestion.name} hedef olarak belirlendi`, 'success');
    setPresetDestination(null); // Clear the suggestion after selection
  }, []);

  // Handle suggestion dismiss
  const handleSuggestionDismiss = useCallback(() => {
    setPresetDestination(null);
  }, []);

  // Handle quick filter toggle with enhanced filters
  const handleQuickFilterToggle = useCallback((filter: string) => {
    setActiveQuickFilters(prev => {
      if (prev.includes(filter)) {
        return prev.filter(f => f !== filter);
      } else {
        return [...prev, filter];
      }
    });
    
    // Enhanced filter sistemini de güncelle
    const newEnhancedFilters = { ...enhancedFilters };
    switch (filter) {
      case 'available':
        newEnhancedFilters.quickFilters.available = !enhancedFilters.quickFilters.available;
        break;
      case 'fast':
        newEnhancedFilters.quickFilters.fastCharging = !enhancedFilters.quickFilters.fastCharging;
        break;
      case 'free':
        newEnhancedFilters.quickFilters.free = !enhancedFilters.quickFilters.free;
        break;
      case 'nearby':
        newEnhancedFilters.quickFilters.nearby = !enhancedFilters.quickFilters.nearby;
        break;
      case 'favorite':
        newEnhancedFilters.quickFilters.favorite = !enhancedFilters.quickFilters.favorite;
        break;
    }
    
    setEnhancedFilters(newEnhancedFilters);
    applyEnhancedFilters(newEnhancedFilters);
    
    AnalyticsService.trackUserBehavior(userId, sessionId, 'quick_filter_used', { filter });
  }, [enhancedFilters]);

  // Apply enhanced filters
  const applyEnhancedFilters = useCallback((filtersToApply: EnhancedFilterOptions) => {
    let filtered = EnhancedFilterService.applyFilters(allStations, filtersToApply, userLocation);
    filtered = EnhancedFilterService.sortStations(
      filtered,
      filtersToApply.sorting.by,
      filtersToApply.sorting.order,
      userLocation
    );
    setStations(filtered);
  }, [allStations, userLocation]);

  // Handle enhanced filter apply
  const handleEnhancedFilterApply = useCallback((newFilters: EnhancedFilterOptions) => {
    setEnhancedFilters(newFilters);
    applyEnhancedFilters(newFilters);
    
    // Quick filter state'ini de güncelle
    const newQuickFilters: string[] = [];
    if (newFilters.quickFilters.available) newQuickFilters.push('available');
    if (newFilters.quickFilters.fastCharging) newQuickFilters.push('fast');
    if (newFilters.quickFilters.free) newQuickFilters.push('free');
    if (newFilters.quickFilters.nearby) newQuickFilters.push('nearby');
    if (newFilters.quickFilters.favorite) newQuickFilters.push('favorite');
    
    setActiveQuickFilters(newQuickFilters);
    
    AnalyticsService.trackUserBehavior(userId, sessionId, 'enhanced_filter_applied', { 
      filterCount: EnhancedFilterService.getActiveFilterCount(newFilters) 
    });
  }, [applyEnhancedFilters]);



  // Handle map height change
  const handleMapHeightChange = useCallback((newHeight: number) => {
    setMapHeight(newHeight);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    if (userLocation) {
      loadStations();
    }
  }, [userLocation, loadStations]);

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
        onChangeText={handleSearchInputChange}
        onSearch={() => handleSearch(searchQuery)}
        activeFilters={[]}
        onFilterPress={(filter) => {}}
        searchSuggestion={presetDestination}
        onSuggestionSelect={handleSuggestionSelect}
        onSuggestionDismiss={handleSuggestionDismiss}
      />

      {/* Enhanced Filter Button - Moved to right side action buttons */}
      
      {/* Map Container */}
      <Animated.View 
        style={[
          styles.mapContainer, 
          { 
            opacity: fadeAnim,
            height: mapHeight,
          }
        ]}
      >
        <MapboxClusteredMapView
          stations={stations}
          userLocation={userLocation}
          initialRegion={initialRegion}
          onStationPress={handleStationPress}
          selectedStation={selectedStation}
          isDarkMode={isDarkMode}
          centerTo={mapCenter}
          plannedRoute={plannedRoute}
        />
        
        {/* Map Action Buttons */}
        <View style={styles.mapActionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setAdvancedFilterVisible(true)}
          >
            <Ionicons name="heart-outline" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setEnhancedFilterVisible(true)}
          >
            <Ionicons name="options-outline" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleRefresh}
          >
            <Ionicons name="locate" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>

        </View>
      </Animated.View>

      {/* Start journey CTA when route exists */}

      {/* Start journey CTA when route exists */}
      {plannedRoute && (
        <View style={styles.startJourneyBar}>
          <TouchableOpacity
            style={styles.startJourneyButton}
            onPress={async () => {
              try {
                const pts = plannedRoute.points;
                if (!pts || pts.length < 2) return;
                const start = pts[0];
                const end = pts[pts.length - 1];
                const wps = pts.slice(1, -1);
                const url = LocationService.getDirectionsUrlMulti(start, end, wps);
                const canOpen = await Linking.canOpenURL(url);
                if (canOpen) {
                  await Linking.openURL(url);
                } else {
                  showToast('Harita uygulaması açılamadı', 'error');
                }
              } catch {
                showToast('Haritaya yönlendirme başarısız', 'error');
              }
            }}
          >
            <Ionicons name="navigate" size={18} color={colors.white} />
            <Text style={styles.startJourneyText}>Yolculuğa Başla</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPlannedRoute(null)} style={styles.clearRouteButton}>
            <Ionicons name="close" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNavigationContainer}>
        <BottomNavigation
          activeTab="map"
          onTabPress={handleTabPress}
          onCenterActionPress={handleCenterActionPress}
        />
      </View>
      
      {/* Modals */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        onApplyFilters={applyFilters}
        filters={filters}
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

      {/* Enhanced Filter System */}
      <EnhancedFilterSystem
        visible={enhancedFilterVisible}
        onClose={() => setEnhancedFilterVisible(false)}
        onApplyFilters={handleEnhancedFilterApply}
        currentFilters={enhancedFilters}
        stations={allStations}
        userLocation={userLocation}
        isDarkMode={isDarkMode}
      />
      
      <RoutePlanning
        visible={routePlanningVisible}
        onClose={() => setRoutePlanningVisible(false)}
        onRouteCreated={handleRouteCreated}
        userLocation={userLocation}
        stations={stations}
        presetDestination={selectedDestination}
        authToken={authToken || undefined}
      />
      

      
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
        onLogout={onLogout}
        user={user}
      />
      
      {/* Station Reviews Modal */}
      <StationReviewsModal
        station={selectedStation}
        visible={reviewsModalVisible}
        onClose={() => setReviewsModalVisible(false)}
        onHeightChange={handleMapHeightChange}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 22,
    elevation: 3,
    height: 44,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: 44,
  },
  clearRouteButton: {
    backgroundColor: colors.gray600,
    borderRadius: 8,
    padding: 8,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  enhancedFilterButton: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  enhancedFilterContainer: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  enhancedFilterText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  filterBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 20,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  mapActionButtons: {
    gap: 12,
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  startJourneyBar: {
    alignItems: 'center',
    backgroundColor: colors.black,
    borderRadius: 12,
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    position: 'absolute',
    right: 12,
  },
  startJourneyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  startJourneyText: {
    color: colors.white,
    fontWeight: '700',
  },
  bottomNavigationContainer: {
    paddingBottom: 0, // Alt menüyü daha aşağı it
  },
});

export default SarjetMainScreen;