import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  onCenterActionPress?: () => void;
  isDarkMode?: boolean;
}

type IconName = keyof typeof Ionicons.glyphMap;

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
  onCenterActionPress,
  isDarkMode = false,
}) => {
  const tabs = [
    { key: 'map', label: 'Harita', icon: 'map-outline' as IconName, activeIcon: 'map' as IconName },
    { key: 'route', label: 'Rota', icon: 'location-outline' as IconName, activeIcon: 'location' as IconName },
    { key: 'center', label: '', icon: 'flash' as IconName, isCenter: true },
    { key: 'explore', label: 'Keşfet', icon: 'globe-outline' as IconName, activeIcon: 'globe' as IconName },
    { key: 'profile', label: 'Profil', icon: 'person-outline' as IconName, activeIcon: 'person' as IconName },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.centerButton}
              onPress={onCenterActionPress}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon} size={28} color={colors.white} />
            </TouchableOpacity>
          );
        }

        const isActive = activeTab === tab.key;
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={isActive 
                ? colors.primary 
                : colors.gray500
              }
            />
            <Text style={[
              styles.tabLabel,
              isActive && styles.tabLabelActive,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 28, // Safe area için
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: -16, // Üstte çıkıntı yap
  },
}); 