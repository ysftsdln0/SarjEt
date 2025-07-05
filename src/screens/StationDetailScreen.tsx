import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Linking,
} from 'react-native';
import { ChargingStation, UserLocation } from '../types';
import { StationUtils } from '../utils/stationUtils';
import { LocationService } from '../services/locationService';

interface StationDetailScreenProps {
  route: {
    params: {
      station: ChargingStation;
    };
  };
  navigation: any;
}

export const StationDetailScreen: React.FC<StationDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { station } = route.params;
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    // Kullanıcı konumunu al
    LocationService.getCurrentLocation()
      .then(setUserLocation)
      .catch(console.error);
  }, []);

  const handleGetDirections = async () => {
    try {
      if (!userLocation) {
        Alert.alert(
          'Konum Hatası',
          'Önce konumunuz alınmalı.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      const directionsUrl = LocationService.getDirectionsUrl(
        userLocation.latitude,
        userLocation.longitude,
        station.AddressInfo.Latitude,
        station.AddressInfo.Longitude
      );

      const canOpen = await Linking.canOpenURL(directionsUrl);
      
      if (canOpen) {
        await Linking.openURL(directionsUrl);
      } else {
        Alert.alert(
          'Hata',
          'Harita uygulaması açılamadı.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Yol tarifi hatası:', error);
      Alert.alert(
        'Hata',
        'Yol tarifi alınamadı.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const handleCall = (phoneNumber: string) => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(phoneUrl)
      .then(canOpen => {
        if (canOpen) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert(
            'Hata',
            'Telefon uygulaması açılamadı.',
            [{ text: 'Tamam' }]
          );
        }
      })
      .catch(console.error);
  };

  const renderConnectionInfo = () => {
    if (!station.Connections || station.Connections.length === 0) {
      return (
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Bağlantı Bilgisi</Text>
          <Text style={styles.noDataText}>Bağlantı bilgisi mevcut değil</Text>
        </View>
      );
    }

    return (
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Bağlantı Bilgileri</Text>
        {station.Connections.map((connection, index) => (
          <View key={index} style={styles.connectionItem}>
            <View style={styles.connectionHeader}>
              <Text style={styles.connectionType}>
                {connection.ConnectionType?.Title || 'Bilinmeyen'}
              </Text>
              {connection.PowerKW && (
                <Text style={styles.connectionPower}>
                  {connection.PowerKW} kW
                </Text>
              )}
            </View>
            
            {connection.Quantity && connection.Quantity > 1 && (
              <Text style={styles.connectionQuantity}>
                {connection.Quantity} adet
              </Text>
            )}
            
            {connection.StatusType && (
              <View style={styles.connectionStatus}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: connection.StatusType.IsOperational
                        ? '#22c55e'
                        : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.connectionStatusText}>
                  {connection.StatusType.IsOperational ? 'Aktif' : 'Devre dışı'}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İstasyon Detayı</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ana bilgiler */}
        <View style={styles.mainCard}>
          <View style={styles.stationHeader}>
            <Text style={styles.stationName}>
              {station.AddressInfo.Title || 'İsimsiz İstasyon'}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: StationUtils.getStatusColor(station) },
                ]}
              />
              <Text style={styles.statusText}>
                {StationUtils.getStationStatus(station)}
              </Text>
            </View>
          </View>

          <Text style={styles.address}>
            {StationUtils.getFormattedAddress(station)}
          </Text>

          {station.AddressInfo.Distance && (
            <Text style={styles.distance}>
              Uzaklık: {StationUtils.formatDistance(station.AddressInfo.Distance)}
            </Text>
          )}

          {StationUtils.isFreeStation(station) && (
            <View style={styles.freeTag}>
              <Text style={styles.freeTagText}>ÜCRETSIZ</Text>
            </View>
          )}
        </View>

        {/* Operatör bilgisi */}
        {station.OperatorInfo && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Operatör</Text>
            <Text style={styles.operatorName}>
              {station.OperatorInfo.Title}
            </Text>
            
            {station.OperatorInfo.WebsiteURL && (
              <TouchableOpacity
                onPress={() => Linking.openURL(station.OperatorInfo!.WebsiteURL!)}
              >
                <Text style={styles.link}>
                  {station.OperatorInfo.WebsiteURL}
                </Text>
              </TouchableOpacity>
            )}
            
            {station.OperatorInfo.PhonePrimaryContact && (
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={() => handleCall(station.OperatorInfo!.PhonePrimaryContact!)}
              >
                <Text style={styles.phoneButtonText}>
                  📞 {station.OperatorInfo.PhonePrimaryContact}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Güç ve hız bilgisi */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Şarj Bilgileri</Text>
          <View style={styles.powerInfo}>
            <View style={styles.powerItem}>
              <Text style={styles.powerLabel}>Maksimum Güç</Text>
              <Text style={styles.powerValue}>
                {StationUtils.getMaxPower(station)}
              </Text>
            </View>
            <View style={styles.powerItem}>
              <Text style={styles.powerLabel}>Şarj Hızı</Text>
              <Text
                style={[
                  styles.powerValue,
                  { color: StationUtils.getSpeedColor(station) },
                ]}
              >
                {StationUtils.getChargingSpeed(station)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.connectionTypes}>
            Bağlantı Türleri: {StationUtils.getConnectionTypes(station)}
          </Text>
        </View>

        {/* Bağlantı detayları */}
        {renderConnectionInfo()}

        {/* Kullanım bilgisi */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Kullanım Bilgileri</Text>
          <Text style={styles.usageType}>
            {StationUtils.getUsageType(station)}
          </Text>
          
          {station.GeneralComments && (
            <Text style={styles.comments}>
              Not: {station.GeneralComments}
            </Text>
          )}
        </View>

        {/* Tarih bilgileri */}
        {(station.DateLastConfirmed || station.DateLastVerified) && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Güncellik Bilgileri</Text>
            
            {station.DateLastConfirmed && (
              <Text style={styles.dateInfo}>
                Son Onay: {new Date(station.DateLastConfirmed).toLocaleDateString('tr-TR')}
              </Text>
            )}
            
            {station.DateLastVerified && (
              <Text style={styles.dateInfo}>
                Son Doğrulama: {new Date(station.DateLastVerified).toLocaleDateString('tr-TR')}
              </Text>
            )}
          </View>
        )}

        {/* Yol tarifi butonu */}
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleGetDirections}
        >
          <Text style={styles.directionsButtonText}>
            🗺️ Yol Tarifi Al
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stationHeader: {
    marginBottom: 12,
  },
  stationName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  address: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 8,
  },
  distance: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  freeTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  operatorName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    color: '#3b82f6',
    textDecorationLine: 'underline',
    marginBottom: 8,
  },
  phoneButton: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  phoneButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  powerInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  powerItem: {
    flex: 1,
  },
  powerLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
    marginBottom: 4,
  },
  powerValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  connectionTypes: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  connectionItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  connectionPower: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  connectionQuantity: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionStatusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  usageType: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  comments: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  dateInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  directionsButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  directionsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});
