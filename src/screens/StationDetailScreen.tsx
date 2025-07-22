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
  Dimensions,
} from 'react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ChargingStation, UserLocation } from '../types';
import { StationUtils } from '../utils/stationUtils';
import { LocationService } from '../services/locationService';
import colors from '../constants/colors';

const { width } = Dimensions.get('window');

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
  const [isDarkMode] = useState(false); // Koyu mod için state
  
  // Animasyon shared values
  const headerOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  useEffect(() => {
    // Animasyonları başlat
    headerOpacity.value = withSpring(1, { duration: 800 });
    cardScale.value = withSpring(1, { duration: 600 });
    
    // Kullanıcı konumunu al
    LocationService.getCurrentLocation()
      .then(setUserLocation)
      .catch(console.error);
  }, []);

  // Animasyon stilleri
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

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
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 400 }}
          style={[styles.infoCard, isDarkMode && styles.darkCard]}
        >        <View style={styles.cardHeader}>
          <FontAwesome5 name="plug" size={20} color={colors.accent1} />
          <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Bağlantı Bilgisi</Text>
        </View>
          <Text style={[styles.noDataText, isDarkMode && styles.darkSubText]}>
            Bağlantı bilgisi mevcut değil
          </Text>
        </MotiView>
      );
    }

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 600, delay: 400 }}
        style={[styles.infoCard, isDarkMode && styles.darkCard]}
      >
        <View style={styles.cardHeader}>
          <FontAwesome5 name="plug" size={20} color={colors.accent1} />
          <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Bağlantı Bilgileri</Text>
        </View>
        {station.Connections.map((connection, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 500 + (index * 100) }}
            style={[styles.connectionItem, isDarkMode && styles.darkConnectionItem]}
          >
            <View style={styles.connectionHeader}>
              <Text style={[styles.connectionType, isDarkMode && styles.darkText]}>
                {connection.ConnectionType?.Title || 'Bilinmeyen'}
              </Text>
              {connection.PowerKW && (
                <View style={styles.powerBadge}>
                  <Text style={styles.connectionPower}>
                    {connection.PowerKW} kW
                  </Text>
                </View>
              )}
            </View>
            
            {connection.Quantity && connection.Quantity > 1 && (
              <Text style={[styles.connectionQuantity, isDarkMode && styles.darkSubText]}>
                {connection.Quantity} adet
              </Text>
            )}
            
            {connection.StatusType && (
              <View style={styles.connectionStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: connection.StatusType.IsOperational
                        ? '#fca311'
                        : '#000000',
                    },
                  ]}
                />
                <Text style={[styles.connectionStatusText, isDarkMode && styles.darkText]}>
                  {connection.StatusType.IsOperational ? 'Aktif' : 'Devre dışı'}
                </Text>
              </View>
            )}
          </MotiView>
        ))}
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "light-content"} 
        backgroundColor={isDarkMode ? colors.black : colors.darkBg} 
      />
      
      {/* Modern Header with Animation */}
      <Animated.View style={[styles.header, isDarkMode && styles.darkHeader, headerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İstasyon Detayı</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView 
        style={[styles.content, isDarkMode && styles.darkContent]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card with Animation */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(800)}
          style={[styles.heroCard, cardAnimatedStyle, isDarkMode && styles.darkCard]}
        >
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 1000, delay: 300 }}
            style={styles.statusBadge}
          >
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: StationUtils.getStatusColor(station) },
              ]}
            />
          </MotiView>

          <Text style={[styles.stationName, isDarkMode && styles.darkText]}>
            {station.AddressInfo.Title || 'İsimsiz İstasyon'}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#fca311" />
            <Text style={[styles.address, isDarkMode && styles.darkSubText]}>
              {StationUtils.getFormattedAddress(station)}
            </Text>
          </View>

          {station.AddressInfo.Distance && (
            <View style={styles.distanceRow}>
              <MaterialIcons name="directions-car" size={16} color="#ffffff" />
              <Text style={styles.distance}>
                {StationUtils.formatDistance(station.AddressInfo.Distance)}
              </Text>
            </View>
          )}

          {StationUtils.isFreeStation(station) && (
            <MotiView
              from={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', duration: 800, delay: 600 }}
              style={styles.freeTag}
            >
              <FontAwesome5 name="gift" size={12} color="#000000" />
              <Text style={styles.freeTagText}>ÜCRETSIZ</Text>
            </MotiView>
          )}
        </Animated.View>

        {/* Power Stats Grid */}
        <Animated.View 
          entering={SlideInRight.delay(400).duration(600)}
          style={[styles.statsGrid, isDarkMode && styles.darkCard]}
        >
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            style={styles.statItem}
          >
            <FontAwesome5 name="bolt" size={24} color="#fca311" />
            <Text style={[styles.statValue, isDarkMode && styles.darkText]}>
              {StationUtils.getMaxPower(station)}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkSubText]}>
              Maksimum Güç
            </Text>
          </MotiView>

          <View style={[styles.statDivider, isDarkMode && styles.darkDivider]} />

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
            style={styles.statItem}
          >
            <FontAwesome5 name="tachometer-alt" size={24} color="#fca311" />
            <Text 
              style={[
                styles.statValue, 
                { color: StationUtils.getSpeedColor(station) },
                isDarkMode && styles.darkText
              ]}
            >
              {StationUtils.getChargingSpeed(station)}
            </Text>
            <Text style={[styles.statLabel, isDarkMode && styles.darkSubText]}>
              Şarj Hızı
            </Text>
          </MotiView>
        </Animated.View>

        {/* Operator Info */}
        {station.OperatorInfo && (
          <MotiView
            from={{ opacity: 0, translateX: -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 300 }}
            style={[styles.infoCard, isDarkMode && styles.darkCard]}
          >
            <View style={styles.cardHeader}>
              <FontAwesome5 name="building" size={20} color="#fca311" />
              <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Operatör</Text>
            </View>
            
            <Text style={[styles.operatorName, isDarkMode && styles.darkText]}>
              {station.OperatorInfo.Title}
            </Text>
            
            {station.OperatorInfo.WebsiteURL && (
              <TouchableOpacity
                onPress={() => Linking.openURL(station.OperatorInfo!.WebsiteURL!)}
                style={styles.linkButton}
              >
                <Ionicons name="globe-outline" size={16} color="#fca311" />
                <Text style={styles.link}>
                  {station.OperatorInfo.WebsiteURL}
                </Text>
              </TouchableOpacity>
            )}
            
            {station.OperatorInfo.PhonePrimaryContact && (
              <TouchableOpacity
                style={[styles.phoneButton, isDarkMode && styles.darkPhoneButton]}
                onPress={() => handleCall(station.OperatorInfo!.PhonePrimaryContact!)}
              >
                <Ionicons name="call" size={20} color="#ffffff" />
                <Text style={styles.phoneButtonText}>
                  {station.OperatorInfo.PhonePrimaryContact}
                </Text>
              </TouchableOpacity>
            )}
          </MotiView>
        )}

        {/* Connection Details */}
        {renderConnectionInfo()}

        {/* Usage Info */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 500 }}
          style={[styles.infoCard, isDarkMode && styles.darkCard]}
        >
          <View style={styles.cardHeader}>
            <MaterialIcons name="info-outline" size={20} color="#fca311" />
            <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Kullanım Bilgileri</Text>
          </View>
          
          <Text style={[styles.usageType, isDarkMode && styles.darkText]}>
            {StationUtils.getUsageType(station)}
          </Text>
          
          {station.GeneralComments && (
            <View style={[styles.commentBox, isDarkMode && styles.darkCommentBox]}>
              <FontAwesome5 name="comment-dots" size={14} color="#ffffff" />
              <Text style={[styles.comments, isDarkMode && styles.darkText]}>
                {station.GeneralComments}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Date Info */}
        {(station.DateLastConfirmed || station.DateLastVerified) && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 600 }}
            style={[styles.infoCard, isDarkMode && styles.darkCard]}
          >
            <View style={styles.cardHeader}>
              <MaterialIcons name="schedule" size={20} color="#fca311" />
              <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Güncellik Bilgileri</Text>
            </View>
            
            {station.DateLastConfirmed && (
              <View style={styles.dateRow}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fca311" />
                <Text style={[styles.dateInfo, isDarkMode && styles.darkSubText]}>
                  Son Onay: {new Date(station.DateLastConfirmed).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            )}
            
            {station.DateLastVerified && (
              <View style={styles.dateRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#fca311" />
                <Text style={[styles.dateInfo, isDarkMode && styles.darkSubText]}>
                  Son Doğrulama: {new Date(station.DateLastVerified).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            )}
          </MotiView>
        )}

        {/* Modern Action Button */}
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', duration: 1000, delay: 700 }}
        >
          <TouchableOpacity
            style={[styles.directionsButton, isDarkMode && styles.darkDirectionsButton]}
            onPress={handleGetDirections}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <MaterialIcons name="directions" size={24} color="#FFFFFF" />
              <Text style={styles.directionsButtonText}>
                Yol Tarifi Al
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Base Styles
  container: {
    flex: 1,
    backgroundColor: '#fff', // Tamamen beyaz arka plan
  },
  darkContainer: {
    backgroundColor: '#fff', // Koyu modda da beyaz (örneklerde koyu mod yok)
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    elevation: 0,
    shadowOpacity: 0,
  },
  darkHeader: {
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#14213d',
    textAlign: 'center',
    flex: 1,
  },
  favoriteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  // Content Styles
  content: {
    flex: 1,
    padding: 0,
    backgroundColor: '#fff',
  },
  darkContent: {
    backgroundColor: '#fff',
  },
  // Hero Card
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 0,
    marginBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
    position: 'relative',
  },
  darkCard: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  statusBadge: {
    display: 'none', // Sadeleştirme için kaldırıldı
  },
  statusIndicator: {
    display: 'none',
  },
  stationName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#14213d',
    marginBottom: 4,
    lineHeight: 34,
  },
  darkText: {
    color: '#14213d',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  address: {
    fontSize: 16,
    color: '#14213d',
    lineHeight: 24,
    flex: 1,
  },
  darkSubText: {
    color: '#b0b0b0',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  distance: {
    fontSize: 16,
    color: '#14213d',
    fontWeight: '600',
  },
  freeTag: {
    display: 'none', // Sadeleştirme için kaldırıldı
  },
  freeTagText: {
    display: 'none',
  },
  // Stats Grid
  statsGrid: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 0,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#14213d',
  },
  statLabel: {
    fontSize: 13,
    color: '#b0b0b0',
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e5e5',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  darkDivider: {
    backgroundColor: '#e5e5e5',
  },
  // Info Cards
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 0,
    marginBottom: 0,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14213d',
  },
  // Operator Styles
  operatorName: {
    fontSize: 16,
    color: '#14213d',
    marginBottom: 8,
    fontWeight: '500',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  link: {
    fontSize: 13,
    color: '#039BE5',
    fontWeight: '500',
  },
  phoneButton: {
    backgroundColor: '#039BE5',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  darkPhoneButton: {
    backgroundColor: '#039BE5',
  },
  phoneButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  // Connection Styles
  connectionItem: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  darkConnectionItem: {
    backgroundColor: '#f5f5f5',
  },
  connectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  connectionType: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#14213d',
  },
  powerBadge: {
    backgroundColor: '#039BE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  connectionPower: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionQuantity: {
    fontSize: 12,
    color: '#b0b0b0',
    marginBottom: 4,
    fontWeight: '500',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectionStatusText: {
    fontSize: 12,
    color: '#14213d',
    fontWeight: '500',
  },
  // Usage Styles
  usageType: {
    fontSize: 14,
    color: '#14213d',
    marginBottom: 4,
    fontWeight: '500',
  },
  commentBox: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  darkCommentBox: {
    backgroundColor: '#f5f5f5',
  },
  comments: {
    fontSize: 13,
    color: '#14213d',
    lineHeight: 18,
    flex: 1,
    fontWeight: '400',
  },
  // Date Styles
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
  },
  dateInfo: {
    fontSize: 12,
    color: '#b0b0b0',
    fontWeight: '400',
  },
  // Action Button
  directionsButton: {
    backgroundColor: '#039BE5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 0,
  },
  darkDirectionsButton: {
    backgroundColor: '#039BE5',
    shadowColor: '#039BE5',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 14,
    color: '#b0b0b0',
    textAlign: 'center',
    opacity: 1,
    fontWeight: '400',
    fontStyle: 'italic',
  },
});
