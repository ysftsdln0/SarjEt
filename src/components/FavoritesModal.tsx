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
  closeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  connectorBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectorText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  connectorTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  detailItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  detailText: {
    color: colors.gray500,
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyDescription: {
    color: colors.gray500,
    fontSize: 16,
    marginBottom: 24,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  favoriteCard: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray800,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  favoritesList: {
    // No additional styles needed
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray800,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  lightDetailText: {
    color: colors.gray600,
  },
  lightEmptyDescription: {
    color: colors.gray600,
  },
  lightEmptyTitle: {
    color: colors.black,
  },
  lightFavoriteCard: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray200,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  lightLoadingText: {
    color: colors.gray600,
  },
  lightSectionTitle: {
    color: colors.black,
  },
  lightStationAddress: {
    color: colors.gray600,
  },
  lightStationName: {
    color: colors.black,
  },
  lightTitle: {
    color: colors.black,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 100,
  },
  loadingText: {
    color: colors.gray500,
    fontSize: 16,
    marginTop: 16,
  },
  placeholder: {
    width: 40,
  },
  removeButton: {
    padding: 4,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  stationAddress: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: 8,
  },
  stationDetails: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stationHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stationInfo: {
    flex: 1,
  },
  stationName: {
    color: colors.white,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
