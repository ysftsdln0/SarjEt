import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onSelectionChange,
}) => {
  return (
    <View style={styles.segmentedControl}>
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
    backgroundColor: '#37474F',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 0,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#263238',
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#B0BEC5',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
});
