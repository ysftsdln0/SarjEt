import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

interface StationPopupProps {
  station: ChargingStation | null;
  visible: boolean;
  onClose: () => void;
  onNavigate?: (station: ChargingStation) => void;
}

const { width } = Dimensions.get('window');

export const StationPopup: React.FC<StationPopupProps> = ({
  station,
  visible,
  onClose,
  onNavigate,
}) => {
  console.log('[StationPopup] Component rendered with props - visible:', visible, 'station:', station?.AddressInfo?.Title);
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  React.useEffect(() => {
    console.log('[StationPopup] State changed - visible:', visible, 'station:', station?.AddressInfo?.Title);
    
    if (visible && station) {
      console.log('[StationPopup] Showing popup for station:', station.AddressInfo?.Title);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      console.log('[StationPopup] Hiding popup');
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, station, fadeAnim, slideAnim]);

  if (!station || !visible) return null;

  const getStationPowerKW = (): number => {
    if (!station.Connections || station.Connections.length === 0) return 0;
    const maxPower = Math.max(
      ...station.Connections.map((conn: { PowerKW?: number }) => conn.PowerKW || 0)
    );
    return maxPower;
  };

  const getStationStatus = (): string => {
    return station.StatusType?.Title || 'Bilinmiyor';
  };

  const isStationAvailable = (): boolean => {
    return station.StatusType?.IsOperational !== false;
  };

  const getConnectionTypes = (): string => {
    if (!station.Connections || station.Connections.length === 0) return 'Bilinmiyor';
    return station.Connections
      .map((conn: { ConnectionType?: { Title?: string } }) => conn.ConnectionType?.Title || 'Standart')
      .filter((value: string, index: number, self: string[]) => 
        self.indexOf(value) === index
      )
      .join(', ');
  };

  const getOperatorName = (): string => {
    return station.OperatorInfo?.Title || 'Bilinmiyor';
  };

  const getDistance = (): string => {
    const distance = station.AddressInfo?.Distance;
    if (distance && distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return distance ? `${distance.toFixed(1)}km` : '';
  };

  const handleNavigate = () => {
    try {
      console.log('[StationPopup] Navigate button pressed for:', station?.AddressInfo?.Title);
      if (onNavigate && station) {
        onNavigate(station);
      } else {
        console.warn('[StationPopup] onNavigate not provided or station is null');
      }
    } catch (error) {
      console.error('[StationPopup] Error in handleNavigate:', error);
    }
  };

  if (!station || !visible) {
    console.log('[StationPopup] Not rendering - station:', !!station, 'visible:', visible);
    return null;
  }

  console.log('[StationPopup] Rendering popup for:', station.AddressInfo?.Title);

  return (
    <Animated.View 
      style={[
        styles.overlay,
        {
          opacity: fadeAnim,
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={onClose}
      />
      
      <Animated.View 
        style={[
          styles.popup,
          {
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.stationTitle} numberOfLines={2}>
              {station.AddressInfo?.Title || 'Şarj İstasyonu'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray600} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status and Power */}
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: isStationAvailable() ? colors.success : colors.error }
              ]} 
            />
            <Text style={[
              styles.statusText,
              { color: isStationAvailable() ? colors.success : colors.error }
            ]}>
              {getStationStatus()}
            </Text>
          </View>
          
          <View style={styles.powerInfo}>
            <Ionicons name="flash" size={16} color={colors.secondary} />
            <Text style={styles.powerText}>{getStationPowerKW()} kW</Text>
          </View>
          
          {getDistance() ? (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{getDistance()}</Text>
            </View>
          ) : null}
        </View>

        {/* Details */}
        <View style={styles.details}>
          {/* Address */}
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={colors.gray600} />
            <Text style={styles.detailText}>
              {station.AddressInfo?.AddressLine1 || station.AddressInfo?.Town || 'Adres bilgisi yok'}
            </Text>
          </View>

          {/* Connection Types */}
          <View style={styles.detailRow}>
            <Ionicons name="flash-outline" size={16} color={colors.gray600} />
            <Text style={styles.detailText}>{getConnectionTypes()}</Text>
          </View>

          {/* Operator */}
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color={colors.gray600} />
            <Text style={styles.detailText}>{getOperatorName()}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            console.log('[StationPopup] Simple close button pressed');
            onClose();
          }}
        >
          <Text style={styles.actionButtonText}>Kapat</Text>
          <Ionicons name="close" size={20} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  header: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  overlay: {
    backgroundColor: colors.overlay,
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 9999, // z-index'i artırdım
  },
  popup: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    maxHeight: '50%',
    paddingBottom: 34, // Safe area padding
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: width,
    // Geçici test için daha görünür hale getirelim
    borderWidth: 3,
    borderColor: colors.primary,
  },
  headerContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stationTitle: {
    color: colors.lightText,
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  statusRow: {
    alignItems: 'center',
    backgroundColor: colors.gray100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 6,
    width: 8,
  },
  statusText: {
    color: colors.lightText,
    fontSize: 14,
    fontWeight: '600',
  },
  powerInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  powerText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  distanceBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailText: {
    color: colors.gray700,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    marginHorizontal: 20,
    paddingVertical: 14,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
});
