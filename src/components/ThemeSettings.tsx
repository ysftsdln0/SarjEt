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

interface ThemeSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ visible, onClose }) => {
  const { isDarkMode, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [compactLayout, setCompactLayout] = useState(false);

  if (!visible) return null;

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
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
              onPress={toggleTheme}
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
    </View>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 4,
  },
  container: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  content: {
    padding: 20,
  },
  fontSizePreview: {
    fontWeight: 'bold',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.gray200,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  modal: {
    borderRadius: 20,
    elevation: 10,
    maxHeight: '80%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    width: '90%',
  },
  optionLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  optionLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  optionRow: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quickToggle: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickToggleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
    borderWidth: 1,
  },
  selectedOptionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
});

export default ThemeSettings; 