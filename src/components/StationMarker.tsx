import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';
import { markerPopup, pulse } from '../utils/animationUtils';

interface StationMarkerProps {
  station: ChargingStation;
  isSelected?: boolean;
  onPress?: () => void;
}

const StationMarker: React.FC<StationMarkerProps> = ({ 
  station, 
  isSelected = false
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      markerPopup(scaleAnim).start();
      pulse(pulseAnim).start();
    } else {
      scaleAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [isSelected]);

  const getConnectionType = () => {
    if (!station.Connections || station.Connections.length === 0) return 'AC';
    
    const types = station.Connections.map(conn => conn.ConnectionType?.Title);
    if (types.includes('DC')) return 'DC';
    if (types.includes('AC')) return 'AC';
    return 'AC';
  };

  const getMarkerColor = () => {
    if (isSelected) return colors.accent1;
    
    // Tüm istasyonları yeşil yap (ekran görüntüsündeki gibi)
    return colors.success;
  };

  const getMarkerIcon = () => {
    const connectionType = getConnectionType();
    if (connectionType === 'DC') return 'flash';
    if (connectionType === 'AC') return 'flash';
    return 'flash';
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim }
          ],
          backgroundColor: getMarkerColor(),
        },
      ]}
    >
      <View style={styles.markerContent}>
        {/* Lightning icon with glow effect */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name={getMarkerIcon() as any} 
            size={22} 
            color={colors.white} 
            style={styles.lightningIcon}
          />
        </View>
        
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>●</Text>
          </View>
        )}
        
        {/* Station name popup */}
        {isSelected && (
          <View style={styles.popup}>
            <Text style={styles.stationName} numberOfLines={1}>
              {station.AddressInfo?.Title || 'İstasyon'}
            </Text>
            <Text style={styles.stationDistance}>
              {station.AddressInfo?.Distance?.toFixed(1) || '0'} km
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderColor: colors.white,
    borderRadius: 20,
    borderWidth: 3,
    elevation: 5,
    height: 40,
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  lightningIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  markerContent: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  popup: {
    backgroundColor: colors.white,
    borderRadius: 8,
    elevation: 5,
    left: -60,
    padding: 8,
    position: 'absolute',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    top: 40,
    width: 120,
  },
  selectedIndicator: {
    alignItems: 'center',
    backgroundColor: colors.accent1,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: -8,
    top: -8,
    width: 16,
  },
  selectedText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  stationDistance: {
    color: colors.gray600,
    fontSize: 10,
    textAlign: 'center',
  },
  stationName: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
});

export default StationMarker;
