import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface QuickFilter {
  id: string;
  title: string;
  icon: string;
  color: string;
  active: boolean;
}

interface QuickFilterBarProps {
  filters: QuickFilter[];
  onFilterToggle: (filterId: string) => void;
  isDarkMode?: boolean;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  filters,
  onFilterToggle,
  isDarkMode = true,
}) => {
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              filter.active && styles.filterChipActive,
              filter.active && { backgroundColor: filter.color },
            ]}
            onPress={() => onFilterToggle(filter.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={filter.icon as any}
              size={16}
              color={filter.active ? colors.white : filter.color}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                filter.active && styles.filterTextActive,
              ]}
            >
              {filter.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? colors.gray700 : colors.gray200,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray100,
      borderWidth: 1,
      borderColor: 'transparent',
      minHeight: 36,
    },
    filterChipActive: {
      borderColor: colors.white,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterText: {
      fontSize: 14,
      fontWeight: '500',
      color: isDarkMode ? colors.white : colors.black,
    },
    filterTextActive: {
      color: colors.white,
    },
  });

export default QuickFilterBar;
