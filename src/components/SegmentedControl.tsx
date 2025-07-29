import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  isDarkMode?: boolean;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onSelectionChange,
  isDarkMode = true,
}) => {
  return (
    <View style={[styles.segmentedControl, !isDarkMode && styles.lightSegmentedControl]}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={option}
          style={[
            styles.segmentButton,
            selectedIndex === index && styles.segmentButtonActive,
          ]}
          onPress={() => onSelectionChange(index)}
        >
          <Text
            style={[
              styles.segmentText,
              !isDarkMode && styles.lightSegmentText,
              selectedIndex === index && styles.segmentTextActive,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  lightSegmentText: {
    color: colors.gray600,
  },
  lightSegmentedControl: {
    backgroundColor: colors.lightCard,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 12,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.gray500,
    fontSize: 16,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: colors.white,
  },
  segmentedControl: {
    backgroundColor: colors.darkCard,
    borderRadius: 8,
    flexDirection: 'row',
    marginBottom: 0,
    marginHorizontal: 20,
    padding: 4,
  },
});
