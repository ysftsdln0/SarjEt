import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface HeaderProps {
  title: string;
  onProfilePress?: () => void;
  isDarkMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onProfilePress, isDarkMode = true }) => {
  return (
    <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
      <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>{title}</Text>
      <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
        <Ionicons 
          name="person-circle-outline" 
          size={28} 
          color={isDarkMode ? colors.darkText : colors.lightText} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.darkBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: colors.darkText,
    fontSize: 24,
    fontWeight: 'bold',
  },
  lightHeader: {
    backgroundColor: colors.lightBg,
  },
  lightHeaderTitle: {
    color: colors.lightText,
  },
  profileButton: {
    padding: 4,
  },
});
