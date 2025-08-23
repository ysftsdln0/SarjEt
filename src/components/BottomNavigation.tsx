import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  onCenterActionPress?: () => void;
}

type IconName = keyof typeof Ionicons.glyphMap;

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabPress,
  onCenterActionPress,
}) => {
  const tabs = [
    { key: 'map', label: 'Harita', icon: 'map-outline' as IconName, activeIcon: 'map' as IconName },
    { key: 'route', label: 'Rota', icon: 'location-outline' as IconName, activeIcon: 'location' as IconName },
    { key: 'center', label: '', icon: 'flash' as IconName, isCenter: true },
    { key: 'campaigns', label: 'Kampanyalar', icon: 'pricetag-outline' as IconName, activeIcon: 'pricetag' as IconName },
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
  centerButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: 56, // Üstte çıkıntı yap
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderTopColor: colors.gray200,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 28, // Safe area için
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    color: colors.gray500,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
}); 