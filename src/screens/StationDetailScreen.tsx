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

import Animated, { 
  FadeInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { ChargingStation, UserLocation } from '../types';
import { StationUtils } from '../utils/stationUtils';
import { LocationService } from '../services/locationService';
import { fadeIn, fadeOut, slideUp, slideDown } from '../utils/animationUtils';
import colors from '../constants/colors';

interface StationDetailScreenProps {
  route: {
    params: {
      station: ChargingStation;
    };
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: object) => void;
  };
}

export const StationDetailScreen: React.FC<StationDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { station } = route.params;
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isDarkMode] = useState(false); // Koyu mod için state
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  
  // Animasyon shared values
  const headerOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);

  useEffect(() => {
    // Initialize animations
    headerOpacity.value = 1;
    cardScale.value = 1;
    
    // Kullanıcı konumunu al
    LocationService.getCurrentLocation()
      .then(setUserLocation)
      .catch(console.error);
  }, []);

  // Helper function to get transition config with reduced motion support
  const getTransitionConfig = (originalDelay: number = 0, durationType: 'spring' | 'timing' = 'timing', originalDuration: number = 600) => ({
    type: isReducedMotion ? 'timing' as const : durationType,
    duration: isReducedMotion ? 0 : originalDuration,
    delay: isReducedMotion ? 0 : originalDelay,
  });

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
          from={{ opacity: 0, translateY: isReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 300, delay: isReducedMotion ? 0 : 400 }}
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
        from={{ opacity: 0, translateY: isReducedMotion ? 0 : 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 300, delay: isReducedMotion ? 0 : 400 }}
        style={[styles.infoCard, isDarkMode && styles.darkCard]}
      >
        <View style={styles.cardHeader}>
          <FontAwesome5 name="plug" size={20} color={colors.accent1} />
          <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>Bağlantı Bilgileri</Text>
        </View>
        {station.Connections.map((connection, index) => (
          <MotiView
            key={index}
            from={{ opacity: 0, scale: isReducedMotion ? 1 : 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 300, 
              delay: isReducedMotion ? 0 : 500 + (index * 100) 
            }}
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
                        ? colors.stationDetail_accent
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
          entering={isReducedMotion ? undefined : FadeInDown.delay(200).duration(800)}
          style={[styles.heroCard, cardAnimatedStyle, isDarkMode && styles.darkCard]}
        >
          <MotiView
            from={{ scale: isReducedMotion ? 1 : 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: isReducedMotion ? 'timing' : 'spring', 
              duration: isReducedMotion ? 0 : 1000, 
              delay: isReducedMotion ? 0 : 300 
            }}
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
              from={{ opacity: 0, scale: isReducedMotion ? 1 : 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                type: isReducedMotion ? 'timing' : 'spring', 
                duration: isReducedMotion ? 0 : 800, 
                delay: isReducedMotion ? 0 : 600 
              }}
              style={styles.freeTag}
            >
              <FontAwesome5 name="gift" size={12} color="#000000" />
              <Text style={styles.freeTagText}>ÜCRETSIZ</Text>
            </MotiView>
          )}
        </Animated.View>

        {/* Power Stats Grid */}
        <Animated.View 
          entering={isReducedMotion ? undefined : SlideInRight.delay(400).duration(600)}
          style={[styles.statsGrid, isDarkMode && styles.darkCard]}
        >
          <MotiView
            from={{ opacity: 0, translateY: isReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ 
              duration: 300, 
              delay: isReducedMotion ? 0 : 500 
            }}
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
            from={{ opacity: 0, translateY: isReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={getTransitionConfig(600, 'timing', 500)}
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
            from={{ opacity: 0, translateX: isReducedMotion ? 0 : -50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={getTransitionConfig(300, 'timing', 600)}
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
          from={{ opacity: 0, translateY: isReducedMotion ? 0 : 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={getTransitionConfig(500, 'timing', 600)}
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
            from={{ opacity: 0, scale: isReducedMotion ? 1 : 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={getTransitionConfig(600, 'timing', 500)}
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
          from={{ opacity: 0, translateY: isReducedMotion ? 0 : 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={getTransitionConfig(700, 'spring', 1000)}
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
    backgroundColor: colors.white,
    flex: 1, // Tamamen beyaz arka plan
  },
  darkContainer: {
    backgroundColor: colors.white, // Koyu modda da beyaz (örneklerde koyu mod yok)
  },
  // Header Styles
  darkHeader: {
    backgroundColor: colors.white,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.stationDetail_mediumGray,
    borderBottomWidth: 1,
    elevation: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowOpacity: 0,
  },
  backButton: {
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    color: colors.stationDetail_darkBlue,
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  favoriteButton: {
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 20,
    padding: 8,
  },
  // Content Styles
  content: {
    backgroundColor: colors.white,
    flex: 1,
    padding: 0,
  },
  darkContent: {
    backgroundColor: colors.white,
  },
  // Hero Card
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 0,
    borderWidth: 0,
    elevation: 0,
    marginBottom: 0,
    padding: 0,
    position: 'relative',
    shadowOpacity: 0,
  },
  darkCard: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  statusBadge: {
    display: 'none', // Sadeleştirme için kaldırıldı
  },
  statusIndicator: {
    display: 'none',
  },
  stationName: {
    color: colors.stationDetail_darkBlue,
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 34,
    marginBottom: 4,
  },
  darkText: {
    color: colors.stationDetail_darkBlue,
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    padding: 8,
  },
  address: {
    color: colors.stationDetail_darkBlue,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  darkSubText: {
    color: colors.stationDetail_textGray,
  },
  distanceRow: {
    alignItems: 'center',
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    padding: 8,
  },
  distance: {
    color: colors.stationDetail_darkBlue,
    fontSize: 16,
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
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 0,
    borderWidth: 0,
    elevation: 0,
    flexDirection: 'row',
    marginBottom: 0,
    padding: 0,
    shadowOpacity: 0,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  statValue: {
    color: colors.stationDetail_darkBlue,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.stationDetail_textGray,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  statDivider: {
    backgroundColor: colors.stationDetail_mediumGray,
    borderRadius: 1,
    height: 40,
    marginHorizontal: 8,
    width: 1,
  },
  darkDivider: {
    backgroundColor: colors.stationDetail_mediumGray,
  },
  // Info Cards
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 0,
    borderWidth: 0,
    elevation: 0,
    marginBottom: 0,
    padding: 0,
    shadowOpacity: 0,
  },
  cardHeader: {
    alignItems: 'center',
    borderBottomWidth: 0,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 0,
  },
  cardTitle: {
    color: colors.stationDetail_darkBlue,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Operator Styles
  operatorName: {
    color: colors.stationDetail_darkBlue,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  linkButton: {
    alignItems: 'center',
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  link: {
    color: colors.stationDetail_link,
    fontSize: 13,
    fontWeight: '500',
  },
  phoneButton: {
    alignItems: 'center',
    backgroundColor: colors.stationDetail_link,
    borderRadius: 8,
    elevation: 0,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    padding: 10,
    shadowOpacity: 0,
  },
  darkPhoneButton: {
    backgroundColor: colors.stationDetail_link,
  },
  phoneButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  // Connection Styles
  connectionItem: {
    backgroundColor: colors.stationDetail_lightGray,
    borderLeftWidth: 0,
    borderRadius: 8,
    elevation: 0,
    marginBottom: 8,
    padding: 10,
    shadowOpacity: 0,
  },
  darkConnectionItem: {
    backgroundColor: colors.stationDetail_lightGray,
  },
  connectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  connectionType: {
    color: colors.stationDetail_darkBlue,
    fontSize: 15,
    fontWeight: 'bold',
  },
  powerBadge: {
    backgroundColor: colors.stationDetail_link,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  connectionPower: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  connectionQuantity: {
    color: colors.stationDetail_textGray,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  connectionStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  connectionStatusText: {
    color: colors.stationDetail_darkBlue,
    fontSize: 12,
    fontWeight: '500',
  },
  // Usage Styles
  usageType: {
    color: colors.stationDetail_darkBlue,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  commentBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  darkCommentBox: {
    backgroundColor: colors.stationDetail_lightGray,
  },
  comments: {
    color: colors.stationDetail_darkBlue,
    flex: 1,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  // Date Styles
  dateRow: {
    alignItems: 'center',
    backgroundColor: colors.stationDetail_lightGray,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    padding: 8,
  },
  dateInfo: {
    color: colors.stationDetail_textGray,
    fontSize: 12,
    fontWeight: '400',
  },
  // Action Button
  directionsButton: {
    backgroundColor: colors.stationDetail_link,
    borderRadius: 8,
    borderWidth: 0,
    elevation: 0,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowOpacity: 0,
  },
  darkDirectionsButton: {
    backgroundColor: colors.stationDetail_link,
    shadowColor: colors.stationDetail_link,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  directionsButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    color: colors.stationDetail_textGray,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '400',
    opacity: 1,
    textAlign: 'center',
  },
});
