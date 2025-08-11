import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

const { width } = Dimensions.get('window');

interface StationDetailsCardProps {
  stations: ChargingStation[];
  onStationPress: (station: ChargingStation) => void;
  isDarkMode?: boolean;
}

export const StationDetailsCard: React.FC<StationDetailsCardProps> = ({
  stations,
  onStationPress,
  isDarkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<'nearby' | 'favorites'>('nearby');
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(
    stations.length > 0 ? stations[0] : null
  );

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

  return (
    <View style={styles.container}>
      {/* Üstteki çizgi - Resimdeki gibi */}
      <View style={styles.dragIndicator} />
      
      {/* Sekmeler */}
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

      {/* İstasyon Detayları - Resimdeki gibi */}
      {selectedStation && (
        <View style={styles.stationDetails}>
          {/* İstasyon Başlığı ve Logo */}
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

          {/* Rating ve Mesafe - Resimdeki gibi */}
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

      {/* İstasyon Listesi */}
      <ScrollView 
        style={styles.stationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stationsListContent}
      >
        {stations.slice(0, 5).map((station, index) => (
          <TouchableOpacity
            key={station.ID}
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
    </View>
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
    maxHeight: 500,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
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
  connectionTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connectionTypeChip: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectionTypeText: {
    fontSize: 12,
    color: colors.gray700,
    fontWeight: '500',
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