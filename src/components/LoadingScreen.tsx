import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '../constants/colors';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Şarj istasyonları yükleniyor…',
}) => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.lightBg,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
});
