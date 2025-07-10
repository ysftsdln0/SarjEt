import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: () => void;
  onShowFilters: () => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onShowFilters,
  placeholder = 'Search by city or district...',
}) => {
  return (
    <View style={styles.searchSection}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.filtersButton} onPress={onShowFilters}>
        <Text style={styles.filtersText}>Show Filters</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#263238',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#333333',
    marginRight: 12,
  },
  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersButton: {
    alignSelf: 'flex-start',
  },
  filtersText: {
    fontSize: 16,
    color: '#00C853',
    fontWeight: '500',
  },
});
