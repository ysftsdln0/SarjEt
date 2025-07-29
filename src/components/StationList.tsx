import React from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { ChargingStation } from '../types';
import { StationUtils } from '../utils/stationUtils';
import colors from '../constants/colors';

interface StationListProps {
  stations: ChargingStation[];
  onStationPress: (station: ChargingStation) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

export const StationList: React.FC<StationListProps> = ({
  stations,
  onStationPress,
  onRefresh,
  refreshing = false,
}) => {
  const renderStationItem = ({ item }: { item: ChargingStation }) => {
    return (
      <TouchableOpacity
        style={styles.stationCard}
        onPress={() => onStationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.stationHeader}>
          <View style={styles.stationTitle}>
            <Text style={styles.stationName} numberOfLines={2}>
              {item.AddressInfo.Title || 'İsimsiz İstasyon'}
            </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: StationUtils.getStatusColor(item) },
                ]}
              />
              <Text style={styles.statusText}>
                {StationUtils.getStationStatus(item)}
              </Text>
            </View>
          </View>
          {item.AddressInfo.Distance && (
            <Text style={styles.distance}>
              {StationUtils.formatDistance(item.AddressInfo.Distance)}
            </Text>
          )}
        </View>

        <Text style={styles.address} numberOfLines={2}>
          {StationUtils.getFormattedAddress(item)}
        </Text>

        <View style={styles.stationDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Güç:</Text>
            <Text style={styles.detailValue}>
              {StationUtils.getMaxPower(item)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Hız:</Text>
            <Text 
              style={[
                styles.detailValue,
                { color: StationUtils.getSpeedColor(item) }
              ]}
            >
              {StationUtils.getChargingSpeed(item)}
            </Text>
          </View>
        </View>

        {item.OperatorInfo?.Title && (
          <Text style={styles.operator} numberOfLines={1}>
            Operatör: {item.OperatorInfo.Title}
          </Text>
        )}

        {StationUtils.isFreeStation(item) && (
          <View style={styles.freeTag}>
            <Text style={styles.freeTagText}>ÜCRETSIZ</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>Şarj istasyonu bulunamadı</Text>
      <Text style={styles.emptySubtitle}>
        Farklı bir konum deneyin veya arama kriterlerinizi genişletin.
      </Text>
    </View>
  );

  return (
    <FlatList
      data={stations}
      renderItem={renderStationItem}
      keyExtractor={(item, index) => `station-${item.ID}-${index}`}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
      ListEmptyComponent={renderEmptyComponent}
    />
  );
};

const styles = StyleSheet.create({
  address: {
    color: colors.gray500,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  container: {
    backgroundColor: colors.overlayLight,
    borderRadius: 20,
    flex: 1,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
    paddingTop: 16,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  detailLabel: {
    color: colors.gray500,
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    color: colors.lightText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  distance: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptySubtitle: {
    color: colors.gray500,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.lightText,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  freeTag: {
    backgroundColor: colors.accent1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    position: 'absolute',
    right: 12,
    top: 12,
  },
  freeTagText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  operator: {
    color: colors.gray500,
    fontSize: 12,
    fontStyle: 'italic',
  },
  stationCard: {
    backgroundColor: colors.lightCard,
    borderColor: colors.gray300,
    borderRadius: 8,
    borderWidth: 1,
    elevation: 0,
    marginBottom: 12,
    padding: 16,
    position: 'relative',
    shadowOpacity: 0,
  },
  stationDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  stationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stationName: {
    color: colors.lightText,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stationTitle: {
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  statusText: {
    color: colors.gray500,
    fontSize: 12,
  },
});
