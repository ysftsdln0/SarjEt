import React, { useState, useRef } from 'react';
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

const { height } = Dimensions.get('window');

interface StationDetailsCardProps {
  stations: ChargingStation[];
  onStationPress: (station: ChargingStation) => void;
  isDarkMode?: boolean;
  onHeightChange?: (height: number) => void;
}

const StationDetailsCard: React.FC<StationDetailsCardProps> = ({
  stations,
  onStationPress,
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

  const getStationDistance = (station: ChargingStation) => {
    return station.AddressInfo?.Distance || 0;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} M`;
    }
    return `${distance.toFixed(2)} KM`;
  };

  // Pan gesture handler
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: false }
  );

  const onPanHandlerStateChange = (event: { nativeEvent: { state: number; translationY: number; velocityY: number } }) => {
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
  activeTab: {
    borderBottomColor: colors.primary,
  },
  activeTabText: {
    color: colors.tabActive,
    fontWeight: '600',
  },
  arrowIcon: {
    position: 'absolute',
    right: -2,
    top: 2,
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    bottom: 0,
    elevation: 10,
    left: 0,
    maxHeight: height * 0.8,
    minHeight: 300,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    position: 'absolute',
    right: 0,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 1000,
  },
  distanceContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  distanceIcon: {
    marginRight: 4,
    position: 'relative',
  },
  distanceText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  dragHandle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dragIndicator: {
    backgroundColor: colors.gray300,
    borderRadius: 2,
    flex: 1,
    height: 4,
    width: 40,
  },
  favoriteButton: {
    padding: 8,
  },
  itemLogoText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActionButton: {
    backgroundColor: colors.gray100,
    borderRadius: 20,
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ratingText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  reviewCount: {
    color: colors.gray600,
    fontSize: 14,
  },
  selectedStationItem: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
    borderWidth: 1,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 4,
  },
  stationAddress: {
    color: colors.gray600,
    fontSize: 14,
    lineHeight: 20,
  },
  stationDetails: {
    marginBottom: 20,
  },
  stationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  stationInfo: {
    flex: 1,
  },
  stationItem: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  stationItemAddress: {
    color: colors.gray600,
    fontSize: 14,
  },
  stationItemContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stationItemDistance: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stationItemFavorite: {
    padding: 4,
  },
  stationItemInfo: {
    flex: 1,
  },
  stationItemLogo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    marginRight: 12,
    width: 32,
  },
  stationItemMeta: {
    alignItems: 'flex-end',
  },
  stationItemName: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  stationLogo: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
    width: 40,
  },
  stationMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  stationName: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  stationsList: {
    flex: 1,
  },
  stationsListContent: {
    paddingBottom: 20,
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 12,
  },
  tabText: {
    color: colors.tabInactive,
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 20,
  },
});

export default StationDetailsCard; 