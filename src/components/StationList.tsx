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
  userLocation,
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    position: 'relative',
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stationTitle: {
    flex: 1,
    marginRight: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#14213d',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#b0b0b0',
  },
  distance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#039BE5',
  },
  address: {
    fontSize: 14,
    color: '#b0b0b0',
    marginBottom: 12,
    lineHeight: 20,
  },
  stationDetails: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#b0b0b0',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#14213d',
    fontWeight: 'bold',
  },
  operator: {
    fontSize: 12,
    color: '#b0b0b0',
    fontStyle: 'italic',
  },
  freeTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#039BE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#14213d',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#b0b0b0',
    textAlign: 'center',
    lineHeight: 20,
  },
});
