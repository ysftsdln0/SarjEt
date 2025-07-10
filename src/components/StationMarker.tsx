import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';

interface StationMarkerProps {
  isAvailable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const StationMarker: React.FC<StationMarkerProps> = ({
  isAvailable = true,
  size = 'medium',
}) => {
  const getMarkerSize = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, borderRadius: 16 };
      case 'large':
        return { width: 48, height: 48, borderRadius: 24 };
      default:
        return { width: 40, height: 40, borderRadius: 20 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  const markerSize = getMarkerSize();
  const iconSize = getIconSize();
  const backgroundColor = isAvailable ? '#00C853' : '#FF5722';

  return (
    <View style={[styles.markerContainer, markerSize, { backgroundColor }]}>
      <View style={[styles.markerInner, { backgroundColor }]}>
        <Ionicons name="flash" size={iconSize} color="#FFFFFF" />
      </View>
    </View>
  );
};

interface StationCalloutProps {
  title: string;
  powerKW: number;
  status: string;
  isAvailable: boolean;
  station: ChargingStation;
}

export const StationCallout: React.FC<StationCalloutProps> = ({
  title,
  powerKW,
  status,
  isAvailable,
  station,
}) => {
  // Safety check for station object
  if (!station || !station.AddressInfo) {
    return (
      <View style={styles.calloutContainer}>
        <Text style={styles.calloutTitle}>Şarj İstasyonu</Text>
        <Text style={styles.calloutPower}>{powerKW} kW</Text>
        <Text style={[styles.calloutStatus, isAvailable ? styles.calloutStatusAvailable : styles.calloutStatusBusy]}>
          {status}
        </Text>
      </View>
    );
  }

  const getConnectionTypes = () => {
    if (!station.Connections || station.Connections.length === 0) return 'Bilinmiyor';
    return station.Connections
      .map((conn: any) => conn.ConnectionType?.Title || 'Standart')
      .filter((value: string, index: number, self: string[]) => self.indexOf(value) === index) // Tekrarları kaldır
      .join(', ');
  };

  const getUsageType = () => {
    return station.UsageType?.Title || 'Genel Kullanım';
  };

  const getOperatorName = () => {
    return station.OperatorInfo?.Title || 'Bilinmiyor';
  };

  const getDistance = () => {
    const distance = station.AddressInfo.Distance;
    if (distance && distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return distance ? `${distance.toFixed(1)}km` : '';
  };

  const getAddress = () => {
    const { AddressInfo } = station;
    const parts = [
      AddressInfo.AddressLine1,
      AddressInfo.Town,
      AddressInfo.StateOrProvince
    ].filter(Boolean);
    return parts.join(', ') || 'Adres bilgisi yok';
  };

  const getNumberOfPoints = () => {
    return station.NumberOfPoints || station.Connections?.length || 1;
  };

  return (
    <View style={styles.calloutContainer}>
      {/* İstasyon Başlığı */}
      <View style={styles.calloutHeader}>
        <Text style={styles.calloutTitle} numberOfLines={2}>{title}</Text>
        {getDistance() && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{getDistance()}</Text>
          </View>
        )}
      </View>

      {/* Güç ve Durum Bilgisi */}
      <View style={styles.powerStatusRow}>
        <View style={styles.powerInfo}>
          <Ionicons name="flash" size={14} color="#00C853" />
          <Text style={styles.calloutPower}>{powerKW} kW</Text>
        </View>
        
        <View style={styles.statusInfo}>
          <View style={[
            styles.statusDot,
            { backgroundColor: isAvailable ? '#00C853' : '#FF5722' }
          ]} />
          <Text style={[
            styles.calloutStatus,
            isAvailable ? styles.calloutStatusAvailable : styles.calloutStatusBusy,
          ]}>
            {status}
          </Text>
        </View>
      </View>

      {/* Şarj Noktası Sayısı */}
      <View style={styles.infoRow}>
        <Ionicons name="car-outline" size={14} color="#666666" />
        <Text style={styles.infoText}>
          {getNumberOfPoints()} şarj noktası
        </Text>
      </View>

      {/* Konnektör Türü */}
      <View style={styles.infoRow}>
        <Ionicons name="link-outline" size={14} color="#666666" />
        <Text style={styles.infoText} numberOfLines={1}>
          {getConnectionTypes()}
        </Text>
      </View>

      {/* Kullanım Türü */}
      <View style={styles.infoRow}>
        <Ionicons name="people-outline" size={14} color="#666666" />
        <Text style={styles.infoText}>
          {getUsageType()}
        </Text>
      </View>

      {/* Operatör */}
      {getOperatorName() !== 'Bilinmiyor' && (
        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={14} color="#666666" />
          <Text style={styles.infoText} numberOfLines={1}>
            {getOperatorName()}
          </Text>
        </View>
      )}

      {/* Adres */}
      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={14} color="#666666" />
        <Text style={styles.addressText} numberOfLines={2}>
          {getAddress()}
        </Text>
      </View>

      {/* Son Güncelleme */}
      {station.DateLastStatusUpdate && (
        <View style={styles.updateRow}>
          <Ionicons name="time-outline" size={12} color="#999999" />
          <Text style={styles.updateText}>
            Son güncelleme: {new Date(station.DateLastStatusUpdate).toLocaleDateString('tr-TR')}
          </Text>
        </View>
      )}

      {/* Detay Butonu */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.detailButton}>
          <Text style={styles.detailButtonText}>Detayları Gör</Text>
          <Ionicons name="chevron-forward" size={16} color="#00C853" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutContainer: {
    padding: 16,
    minWidth: 280,
    maxWidth: 320,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263238',
    flex: 1,
    marginRight: 8,
  },
  distanceBadge: {
    backgroundColor: '#00C853',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  powerStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  powerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calloutPower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263238',
    marginLeft: 4,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  calloutStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  calloutStatusAvailable: {
    color: '#00C853',
  },
  calloutStatusBusy: {
    color: '#FF5722',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#555555',
    marginLeft: 8,
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#555555',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  updateText: {
    fontSize: 11,
    color: '#999999',
    marginLeft: 4,
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00C853',
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C853',
    marginRight: 4,
  },
});
