import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  TextInput,
  Animated,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

const { width, height } = Dimensions.get('window');

// Gelişmiş Filter Tipi
export interface EnhancedFilterOptions {
  // Hızlı Filtreler
  quickFilters: {
    available: boolean;
    fastCharging: boolean;
    free: boolean;
    nearby: boolean;
    favorite: boolean;
  };
  
  // Mesafe ve Konum
  location: {
    maxDistance: number;
    useCurrentLocation: boolean;
    customLocation?: {
      latitude: number;
      longitude: number;
      name: string;
    };
  };
  
  // Şarj Özellikleri
  charging: {
    connectionTypes: string[];
    minPower: number;
    maxPower: number;
    supportedStandards: string[];
  };
  
  // İşletmeci ve Fiyat
  business: {
    operators: string[];
    priceRange: {
      min: number;
      max: number;
      free: boolean;
    };
    paymentMethods: string[];
  };
  
  // Çalışma Saatleri
  schedule: {
    openNow: boolean;
    twentyFourSeven: boolean;
    customHours?: {
      start: string;
      end: string;
    };
  };
  
  // Değerlendirme ve Yorumlar
  ratings: {
    minRating: number;
    hasReviews: boolean;
    verifiedOnly: boolean;
  };
  
  // Özel Özellikler
  amenities: {
    parking: boolean;
    restroom: boolean;
    restaurant: boolean;
    wifi: boolean;
    shelter: boolean;
  };
  
  // Sıralama
  sorting: {
    by: 'distance' | 'rating' | 'price' | 'power' | 'availability';
    order: 'asc' | 'desc';
  };
}

interface EnhancedFilterSystemProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: EnhancedFilterOptions) => void;
  currentFilters: EnhancedFilterOptions;
  stations: ChargingStation[];
  userLocation?: { latitude: number; longitude: number } | null;
  isDarkMode?: boolean;
}

