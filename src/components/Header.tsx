import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface HeaderProps {
  title: string;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onProfilePress }) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
        <Ionicons name="person-circle-outline" size={28} color={colors.darkText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.darkBg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.darkText,
  },
  profileButton: {
    padding: 4,
  },
});
