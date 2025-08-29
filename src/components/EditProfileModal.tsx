import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSave: (userData: { name: string; email: string; phone: string }) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  isDarkMode,
  user,
  onSave,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isValidEmail = (email: string): boolean => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const handleSave = async () => {
    if (name.trim() === '') {
      Alert.alert('Hata', 'Ad alanı boş olamaz.');
      return;
    }

    if (email.trim() === '' || !isValidEmail(email)) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi giriniz.');
      return;
    }

    try {
      setIsLoading(true);
      await onSave({ name, email, phone });
      onClose();
    } catch (err) {
      console.error('Profile save error:', err);
      Alert.alert('Hata', 'Profil kaydedilemedi. Tekrar deneyin.');
    } finally {
      setIsLoading(false);
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
        <View style={[styles.header, !isDarkMode && styles.lightHeader]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? colors.white : colors.black} />
          </TouchableOpacity>
          <Text style={[styles.title, !isDarkMode && styles.lightTitle]}>
            Profili Düzenle
          </Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={isLoading}
          >
            <Text style={[styles.saveButtonText, isLoading && styles.disabledText]}>
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Kişisel Bilgiler */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
              Kişisel Bilgiler
            </Text>
            
            <View style={[styles.inputContainer, !isDarkMode && styles.lightInputContainer]}>
              <Text style={[styles.label, !isDarkMode && styles.lightLabel]}>İsim ve Soyisim</Text>
              <TextInput
                style={[styles.input, !isDarkMode && styles.lightInput]}
                value={name}
                onChangeText={setName}
                placeholder="İsim ve soyisminizi girin"
                placeholderTextColor={colors.gray500}
              />
            </View>

            <View style={[styles.inputContainer, !isDarkMode && styles.lightInputContainer]}>
              <Text style={[styles.label, !isDarkMode && styles.lightLabel]}>E-posta</Text>
              <TextInput
                style={[styles.input, !isDarkMode && styles.lightInput]}
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta adresinizi girin"
                placeholderTextColor={colors.gray500}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputContainer, !isDarkMode && styles.lightInputContainer]}>
              <Text style={[styles.label, !isDarkMode && styles.lightLabel]}>Telefon (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, !isDarkMode && styles.lightInput]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Telefon numaranızı girin"
                placeholderTextColor={colors.gray500}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Şifre Değiştir */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.passwordToggle, !isDarkMode && styles.lightPasswordToggle]}
              onPress={() => setIsChangingPassword(!isChangingPassword)}
            >
              <Text style={[styles.sectionTitle, !isDarkMode && styles.lightSectionTitle]}>
                Şifre Değiştir
              </Text>
              <Ionicons 
                name={isChangingPassword ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={isDarkMode ? colors.white : colors.black} 
              />
            </TouchableOpacity>

            {isChangingPassword && (
              <>
                <View style={[styles.inputContainer, !isDarkMode && styles.lightInputContainer]}>
                  <Text style={[styles.label, !isDarkMode && styles.lightLabel]}>Mevcut Şifre</Text>
                  <TextInput
                    style={[styles.input, !isDarkMode && styles.lightInput]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mevcut şifrenizi girin"
                    placeholderTextColor={colors.gray500}
                    secureTextEntry
                  />
                </View>

                <View style={[styles.inputContainer, !isDarkMode && styles.lightInputContainer]}>
                  <Text style={[styles.label, !isDarkMode && styles.lightLabel]}>Yeni Şifre</Text>
                  <TextInput
                    style={[styles.input, !isDarkMode && styles.lightInput]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Yeni şifrenizi girin"
                    placeholderTextColor={colors.gray500}
                    secureTextEntry
                  />
                </View>

                <View style={[styles.inputContainer, !isDarkMode && styles.lightInputContainer]}>
                  <Text style={[styles.label, !isDarkMode && styles.lightLabel]}>Yeni Şifre (Tekrar)</Text>
                  <TextInput
                    style={[styles.input, !isDarkMode && styles.lightInput]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Yeni şifrenizi tekrar girin"
                    placeholderTextColor={colors.gray500}
                    secureTextEntry
                  />
                </View>
              </>
            )}
          </View>
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
  container: {
    backgroundColor: colors.black,
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  disabledText: {
    opacity: 0.5,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray800,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  input: {
    backgroundColor: colors.gray900,
    borderColor: colors.gray700,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.white,
    fontSize: 16,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  lightInput: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
    color: colors.black,
  },
  lightInputContainer: {
    // No additional styles needed
  },
  lightLabel: {
    color: colors.black,
  },
  lightPasswordToggle: {
    // No additional styles needed
  },
  lightSectionTitle: {
    color: colors.black,
  },
  lightTitle: {
    color: colors.black,
  },
  passwordToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
