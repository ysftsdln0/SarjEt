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
    alignItems: 'center',
    backgroundColor: colors.lightBg,
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
});
