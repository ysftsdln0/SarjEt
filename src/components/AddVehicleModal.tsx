import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import userVehicleService, { 
  VehicleBrand, 
  VehicleModel, 
  VehicleVariant, 
  CreateVehicleData
} from '../services/userVehicleService';
import { getBaseUrl } from '../services/apiClient';

// EV data service interface for frontend
interface EVVehicle {
  id: string;
  brand: string;
  model: string;
  variant: string;
  release_year: number;
  usable_battery_size: number;
  range?: number;
  energy_consumption?: {
    average_consumption: number;
  };
  ac_charger?: {
    max_power: number;
    ports: string[];
  };
  dc_charger?: {
    max_power: number;
    ports: string[];
  };
}

interface AddVehicleModalProps {
  visible: boolean;
  onClose: () => void;
  onVehicleAdded: () => void;
  isDarkMode: boolean;
  authToken: string;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  visible,
  onClose,
  onVehicleAdded,
  isDarkMode,
  authToken,
}) => {
  const [step, setStep] = useState(1); // 1: Brand, 2: Model, 3: Variant, 4: Details
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Data states
  const [evVehicles, setEvVehicles] = useState<EVVehicle[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [variants, setVariants] = useState<EVVehicle[]>([]);

  // Selected values
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<EVVehicle | null>(null);
  
  // Vehicle details
  const [nickname, setNickname] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('80');

  useEffect(() => {
    if (visible) {
      loadEVData();
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setStep(1);
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedVariant(null);
    setNickname('');
    setLicensePlate('');
    setColor('');
    setBatteryLevel('80');
  };

  const loadEVData = async () => {
    try {
      setLoading(true);
      // Backend EV data service'den tüm araçları çek
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/api/vehicles/ev-data`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('EV data response:', data); // Debug için
      
      // Response format'ını kontrol et
      let vehicles: EVVehicle[] = [];
      if (Array.isArray(data)) {
        vehicles = data;
      } else if (data.vehicles && Array.isArray(data.vehicles)) {
        vehicles = data.vehicles;
      } else if (data.data && Array.isArray(data.data)) {
        vehicles = data.data;
      } else {
        console.error('Unexpected data format:', data);
        throw new Error('Araç verileri beklenmeyen formatta');
      }
      
      setEvVehicles(vehicles);
      
      // Unique brand listesi çıkar
      const uniqueBrands = Array.from(new Set(vehicles.map(v => v.brand))).sort();
      setBrands(uniqueBrands);
    } catch (error) {
      Alert.alert('Hata', 'Araç verileri yüklenemedi');
      console.error('Load EV data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = (brandName: string) => {
    try {
      setLoading(true);
      // Seçilen marka için modelleri filtrele
      const brandVehicles = evVehicles.filter(v => v.brand === brandName);
      const uniqueModels = Array.from(new Set(brandVehicles.map(v => v.model))).sort();
      
      setModels(uniqueModels);
      setSelectedBrand(brandName);
      setStep(2);
    } catch (error) {
      Alert.alert('Hata', 'Araç modelleri yüklenemedi');
      console.error('Load models error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = (modelName: string) => {
    try {
      setLoading(true);
      // Seçilen marka ve model için varyantları filtrele
      const modelVehicles = evVehicles.filter(
        v => v.brand === selectedBrand && v.model === modelName
      );
      
      setVariants(modelVehicles);
      setSelectedModel(modelName);
      setStep(3);
    } catch (error) {
      Alert.alert('Hata', 'Araç varyantları yüklenemedi');
      console.error('Load variants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brandName: string) => {
    loadModels(brandName);
  };

  const handleModelSelect = (modelName: string) => {
    loadVariants(modelName);
  };

  const handleVariantSelect = (variant: EVVehicle) => {
    setSelectedVariant(variant);
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!selectedVariant) return;

    try {
      setSubmitting(true);
      
      const vehicleData: CreateVehicleData = {
        variantId: selectedVariant.id,
        nickname: nickname || undefined,
        licensePlate: licensePlate || undefined,
        color: color || undefined,
        currentBatteryLevel: batteryLevel ? parseInt(batteryLevel) : undefined,
      };

      await userVehicleService.createUserVehicle(authToken, vehicleData);
      
      Alert.alert('Başarılı', 'Araç başarıyla eklendi', [
        { text: 'Tamam', onPress: () => {
          onVehicleAdded();
          onClose();
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Araç eklenirken bir hata oluştu');
      console.error('Create vehicle error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, !isDarkMode && styles.lightText]}>
            Yükleniyor...
          </Text>
        </View>
      );
    }

    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>
              Araç Markasını Seçin
            </Text>
            <ScrollView style={styles.optionsContainer}>
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand}
                  style={[styles.optionButton, !isDarkMode && styles.lightOptionButton]}
                  onPress={() => handleBrandSelect(brand)}
                >
                  <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>
                    {brand}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>
              {selectedBrand} Modelini Seçin
            </Text>
            <ScrollView style={styles.optionsContainer}>
              {models.map((model) => (
                <TouchableOpacity
                  key={model}
                  style={[styles.optionButton, !isDarkMode && styles.lightOptionButton]}
                  onPress={() => handleModelSelect(model)}
                >
                  <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>
                    {model}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>
              {selectedModel} Varyantını Seçin
            </Text>
            <ScrollView style={styles.optionsContainer}>
              {variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[styles.optionButton, !isDarkMode && styles.lightOptionButton]}
                  onPress={() => handleVariantSelect(variant)}
                >
                  <View style={styles.variantInfo}>
                    <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>
                      {variant.variant} ({variant.release_year})
                    </Text>
                    {variant.range && (
                      <Text style={[styles.variantDetail, !isDarkMode && styles.lightDetailText]}>
                        Menzil: {variant.range} km
                      </Text>
                    )}
                    {variant.usable_battery_size && (
                      <Text style={[styles.variantDetail, !isDarkMode && styles.lightDetailText]}>
                        Batarya: {variant.usable_battery_size} kWh
                      </Text>
                    )}
                    {variant.energy_consumption && (
                      <Text style={[styles.variantDetail, !isDarkMode && styles.lightDetailText]}>
                        Tüketim: {variant.energy_consumption.average_consumption} kWh/100km
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <ScrollView style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>
              Araç Detayları
            </Text>
            
            {/* Selected vehicle summary */}
            <View style={[styles.summaryCard, !isDarkMode && styles.lightSummaryCard]}>
              <Text style={[styles.summaryTitle, !isDarkMode && styles.lightText]}>
                Seçilen Araç
              </Text>
              <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                {selectedBrand} {selectedModel}
              </Text>
              <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                {selectedVariant?.variant} ({selectedVariant?.release_year})
              </Text>
              {selectedVariant?.usable_battery_size && (
                <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                  Batarya: {selectedVariant.usable_battery_size} kWh
                </Text>
              )}
              {selectedVariant?.range && (
                <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                  Menzil: {selectedVariant.range} km
                </Text>
              )}
              {selectedVariant?.ac_charger && (
                <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                  AC Şarj: {selectedVariant.ac_charger.max_power} kW
                </Text>
              )}
              {selectedVariant?.dc_charger && (
                <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                  DC Şarj: {selectedVariant.dc_charger.max_power} kW
                </Text>
              )}
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>
                  Araç Takma Adı (İsteğe Bağlı)
                </Text>
                <TextInput
                  style={[styles.textInput, !isDarkMode && styles.lightTextInput]}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Örn: Günlük Araç, Beyaz Tesla"
                  placeholderTextColor={colors.gray500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>
                  Plaka (İsteğe Bağlı)
                </Text>
                <TextInput
                  style={[styles.textInput, !isDarkMode && styles.lightTextInput]}
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  placeholder="34 ABC 123"
                  placeholderTextColor={colors.gray500}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>
                  Renk (İsteğe Bağlı)
                </Text>
                <TextInput
                  style={[styles.textInput, !isDarkMode && styles.lightTextInput]}
                  value={color}
                  onChangeText={setColor}
                  placeholder="Beyaz, Siyah, Kırmızı..."
                  placeholderTextColor={colors.gray500}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>
                  Mevcut Batarya Seviyesi (%)
                </Text>
                <TextInput
                  style={[styles.textInput, !isDarkMode && styles.lightTextInput]}
                  value={batteryLevel}
                  onChangeText={setBatteryLevel}
                  placeholder="80"
                  placeholderTextColor={colors.gray500}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, !isDarkMode && styles.lightContainer]}>
        {/* Header */}
        <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
          <View style={styles.headerLeft}>
            {step > 1 && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setStep(step - 1)}
              >
                <Ionicons name="chevron-back" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>
              Araç Ekle
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map((stepNum) => (
            <View
              key={stepNum}
              style={[
                styles.progressStep,
                stepNum <= step && styles.progressStepActive,
                !isDarkMode && stepNum <= step && styles.lightProgressStepActive,
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderStepContent()}
        </View>

        {/* Footer */}
        {step === 4 && (
          <View style={[styles.footer, !isDarkMode && styles.lightFooter]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Araç Ekle</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray900,
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  lightHeaderTitle: {
    color: colors.gray900,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray700,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  lightProgressStepActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray400,
  },
  lightText: {
    color: colors.gray700,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 24,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.gray800,
    borderRadius: 12,
    marginBottom: 12,
  },
  lightOptionButton: {
    backgroundColor: colors.gray50,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  variantInfo: {
    flex: 1,
  },
  variantDetail: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 4,
  },
  lightDetailText: {
    color: colors.gray600,
  },
  summaryCard: {
    backgroundColor: colors.gray800,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  lightSummaryCard: {
    backgroundColor: colors.gray50,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 4,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
  },
  textInput: {
    backgroundColor: colors.gray800,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  lightTextInput: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
    color: colors.gray900,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray800,
  },
  lightFooter: {
    borderTopColor: colors.gray200,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
