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
      borderBottomColor: isDarkMode ? colors.gray700 : colors.gray200,
      borderBottomWidth: 1,
      paddingVertical: 12,
    },
    filterChip: {
      alignItems: 'center',
      backgroundColor: isDarkMode ? colors.gray800 : colors.gray100,
      borderColor: 'transparent',
      borderRadius: 20,
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: 36,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterChipActive: {
      borderColor: colors.white,
      elevation: 3,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    filterIcon: {
      marginRight: 6,
    },
    filterText: {
      color: isDarkMode ? colors.white : colors.black,
      fontSize: 14,
      fontWeight: '500',
    },
    filterTextActive: {
      color: colors.white,
    },
    scrollContent: {
      gap: 8,
      paddingHorizontal: 16,
    },
  });

export default QuickFilterBar;
