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
      
      // MVP için sadece Tesla markalı araçları filtrele
      const teslaVehicles = vehicles.filter(v => v.brand.toLowerCase() === 'tesla');
      setEvVehicles(teslaVehicles);
      
      // Unique brand listesi çıkar (sadece Tesla)
      const uniqueBrands = Array.from(new Set(teslaVehicles.map(v => v.brand))).sort();
      setBrands(uniqueBrands.length > 0 ? uniqueBrands : ['Tesla']); // Fallback olarak Tesla ekle
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

      await userVehicleService.addUserVehicle(selectedVariant.id, nickname, authToken);
      
      Alert.alert('Başarılı', 'Araç başarıyla eklendi', [
        { text: 'Tamam', onPress: () => {
          onVehicleAdded();
          onClose();
        }}
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Araç eklenirken bir hata oluştu';
      Alert.alert('Hata', errorMessage);
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
  backButton: {
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  container: {
    backgroundColor: colors.gray900,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  footer: {
    borderTopColor: colors.gray800,
    borderTopWidth: 1,
    padding: 20,
  },
  formContainer: {
    gap: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray800,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  lightDetailText: {
    color: colors.gray600,
  },
  lightFooter: {
    borderTopColor: colors.gray200,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  lightHeaderTitle: {
    color: colors.gray900,
  },
  lightOptionButton: {
    backgroundColor: colors.gray50,
  },
  lightProgressStepActive: {
    backgroundColor: colors.primary,
  },
  lightSummaryCard: {
    backgroundColor: colors.gray50,
  },
  lightText: {
    color: colors.gray700,
  },
  lightTextInput: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
    color: colors.gray900,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.gray400,
    fontSize: 16,
    marginTop: 16,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: colors.gray800,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 16,
  },
  optionText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  optionsContainer: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressStep: {
    backgroundColor: colors.gray700,
    borderRadius: 2,
    flex: 1,
    height: 4,
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: colors.gray800,
    borderRadius: 12,
    marginBottom: 24,
    padding: 16,
  },
  summaryText: {
    color: colors.gray400,
    fontSize: 14,
    marginBottom: 4,
  },
  summaryTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.gray800,
    borderColor: colors.gray700,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    padding: 16,
  },
  variantDetail: {
    color: colors.gray400,
    fontSize: 14,
    marginTop: 4,
  },
  variantInfo: {
    flex: 1,
  },
});
