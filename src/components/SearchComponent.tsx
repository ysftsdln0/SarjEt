import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SearchFilters } from '../types';

interface SearchComponentProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

export const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearch,
  loading = false,
}) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    maxDistance: 25,
    fastChargeOnly: false,
    freeOnly: false,
  });

  const handleSearch = () => {
    if (query.trim().length === 0) {
      Alert.alert('Uyarı', 'Lütfen arama yapmak için bir şehir adı girin.');
      return;
    }

    const searchFilters: SearchFilters = {
      ...filters,
      query: query.trim(),
    };

    onSearch(searchFilters);
  };

  const toggleFilter = (filterKey: keyof SearchFilters) => {
    if (typeof filters[filterKey] === 'boolean') {
      setFilters(prev => ({
        ...prev,
        [filterKey]: !prev[filterKey],
      }));
    }
  };

  const updateMaxDistance = (distance: number) => {
    setFilters(prev => ({
      ...prev,
      maxDistance: distance,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Ana arama çubuğu */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Şehir veya bölge ara..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.disabledButton]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>
            {loading ? 'Aranıyor...' : 'Ara'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtre toggle butonu */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>
          {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
        </Text>
      </TouchableOpacity>

      {/* Filtreler */}
      {showFilters && (
        <ScrollView
          style={styles.filtersContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Mesafe filtresi */}
          <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>Maksimum Mesafe</Text>
            <View style={styles.distanceButtons}>
              {[10, 25, 50, 100].map(distance => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceButton,
                    filters.maxDistance === distance && styles.activeDistanceButton,
                  ]}
                  onPress={() => updateMaxDistance(distance)}
                >
                  <Text
                    style={[
                      styles.distanceButtonText,
                      filters.maxDistance === distance && styles.activeDistanceButtonText,
                    ]}
                  >
                    {distance} km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hızlı şarj filtresi */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => toggleFilter('fastChargeOnly')}
            >
              <View style={[
                styles.checkbox,
                filters.fastChargeOnly && styles.checkedCheckbox,
              ]}>
                {filters.fastChargeOnly && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Sadece Hızlı Şarj (50kW+)</Text>
            </TouchableOpacity>
          </View>

          {/* Ücretsiz şarj filtresi */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => toggleFilter('freeOnly')}
            >
              <View style={[
                styles.checkbox,
                filters.freeOnly && styles.checkedCheckbox,
              ]}>
                {filters.freeOnly && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Sadece Ücretsiz İstasyonlar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterToggle: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  filterToggleText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  filtersContainer: {
    maxHeight: 200,
    marginTop: 8,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  distanceButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  activeDistanceButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  distanceButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  activeDistanceButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});