const EnhancedFilterSystem: React.FC<EnhancedFilterSystemProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
  stations,
  userLocation,
  isDarkMode = true,
}) => {
  const [filters, setFilters] = useState<EnhancedFilterOptions>(currentFilters);
  const [activeTab, setActiveTab] = useState(0);
  const [slideAnim] = useState(new Animated.Value(height));
  const [searchQuery, setSearchQuery] = useState('');

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const tabs = [
    { id: 'quick', title: 'Hızlı', icon: 'flash-outline' },
    { id: 'location', title: 'Konum', icon: 'location-outline' },
    { id: 'charging', title: 'Şarj', icon: 'battery-charging-outline' },
    { id: 'business', title: 'İşletme', icon: 'business-outline' },
    { id: 'advanced', title: 'Gelişmiş', icon: 'settings-outline' },
  ];

  // Modal animasyonları
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Mevcut istasyonlardan dinamik veriler
  const availableConnectionTypes = useMemo(() => {
    const types = new Set<string>();
    stations.forEach(station => {
      station.Connections?.forEach(conn => {
        if (conn.ConnectionType?.Title) {
          types.add(conn.ConnectionType.Title);
        }
      });
    });
    return Array.from(types).sort();
  }, [stations]);

  const availableOperators = useMemo(() => {
    const operators = new Set<string>();
    stations.forEach(station => {
      if (station.OperatorInfo?.Title) {
        operators.add(station.OperatorInfo.Title);
      }
    });
    return Array.from(operators).sort();
  }, [stations]);

  const powerRange = useMemo(() => {
    let minPower = Infinity;
    let maxPower = 0;
    stations.forEach(station => {
      station.Connections?.forEach(conn => {
        const power = conn.PowerKW || 0;
        if (power > 0) {
          minPower = Math.min(minPower, power);
          maxPower = Math.max(maxPower, power);
        }
      });
    });
    return {
      min: minPower === Infinity ? 0 : minPower,
      max: maxPower,
    };
  }, [stations]);

  const handleFilterChange = <K extends keyof EnhancedFilterOptions>(
    section: K,
    key: keyof EnhancedFilterOptions[K],
    value: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleQuickFilterToggle = (filterKey: keyof EnhancedFilterOptions['quickFilters']) => {
    handleFilterChange('quickFilters', filterKey, !filters.quickFilters[filterKey]);
  };

  const handleConnectionTypeToggle = (type: string) => {
    const current = filters.charging.connectionTypes;
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    handleFilterChange('charging', 'connectionTypes', updated);
  };

  const handleOperatorToggle = (operator: string) => {
    const current = filters.business.operators;
    const updated = current.includes(operator)
      ? current.filter(o => o !== operator)
      : [...current, operator];
    handleFilterChange('business', 'operators', updated);
  };

  const resetFilters = () => {
    const defaultFilters: EnhancedFilterOptions = {
      quickFilters: {
        available: false,
        fastCharging: false,
        free: false,
        nearby: false,
        favorite: false,
      },
      location: {
        maxDistance: 50,
        useCurrentLocation: true,
      },
      charging: {
        connectionTypes: [],
        minPower: powerRange.min,
        maxPower: powerRange.max,
        supportedStandards: [],
      },
      business: {
        operators: [],
        priceRange: { min: 0, max: 100, free: false },
        paymentMethods: [],
      },
      schedule: {
        openNow: false,
        twentyFourSeven: false,
      },
      ratings: {
        minRating: 0,
        hasReviews: false,
        verifiedOnly: false,
      },
      amenities: {
        parking: false,
        restroom: false,
        restaurant: false,
        wifi: false,
        shelter: false,
      },
      sorting: {
        by: 'distance',
        order: 'asc',
      },
    };
    setFilters(defaultFilters);
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const getFilteredStationsCount = () => {
    // Basit bir count hesapla - gerçek filtreleme mantığı FilterService'de olacak
    return stations.length;
  };

  // Tab içerikleri
  const renderQuickFilters = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Hızlı Filtreler</Text>
      <Text style={styles.sectionDescription}>
        En çok kullanılan filtrelerle hızlıca sonuç alın
      </Text>

      <View style={styles.quickFilterGrid}>
        {[
          { key: 'available', title: 'Müsait', icon: 'checkmark-circle', color: colors.success },
          { key: 'fastCharging', title: 'Hızlı Şarj', icon: 'flash', color: colors.warning },
          { key: 'free', title: 'Ücretsiz', icon: 'gift', color: colors.accent1 },
          { key: 'nearby', title: 'Yakındaki', icon: 'location', color: colors.primary },
          { key: 'favorite', title: 'Favoriler', icon: 'heart', color: colors.accent2 },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.quickFilterCard,
              filters.quickFilters[filter.key as keyof typeof filters.quickFilters] && 
              styles.quickFilterCardActive
            ]}
            onPress={() => handleQuickFilterToggle(filter.key as keyof typeof filters.quickFilters)}
          >
            <Ionicons
              name={filter.icon as any}
              size={24}
              color={
                filters.quickFilters[filter.key as keyof typeof filters.quickFilters]
                  ? colors.white
                  : filter.color
              }
            />
            <Text
              style={[
                styles.quickFilterText,
                filters.quickFilters[filter.key as keyof typeof filters.quickFilters] && 
                styles.quickFilterTextActive
              ]}
            >
              {filter.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sortingSection}>
        <Text style={styles.subsectionTitle}>Sıralama</Text>
        <View style={styles.sortingOptions}>
          {[
            { key: 'distance', title: 'Mesafe' },
            { key: 'rating', title: 'Değerlendirme' },
            { key: 'power', title: 'Güç' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortingOption,
                filters.sorting.by === option.key && styles.sortingOptionActive
              ]}
              onPress={() => handleFilterChange('sorting', 'by', option.key)}
            >
              <Text
                style={[
                  styles.sortingOptionText,
                  filters.sorting.by === option.key && styles.sortingOptionTextActive
                ]}
              >
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderLocationFilters = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Konum ve Mesafe</Text>
      
      <View style={styles.distanceSection}>
        <Text style={styles.subsectionTitle}>Maksimum Mesafe: {filters.location.maxDistance} km</Text>
        <View style={styles.distanceButtons}>
          {[5, 10, 25, 50, 100].map((distance) => (
            <TouchableOpacity
              key={distance}
              style={[
                styles.distanceButton,
                filters.location.maxDistance === distance && styles.distanceButtonActive
              ]}
              onPress={() => handleFilterChange('location', 'maxDistance', distance)}
            >
              <Text
                style={[
                  styles.distanceButtonText,
                  filters.location.maxDistance === distance && styles.distanceButtonTextActive
                ]}
              >
                {distance}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchTitle}>Mevcut konumumu kullan</Text>
          <Text style={styles.switchDescription}>
            Konum servisleriniz açık olmalı
          </Text>
        </View>
        <Switch
          value={filters.location.useCurrentLocation}
          onValueChange={(value) => handleFilterChange('location', 'useCurrentLocation', value)}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={filters.location.useCurrentLocation ? colors.white : colors.gray400}
        />
      </View>
    </View>
  );

  const renderChargingFilters = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Şarj Özellikleri</Text>
      
      <View style={styles.connectionTypesSection}>
        <Text style={styles.subsectionTitle}>Bağlantı Türleri</Text>
        <View style={styles.connectionGrid}>
          {availableConnectionTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.connectionCard,
                filters.charging.connectionTypes.includes(type) && styles.connectionCardActive
              ]}
              onPress={() => handleConnectionTypeToggle(type)}
            >
              <Text
                style={[
                  styles.connectionText,
                  filters.charging.connectionTypes.includes(type) && styles.connectionTextActive
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.powerSection}>
        <Text style={styles.subsectionTitle}>
          Şarj Gücü: {filters.charging.minPower} - {filters.charging.maxPower} kW
        </Text>
        <View style={styles.powerButtons}>
          {[
            { label: '≥50kW', min: 50, max: powerRange.max },
            { label: '≥100kW', min: 100, max: powerRange.max },
            { label: '≥150kW', min: 150, max: powerRange.max },
          ].map((power, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.powerButton,
                filters.charging.minPower === power.min && styles.powerButtonActive
              ]}
              onPress={() => {
                handleFilterChange('charging', 'minPower', power.min);
                handleFilterChange('charging', 'maxPower', power.max);
              }}
            >
              <Text
                style={[
                  styles.powerButtonText,
                  filters.charging.minPower === power.min && styles.powerButtonTextActive
                ]}
              >
                {power.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderBusinessFilters = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>İşletmeci ve Fiyat</Text>
      
      <View style={styles.operatorSection}>
        <Text style={styles.subsectionTitle}>İşletmeciler</Text>
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="İşletmeci ara..."
            placeholderTextColor={colors.gray500}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <ScrollView style={styles.operatorList} showsVerticalScrollIndicator={false}>
          {availableOperators
            .filter(op => op.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((operator) => (
            <TouchableOpacity
              key={operator}
              style={styles.operatorRow}
              onPress={() => handleOperatorToggle(operator)}
            >
              <Text style={styles.operatorText}>{operator}</Text>
              <Ionicons
                name={filters.business.operators.includes(operator) ? 'checkbox' : 'square-outline'}
                size={20}
                color={filters.business.operators.includes(operator) ? colors.primary : colors.gray400}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.priceSection}>
        <View style={styles.switchRow}>
          <Text style={styles.switchTitle}>Sadece ücretsiz istasyonlar</Text>
          <Switch
            value={filters.business.priceRange.free}
            onValueChange={(value) => handleFilterChange('business', 'priceRange', {
              ...filters.business.priceRange,
              free: value
            })}
            trackColor={{ false: colors.gray300, true: colors.primary }}
          />
        </View>
      </View>
    </View>
  );

  const renderAdvancedFilters = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Gelişmiş Filtreler</Text>
      
      <View style={styles.scheduleSection}>
        <Text style={styles.subsectionTitle}>Çalışma Saatleri</Text>
        <View style={styles.scheduleOptions}>
          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>Şu an açık</Text>
            <Switch
              value={filters.schedule.openNow}
              onValueChange={(value) => handleFilterChange('schedule', 'openNow', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchTitle}>7/24 açık</Text>
            <Switch
              value={filters.schedule.twentyFourSeven}
              onValueChange={(value) => handleFilterChange('schedule', 'twentyFourSeven', value)}
              trackColor={{ false: colors.gray300, true: colors.primary }}
            />
          </View>
        </View>
      </View>

      <View style={styles.ratingsSection}>
        <Text style={styles.subsectionTitle}>Değerlendirmeler</Text>
        <Text style={styles.ratingLabel}>Minimum puan: {filters.ratings.minRating}</Text>
        <View style={styles.ratingButtons}>
          {[0, 3, 4, 4.5].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.ratingButton,
                filters.ratings.minRating === rating && styles.ratingButtonActive
              ]}
              onPress={() => handleFilterChange('ratings', 'minRating', rating)}
            >
              <Text
                style={[
                  styles.ratingButtonText,
                  filters.ratings.minRating === rating && styles.ratingButtonTextActive
                ]}
              >
                {rating === 0 ? 'Hepsi' : `${rating}★+`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.amenitiesSection}>
        <Text style={styles.subsectionTitle}>Özellikler</Text>
        <View style={styles.amenitiesGrid}>
          {[
            { key: 'parking', title: 'Park Yeri', icon: 'car-outline' },
            { key: 'restroom', title: 'Tuvalet', icon: 'storefront-outline' },
            { key: 'restaurant', title: 'Restoran', icon: 'restaurant-outline' },
            { key: 'wifi', title: 'WiFi', icon: 'wifi-outline' },
            { key: 'shelter', title: 'Kapalı Alan', icon: 'home-outline' },
          ].map((amenity) => (
            <TouchableOpacity
              key={amenity.key}
              style={[
                styles.amenityCard,
                filters.amenities[amenity.key as keyof typeof filters.amenities] && 
                styles.amenityCardActive
              ]}
              onPress={() => 
                handleFilterChange('amenities', amenity.key as keyof typeof filters.amenities, 
                !filters.amenities[amenity.key as keyof typeof filters.amenities])
              }
            >
              <Ionicons
                name={amenity.icon as any}
                size={20}
                color={
                  filters.amenities[amenity.key as keyof typeof filters.amenities]
                    ? colors.white
                    : colors.gray600
                }
              />
              <Text
                style={[
                  styles.amenityText,
                  filters.amenities[amenity.key as keyof typeof filters.amenities] && 
                  styles.amenityTextActive
                ]}
              >
                {amenity.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderQuickFilters();
      case 1: return renderLocationFilters();
      case 2: return renderChargingFilters();
      case 3: return renderBusinessFilters();
      case 4: return renderAdvancedFilters();
      default: return renderQuickFilters();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray600} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gelişmiş Filtreler</Text>
            <TouchableOpacity onPress={resetFilters} style={styles.resetButton}>
              <Text style={styles.resetText}>Sıfırla</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {tabs.map((tab, index) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    activeTab === index && styles.tabActive
                  ]}
                  onPress={() => setActiveTab(index)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={activeTab === index ? colors.white : colors.gray600}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === index && styles.tabTextActive
                    ]}
                  >
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {renderTabContent()}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultText}>
                {getFilteredStationsCount()} istasyon bulundu
              </Text>
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>Filtrele</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    amenitiesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    amenitiesSection: {
      marginBottom: 24,
    },
    amenityCard: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      padding: 12,
      width: '48%',
    },
    amenityCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    amenityText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 12,
      marginTop: 6,
      textAlign: 'center',
    },
    amenityTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    applyButton: {
      backgroundColor: colors.primary,
      borderRadius: 25,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    applyButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    closeButton: {
      padding: 4,
    },
    connectionCard: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 8,
      padding: 12,
      width: '48%',
    },
    connectionCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    connectionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    connectionText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
    },
    connectionTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    connectionTypesSection: {
      marginBottom: 24,
    },
    container: {
      backgroundColor: isDarkMode ? colors.darkCard : colors.white,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: height * 0.9,
      minHeight: height * 0.7,
    },
    content: {
      flex: 1,
    },
    distanceButton: {
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    distanceButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    distanceButtonText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
    },
    distanceButtonTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    distanceButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    distanceSection: {
      marginBottom: 24,
    },
    footer: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.darkCard : colors.white,
      borderTopColor: isDarkMode ? colors.gray700 : colors.gray200,
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    header: {
      alignItems: 'center',
      borderBottomColor: isDarkMode ? colors.gray700 : colors.gray200,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerTitle: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 18,
      fontWeight: '600',
    },
    operatorList: {
      maxHeight: 200,
    },
    operatorRow: {
      alignItems: 'center',
      borderBottomColor: isDarkMode ? colors.gray700 : colors.gray200,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    operatorSection: {
      marginBottom: 24,
    },
    operatorText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 16,
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      flex: 1,
      justifyContent: 'flex-end',
    },
    powerButton: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: 12,
    },
    powerButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    powerButtonText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
    },
    powerButtonTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    powerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    powerSection: {
      marginBottom: 24,
    },
    priceSection: {
      marginBottom: 24,
    },
    quickFilterCard: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderColor: 'transparent',
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
      padding: 16,
      width: '48%',
    },
    quickFilterCardActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickFilterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    quickFilterText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
      fontWeight: '500',
      marginTop: 8,
    },
    quickFilterTextActive: {
      color: colors.white,
    },
    ratingButton: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderColor: 'transparent',
      borderRadius: 8,
      borderWidth: 1,
      flex: 1,
      marginHorizontal: 2,
      paddingVertical: 10,
    },
    ratingButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    ratingButtonText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
    },
    ratingButtonTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    ratingButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    ratingLabel: {
      color: isDarkMode ? colors.gray300 : colors.gray600,
      fontSize: 14,
      marginBottom: 12,
    },
    ratingsSection: {
      marginBottom: 24,
    },
    resetButton: {
      padding: 4,
    },
    resetText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
    resultInfo: {
      flex: 1,
    },
    resultText: {
      color: isDarkMode ? colors.gray300 : colors.gray600,
      fontSize: 14,
    },
    scheduleOptions: {
      marginBottom: 8,
    },
    scheduleSection: {
      marginBottom: 24,
    },
    searchInput: {
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderRadius: 8,
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchSection: {
      marginBottom: 16,
    },
    sectionDescription: {
      color: isDarkMode ? colors.gray300 : colors.gray600,
      fontSize: 14,
      marginBottom: 20,
    },
    sectionTitle: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
    },
    sortingOption: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray50,
      borderRadius: 8,
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: 12,
    },
    sortingOptionActive: {
      backgroundColor: colors.primary,
    },
    sortingOptionText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
    },
    sortingOptionTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    sortingOptions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    sortingSection: {
      marginTop: 8,
    },
    subsectionTitle: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 12,
    },
    switchDescription: {
      color: isDarkMode ? colors.gray300 : colors.gray600,
      fontSize: 14,
    },
    switchInfo: {
      flex: 1,
    },
    switchRow: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    switchTitle: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 16,
      marginBottom: 4,
    },
    tab: {
      alignItems: 'center',
      flexDirection: 'row',
      marginRight: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      marginVertical: 8,
    },
    tabContent: {
      padding: 20,
    },
    tabText: {
      color: isDarkMode ? colors.gray300 : colors.gray600,
      fontSize: 14,
      marginLeft: 6,
    },
    tabTextActive: {
      color: colors.white,
      fontWeight: '500',
    },
    tabsContainer: {
      borderBottomColor: isDarkMode ? colors.gray700 : colors.gray200,
      borderBottomWidth: 1,
    },
  });

export default EnhancedFilterSystem;
