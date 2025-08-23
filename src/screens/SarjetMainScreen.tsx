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
import { ChargingStation, UserLocation, FilterOptions, Region } from '../types';
import { Header } from '../components/Header';
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
import NotificationService from '../services/NotificationService';
import AnalyticsService from '../services/AnalyticsService';
import MapboxClusteredMapView from '../components/MapboxClusteredMapView';
import { BottomNavigation } from '../components/BottomNavigation';
import { useTheme } from '../contexts/ThemeContext';
import { Linking } from 'react-native';
import { 
  fadeIn, 
  fadeOut, 
  slideUp, 
  slideDown, 
  bounce, 
  markerPopup 
} from '../utils/animationUtils';

const { width, height } = Dimensions.get('window');

const SarjetMainScreen: React.FC<{
  authToken: string | null;
  user: any;
  onLogout: () => void;
}> = ({ authToken, user, onLogout }) => {
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
  const [plannedRoute, setPlannedRoute] = useState<{ 
    points: Array<{ latitude: number; longitude: number; type?: string; title?: string }>;
    routeCoordinates?: [number, number][];
  } | null>(null);

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
      setLoading(false);
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
    setRefreshing(true);
    await loadStations();
    setRefreshing(false);
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

  // Handle search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setStations(allStations);
      return;
    }
    // Önce istasyon adı/adresinde ara
    const filtered = allStations.filter(station =>
      station.AddressInfo?.Title?.toLowerCase().includes(query.toLowerCase()) ||
      station.AddressInfo?.AddressLine1?.toLowerCase().includes(query.toLowerCase())
    );
    setStations(filtered);
    // Şehir/ilçe için geocoding yap ve üstte bir hedef seçimi öner
    try {
      const results = await searchPlaces(query, 'tr', 1);
      if (results[0]) {
        setMapCenter({ latitude: results[0].latitude, longitude: results[0].longitude });
        // Kullanıcıya hedef olarak seçme butonu için preset sakla
        setPresetDestination({ name: results[0].displayName, latitude: results[0].latitude, longitude: results[0].longitude });
        showToast('Konuma odaklanmak için hedef seçimi menüsünü kullanın', 'info');
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
    console.log('=== END ROUTE DEBUG ===');
    
    AnalyticsService.trackUserBehavior(userId, sessionId, 'route_created', { route });
  }, []);

  // Show toast
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
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
        onChangeText={setSearchQuery}
        onSearch={() => handleSearch(searchQuery)}
        onShowFilters={() => setFilterVisible(true)}
        isDarkMode={isDarkMode}
        activeFilters={activeQuickFilters}
        onFilterPress={handleQuickFilterPress}
        searchSuggestion={presetDestination}
        onSuggestionSelect={() => setRoutePlanningVisible(true)}
        onSuggestionDismiss={() => setPresetDestination(null)}
      />

      {/* Quick Filters */}
      <QuickFilterBar
        filters={[
          { 
            id: 'available', 
            title: 'Müsait', 
            icon: 'checkmark-circle', 
            color: colors.success,
            active: activeQuickFilters.includes('available')
          },
          { 
            id: 'fast', 
            title: 'Hızlı', 
            icon: 'flash', 
            color: colors.warning,
            active: activeQuickFilters.includes('fast')
          },
          { 
            id: 'free', 
            title: 'Ücretsiz', 
            icon: 'gift', 
            color: colors.accent1,
            active: activeQuickFilters.includes('free')
          },
          { 
            id: 'nearby', 
            title: 'Yakın', 
            icon: 'location', 
            color: colors.primary,
            active: activeQuickFilters.includes('nearby')
          },
          { 
            id: 'favorite', 
            title: 'Favoriler', 
            icon: 'heart', 
            color: colors.accent2,
            active: activeQuickFilters.includes('favorite')
          },
        ]}
        onFilterToggle={handleQuickFilterToggle}
        isDarkMode={isDarkMode}
      />

      {/* Enhanced Filter Button */}
      <View style={styles.enhancedFilterContainer}>
        <TouchableOpacity
          style={styles.enhancedFilterButton}
          onPress={() => setEnhancedFilterVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color={colors.primary} />
          <Text style={styles.enhancedFilterText}>
            Gelişmiş Filtreler
          </Text>
          {EnhancedFilterService.getActiveFilterCount(enhancedFilters) > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {EnhancedFilterService.getActiveFilterCount(enhancedFilters)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
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
              } catch (e) {
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
        presetDestination={presetDestination}
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapActionButtons: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
    gap: 12,
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
  startJourneyBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.black,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  startJourneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startJourneyText: {
    color: colors.white,
    fontWeight: '700',
  },
  clearRouteButton: {
    backgroundColor: colors.gray600,
    padding: 8,
    borderRadius: 8,
  },
  enhancedFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  enhancedFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  enhancedFilterText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 8,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SarjetMainScreen;