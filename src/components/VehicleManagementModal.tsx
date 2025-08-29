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
import userVehicleService, { 
  UserVehicle
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
      const userVehicles = await userVehicleService.getUserVehicles();
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
  actionButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    marginLeft: 10,
    width: 40,
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
  addFirstButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  addFirstButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  addFormContainer: {
    padding: 20,
  },
  addFormTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  brandCard: {
    backgroundColor: colors.gray800,
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brandText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
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
  container: {
    backgroundColor: colors.gray900,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  emptyText: {
    color: colors.gray400,
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 20,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  formButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 15,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray800,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  lightAddFormTitle: {
    color: colors.gray900,
  },
  lightBrandCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  lightBrandText: {
    color: colors.gray900,
  },
  lightContainer: {
    backgroundColor: colors.gray50,
  },
  lightEmptyText: {
    color: colors.gray600,
  },
  lightEmptyTitle: {
    color: colors.gray900,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  lightHeaderTitle: {
    color: colors.gray900,
  },
  lightLoadingText: {
    color: colors.gray600,
  },
  lightModelCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  lightModelText: {
    color: colors.gray900,
  },
  lightNicknameInput: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    color: colors.gray900,
  },
  lightSpecText: {
    color: colors.gray700,
  },
  lightStepTitle: {
    color: colors.gray900,
  },
  lightVariantCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
  },
  lightVariantName: {
    color: colors.gray900,
  },
  lightVariantSpecText: {
    color: colors.gray600,
  },
  lightVehicleCard: {
    backgroundColor: colors.white,
    borderColor: colors.gray200,
    borderWidth: 1,
  },
  lightVehicleDetails: {
    color: colors.gray600,
  },
  lightVehicleName: {
    color: colors.gray900,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: colors.gray400,
    fontSize: 16,
    marginTop: 10,
  },
  modelCard: {
    backgroundColor: colors.gray800,
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  modelText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  nicknameInput: {
    backgroundColor: colors.gray800,
    borderColor: colors.gray700,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  placeholder: {
    width: 24,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  selectedBrandCard: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  selectedBrandText: {
    color: colors.primary,
  },
  selectedModelCard: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  selectedModelText: {
    color: colors.primary,
  },
  selectedVariantCard: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  selectedVariantName: {
    color: colors.primary,
  },
  specItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 15,
  },
  specText: {
    color: colors.gray300,
    fontSize: 12,
    marginLeft: 4,
  },
  stepTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 20,
  },
  variantCard: {
    backgroundColor: colors.gray800,
    borderColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
  },
  variantName: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  variantSpecText: {
    color: colors.gray400,
    fontSize: 14,
  },
  variantSpecs: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  vehicleActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  vehicleCard: {
    alignItems: 'center',
    backgroundColor: colors.gray800,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 15,
    padding: 15,
  },
  vehicleDetails: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: 10,
  },
  vehicleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 5,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    color: colors.white,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleSpecs: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  vehiclesList: {
    padding: 20,
  },
});
