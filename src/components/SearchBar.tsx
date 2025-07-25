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
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.darkBg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.lightCard,
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    color: colors.lightText,
    marginRight: 12,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.darkCard,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  filtersButton: {
    alignSelf: 'flex-start',
  },
  filtersText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  lightSearchContainer: {
    // Container için light mode değişikliği gerekmiyor
  },
  lightSearchSection: {
    backgroundColor: colors.lightBg,
  },
  lightSearchInput: {
    backgroundColor: colors.lightCard,
    color: colors.lightText,
  },
  lightFilterButton: {
    backgroundColor: colors.lightCard,
  },
});
