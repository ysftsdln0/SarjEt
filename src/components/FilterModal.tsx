import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

export interface FilterOptions {
  minPowerKW: number;
  maxPowerKW: number;
  connectionTypes: string[];
  operators: string[];
  maxDistance: number;
  maxResults: number;
  onlyFastCharging: boolean;
  onlyAvailable: boolean;
  onlyFree: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  stations: ChargingStation[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  stations,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const getAvailableConnectionTypes = (): string[] => {
    const types = new Set<string>();
    stations.forEach(station => {
      station.Connections?.forEach(conn => {
        if (conn.ConnectionType?.Title) {
          types.add(conn.ConnectionType.Title);
        }
      });
    });
    return Array.from(types).sort();
  };

  const getAvailableOperators = (): string[] => {
    const operators = new Set<string>();
    stations.forEach(station => {
      if (station.OperatorInfo?.Title) {
        operators.add(station.OperatorInfo.Title);
      }
    });
    return Array.from(operators).sort();
  };

  const powerRanges = [
    { label: 'Tümü', min: 0, max: 1000 },
    { label: '0-22 kW (AC Yavaş)', min: 0, max: 22 },
    { label: '23-49 kW (AC Hızlı)', min: 23, max: 49 },
    { label: '50-149 kW (DC Hızlı)', min: 50, max: 149 },
    { label: '150+ kW (DC Ultra Hızlı)', min: 150, max: 1000 },
  ];

  const distanceRanges = [
    { label: 'Tümü', value: 10000 },
    { label: '5 km yakın', value: 5 },
    { label: '10 km yakın', value: 10 },
    { label: '25 km yakın', value: 25 },
    { label: '50 km yakın', value: 50 },
    { label: '100 km yakın', value: 100 },
  ];

  const handleApplyFilters = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const resetFilters: FilterOptions = {
      minPowerKW: 0,
      maxPowerKW: 1000,
      connectionTypes: [],
      operators: [],
      maxDistance: 100, // Varsayılan 100km
      maxResults: 100,
      onlyFastCharging: false,
      onlyAvailable: false,
      onlyFree: false,
    };
    setLocalFilters(resetFilters);
  };

  const toggleConnectionType = (type: string) => {
    const newTypes = localFilters.connectionTypes.includes(type)
      ? localFilters.connectionTypes.filter(t => t !== type)
      : [...localFilters.connectionTypes, type];
    
    setLocalFilters({ ...localFilters, connectionTypes: newTypes });
  };

  const toggleOperator = (operator: string) => {
    const newOperators = localFilters.operators.includes(operator)
      ? localFilters.operators.filter(o => o !== operator)
      : [...localFilters.operators, operator];
    
    setLocalFilters({ ...localFilters, operators: newOperators });
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
            <Ionicons name="close" size={24} color={colors.gray600} />
          </TouchableOpacity>
          <Text style={styles.title}>Filtreleme Seçenekleri</Text>
          <TouchableOpacity onPress={handleResetFilters} style={styles.resetButton}>
            <Text style={styles.resetText}>Sıfırla</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Güç Aralığı */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Güç Aralığı</Text>
            {powerRanges.map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[
                  styles.optionButton,
                  localFilters.minPowerKW === range.min && 
                  localFilters.maxPowerKW === range.max && styles.optionButtonActive
                ]}
                onPress={() => setLocalFilters({
                  ...localFilters,
                  minPowerKW: range.min,
                  maxPowerKW: range.max,
                })}
              >
                <Text style={[
                  styles.optionText,
                  localFilters.minPowerKW === range.min && 
                  localFilters.maxPowerKW === range.max && styles.optionTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mesafe */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Mesafe</Text>
            {distanceRanges.map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[
                  styles.optionButton,
                  localFilters.maxDistance === range.value && styles.optionButtonActive
                ]}
                onPress={() => setLocalFilters({
                  ...localFilters,
                  maxDistance: range.value,
                })}
              >
                <Text style={[
                  styles.optionText,
                  localFilters.maxDistance === range.value && styles.optionTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* İstasyon Sayısı */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Gösterilecek İstasyon Sayısı</Text>
            {[
              { label: '50 istasyon', value: 50 },
              { label: '100 istasyon', value: 100 },
              { label: '200 istasyon', value: 200 },
              { label: '500 istasyon', value: 500 },
            ].map((option) => (
              <TouchableOpacity
                key={option.label}
                style={[
                  styles.optionButton,
                  localFilters.maxResults === option.value && styles.optionButtonActive
                ]}
                onPress={() => setLocalFilters({
                  ...localFilters,
                  maxResults: option.value,
                })}
              >
                <Text style={[
                  styles.optionText,
                  localFilters.maxResults === option.value && styles.optionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Hızlı Filtreler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚀 Hızlı Filtreler</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Sadece hızlı şarj (50kW+)</Text>
              <Switch
                value={localFilters.onlyFastCharging}
                onValueChange={(value) => setLocalFilters({
                  ...localFilters,
                  onlyFastCharging: value,
                })}
                trackColor={{ false: colors.gray300, true: colors.secondary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Sadece müsait istasyonlar</Text>
              <Switch
                value={localFilters.onlyAvailable}
                onValueChange={(value) => setLocalFilters({
                  ...localFilters,
                  onlyAvailable: value,
                })}
                trackColor={{ false: colors.gray300, true: colors.secondary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Sadece ücretsiz istasyonlar</Text>
              <Switch
                value={localFilters.onlyFree}
                onValueChange={(value) => setLocalFilters({
                  ...localFilters,
                  onlyFree: value,
                })}
                trackColor={{ false: colors.gray300, true: colors.secondary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Konnektör Tipi */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔌 Konnektör Tipi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              {getAvailableConnectionTypes().slice(0, 10).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    localFilters.connectionTypes.includes(type) && styles.chipActive
                  ]}
                  onPress={() => toggleConnectionType(type)}
                >
                  <Text style={[
                    styles.chipText,
                    localFilters.connectionTypes.includes(type) && styles.chipTextActive
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Operatör */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏢 Operatör</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
              {getAvailableOperators().slice(0, 15).map((operator) => (
                <TouchableOpacity
                  key={operator}
                  style={[
                    styles.chip,
                    localFilters.operators.includes(operator) && styles.chipActive
                  ]}
                  onPress={() => toggleOperator(operator)}
                >
                  <Text style={[
                    styles.chipText,
                    localFilters.operators.includes(operator) && styles.chipTextActive
                  ]} numberOfLines={1}>
                    {operator}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
            <Text style={styles.applyButtonText}>Filtreleri Uygula</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightCard,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.lightText,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.lightBg,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.lightText,
    marginBottom: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.lightBg,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: colors.secondary,
  },
  optionText: {
    fontSize: 14,
    color: colors.gray600,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  switchLabel: {
    fontSize: 14,
    color: colors.lightText,
    flex: 1,
  },
  chipContainer: {
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.lightBg,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: 12,
    color: colors.gray600,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
