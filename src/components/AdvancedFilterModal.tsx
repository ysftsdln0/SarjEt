import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

export interface AdvancedFilterOptions {
  // Temel filtreler
  connectionTypes: string[];
  maxDistance: number;
  
  // Gelişmiş filtreler
  priceRange: {
    min: number;
    max: number;
  };
  workingHours: {
    isOpenNow: boolean;
    is24Hours: boolean;
  };
  rating: {
    min: number;
    max: number;
  };
  
  // Kullanıcı tercihleri
  showFavorites: boolean;
  showRecentlyUsed: boolean;
  showAvailableOnly: boolean;
  
  // Özel filtreler
  greenEnergy: boolean;
  fastCharging: boolean;
  freeCharging: boolean;
}

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedFilterOptions) => void;
  currentFilters: AdvancedFilterOptions;
  stations: ChargingStation[];
}

const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
  stations,
}) => {
  const [filters, setFilters] = useState<AdvancedFilterOptions>(currentFilters);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'preferences'>('basic');

  const tabs = [
    { key: 'basic', label: 'Temel', icon: 'filter' },
    { key: 'advanced', label: 'Gelişmiş', icon: 'settings' },
    { key: 'preferences', label: 'Tercihler', icon: 'heart' },
  ];

  const connectionTypes = [
    { key: 'AC', label: 'AC Şarj', icon: 'flash-outline' },
    { key: 'DC', label: 'DC Şarj', icon: 'flash' },
    { key: 'Type2', label: 'Type 2', icon: 'battery-charging' },
    { key: 'CCS', label: 'CCS', icon: 'battery-charging' },
    { key: 'CHAdeMO', label: 'CHAdeMO', icon: 'battery-charging' },
  ];

  const handleFilterChange = (key: keyof AdvancedFilterOptions, value: AdvancedFilterOptions[keyof AdvancedFilterOptions]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleConnectionTypeToggle = (type: string) => {
    const currentTypes = filters.connectionTypes;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    handleFilterChange('connectionTypes', newTypes);
  };

  const handleDistanceChange = (distance: number) => {
    handleFilterChange('maxDistance', distance);
  };

  const handlePriceChange = (min: number, max: number) => {
    handleFilterChange('priceRange', { min, max });
  };

  const handleRatingChange = (min: number, max: number) => {
    handleFilterChange('rating', { min, max });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleResetFilters = () => {
    const defaultFilters: AdvancedFilterOptions = {
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
    };
    
    setFilters(defaultFilters);
    Alert.alert('Filtreler Sıfırlandı', 'Tüm filtreler varsayılan değerlere sıfırlandı.');
  };

  const getFilteredStationsCount = () => {
    // TODO: Implement actual filtering logic
    return stations.length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Gelişmiş Filtreler</Text>
          <TouchableOpacity onPress={handleResetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key as 'basic' | 'advanced' | 'preferences')}
            >
              <Ionicons 
                name={tab.icon as keyof typeof Ionicons.glyphMap} 
                size={20} 
                color={activeTab === tab.key ? colors.primary : colors.gray600} 
              />
              <Text style={[
                styles.tabLabel,
                activeTab === tab.key && styles.activeTabLabel,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'basic' && (
            <View style={styles.tabContent}>
              {/* Bağlantı Tipleri */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bağlantı Tipleri</Text>
                <View style={styles.connectionTypesGrid}>
                  {connectionTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.connectionTypeButton,
                        filters.connectionTypes.includes(type.key) && styles.connectionTypeActive,
                      ]}
                      onPress={() => handleConnectionTypeToggle(type.key)}
                    >
                      <Ionicons 
                        name={type.icon as keyof typeof Ionicons.glyphMap} 
                        size={20} 
                        color={filters.connectionTypes.includes(type.key) ? colors.white : colors.gray600} 
                      />
                      <Text style={[
                        styles.connectionTypeLabel,
                        filters.connectionTypes.includes(type.key) && styles.connectionTypeLabelActive,
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Mesafe */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Maksimum Mesafe: {filters.maxDistance} km</Text>
                <View style={styles.sliderContainer}>
                  {[5, 10, 25, 50, 100].map((distance) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.distanceButton,
                        filters.maxDistance === distance && styles.distanceButtonActive,
                      ]}
                      onPress={() => handleDistanceChange(distance)}
                    >
                      <Text style={[
                        styles.distanceButtonText,
                        filters.maxDistance === distance && styles.distanceButtonTextActive,
                      ]}>
                        {distance}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'advanced' && (
            <View style={styles.tabContent}>
              {/* Fiyat Aralığı */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fiyat Aralığı (₺/kWh)</Text>
                <View style={styles.priceContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={filters.priceRange.min.toString()}
                    onChangeText={(text) => handlePriceChange(Number(text) || 0, filters.priceRange.max)}
                  />
                  <Text style={styles.priceSeparator}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={filters.priceRange.max.toString()}
                    onChangeText={(text) => handlePriceChange(filters.priceRange.min, Number(text) || 100)}
                  />
                </View>
              </View>

              {/* Çalışma Saatleri */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Çalışma Saatleri</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Şu anda açık olanlar</Text>
                  <Switch
                    value={filters.workingHours.isOpenNow}
                    onValueChange={(value) => handleFilterChange('workingHours', { ...filters.workingHours, isOpenNow: value })}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>24 saat açık</Text>
                  <Switch
                    value={filters.workingHours.is24Hours}
                    onValueChange={(value) => handleFilterChange('workingHours', { ...filters.workingHours, is24Hours: value })}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>

              {/* Rating */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Minimum Rating: {filters.rating.min}</Text>
                <View style={styles.ratingContainer}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingButton,
                        filters.rating.min === rating && styles.ratingButtonActive,
                      ]}
                      onPress={() => handleRatingChange(rating, filters.rating.max)}
                    >
                      <Ionicons 
                        name={rating <= filters.rating.min ? 'star' : 'star-outline'} 
                        size={20} 
                        color={filters.rating.min === rating ? colors.accent1 : colors.gray400} 
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'preferences' && (
            <View style={styles.tabContent}>
              {/* Kullanıcı Tercihleri */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Görüntüleme Tercihleri</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Sadece favoriler</Text>
                  <Switch
                    value={filters.showFavorites}
                    onValueChange={(value) => handleFilterChange('showFavorites', value)}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Son kullanılanlar</Text>
                  <Switch
                    value={filters.showRecentlyUsed}
                    onValueChange={(value) => handleFilterChange('showRecentlyUsed', value)}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Sadece müsait olanlar</Text>
                  <Switch
                    value={filters.showAvailableOnly}
                    onValueChange={(value) => handleFilterChange('showAvailableOnly', value)}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>

              {/* Özel Filtreler */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Özel Filtreler</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Yeşil enerji</Text>
                  <Switch
                    value={filters.greenEnergy}
                    onValueChange={(value) => handleFilterChange('greenEnergy', value)}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Hızlı şarj</Text>
                  <Switch
                    value={filters.fastCharging}
                    onValueChange={(value) => handleFilterChange('fastCharging', value)}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Ücretsiz şarj</Text>
                  <Switch
                    value={filters.freeCharging}
                    onValueChange={(value) => handleFilterChange('freeCharging', value)}
                    trackColor={{ false: colors.gray300, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {getFilteredStationsCount()} istasyon bulundu
            </Text>
          </View>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
            <Text style={styles.applyButtonText}>Filtreleri Uygula</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  activeTab: {
    borderBottomColor: colors.primary,
    borderBottomWidth: 2,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '600',
  },
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  connectionTypeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  connectionTypeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray300,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  connectionTypeLabel: {
    color: colors.gray600,
    fontSize: 14,
    marginLeft: 8,
  },
  connectionTypeLabelActive: {
    color: colors.white,
    fontWeight: '500',
  },
  connectionTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  distanceButton: {
    backgroundColor: colors.white,
    borderColor: colors.gray300,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  distanceButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  distanceButtonText: {
    color: colors.gray600,
    fontSize: 14,
  },
  distanceButtonTextActive: {
    color: colors.white,
    fontWeight: '500',
  },
  footer: {
    borderTopColor: colors.gray200,
    borderTopWidth: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  priceContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    borderColor: colors.gray300,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priceSeparator: {
    color: colors.gray600,
    fontSize: 18,
  },
  ratingButton: {
    padding: 8,
  },
  ratingButtonActive: {
    backgroundColor: colors.accent1 + '20',
    borderRadius: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  resultsInfo: {
    marginBottom: 16,
  },
  resultsText: {
    color: colors.gray600,
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  switchLabel: {
    color: colors.black,
    fontSize: 16,
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  tabContent: {
    padding: 20,
  },
  tabLabel: {
    color: colors.gray600,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  tabsContainer: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  title: {
    color: colors.black,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AdvancedFilterModal; 