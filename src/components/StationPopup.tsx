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
  backdrop: {
    flex: 1,
  },
  header: {
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
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
    minHeight: SCREEN_HEIGHT * 0.6,
    maxHeight: SCREEN_HEIGHT * 0.85,
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  stationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  powerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  powerLabel: {
    fontSize: 12,
    color: colors.gray600,
    marginRight: 4,
  },
  powerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray900,
  },
  distanceBadge: {
    backgroundColor: colors.blue100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.blue700,
  },
  details: {
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 4,
  },
  detailText: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  detailSubText: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 2,
  },
  connectionsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 12,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionType: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray900,
  },
  connectionPower: {
    fontSize: 12,
    color: colors.gray600,
    marginTop: 2,
  },
  connectionLevel: {
    backgroundColor: colors.blue100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.blue700,
  },
  moreConnectionsText: {
    fontSize: 12,
    color: colors.gray500,
    fontStyle: 'italic',
    marginTop: 8,
  },
  operatorSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.gray50,
    borderRadius: 12,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  operatorText: {
    fontSize: 14,
    color: colors.gray700,
    marginLeft: 4,
  },
  operatorWebsite: {
    fontSize: 14,
    color: colors.blue600,
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
  costSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.orange50,
    borderRadius: 12,
  },
  costText: {
    fontSize: 14,
    color: colors.orange700,
    fontWeight: '500',
  },
  verificationSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.green50,
    borderRadius: 12,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationText: {
    fontSize: 12,
    color: colors.gray600,
    marginLeft: 4,
  },
  commentsSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.blue50,
    borderRadius: 12,
  },
  commentsText: {
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StationPopup;
