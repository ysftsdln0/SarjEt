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
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, User } from '../types';

const { height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
type LoginScreenRouteProp = RouteProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
  onLoginSuccess: (token: string, user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  navigation,
  onLoginSuccess
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen email ve şifre giriniz.');
      return;
    }

    setLoading(true);

    try {
      const response = await post('/api/auth/login', {
        email: email.toLowerCase(),
        password,
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.token, data.user);
      } else {
        Alert.alert('Giriş Hatası', data.error || 'Giriş yapılamadı');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

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
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="flash" size={60} color={colors.primary} />
            <Text style={styles.appName}>SarjEt</Text>
            <Text style={styles.tagline}>Elektrikli Araç Şarj İstasyonları</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
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
            <Text style={styles.inputLabel}>Şifre</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Şifrenizi girin"
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

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.loginButtonText}>Giriş Yapılıyor...</Text>
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => Alert.alert('Bilgi', 'Şifre sıfırlama özelliği yakında eklenecek.')}
          >
            <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Giriş yaparak{' '}
            <Text style={styles.footerLink}>Kullanım Şartları</Text>
            {' '}ve{' '}
            <Text style={styles.footerLink}>Gizlilik Politikası</Text>
            'nı kabul etmiş olursunuz.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  appName: {
    color: colors.gray900,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 16,
  },
  container: {
    backgroundColor: colors.white,
    flex: 1,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  dividerLine: {
    backgroundColor: colors.gray300,
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: colors.gray500,
    fontSize: 14,
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  footerText: {
    color: colors.gray500,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: height * 0.1,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.gray300,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  inputLabel: {
    color: colors.gray800,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
    paddingVertical: 16,
  },
  loginButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  logoContainer: {
    alignItems: 'center',
  },
  passwordToggle: {
    padding: 16,
  },
  registerButton: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 16,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  subtitle: {
    color: colors.gray600,
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  tagline: {
    color: colors.gray600,
    fontSize: 16,
    textAlign: 'center',
  },
  textInput: {
    color: colors.gray900,
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  title: {
    color: colors.gray900,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default LoginScreen; 