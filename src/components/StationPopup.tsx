import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChargingStation } from '../types';
import colors from '../constants/colors';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StationPopupProps {
  station: ChargingStation | null;
  visible: boolean;
  slideAnim: Animated.Value;
  onClose: () => void;
  onNavigate?: (station: ChargingStation) => void;
}

const StationPopup: React.FC<StationPopupProps> = ({
  station,
  visible,
  slideAnim,
  onClose,
  onNavigate,
}) => {
  if (!visible || !station) return null;

  const getStationStatusColor = () => {
    const statusId = station.StatusTypeID;
    switch (statusId) {
      case 50: return colors.green500; // Operational
      case 30: return colors.orange500; // Temporarily Unavailable
      case 20: return colors.red500; // Planned
      default: return colors.gray500;
    }
  };

  const getStationStatusText = () => {
    return station.StatusType?.Title || 'Durumu Bilinmiyor';
  };

  const getStationPowerKW = () => {
    if (station.Connections && station.Connections.length > 0) {
      const maxPower = Math.max(...station.Connections.map((conn: any) => conn.PowerKW || 0));
      return maxPower > 0 ? maxPower : 'Bilinmiyor';
    }
    return 'Bilinmiyor';
  };

  const getDistance = () => {
    // Bu fonksiyon gerçek lokasyon hesaplaması ile değiştirilmeli
    return null; // Şimdilik null döndürüyor
  };

  const getUsageTypeText = () => {
    return station.UsageType?.Title || 'Genel Kullanım';
  };

  const getConnectionCount = () => {
    return station.Connections?.length || 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Bilgi yok';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR');
    } catch {
      return 'Bilgi yok';
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        onPress={onClose}
        activeOpacity={1}
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

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status and Power */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStationStatusColor() }]}>
              <Text style={styles.statusText}>{getStationStatusText()}</Text>
            </View>
            <View style={styles.powerContainer}>
              <Text style={styles.powerLabel}>Max Güç:</Text>
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
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailText}>
                  {station.AddressInfo?.AddressLine1 || station.AddressInfo?.Town || 'Adres bilgisi yok'}
                </Text>
                {station.AddressInfo?.StateOrProvince && (
                  <Text style={styles.detailSubText}>
                    {station.AddressInfo.StateOrProvince}
                  </Text>
                )}
              </View>
            </View>

            {/* Connection Count */}
            <View style={styles.detailRow}>
              <Ionicons name="flash-outline" size={16} color={colors.gray600} />
              <Text style={[styles.detailText, { marginLeft: 4 }]}>
                {getConnectionCount()} şarj noktası
              </Text>
            </View>

            {/* Usage Type */}
            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={colors.gray600} />
              <Text style={[styles.detailText, { marginLeft: 4 }]}>
                {getUsageTypeText()}
              </Text>
            </View>

            {/* Connection Details */}
            {station.Connections && station.Connections.length > 0 && (
              <View style={styles.connectionsSection}>
                <Text style={styles.sectionTitle}>Şarj Bağlantıları</Text>
                {station.Connections.slice(0, 3).map((connection: any, index: number) => (
                  <View key={index} style={styles.connectionRow}>
                    <View style={styles.connectionInfo}>
                      <Text style={styles.connectionType}>
                        {connection.ConnectionType?.Title || 'Standart'}
                      </Text>
                      <Text style={styles.connectionPower}>
                        {connection.PowerKW ? `${connection.PowerKW} kW` : 'Güç bilgisi yok'}
                      </Text>
                    </View>
                    <View style={styles.connectionLevel}>
                      <Text style={styles.levelText}>
                        {connection.Level?.Title || 'Seviye 2'}
                      </Text>
                    </View>
                  </View>
                ))}
                {station.Connections.length > 3 && (
                  <Text style={styles.moreConnectionsText}>
                    +{station.Connections.length - 3} daha fazla bağlantı
                  </Text>
                )}
              </View>
            )}

            {/* Operator Information */}
            {station.OperatorInfo && (
              <View style={styles.operatorSection}>
                <Text style={styles.sectionTitle}>İşletmeci Bilgisi</Text>
                <View style={styles.operatorRow}>
                  <Ionicons name="business-outline" size={16} color={colors.gray600} />
                  <Text style={styles.operatorText}>
                    {station.OperatorInfo.Title}
                  </Text>
                </View>
                {station.OperatorInfo.WebsiteURL && (
                  <View style={styles.operatorRow}>
                    <Ionicons name="globe-outline" size={16} color={colors.gray600} />
                    <Text style={styles.operatorWebsite}>
                      Website
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Usage Cost */}
            {station.GeneralComments && station.GeneralComments.includes('cost') && (
              <View style={styles.costSection}>
                <Text style={styles.sectionTitle}>Kullanım Maliyeti</Text>
                <Text style={styles.costText}>
                  Ücret bilgisi için işletmeci ile iletişime geçiniz
                </Text>
              </View>
            )}

            {/* Verification Info */}
            <View style={styles.verificationSection}>
              <Text style={styles.sectionTitle}>Doğrulama Bilgisi</Text>
              {station.DateLastStatusUpdate && (
                <View style={styles.verificationRow}>
                  <Ionicons name="time-outline" size={16} color={colors.gray600} />
                  <Text style={styles.verificationText}>
                    Son güncelleme: {formatDate(station.DateLastStatusUpdate)}
                  </Text>
                </View>
              )}
              {station.DateLastVerified && (
                <View style={styles.verificationRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.gray600} />
                  <Text style={styles.verificationText}>
                    Son doğrulama: {formatDate(station.DateLastVerified)}
                  </Text>
                </View>
              )}
            </View>

            {/* Comments */}
            {station.GeneralComments && (
              <View style={styles.commentsSection}>
                <Text style={styles.sectionTitle}>Yorumlar</Text>
                <Text style={styles.commentsText}>
                  {station.GeneralComments}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => onNavigate?.(station)}>
              <Ionicons name="navigate-outline" size={20} color={colors.white} />
              <Text style={styles.primaryButtonText}>Yol Tarifi Al</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Detaylar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  backdrop: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  commentsSection: {
    backgroundColor: colors.blue50,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  commentsText: {
    color: colors.gray700,
    fontSize: 14,
    lineHeight: 20,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionLevel: {
    backgroundColor: colors.blue100,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectionPower: {
    color: colors.gray600,
    fontSize: 12,
    marginTop: 2,
  },
  connectionRow: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  connectionType: {
    color: colors.gray900,
    fontSize: 14,
    fontWeight: '500',
  },
  connectionsSection: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  costSection: {
    backgroundColor: colors.orange50,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  costText: {
    color: colors.orange700,
    fontSize: 14,
    fontWeight: '500',
  },
  detailRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailSubText: {
    color: colors.gray500,
    fontSize: 12,
    marginTop: 2,
  },
  detailText: {
    color: colors.gray700,
    fontSize: 14,
    lineHeight: 20,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 4,
  },
  details: {
    paddingBottom: 8,
  },
  distanceBadge: {
    backgroundColor: colors.blue100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  distanceText: {
    color: colors.blue700,
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelText: {
    color: colors.blue700,
    fontSize: 12,
    fontWeight: '500',
  },
  moreConnectionsText: {
    color: colors.gray500,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  operatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  operatorSection: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  operatorText: {
    color: colors.gray700,
    fontSize: 14,
    marginLeft: 4,
  },
  operatorWebsite: {
    color: colors.blue600,
    fontSize: 14,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  overlay: {
    backgroundColor: colors.overlay,
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 9999,
  },
  popup: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: SCREEN_HEIGHT * 0.6,
    paddingBottom: 34,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    width: width,
  },
  powerContainer: {
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 12,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  powerLabel: {
    color: colors.gray600,
    fontSize: 12,
    marginRight: 4,
  },
  powerText: {
    color: colors.gray900,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.gray900,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  stationTitle: {
    color: colors.gray900,
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  verificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  verificationSection: {
    backgroundColor: colors.green50,
    borderRadius: 12,
    marginTop: 16,
    padding: 16,
  },
  verificationText: {
    color: colors.gray600,
    fontSize: 12,
    marginLeft: 4,
  },
});

export default StationPopup;
