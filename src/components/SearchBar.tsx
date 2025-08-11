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
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    backgroundColor: colors.white,
    paddingTop: 16,
    paddingBottom: 16,
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
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
});
