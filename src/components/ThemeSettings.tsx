import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import colors from '../constants/colors';
import Toast from './Toast';

interface ThemeSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ visible, onClose }) => {
  const { isDarkMode, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactLayout, setCompactLayout] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'info' | 'success' | 'warning' | 'error' });

  if (!visible) return null;

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    const themeNames = {
      light: 'Açık Tema',
      dark: 'Koyu Tema',
      system: 'Sistem Teması'
    };
    setToast({
      visible: true,
      message: `${themeNames[mode]} uygulandı`,
      type: 'success'
    });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    // TODO: Implement font size change
    Alert.alert('Font Boyutu', `${size} boyut seçildi`);
  };

  const handleLayoutChange = (compact: boolean) => {
    setCompactLayout(compact);
    // TODO: Implement layout change
    Alert.alert('Layout', compact ? 'Compact layout aktif' : 'Comfortable layout aktif');
  };

  const themeOptions = [
    { key: 'light', label: 'Açık Tema', icon: 'sunny' },
    { key: 'dark', label: 'Koyu Tema', icon: 'moon' },
    { key: 'system', label: 'Sistem', icon: 'settings' },
  ];

  const fontSizeOptions = [
    { key: 'small', label: 'Küçük', size: 14 },
    { key: 'medium', label: 'Orta', size: 16 },
    { key: 'large', label: 'Büyük', size: 18 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.overlay }]}>
      <View style={[styles.modal, { backgroundColor: isDarkMode ? colors.darkCard : colors.white }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDarkMode ? colors.white : colors.black }]}>
            Tema Ayarları
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={isDarkMode ? colors.white : colors.black} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Tema Seçimi */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.black }]}>
              Tema
            </Text>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionRow,
                  themeMode === option.key && styles.selectedOption,
                ]}
                onPress={() => handleThemeChange(option.key as 'light' | 'dark' | 'system')}
              >
                <View style={styles.optionLeft}>
                  <Ionicons 
                    name={option.icon as any} 
                    size={20} 
                    color={themeMode === option.key ? colors.primary : colors.gray600} 
                  />
                  <Text style={[
                    styles.optionLabel,
                    { color: isDarkMode ? colors.white : colors.black },
                    themeMode === option.key && styles.selectedOptionText,
                  ]}>
                    {option.label}
                  </Text>
                </View>
                {themeMode === option.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Font Boyutu */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.black }]}>
              Font Boyutu
            </Text>
            {fontSizeOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionRow,
                  fontSize === option.key && styles.selectedOption,
                ]}
                onPress={() => handleFontSizeChange(option.key as 'small' | 'medium' | 'large')}
              >
                <View style={styles.optionLeft}>
                  <Ionicons 
                    name="text" 
                    size={20} 
                    color={fontSize === option.key ? colors.primary : colors.gray600} 
                  />
                  <Text style={[
                    styles.optionLabel,
                    { color: isDarkMode ? colors.white : colors.black },
                    fontSize === option.key && styles.selectedOptionText,
                  ]}>
                    {option.label}
                  </Text>
                </View>
                <Text style={[
                  styles.fontSizePreview,
                  { fontSize: option.size },
                  { color: fontSize === option.key ? colors.primary : colors.gray600 },
                ]}>
                  Aa
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Layout Seçenekleri */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.black }]}>
              Layout
            </Text>
            <View style={styles.optionRow}>
              <View style={styles.optionLeft}>
                <Ionicons 
                  name="grid" 
                  size={20} 
                  color={colors.gray600} 
                />
                <Text style={[styles.optionLabel, { color: isDarkMode ? colors.white : colors.black }]}>
                  Compact Layout
                </Text>
              </View>
              <Switch
                value={compactLayout}
                onValueChange={handleLayoutChange}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Hızlı Tema Değiştirme */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? colors.white : colors.black }]}>
              Hızlı Değişim
            </Text>
            <TouchableOpacity
              style={[styles.quickToggle, { backgroundColor: colors.primary }]}
              onPress={() => {
                toggleTheme();
                setToast({
                  visible: true,
                  message: `Tema ${isDarkMode ? 'açık' : 'koyu'} moda değiştirildi`,
                  type: 'success'
                });
                setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2000);
              }}
            >
              <Ionicons 
                name={isDarkMode ? 'sunny' : 'moon'} 
                size={24} 
                color={colors.white} 
              />
              <Text style={styles.quickToggleText}>
                {isDarkMode ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: colors.primary + '10',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  fontSizePreview: {
    fontWeight: 'bold',
  },
  quickToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  quickToggleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default ThemeSettings; 