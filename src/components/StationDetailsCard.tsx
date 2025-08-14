import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

interface StationDetailsCardProps {
  stations: ChargingStation[];
  onStationPress: (station: ChargingStation) => void;
  isDarkMode?: boolean;
  onHeightChange?: (height: number) => void;
}

const StationDetailsCard: React.FC<StationDetailsCardProps> = ({
  stations,
  onStationPress,
  isDarkMode = false,
  onHeightChange,
}) => {
  const [activeTab, setActiveTab] = useState<'nearby' | 'favorites'>('nearby');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(
    stations.length > 0 ? stations[0] : null
  );

  // Animation values
  const translateY = useRef(new Animated.Value(0)).current;
  const cardHeight = useRef(new Animated.Value(300)).current;
  const isExpanded = useRef(false);

  const tabs = [
    { key: 'nearby', label: 'Yakındaki istasyonlar' },
    { key: 'favorites', label: 'Favori istasyonlar' },
  ];

  const handleStationSelect = (station: ChargingStation) => {
    setSelectedStation(station);
    onStationPress(station);
  };

  const getStationRating = (station: ChargingStation) => {
    // Mock rating - gerçek uygulamada station'dan gelecek
    return { rating: 4.5, reviewCount: 12 };
  };

  const getStationDistance = (station: ChargingStation) => {
    return station.AddressInfo?.Distance || 0;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} M`;
    }
    return `${distance.toFixed(2)} KM`;
  };

  const getConnectionTypes = (station: ChargingStation) => {
    if (!station.Connections || station.Connections.length === 0) return [];
    
    const types = station.Connections
      .map(conn => conn.ConnectionType?.Title)
      .filter(Boolean);
    
    return [...new Set(types)];
  };

  // Pan gesture handler
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Determine if should expand or collapse based on velocity and distance
      const shouldExpand = velocityY < -500 || (translationY < -50 && !isExpanded.current);
      const shouldCollapse = velocityY > 500 || (translationY > 50 && isExpanded.current);
      
      if (shouldExpand && !isExpanded.current) {
        expandCard();
      } else if (shouldCollapse && isExpanded.current) {
        collapseCard();
      } else {
        // Reset to current state
        resetCard();
      }
      
      translateY.setValue(0);
    }
  };

  const expandCard = () => {
    isExpanded.current = true;
    Animated.parallel([
      Animated.timing(cardHeight, {
        toValue: height * 0.8, // 80% of screen height
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: -height * 0.3,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    
    onHeightChange?.(height * 0.8);
  };

  const collapseCard = () => {
    isExpanded.current = false;
    Animated.parallel([
      Animated.timing(cardHeight, {
        toValue: 300,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
    
    onHeightChange?.(300);
  };

  const resetCard = () => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Quick expand/collapse buttons
  const handleQuickExpand = () => {
    if (isExpanded.current) {
      collapseCard();
    } else {
      expandCard();
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          height: cardHeight,
        },
      ]}
    >
      {/* Drag Indicator */}
      <PanGestureHandler
        onGestureEvent={onPanGestureEvent}
        onHandlerStateChange={onPanHandlerStateChange}
      >
        <View style={styles.dragHandle}>
          <View style={styles.dragIndicator} />
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleQuickExpand}
            >
              <Ionicons 
                name={isExpanded.current ? 'chevron-down' : 'chevron-up'} 
                size={20} 
                color={colors.gray600} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="resize" size={20} color={colors.gray600} />
            </TouchableOpacity>
          </View>
        </View>
      </PanGestureHandler>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key as 'nearby' | 'favorites')}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.key && styles.activeTabText,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Station Details */}
      {selectedStation && (
        <View style={styles.stationDetails}>
          {/* Station Header and Logo */}
          <View style={styles.stationHeader}>
            <View style={styles.stationLogo}>
              <Text style={styles.logoText}>zes</Text>
            </View>
            <View style={styles.stationInfo}>
              <Text style={styles.stationName}>
                {selectedStation.AddressInfo?.Title || 'İsimsiz İstasyon'}
              </Text>
              <Text style={styles.stationAddress}>
                {selectedStation.AddressInfo?.AddressLine1 || 'Adres bilgisi yok'}
              </Text>
            </View>
          </View>

          {/* Rating and Distance */}
          <View style={styles.stationMeta}>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>4.5</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= 4.5 ? 'star' : 'star-outline'}
                    size={16}
                    color={colors.accent1}
                  />
                ))}
              </View>
              <Text style={styles.reviewCount}>(12)</Text>
            </View>
            
            <View style={styles.distanceContainer}>
              <View style={styles.distanceIcon}>
                <Ionicons name="diamond" size={16} color={colors.primary} />
                <Ionicons name="arrow-forward" size={12} color={colors.primary} style={styles.arrowIcon} />
              </View>
              <Text style={styles.distanceText}>
                {formatDistance(getStationDistance(selectedStation))}
              </Text>
            </View>

            <TouchableOpacity style={styles.favoriteButton}>
              <Ionicons name="heart" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Stations List */}
      <ScrollView 
        style={styles.stationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stationsListContent}
      >
        {stations.slice(0, 5).map((station, index) => (
          <TouchableOpacity
            key={`station-${station.ID}-${index}`}
            style={[
              styles.stationItem,
              selectedStation?.ID === station.ID && styles.selectedStationItem,
            ]}
            onPress={() => handleStationSelect(station)}
          >
            <View style={styles.stationItemContent}>
              <View style={styles.stationItemLogo}>
                <Text style={styles.itemLogoText}>zes</Text>
              </View>
              <View style={styles.stationItemInfo}>
                <Text style={styles.stationItemName}>
                  {station.AddressInfo?.Title || 'İsimsiz İstasyon'}
                </Text>
                <Text style={styles.stationItemAddress}>
                  {station.AddressInfo?.Town || 'Konum bilgisi yok'}
                </Text>
              </View>
              <View style={styles.stationItemMeta}>
                <Text style={styles.stationItemDistance}>
                  {formatDistance(getStationDistance(station))}
                </Text>
                <TouchableOpacity style={styles.stationItemFavorite}>
                  <Ionicons name="heart-outline" size={16} color={colors.gray500} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 300,
    maxHeight: height * 0.8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.gray100,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.tabInactive,
  },
  activeTabText: {
    color: colors.tabActive,
    fontWeight: '600',
  },
  stationDetails: {
    marginBottom: 20,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stationLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  stationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.black,
    fontWeight: '600',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: colors.gray600,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceIcon: {
    position: 'relative',
    marginRight: 4,
  },
  arrowIcon: {
    position: 'absolute',
    top: 2,
    right: -2,
  },
  distanceText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
  },
  stationsList: {
    flex: 1,
  },
  stationsListContent: {
    paddingBottom: 20,
  },
  stationItem: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedStationItem: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  stationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stationItemLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemLogoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stationItemInfo: {
    flex: 1,
  },
  stationItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
    marginBottom: 4,
  },
  stationItemAddress: {
    fontSize: 14,
    color: colors.gray600,
  },
  stationItemMeta: {
    alignItems: 'flex-end',
  },
  stationItemDistance: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  stationItemFavorite: {
    padding: 4,
  },
});

export default StationDetailsCard; 