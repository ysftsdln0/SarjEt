import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onShowFilters?: () => void;
  placeholder?: string;
  filterCount?: number;
  isDarkMode?: boolean;
  onFilterPress?: (filterType: string) => void;
  activeFilters?: string[];
  onPlaceSelected?: (place: { name: string; latitude: number; longitude: number }) => void;
  searchSuggestion?: { name: string; latitude: number; longitude: number } | null;
  onSuggestionSelect?: (suggestion: { name: string; latitude: number; longitude: number }) => void;
  onSuggestionDismiss?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onShowFilters,
  placeholder = 'Konum veya İstasyon ara',
  filterCount = 0,
  isDarkMode = false,
  onFilterPress,
  activeFilters = [],
  onPlaceSelected,
  searchSuggestion,
  onSuggestionSelect,
  onSuggestionDismiss,
}) => {
  const filterOptions = [
    { key: 'AC', label: 'AC', icon: 'flash-outline' },
    { key: 'DC', label: 'DC', icon: 'flash' },
    { key: 'GREEN', label: 'Yeşil Enerji', icon: 'leaf-outline' },
    { key: 'RATING', label: 'Puan', icon: 'star-outline', hasDropdown: true },
  ];

  return (
    <View style={styles.searchSection}>
      {/* Ana Arama Çubuğu - Resimdeki gibi */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.gray500} 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={colors.gray500}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSearch}
          />
          {!!onPlaceSelected && (
            <TouchableOpacity onPress={onSearch}>
              <Ionicons name="search" size={20} color={colors.gray600} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtre Butonları - Resimdeki gibi yatay */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollContainer}
        contentContainerStyle={styles.filterButtonsContainer}
      >
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              activeFilters.includes(filter.key) && styles.filterChipActive,
            ]}
            onPress={() => onFilterPress?.(filter.key)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={16} 
              color={activeFilters.includes(filter.key) 
                ? colors.white 
                : colors.gray600
              } 
            />
            <Text style={[
              styles.filterChipText,
              activeFilters.includes(filter.key) && styles.filterChipTextActive,
            ]}>
              {filter.label}
            </Text>
            {filter.hasDropdown && (
              <Ionicons 
                name="chevron-down" 
                size={14} 
                color={activeFilters.includes(filter.key) 
                  ? colors.white 
                  : colors.gray600
                } 
                style={styles.dropdownIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Suggestion Panel - Arama önerisi arama çubuğunun altında */}
      {searchSuggestion && (
        <View style={styles.suggestionPanel}>
          <View style={styles.suggestionContent}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <View style={styles.suggestionText}>
              <Text style={styles.suggestionTitle} numberOfLines={1}>
                {searchSuggestion.name}
              </Text>
              <Text style={styles.suggestionSubtitle}>Hedef olarak belirlemek için dokunun</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onSuggestionSelect?.(searchSuggestion)}
            style={styles.suggestionButton}
          >
            <Text style={styles.suggestionButtonText}>Hedef Seç</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onSuggestionDismiss}
            style={styles.suggestionDismiss}
          >
            <Ionicons name="close" size={18} color={colors.gray600} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    backgroundColor: colors.white,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.searchBarBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.black,
    fontSize: 16,
    padding: 0,
  },
  filterScrollContainer: {
    marginBottom: 8,
  },
  filterButtonsContainer: {
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.filterChipBg,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  filterChipActive: {
    backgroundColor: colors.filterChipActive,
    borderColor: colors.filterChipActive,
  },
  filterChipText: {
    color: colors.gray600,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  filterChipTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  dropdownIcon: {
    marginLeft: 6,
  },
  suggestionPanel: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginHorizontal: 0,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
    marginLeft: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.black,
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2,
  },
  suggestionButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  suggestionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionDismiss: {
    padding: 4,
  },
});
