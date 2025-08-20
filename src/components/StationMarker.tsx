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
  isSelected = false,
  onPress 
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
    if (isSelected) return colors.primary;
    
    const connectionType = getConnectionType();
    if (connectionType === 'DC') return colors.success;
    if (connectionType === 'AC') return colors.warning;
    
    return colors.gray500;
  };

  const getMarkerIcon = () => {
    const connectionType = getConnectionType();
    if (connectionType === 'DC') return 'flash';
    if (connectionType === 'AC') return 'flash-outline';
    return 'battery-charging';
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
        <Ionicons 
          name={getMarkerIcon() as any} 
          size={16} 
          color={colors.white} 
        />
        
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  selectedIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: 'bold',
  },
  popup: {
    position: 'absolute',
    top: 40,
    left: -60,
    width: 120,
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stationName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    marginBottom: 2,
  },
  stationDistance: {
    fontSize: 10,
    color: colors.gray600,
    textAlign: 'center',
  },
});

export default StationMarker;
