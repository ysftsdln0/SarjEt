import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface VehicleBrand {
  id: string;
  name: string;
  country: string;
  logo: string;
  website: string;
}

interface VehicleModel {
  id: string;
  name: string;
  category: string;
  bodyType: string;
  startYear: number;
  endYear?: number;
}

interface VehicleVariant {
  id: string;
  name: string;
  year: number;
  batteryCapacity: number;
  maxRange: number;
  power: number;
  efficiency: number;
  maxDCCharging: number;
  chargingPort: string;
  basePrice?: number;
  currency?: string;
}

interface VehicleSelectionProps {
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
  onClose: () => void;
}

const VehicleSelection: React.FC<VehicleSelectionProps> = ({
  onVehicleSelected,
  onClose
}) => {
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrand | null>(null);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VehicleVariant | null>(null);
  
  // Kullanıcı özelleştirmeleri
  const [nickname, setNickname] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [color, setColor] = useState('');
  const [currentBatteryLevel, setCurrentBatteryLevel] = useState(100);
  
  // Mock data (gerçek uygulamada API'den gelecek)
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [variants, setVariants] = useState<VehicleVariant[]>([]);

  useEffect(() => {
    // Mock veri yükleme
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Gerçek uygulamada bu veriler API'den gelecek
    const mockBrands: VehicleBrand[] = [
      {
        id: '1',
        name: 'Tesla',
        country: 'USA',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png',
        website: 'https://www.tesla.com'
      },
      {
        id: '2',
        name: 'BMW',
        country: 'Germany',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
        website: 'https://www.bmw.com.tr'
      },
      {
        id: '3',
        name: 'Mercedes-Benz',
        country: 'Germany',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
        website: 'https://www.mercedes-benz.com.tr'
      },
      {
        id: '4',
        name: 'Audi',
        country: 'Germany',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
        website: 'https://www.audi.com.tr'
      },
      {
        id: '5',
        name: 'Volkswagen',
        country: 'Germany',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Volkswagen_logo_2019.svg',
        website: 'https://www.volkswagen.com.tr'
      }
    ];
    
    setBrands(mockBrands);
  };

  const handleBrandSelect = (brand: VehicleBrand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setSelectedVariant(null);
    
    // Marka seçimine göre modelleri yükle
    loadModelsForBrand(brand.id);
  };

  const loadModelsForBrand = (brandId: string) => {
    // Mock model verisi
    const mockModels: VehicleModel[] = [];
    
    if (brandId === '1') { // Tesla
      mockModels.push(
        { id: '1', name: 'Model 3', category: 'Sedan', bodyType: '4 kapı', startYear: 2017 },
        { id: '2', name: 'Model Y', category: 'SUV', bodyType: '5 kapı', startYear: 2020 }
      );
    } else if (brandId === '2') { // BMW
      mockModels.push(
        { id: '3', name: 'iX', category: 'SUV', bodyType: '5 kapı', startYear: 2021 },
        { id: '4', name: 'i4', category: 'Sedan', bodyType: '4 kapı', startYear: 2021 }
      );
    } else if (brandId === '3') { // Mercedes
      mockModels.push(
        { id: '5', name: 'EQS', category: 'Sedan', bodyType: '4 kapı', startYear: 2021 },
        { id: '6', name: 'EQE', category: 'Sedan', bodyType: '4 kapı', startYear: 2022 }
      );
    }
    
    setModels(mockModels);
  };

  const handleModelSelect = (model: VehicleModel) => {
    setSelectedModel(model);
    setSelectedVariant(null);
    
    // Model seçimine göre varyantları yükle
    loadVariantsForModel(model.id);
  };

  const loadVariantsForModel = (modelId: string) => {
    // Mock varyant verisi
    const mockVariants: VehicleVariant[] = [];
    
    if (modelId === '1') { // Model 3
      mockVariants.push(
        {
          id: '1',
          name: 'Standard Range',
          year: 2024,
          batteryCapacity: 60,
          maxRange: 409,
          power: 175,
          efficiency: 15.6,
          maxDCCharging: 170,
          chargingPort: 'Tesla Supercharger + Type 2',
          basePrice: 1250000,
          currency: 'TL'
        },
        {
          id: '2',
          name: 'Long Range',
          year: 2024,
          batteryCapacity: 82,
          maxRange: 576,
          power: 324,
          efficiency: 15.6,
          maxDCCharging: 250,
          chargingPort: 'Tesla Supercharger + Type 2',
          basePrice: 1450000,
          currency: 'TL'
        }
      );
    } else if (modelId === '2') { // Model Y
      mockVariants.push(
        {
          id: '3',
          name: 'Standard Range',
          year: 2024,
          batteryCapacity: 60,
          maxRange: 394,
          power: 175,
          efficiency: 16.1,
          maxDCCharging: 170,
          chargingPort: 'Tesla Supercharger + Type 2',
          basePrice: 1350000,
          currency: 'TL'
        }
      );
    }
    
    setVariants(mockVariants);
  };

  const handleVariantSelect = (variant: VehicleVariant) => {
    setSelectedVariant(variant);
  };

  const handleConfirmSelection = () => {
    console.log('🚀 handleConfirmSelection called');
    console.log('📊 Current selections:', {
      selectedBrand: selectedBrand?.name,
      selectedModel: selectedModel?.name,
      selectedVariant: selectedVariant?.name
    });
    
    if (!selectedBrand || !selectedModel || !selectedVariant) {
      console.log('❌ Missing selections, showing alert');
      Alert.alert('Hata', 'Lütfen marka, model ve varyant seçiniz.');
      return;
    }

    const vehicleData = {
      brand: selectedBrand,
      model: selectedModel,
      variant: selectedVariant,
      userCustomizations: {
        nickname: nickname || undefined,
        licensePlate: licensePlate || undefined,
        color: color || undefined,
        currentBatteryLevel: currentBatteryLevel
      }
    };

    console.log('✅ Vehicle data prepared:', vehicleData);
    console.log('📞 Calling onVehicleSelected callback...');
    
    try {
      onVehicleSelected(vehicleData);
      console.log('✅ onVehicleSelected called successfully');
    } catch (error) {
      console.error('❌ Error calling onVehicleSelected:', error);
    }
  };

  const renderBrands = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Marka Seçin</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {brands.map((brand) => (
          <TouchableOpacity
            key={brand.id}
            style={[
              styles.brandCard,
              selectedBrand?.id === brand.id && styles.selectedCard
            ]}
            onPress={() => handleBrandSelect(brand)}
          >
            <Image
              source={{ uri: brand.logo }}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>{brand.name}</Text>
            <Text style={styles.brandCountry}>{brand.country}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderModels = () => {
    if (!selectedBrand || models.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Model Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {models.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={[
                styles.modelCard,
                selectedModel?.id === model.id && styles.selectedCard
              ]}
              onPress={() => handleModelSelect(model)}
            >
              <Text style={styles.modelName}>{model.name}</Text>
              <Text style={styles.modelCategory}>{model.category}</Text>
              <Text style={styles.modelBodyType}>{model.bodyType}</Text>
              <Text style={styles.modelYear}>{model.startYear}-{model.endYear || 'Güncel'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderVariants = () => {
    if (!selectedModel || variants.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Varyant Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {variants.map((variant) => (
            <TouchableOpacity
              key={variant.id}
              style={[
                styles.variantCard,
                selectedVariant?.id === variant.id && styles.selectedCard
              ]}
              onPress={() => handleVariantSelect(variant)}
            >
              <Text style={styles.variantName}>{variant.name}</Text>
              <Text style={styles.variantYear}>{variant.year}</Text>
              <Text style={styles.variantSpecs}>
                {variant.batteryCapacity} kWh • {variant.maxRange} km
              </Text>
              <Text style={styles.variantPower}>{variant.power} kW</Text>
              {variant.basePrice && (
                <Text style={styles.variantPrice}>
                  {variant.basePrice.toLocaleString('tr-TR')} {variant.currency}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCustomizations = () => {
    if (!selectedVariant) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Araç Özelleştirmeleri</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Takma Ad (Opsiyonel)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Örn: Kırmızı Şeytan"
            value={nickname}
            onChangeText={setNickname}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Plaka</Text>
          <TextInput
            style={styles.textInput}
            placeholder="34 ABC 123"
            value={licensePlate}
            onChangeText={setLicensePlate}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Renk</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Örn: Kırmızı"
            value={color}
            onChangeText={setColor}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Mevcut Şarj Seviyesi: {currentBatteryLevel}%</Text>
          <View style={styles.batterySlider}>
            <TouchableOpacity
              style={styles.batteryButton}
              onPress={() => setCurrentBatteryLevel(Math.max(0, currentBatteryLevel - 10))}
            >
              <Ionicons name="remove" size={20} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.batteryBar}>
              <View 
                style={[
                  styles.batteryFill, 
                  { width: `${currentBatteryLevel}%` }
                ]} 
              />
            </View>
            <TouchableOpacity
              style={styles.batteryButton}
              onPress={() => setCurrentBatteryLevel(Math.min(100, currentBatteryLevel + 10))}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderVehicleSummary = () => {
    if (!selectedBrand || !selectedModel || !selectedVariant) return null;

    console.log('🎯 renderVehicleSummary: All selections are ready');

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Seçilen Araç</Text>
        <View style={styles.summaryContent}>
          <Image
            source={{ uri: selectedBrand.logo }}
            style={styles.summaryLogo}
            resizeMode="contain"
          />
          <View style={styles.summaryDetails}>
            <Text style={styles.summaryBrand}>{selectedBrand.name}</Text>
            <Text style={styles.summaryModel}>{selectedModel.name}</Text>
            <Text style={styles.summaryVariant}>{selectedVariant.name} ({selectedVariant.year})</Text>
            <Text style={styles.summarySpecs}>
              {selectedVariant.batteryCapacity} kWh • {selectedVariant.maxRange} km • {selectedVariant.power} kW
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            console.log('🔘 Confirm button pressed');
            handleConfirmSelection();
          }}
        >
          <Text style={styles.confirmButtonText}>Aracı Onayla</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Araç Seçimi</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.gray600} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderBrands()}
        {renderModels()}
        {renderVariants()}
        {renderCustomizations()}
        {renderVehicleSummary()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  batteryBar: {
    backgroundColor: colors.gray200,
    borderRadius: 4,
    flex: 1,
    height: 8,
    overflow: 'hidden',
  },
  batteryButton: {
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  batteryFill: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: '100%',
  },
  batterySlider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  brandCard: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderColor: colors.transparent,
    borderRadius: 16,
    borderWidth: 2,
    height: 140,
    justifyContent: 'center',
    marginRight: 16,
    padding: 16,
    width: 120,
  },
  brandCountry: {
    color: colors.gray600,
    fontSize: 12,
    textAlign: 'center',
  },
  brandLogo: {
    height: 40,
    marginBottom: 12,
    width: 60,
  },
  brandName: {
    color: colors.gray900,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  confirmButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.gray800,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modelBodyType: {
    color: colors.gray600,
    fontSize: 12,
    marginBottom: 4,
  },
  modelCard: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderColor: colors.transparent,
    borderRadius: 16,
    borderWidth: 2,
    height: 120,
    justifyContent: 'center',
    marginRight: 16,
    padding: 16,
    width: 140,
  },
  modelCategory: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  modelName: {
    color: colors.gray900,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modelYear: {
    color: colors.gray500,
    fontSize: 12,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    color: colors.gray900,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectedCard: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  summaryBrand: {
    color: colors.gray900,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryCard: {
    backgroundColor: colors.gray50,
    borderColor: colors.gray200,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 20,
    padding: 20,
  },
  summaryContent: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
  },
  summaryDetails: {
    flex: 1,
  },
  summaryLogo: {
    height: 40,
    marginRight: 16,
    width: 60,
  },
  summaryModel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  summarySpecs: {
    color: colors.gray600,
    fontSize: 12,
  },
  summaryTitle: {
    color: colors.gray900,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryVariant: {
    color: colors.gray700,
    fontSize: 14,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: colors.white,
    borderColor: colors.gray300,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: colors.gray900,
    fontSize: 24,
    fontWeight: '700',
  },
  variantCard: {
    alignItems: 'center',
    backgroundColor: colors.gray50,
    borderColor: colors.transparent,
    borderRadius: 16,
    borderWidth: 2,
    height: 140,
    justifyContent: 'center',
    marginRight: 16,
    padding: 16,
    width: 160,
  },
  variantName: {
    color: colors.gray900,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  variantPower: {
    color: colors.gray800,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  variantPrice: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  variantSpecs: {
    color: colors.gray700,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  variantYear: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
});

export default VehicleSelection; 