import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { post } from '../services/apiClient';
import VehicleSelection from '../components/VehicleSelection';

const { width, height } = Dimensions.get('window');

interface RegisterScreenProps {
  onRegisterSuccess: (token: string, user: any) => void;
  onSwitchToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onRegisterSuccess,
  onSwitchToLogin
}) => {
  const [step, setStep] = useState<'form' | 'vehicle'>('form');
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Vehicle state
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const handleNextStep = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setStep('vehicle');
  };

  const handleVehicleSelected = (vehicle: any) => {
    console.log('🚗 Vehicle selected in RegisterScreen:', vehicle);
    setSelectedVehicle(vehicle);
    console.log('✅ selectedVehicle state updated');
  };

  const handleRegister = async () => {
    if (!selectedVehicle) {
      Alert.alert('Hata', 'Lütfen bir araç seçiniz.');
      return;
    }

    setLoading(true);
    console.log('🚀 Starting registration process...');
    console.log('📝 Form data:', { name, email, phone, password: '***' });
    console.log('🚗 Selected vehicle:', selectedVehicle);

    try {
      const requestBody = {
        name,
        email: email.toLowerCase(),
        phone,
        password,
        vehicle: {
          variantId: selectedVehicle.variant.id,
          nickname: selectedVehicle.userCustomizations.nickname,
          licensePlate: selectedVehicle.userCustomizations.licensePlate,
          color: selectedVehicle.userCustomizations.color,
          currentBatteryLevel: selectedVehicle.userCustomizations.currentBatteryLevel
        }
      };

      console.log('📤 Sending request to backend:', requestBody);
      const response = await post('/api/auth/register', requestBody);

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      const data = await response.json();
      console.log('📄 Response data:', data);

      if (response.ok) {
        console.log('✅ Registration successful!');
        onRegisterSuccess(data.token, data.user);
      } else {
        console.error('❌ Registration failed:', data);
        Alert.alert('Kayıt Hatası', data.error || 'Kayıt işlemi başarısız');
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormStep = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>Hesap Oluştur</Text>
      <Text style={styles.subtitle}>Elektrikli araç deneyiminizi kişiselleştirin</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Ad Soyad *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Adınız ve soyadınız"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Telefon (Opsiyonel)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="+90 5XX XXX XX XX"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Şifre *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="En az 6 karakter"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.gray500}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Şifre Tekrar *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Şifrenizi tekrar girin"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.gray500}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNextStep}
        disabled={loading}
      >
        <Text style={styles.nextButtonText}>Devam Et</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={onSwitchToLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>Zaten hesabım var</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVehicleStep = () => (
    <View style={styles.vehicleContainer}>
      <View style={styles.vehicleHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('form')}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray600} />
        </TouchableOpacity>
        <Text style={styles.vehicleTitle}>Araç Seçimi</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <Text style={styles.vehicleSubtitle}>
        Rota planlama için araç bilgilerinizi seçin
      </Text>

      <VehicleSelection
        onVehicleSelected={handleVehicleSelected}
        onClose={() => setStep('form')}
      />

      {selectedVehicle && (
        <View style={styles.selectedVehicleCard}>
          <Text style={styles.selectedVehicleTitle}>Seçilen Araç:</Text>
          <Text style={styles.selectedVehicleInfo}>
            {selectedVehicle.brand.name} {selectedVehicle.model.name} {selectedVehicle.variant.name}
          </Text>
          <Text style={styles.selectedVehicleSpecs}>
            {selectedVehicle.variant.batteryCapacity} kWh • {selectedVehicle.variant.maxRange} km
          </Text>
          
          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.registerButtonText}>Kayıt Yapılıyor...</Text>
            ) : (
              <Text style={styles.registerButtonText}>Hesabı Oluştur</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'form' ? (
          <>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="flash" size={60} color={colors.primary} />
                <Text style={styles.appName}>SarjEt</Text>
                <Text style={styles.tagline}>Elektrikli Araç Şarj İstasyonları</Text>
              </View>
            </View>
            {renderFormStep()}
          </>
        ) : (
          renderVehicleStep()
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.1,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray900,
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.gray900,
  },
  passwordToggle: {
    padding: 16,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 8,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    alignItems: 'center',
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
  },
  vehicleSubtitle: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 24,
  },
  selectedVehicleCard: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  selectedVehicleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 8,
  },
  selectedVehicleInfo: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  selectedVehicleSpecs: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RegisterScreen; 