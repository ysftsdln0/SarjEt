import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
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
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onShowFilters,
  placeholder = 'Search by city or district...',
  filterCount = 0,
  isDarkMode = true,
}) => {
  return (
    <View style={[styles.searchSection, !isDarkMode && styles.lightSearchSection]}>
      <View style={[styles.searchContainer, !isDarkMode && styles.lightSearchContainer]}>
        <TextInput
          style={[styles.searchInput, !isDarkMode && styles.lightSearchInput]}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? colors.gray500 : colors.gray400}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
          <Ionicons name="search" size={20} color={colors.white} />
        </TouchableOpacity>
        
        {onShowFilters && (
          <TouchableOpacity style={[styles.filterButton, !isDarkMode && styles.lightFilterButton]} onPress={onShowFilters}>
            <Ionicons 
              name="options" 
              size={20} 
              color={isDarkMode ? colors.white : colors.lightText} 
            />
            {filterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent2,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    top: -2,
    width: 20,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  filtersButton: {
    alignSelf: 'flex-start',
  },
  filtersText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  lightFilterButton: {
    backgroundColor: colors.lightCard,
  },
  lightSearchContainer: {
    // Container için light mode değişikliği gerekmiyor
  },
  lightSearchInput: {
    backgroundColor: colors.lightCard,
    color: colors.lightText,
  },
  lightSearchSection: {
    backgroundColor: colors.lightBg,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    marginRight: 8,
    width: 48,
  },
  searchContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchInput: {
    backgroundColor: colors.lightCard,
    borderRadius: 24,
    color: colors.lightText,
    flex: 1,
    fontSize: 16,
    height: 48,
    marginRight: 12,
    paddingHorizontal: 20,
  },
  searchSection: {
    backgroundColor: colors.darkBg,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
});
