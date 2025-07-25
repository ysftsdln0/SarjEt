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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.darkCard,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 0,
    padding: 4,
  },
  lightSegmentedControl: {
    backgroundColor: colors.lightCard,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray500,
  },
  lightSegmentText: {
    color: colors.gray600,
  },
  segmentTextActive: {
    color: colors.white,
  },
});
