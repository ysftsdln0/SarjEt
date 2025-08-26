import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface FavoriteStation {
  id: string;
  name: string;
  address: string;
  distance?: number;
  connectorTypes: string[];
  rating?: number;
  reviewCount?: number;
}

interface FavoritesModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onNavigateToStation: (stationId: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  visible,
  onClose,
  isDarkMode,
  onNavigateToStation,
}) => {
  const [favorites, setFavorites] = useState<FavoriteStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFavorites();
    }
  }, [visible]);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      // TODO: API çağrısı yapılacak
      // Şimdilik mock data
      const mockFavorites: FavoriteStation[] = [
        {
          id: '1',
          name: 'Tesla Supercharger İstinyePark',
          address: 'İstinye Park AVM, İstinye, İstanbul',
          distance: 2.3,
          connectorTypes: ['Type 2', 'CCS2', 'CHAdeMO'],
          rating: 4.8,
          reviewCount: 124
        },
        {
          id: '2', 
          name: 'Eşarj Zorlu Center',
          address: 'Zorlu Center AVM, Beşiktaş, İstanbul',
          distance: 5.1,
          connectorTypes: ['Type 2', 'CCS2'],
          rating: 4.6,
          reviewCount: 89
        },
        {
          id: '3',
          name: 'ZES Ataşehir',
          address: 'Ataşehir Bulvarı No:12, Ataşehir, İstanbul',
          distance: 12.8,
          connectorTypes: ['Type 2', 'CCS2', 'CHAdeMO'],
          rating: 4.4,
          reviewCount: 56
        }
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setFavorites(mockFavorites);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Hata', 'Favoriler yüklenirken bir hata oluştu.');
      setIsLoading(false);
    }
  };

  const removeFavorite = (stationId: string) => {
    Alert.alert(
      'Favoriden Çıkar',
      'Bu istasyonu favorilerinizden çıkarmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: () => {
            setFavorites(favorites.filter(station => station.id !== stationId));
            Alert.alert('Başarılı', 'İstasyon favorilerden çıkarıldı.');
          }
        }
      ]
    );
  };

  const FavoriteCard = ({ station }: { station: FavoriteStation }) => (
    <TouchableOpacity 
      style={[styles.favoriteCard, !isDarkMode && styles.lightFavoriteCard]}
      onPress={() => {
        onNavigateToStation(station.id);
        onClose();
      }}
    >
      <View style={styles.stationInfo}>
        <View style={styles.stationHeader}>
          <Text style={[styles.stationName, !isDarkMode && styles.lightStationName]}>
            {station.name}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFavorite(station.id)}
          >
            <Ionicons name="heart" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.stationAddress, !isDarkMode && styles.lightStationAddress]}>
          {station.address}
        </Text>
        
        <View style={styles.stationDetails}>
          {station.distance && (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color={colors.gray500} />
              <Text style={[styles.detailText, !isDarkMode && styles.lightDetailText]}>
                {station.distance} km
              </Text>
            </View>
          )}
          
          {station.rating && (
            <View style={styles.detailItem}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={[styles.detailText, !isDarkMode && styles.lightDetailText]}>
                {station.rating} ({station.reviewCount} değerlendirme)
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.connectorTypes}>
          {station.connectorTypes.map((type, index) => (
            <View key={index} style={styles.connectorBadge}>
              <Text style={styles.connectorText}>{type}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, !isDarkMode && styles.lightContainer]}>
        <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? colors.white : colors.black} />
          </TouchableOpacity>
          <Text style={[styles.title, !isDarkMode && styles.lightTitle]}>
            Favori İstasyonlar
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, !isDarkMode && styles.lightLoadingText]}>
                Favoriler yükleniyor...
              </Text>
            </View>
          ) : favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color={colors.gray500} />
              <Text style={[styles.emptyTitle, !isDarkMode && styles.lightEmptyTitle]}>
                Henüz favori istasyonunuz yok
              </Text>
              <Text style={[styles.emptyDescription, !isDarkMode && styles.lightEmptyDescription]}>
                Şarj istasyonlarını favorilerinize ekleyerek hızlıca erişebilirsiniz
              </Text>
            </View>
          ) : (
            <View style={styles.favoritesList}>
              <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
                Favori İstasyonlarınız ({favorites.length})
              </Text>
              {favorites.map((station) => (
                <FavoriteCard key={station.id} station={station} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  lightTitle: {
    color: colors.black,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray500,
  },
  lightLoadingText: {
    color: colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  lightEmptyTitle: {
    color: colors.black,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  lightEmptyDescription: {
    color: colors.gray600,
  },
  favoritesList: {
    // No additional styles needed
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  lightSectionTitle: {
    color: colors.black,
  },
  favoriteCard: {
    backgroundColor: colors.gray900,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray800,
  },
  lightFavoriteCard: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  stationInfo: {
    flex: 1,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    marginRight: 8,
  },
  lightStationName: {
    color: colors.black,
  },
  removeButton: {
    padding: 4,
  },
  stationAddress: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 8,
  },
  lightStationAddress: {
    color: colors.gray600,
  },
  stationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.gray500,
  },
  lightDetailText: {
    color: colors.gray600,
  },
  connectorTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  connectorBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectorText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});
