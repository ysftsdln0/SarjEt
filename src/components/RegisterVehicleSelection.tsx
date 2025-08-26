import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import userVehicleService, { 
  VehicleBrand, 
  VehicleModel, 
  VehicleVariant 
} from '../services/userVehicleService';

interface RegisterVehicleSelectionProps {
  onVehicleSelected: (vehicle: {
    brand: VehicleBrand;
    model: VehicleModel;
    variant: VehicleVariant;
    userCustomizations: {
      nickname?: string;
      licensePlate?: string;
      color?: string;
      currentBatteryLevel?: number;
    };
  }) => void;
  onBack: () => void;
  isDarkMode?: boolean;
}

export const RegisterVehicleSelection: React.FC<RegisterVehicleSelectionProps> = ({
  onVehicleSelected,
  onBack,
  isDarkMode = false,
}) => {
  const [step, setStep] = useState(1); // 1: Brand, 2: Model, 3: Variant, 4: Details
  const [loading, setLoading] = useState(false);

  // Data states
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);

  // Selected values
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null);
  
  // Vehicle details
  const [nickname, setNickname] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('80');

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const brandsData = await userVehicleService.getVehicleBrands();
      setBrands(brandsData);
    } catch (error) {
      Alert.alert('Hata', 'Araç markaları yüklenemedi');
      console.error('Load brands error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      setLoading(true);
      const modelsData = await userVehicleService.getVehicleModels(brandId);
      setModels(modelsData);
      setStep(2);
    } catch (error) {
      Alert.alert('Hata', 'Araç modelleri yüklenemedi');
      console.error('Load models error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (modelId: string) => {
    try {
      setLoading(true);
      const variantsData = await userVehicleService.getVehicleVariants(modelId);
      setVariants(variantsData);
      setStep(3);
    } catch (error) {
      Alert.alert('Hata', 'Araç varyantları yüklenemedi');
      console.error('Load variants error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brand: VehicleBrand) => {
    setSelectedBrand(brand);
    loadModels(brand.id);
  };

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModel(model);
    loadVariants(model.id);
  };

  const handleVariantSelect = (variant: VehicleVariant) => {
    setSelectedVariant(variant);
    setStep(4);
  };

  const handleSubmit = () => {
    if (!selectedBrand || !selectedModel || !selectedVariant) return;

    onVehicleSelected({
      brand: selectedBrand,
      model: selectedModel,
      variant: selectedVariant,
      userCustomizations: {
        nickname: nickname || undefined,
        licensePlate: licensePlate || undefined,
        color: color || undefined,
        currentBatteryLevel: batteryLevel ? parseInt(batteryLevel) : undefined,
      },
    });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
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
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>
              Hangi markanın elektrikli aracını kullanıyorsunuz?
            </Text>
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  style={[styles.optionButton, !isDarkMode && styles.lightOptionButton]}
                  onPress={() => handleBrandSelect(brand)}
                >
                  <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>
                    {brand.name}
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
              {selectedBrand?.name} Modelini Seçin
            </Text>
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>
              Hangi modeli kullanıyorsunuz?
            </Text>
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[styles.optionButton, !isDarkMode && styles.lightOptionButton]}
                  onPress={() => handleModelSelect(model)}
                >
                  <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>
                    {model.name}
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
              {selectedModel?.name} Varyantını Seçin
            </Text>
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>
              Hangi yıl ve konfigürasyonu kullanıyorsunuz?
            </Text>
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[styles.variantButton, !isDarkMode && styles.lightVariantButton]}
                  onPress={() => handleVariantSelect(variant)}
                >
                  <View style={styles.variantInfo}>
                    <Text style={[styles.variantName, !isDarkMode && styles.lightText]}>
                      {variant.name} ({variant.year})
                    </Text>
                    <View style={styles.variantSpecs}>
                      {variant.batteryCapacity && (
                        <View style={styles.specItem}>
                          <Ionicons name="battery-charging" size={14} color={colors.success} />
                          <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                            {variant.batteryCapacity} kWh
                          </Text>
                        </View>
                      )}
                      {variant.maxRange && (
                        <View style={styles.specItem}>
                          <Ionicons name="speedometer" size={14} color={colors.primary} />
                          <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                            {variant.maxRange} km
                          </Text>
                        </View>
                      )}
                      {variant.chargingSpeedDC && (
                        <View style={styles.specItem}>
                          <Ionicons name="flash" size={14} color={colors.warning} />
                          <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                            {variant.chargingSpeedDC} kW
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>
              Araç Detayları
            </Text>
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>
              Son olarak aracınızla ilgili detayları giriniz
            </Text>
            
            {/* Selected vehicle summary */}
            <View style={[styles.summaryCard, !isDarkMode && styles.lightSummaryCard]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={[styles.summaryTitle, !isDarkMode && styles.lightText]}>
                  Seçilen Araç
                </Text>
              </View>
              <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                {selectedBrand?.name} {selectedModel?.name}
              </Text>
              <Text style={[styles.summaryText, !isDarkMode && styles.lightDetailText]}>
                {selectedVariant?.name} ({selectedVariant?.year})
              </Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>
                  🚗 Araç Takma Adı (İsteğe Bağlı)
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
                  📋 Plaka (İsteğe Bağlı)
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
                  🎨 Renk (İsteğe Bağlı)
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
                  🔋 Mevcut Batarya Seviyesi (%)
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
    <SafeAreaView style={[styles.container, !isDarkMode && styles.lightContainer]}>
      {/* Header */}
      <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>
          Araç Bilgileri
        </Text>
        <View style={styles.placeholder} />
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
            style={styles.completeButton}
            onPress={handleSubmit}
          >
            <Text style={styles.completeButtonText}>Kaydı Tamamla</Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  lightHeaderTitle: {
    color: colors.gray900,
  },
  placeholder: {
    width: 32,
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
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: colors.gray400,
    marginBottom: 24,
    lineHeight: 22,
  },
  lightSubtitle: {
    color: colors.gray600,
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
  variantButton: {
    backgroundColor: colors.gray800,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightVariantButton: {
    backgroundColor: colors.gray50,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  variantSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 12,
    color: colors.gray300,
  },
  lightSpecText: {
    color: colors.gray700,
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  summaryText: {
    fontSize: 14,
    color: colors.gray400,
    marginBottom: 4,
  },
  lightDetailText: {
    color: colors.gray600,
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
  completeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  completeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
