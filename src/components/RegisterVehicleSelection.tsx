import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import userVehicleService, {
  VehicleBrand,
  VehicleModel,
  VehicleVariant,
} from '../services/userVehicleService';
import { getBaseUrl } from '../services/apiClient';

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

type EVCharger = { max_power?: number; ports?: string[] };
interface EVNormalized {
  id: string | number;
  brand: string;
  model: string;
  variant?: string;
  year?: number;
  batteryCapacity?: number;
  usable_battery_size?: number;
  range?: number;
  consumption?: number;
  acCharger?: EVCharger;
  dcCharger?: EVCharger;
  ac_charger?: EVCharger;
  dc_charger?: EVCharger;
  connectorTypes?: string[];
}

export const RegisterVehicleSelection: React.FC<RegisterVehicleSelectionProps> = ({
  onVehicleSelected,
  onBack,
  isDarkMode = false,
}) => {
  // helpers
  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const getACkW = (v: VehicleVariant & { maxACCharging?: number; chargingSpeedAC?: number }): number | undefined =>
    v.maxACCharging ?? v.chargingSpeedAC;
  const getDCkW = (v: VehicleVariant & { maxDCCharging?: number; chargingSpeedDC?: number }): number | undefined =>
    v.maxDCCharging ?? v.chargingSpeedDC;

  // step + loading
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // data states
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);
  const [evVehicles, setEvVehicles] = useState<EVNormalized[] | null>(null);
  const [brandSource, setBrandSource] = useState<'db' | 'ev'>('db');
  const [modelSource, setModelSource] = useState<'db' | 'ev'>('db');

  // selections
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null);

  // details
  const [nickname, setNickname] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [batteryLevel, setBatteryLevel] = useState('80');

  useEffect(() => {
    loadBrands();
  }, []);

  const fetchEVVehiclesOnce = async (): Promise<EVNormalized[]> => {
    if (evVehicles && Array.isArray(evVehicles) && evVehicles.length > 0) {
      console.log('📦 Using cached EV vehicles:', evVehicles.length);
      return evVehicles;
    }
    try {
      console.log('🌐 Fetching EV vehicles from API...');
      const base = await getBaseUrl();
      console.log('🔗 Base URL:', base);
      
      if (!base) {
        console.error('❌ No base URL configured');
        return [];
      }
      
      const url = `${base}/api/vehicles/ev-data`;
      console.log('🌐 EV data URL:', url);
      
      // 10 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const res = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      clearTimeout(timeoutId);
      
      console.log('📊 EV data response status:', res.status, res.statusText);
      
      if (!res.ok) {
        console.error('❌ EV data fetch failed:', res.status, res.statusText);
        // 500 hatası alıyorsa, ev-brands endpoint'ini dene
        if (res.status === 500) {
          try {
            console.log('🔄 Trying ev-brands endpoint as fallback...');
            const brandsRes = await fetch(`${base}/api/vehicles/ev-brands`);
            if (brandsRes.ok) {
              console.log('✅ ev-brands endpoint works, but ev-data has issues');
            } else {
              console.log('❌ ev-brands also failed:', brandsRes.status);
            }
          } catch (fallbackError) {
            console.log('❌ Fallback test failed:', fallbackError);
          }
        }
        return [];
      }
      
      const data: unknown = await res.json();
      const arr: EVNormalized[] = Array.isArray(data) ? (data as EVNormalized[]) : [];
      console.log('✅ EV vehicles fetched:', arr.length);
      setEvVehicles(arr);
      return arr;
    } catch (error) {
      console.error('❌ EV vehicles fetch error:', error);
      // Network veya server hatası durumunda boş array döndür
      return [];
    }
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      // DB first
      try {
        const dbBrands = await userVehicleService.getVehicleBrands();
        if (dbBrands.length > 0) {
          setBrands(dbBrands);
          setBrandSource('db');
          return;
        }
      } catch {
        // continue to EV fallback
      }

      // EV brands endpoint
      try {
        const base = await getBaseUrl();
        const res = await fetch(`${base}/api/vehicles/ev-brands`);
        if (res.ok) {
          const list: unknown = await res.json();
          const names: string[] = Array.isArray(list) ? (list as string[]) : [];
          if (names.length > 0) {
            const evBrands: VehicleBrand[] = names.map((name) => ({ id: `ev:${slugify(name)}`, name }));
            setBrands(evBrands);
            setBrandSource('ev');
            return;
          }
        }
      } catch {
        // continue to compute from ev-data
      }

      // Compute from ev-data
      const evs = await fetchEVVehiclesOnce();
      const brandNames = [...new Set(evs.map((v) => v.brand))].filter(Boolean) as string[];
      if (brandNames.length > 0) {
        const evBrands: VehicleBrand[] = brandNames.map((name) => ({ id: `ev:${slugify(name)}`, name }));
        setBrands(evBrands);
        setBrandSource('ev');
        return;
      }

      Alert.alert('Hata', 'Araç markaları yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const loadModelsForBrand = async (brand: VehicleBrand) => {
    try {
      setLoading(true);
      if (brandSource === 'db' && !brand.id.startsWith('ev:')) {
        const modelsData = await userVehicleService.getVehicleModels(brand.id);
        setModels(modelsData);
        setModelSource('db');
        setStep(2);
        return;
      }

      const evs = await fetchEVVehiclesOnce();
      const modelNames = [...new Set(
        evs.filter((v) => v.brand === brand.name).map((v) => v.model)
      )].filter(Boolean) as string[];
      const evModels: VehicleModel[] = modelNames.map((name) => ({
        id: `ev:${slugify(brand.name)}:${slugify(name)}`,
        name,
        brandId: brand.id,
        brand,
      }));
      setModels(evModels);
      setModelSource('ev');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (modelId: string, modelParam?: VehicleModel) => {
    try {
      setLoading(true);
      
      // Parametre olarak gelen model'i kullan veya state'den al
      const currentModel = modelParam || selectedModel;
      
      console.log('🔄 Loading variants for model:', modelId, 'Source:', modelSource);
      console.log('📊 Models:', {
        selectedBrand: selectedBrand?.name,
        parameterModel: modelParam?.name,
        stateModel: selectedModel?.name,
        currentModel: currentModel?.name
      });
      
      if (modelSource === 'ev' && selectedBrand && currentModel) {
        console.log('💡 Using EV data source for variants');
        const evs = await fetchEVVehiclesOnce();
        console.log('📦 EV vehicles fetched:', evs.length);
        const filtered = evs.filter(
          (v) => v.brand === selectedBrand.name && v.model === currentModel.name
        );
        console.log('🔍 Filtered variants:', filtered.length);
        const mapped: VehicleVariant[] = filtered.map((v) => ({
          id: String(v.id),
          name: v.variant || currentModel.name,
          year: Number(v.year || new Date().getFullYear()),
          modelId,
          batteryCapacity: v.batteryCapacity ?? v.usable_battery_size ?? undefined,
          maxRange: v.range ?? undefined,
          efficiency: v.consumption ?? undefined,
          chargingSpeedAC: v.acCharger?.max_power ?? v.ac_charger?.max_power ?? undefined,
          chargingSpeedDC: v.dcCharger?.max_power ?? v.dc_charger?.max_power ?? undefined,
          connectorTypes: v.connectorTypes || v.acCharger?.ports || v.dcCharger?.ports || undefined,
        }));
        setVariants(mapped);
        setStep(3);
        return;
      }

      // DB first
      console.log('🏦 Trying database first for variants');
      let variantsData: VehicleVariant[] = [];
      let dbFailed = false;
      
      try {
        variantsData = await userVehicleService.getVehicleVariants(modelId);
        console.log('📊 DB variants loaded:', variantsData.length);
      } catch (dbError: unknown) {
        console.error('❌ DB variants error:', dbError);
        const dbMessage = dbError instanceof Error ? dbError.message : String(dbError);
        console.log('⚠️ DB error details:', dbMessage);
        dbFailed = true;
      }
      
      // EV fallback - hem DB boş dönerse hem de hata alırsa
      if (dbFailed || !variantsData || variantsData.length === 0) {
        console.log('🔄 Falling back to EV data for variants');
        if (selectedBrand && currentModel) {
          try {
            const evs = await fetchEVVehiclesOnce();
            console.log('📦 EV fallback - vehicles fetched:', evs.length);
            
            if (evs.length > 0) {
              const filtered = evs.filter(
                (v) => v.brand === selectedBrand.name && v.model === currentModel.name
              );
              console.log('🔍 EV fallback - filtered variants:', filtered.length);
              variantsData = filtered.map((v) => ({
                id: String(v.id),
                name: v.variant || currentModel.name,
                year: Number(v.year || new Date().getFullYear()),
                modelId,
                batteryCapacity: v.batteryCapacity ?? v.usable_battery_size ?? undefined,
                maxRange: v.range ?? undefined,
                efficiency: v.consumption ?? undefined,
                chargingSpeedAC: v.acCharger?.max_power ?? v.ac_charger?.max_power ?? undefined,
                chargingSpeedDC: v.dcCharger?.max_power ?? v.dc_charger?.max_power ?? undefined,
                connectorTypes: v.connectorTypes || v.acCharger?.ports || v.dcCharger?.ports || undefined,
              }));
            } else {
              console.log('⚠️ No EV data available for fallback');
            }
          } catch (evError: unknown) {
            console.error('❌ EV fallback error:', evError);
            const evMessage = evError instanceof Error ? evError.message : String(evError);
            console.log('⚠️ EV fallback error details:', evMessage);
          }
        }
      }
      
      console.log('✅ Final variants count:', variantsData.length);
      setVariants(variantsData);
      setStep(3);
      
      // Backend erişilemiyor ve EV data da yoksa kullanıcıya bilgi ver
      if (dbFailed && variantsData.length === 0) {
        Alert.alert(
          'Bağlantı Sorunu', 
          'Sunucuya erişilemiyor. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.'
        );
      }
    } catch (error: unknown) {
      console.error('❌ Load variants general error:', error);
      const message = error instanceof Error ? error.message : String(error);
      console.log('⚠️ General error details:', message);
      Alert.alert('Hata', 'Araç varyantları yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brand: VehicleBrand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setSelectedVariant(null);
    loadModelsForBrand(brand);
  };

  const handleModelSelect = (model: VehicleModel) => {
    console.log('📝 Model selected:', model.name, 'ID:', model.id);
    setSelectedModel(model);
    setSelectedVariant(null);
    loadVariants(model.id, model); // Model'i parametre olarak geç
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
        currentBatteryLevel: batteryLevel ? parseInt(batteryLevel, 10) : undefined,
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
          <Text style={[styles.loadingText, !isDarkMode && styles.lightText]}>Yükleniyor...</Text>
        </View>
      );
    }

    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>Araç Markasını Seçin</Text>
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
                  <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>{brand.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>{selectedBrand?.name} Modelini Seçin</Text>
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>Hangi modeli kullanıyorsunuz?</Text>
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {models.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  style={[styles.optionButton, !isDarkMode && styles.lightOptionButton]}
                  onPress={() => handleModelSelect(model)}
                >
                  <Text style={[styles.optionText, !isDarkMode && styles.lightText]}>{model.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>{selectedModel?.name} Varyantını Seçin</Text>
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>Hangi yıl ve konfigürasyonu kullanıyorsunuz?</Text>
            <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
              {variants.length === 0 ? (
                <Text style={[styles.loadingText, !isDarkMode && styles.lightText]}>Bu model için varyant bulunamadı.</Text>
              ) : (
                variants.map((variant) => (
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
                            <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>{variant.batteryCapacity} kWh</Text>
                          </View>
                        )}
                        {variant.maxRange && (
                          <View style={styles.specItem}>
                            <Ionicons name="speedometer" size={14} color={colors.primary} />
                            <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>{variant.maxRange} km</Text>
                          </View>
                        )}
                        {getDCkW(variant as VehicleVariant & { maxDCCharging?: number; chargingSpeedDC?: number }) ? (
                          <View style={styles.specItem}>
                            <Ionicons name="flash" size={14} color={colors.warning} />
                            <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                              {getDCkW(variant as VehicleVariant & { maxDCCharging?: number; chargingSpeedDC?: number })} kW DC
                            </Text>
                          </View>
                        ) : null}
                        {getACkW(variant as VehicleVariant & { maxACCharging?: number; chargingSpeedAC?: number }) ? (
                          <View style={styles.specItem}>
                            <Ionicons name="battery-charging" size={14} color={colors.success} />
                            <Text style={[styles.specText, !isDarkMode && styles.lightSpecText]}>
                              {getACkW(variant as VehicleVariant & { maxACCharging?: number; chargingSpeedAC?: number })} kW AC
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        );
      case 4:
        return (
          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            <Text style={[styles.stepTitle, !isDarkMode && styles.lightText]}>Araç Detayları</Text>
            <Text style={[styles.stepSubtitle, !isDarkMode && styles.lightSubtitle]}>Son olarak aracınızla ilgili detayları giriniz</Text>
            <View style={[styles.summaryCard, !isDarkMode && styles.lightSummaryCard]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={[styles.summaryTitle, !isDarkMode && styles.lightText]}>Seçilen Araç</Text>
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
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>🚗 Araç Takma Adı (İsteğe Bağlı)</Text>
                <TextInput
                  style={[styles.textInput, !isDarkMode && styles.lightTextInput]}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Örn: Günlük Araç, Beyaz Tesla"
                  placeholderTextColor={colors.gray500}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>📋 Plaka (İsteğe Bağlı)</Text>
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
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>🎨 Renk (İsteğe Bağlı)</Text>
                <TextInput
                  style={[styles.textInput, !isDarkMode && styles.lightTextInput]}
                  value={color}
                  onChangeText={setColor}
                  placeholder="Beyaz, Siyah, Kırmızı..."
                  placeholderTextColor={colors.gray500}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, !isDarkMode && styles.lightText]}>🔋 Mevcut Batarya Seviyesi (%)</Text>
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
      <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, !isDarkMode && styles.lightHeaderTitle]}>Araç Bilgileri</Text>
        <View style={styles.placeholder} />
      </View>
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
      <View style={styles.content}>{renderStepContent()}</View>
      {step === 4 && (
        <View style={[styles.footer, !isDarkMode && styles.lightFooter]}>
          <TouchableOpacity style={styles.completeButton} onPress={handleSubmit}>
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
