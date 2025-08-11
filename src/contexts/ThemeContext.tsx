import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: any;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>('light');

  // Sistem tema değişikliklerini dinle
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    // İlk sistem temasını al
    setSystemColorScheme(Appearance.getColorScheme());

    return () => subscription?.remove();
  }, []);

  // AsyncStorage'dan tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeMode(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Tema tercihi yüklenemedi:', error);
    }
  };

  const saveThemePreference = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Tema tercihi kaydedilemedi:', error);
    }
  };

  // Aktif tema rengini hesapla
  const isDarkMode = themeMode === 'system' 
    ? systemColorScheme === 'dark'
    : themeMode === 'dark';

  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  // Tema renklerini seç
  const colors = isDarkMode ? {
    // Dark mode renkleri
    background: '#0D1B2A',
    surface: '#1B263B',
    text: '#F1FAEE',
    textSecondary: '#A0A0A0',
    primary: '#007AFF',
    secondary: '#5AC8FA',
    accent: '#FFB703',
    border: '#2D3748',
    card: '#2D3748',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
  } : {
    // Light mode renkleri
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#000000',
    textSecondary: '#6C757D',
    primary: '#007AFF',
    secondary: '#5AC8FA',
    accent: '#FFB703',
    border: '#E9ECEF',
    card: '#FFFFFF',
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
  };

  const value: ThemeContextType = {
    isDarkMode,
    themeMode,
    toggleTheme,
    setThemeMode: handleSetThemeMode,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 