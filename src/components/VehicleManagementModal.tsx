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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import userVehicleService, { 
  UserVehicle, 
  VehicleBrand, 
  VehicleModel, 
  VehicleVariant 
} from '../services/userVehicleService';
import { AddVehicleModal } from './AddVehicleModal';

interface VehicleManagementModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  authToken: string | null;
}

export const VehicleManagementModal: React.FC<VehicleManagementModalProps> = ({
  visible,
  onClose,
  isDarkMode,
  authToken,
}) => {
  const [vehicles, setVehicles] = useState<UserVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);

  useEffect(() => {
    if (visible && authToken) {
      loadVehicles();
    }
  }, [visible, authToken]);

  const loadVehicles = async () => {
    if (!authToken) return;
    
    try {
      setLoading(true);
      const userVehicles = await userVehicleService.getUserVehicles(authToken);
      setVehicles(userVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      Alert.alert('Hata', 'Araçlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!authToken) return;
    
    Alert.alert(
      'Araç Sil',
      'Bu aracı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await userVehicleService.deleteVehicle(authToken, vehicleId);
              Alert.alert('Başarılı', 'Araç başarıyla silindi.');
              await loadVehicles();
            } catch (error) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Hata', 'Araç silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (vehicleId: string) => {
    if (!authToken) return;
    
    try {
      await userVehicleService.setPrimaryVehicle(authToken, vehicleId);
      Alert.alert('Başarılı', 'Ana araç değiştirildi.');
      await loadVehicles();
    } catch (error) {
      console.error('Error setting primary vehicle:', error);
      Alert.alert('Hata', 'Ana araç değiştirilirken bir hata oluştu.');
    }
  };

  const renderVehicleCard = (vehicle: UserVehicle) => (
    <View key={vehicle.id} style={[styles.vehicleCard, !isDarkMode && styles.lightVehicleCard]}>
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleHeader}>
          <Text style={[styles.vehicleName, !isDarkMode && styles.lightVehicleName]}>
            {vehicle.nickname || 
             `${vehicle.variant?.model?.brand?.name || 'Bilinmeyen'} ${vehicle.variant?.model?.name || 'Model'}`}
          </Text>
          {/* Primary vehicle badge - we'll need to track this separately */}
        </View>
        
        <Text style={[styles.vehicleDetails, !isDarkMode && styles.lightVehicleDetails]}>
          {vehicle.variant?.name || 'Varyant'} • {vehicle.variant?.year || 'N/A'}
        </Text>
        
        <View style={styles.vehicleSpecs}>
          <View style={styles.specItem}>
            <Ionicons name="speedometer" size={16} color={colors.primary} />
            <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
              {vehicle.variant?.maxRange || 'N/A'} km
            </Text>
          </View>
          <View style={styles.specItem}>
            <Ionicons name="calendar" size={16} color={colors.warning} />
            <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
              {vehicle.variant?.year || 'N/A'}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.vehicleActions}>        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteVehicle(vehicle.id)}
        >
          <Ionicons name="trash" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
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
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={isDarkMode ? colors.white : colors.gray900} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>
            Araç Yönetimi
          </Text>
          {vehicles.length > 0 && (
            <TouchableOpacity onPress={() => setShowAddVehicleModal(true)}>
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, !isDarkMode && styles.lightLoadingText]}>
                Araçlar yükleniyor...
              </Text>
            </View>
          ) : (
            <>
              {vehicles.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="car" size={80} color={colors.gray400} />
                  <Text style={[styles.emptyTitle, !isDarkMode && styles.lightEmptyTitle]}>
                    Henüz araç eklenmemiş
                  </Text>
                  <Text style={[styles.emptyText, !isDarkMode && styles.lightEmptyText]}>
                    İlk aracınızı eklemek için butona tıklayın
                  </Text>
                  <TouchableOpacity
                    style={styles.addFirstButton}
                    onPress={() => setShowAddVehicleModal(true)}
                  >
                    <Text style={styles.addFirstButtonText}>İlk Aracımı Ekle</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.vehiclesList}>
                  {vehicles.map(renderVehicleCard)}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <AddVehicleModal
        visible={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onVehicleAdded={() => {
          setShowAddVehicleModal(false);
          loadVehicles();
        }}
        isDarkMode={isDarkMode}
        authToken={authToken || ''}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray900,
  },
  lightContainer: {
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  lightHeaderTitle: {
    color: colors.gray900,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: colors.gray400,
    fontSize: 16,
  },
  lightLoadingText: {
    color: colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginTop: 20,
    marginBottom: 10,
  },
  lightEmptyTitle: {
    color: colors.gray900,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray400,
    textAlign: 'center',
    marginBottom: 30,
  },
  lightEmptyText: {
    color: colors.gray600,
  },
  addFirstButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  addFirstButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  vehiclesList: {
    padding: 20,
  },
  vehicleCard: {
    backgroundColor: colors.gray800,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightVehicleCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
  },
  lightVehicleName: {
    color: colors.gray900,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  vehicleDetails: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 10,
  },
  lightVehicleDetails: {
    color: colors.gray600,
  },
  vehicleSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  specText: {
    fontSize: 12,
    color: colors.gray300,
    marginLeft: 4,
  },
  lightSpecText: {
    color: colors.gray700,
  },
  vehicleActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  addFormContainer: {
    padding: 20,
  },
  addFormTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 30,
  },
  lightAddFormTitle: {
    color: colors.gray900,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginTop: 20,
    marginBottom: 15,
  },
  lightStepTitle: {
    color: colors.gray900,
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  brandCard: {
    backgroundColor: colors.gray800,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lightBrandCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  selectedBrandCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  brandText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  lightBrandText: {
    color: colors.gray900,
  },
  selectedBrandText: {
    color: colors.primary,
  },
  modelCard: {
    backgroundColor: colors.gray800,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lightModelCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  selectedModelCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  modelText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  lightModelText: {
    color: colors.gray900,
  },
  selectedModelText: {
    color: colors.primary,
  },
  variantCard: {
    backgroundColor: colors.gray800,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  lightVariantCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  selectedVariantCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  variantName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  lightVariantName: {
    color: colors.gray900,
  },
  selectedVariantName: {
    color: colors.primary,
  },
  variantSpecs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variantSpecText: {
    color: colors.gray400,
    fontSize: 14,
  },
  lightVariantSpecText: {
    color: colors.gray600,
  },
  nicknameInput: {
    backgroundColor: colors.gray800,
    borderWidth: 1,
    borderColor: colors.gray700,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 16,
    marginBottom: 20,
  },
  lightNicknameInput: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    color: colors.gray900,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  formButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.gray600,
    marginRight: 10,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
    marginLeft: 10,
  },
  addButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
