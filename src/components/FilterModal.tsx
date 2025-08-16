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
import { ChargingStation, FilterOptions } from '../types';
import colors from '../constants/colors';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  stations: ChargingStation[];
  isDarkMode?: boolean;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  stations,
  isDarkMode = true,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const styles = getStyles(isDarkMode);

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
            <Ionicons 
              name="close" 
              size={24} 
              color={isDarkMode ? colors.gray600 : colors.gray500} 
            />
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
            <Text style={styles.sectionDescription}>Şarj istasyonlarının çıkış gücünü seçin</Text>
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
            <Text style={styles.sectionDescription}>Mevcut konumunuza olan maksimum mesafeyi seçin</Text>
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

          {/* Hızlı Filtreler */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚀 Hızlı Filtreler</Text>
            <Text style={styles.sectionDescription}>En yaygın ihtiyaçlara göre hızlı filtreleme</Text>
            
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
            <Text style={styles.sectionDescription}>Aracınızla uyumlu konnektör tiplerini seçin</Text>
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
            <Text style={styles.sectionDescription}>Tercih ettiğiniz şarj istasyonu operatörlerini seçin</Text>
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

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  applyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  chip: {
    backgroundColor: isDarkMode ? colors.darkCard : colors.lightCard,
    borderColor: isDarkMode ? colors.gray600 : colors.gray300,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipContainer: {
    marginBottom: 8,
  },
  chipText: {
    color: isDarkMode ? colors.gray400 : colors.gray600,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: isDarkMode ? colors.darkCard : colors.lightCard,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  container: {
    backgroundColor: isDarkMode ? colors.darkBg : colors.lightBg,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  footer: {
    borderTopColor: isDarkMode ? colors.gray600 : colors.gray300,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: isDarkMode ? colors.gray600 : colors.gray300,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  optionButton: {
    backgroundColor: isDarkMode ? colors.darkCard : colors.lightCard,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionButtonActive: {
    backgroundColor: colors.primary,
  },
  optionText: {
    color: isDarkMode ? colors.gray400 : colors.gray600,
    fontSize: 14,
    fontWeight: '500',
  },
  optionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: isDarkMode ? colors.darkCard : colors.lightCard,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resetText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    color: isDarkMode ? colors.darkText : colors.lightText,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  sectionDescription: {
    color: isDarkMode ? colors.gray400 : colors.gray600,
    fontSize: 14,
    marginBottom: 16,
  },
  switchLabel: {
    color: isDarkMode ? colors.darkText : colors.lightText,
    flex: 1,
    fontSize: 14,
  },
  switchRow: {
    alignItems: 'center',
    borderBottomColor: isDarkMode ? colors.gray600 : colors.gray300,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  title: {
    color: isDarkMode ? colors.darkText : colors.lightText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
