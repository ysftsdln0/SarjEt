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

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Hata', 'İsim ve e-posta alanları zorunludur.');
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert('Hata', 'Şifre değişikliği için tüm alanları doldurun.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
        return;
      }
    }

    setIsLoading(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.', [
        { text: 'Tamam', onPress: onClose }
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu.');
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
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  lightContainer: {
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray800,
  },
  lightHeader: {
    borderBottomColor: colors.gray200,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  lightTitle: {
    color: colors.black,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 16,
  },
  lightSectionTitle: {
    color: colors.black,
  },
  passwordToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lightPasswordToggle: {
    // No additional styles needed
  },
  inputContainer: {
    marginBottom: 16,
  },
  lightInputContainer: {
    // No additional styles needed
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.white,
    marginBottom: 8,
  },
  lightLabel: {
    color: colors.black,
  },
  input: {
    backgroundColor: colors.gray900,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.gray700,
  },
  lightInput: {
    backgroundColor: colors.gray100,
    color: colors.black,
    borderColor: colors.gray300,
  },
});
