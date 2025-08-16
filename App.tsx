import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/contexts/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import SarjetMainScreen from './src/screens/SarjetMainScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { withAuth, getBaseUrl } from './src/services/apiClient';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<'login' | 'register' | 'main'>('login');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');
      
      if (token && userData) {
        // Token'ı doğrula (backend'de)
        const isValid = await validateToken(token);
        if (isValid) {
          setAuthToken(token);
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
          setCurrentScreen('main');
        } else {
          // Geçersiz token'ı temizle
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('userData');
        }
      }
    } catch (error) {
      console.error('Authentication check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const base = await getBaseUrl();
      if (!base) return false;
      const response = await fetch(`${base}/api/auth/profile`, {
        headers: withAuth(token) as any,
      });
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const handleLoginSuccess = async (token: string, userData: any) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setAuthToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      setCurrentScreen('main');
    } catch (error) {
      console.error('Login success error:', error);
    }
  };

  const handleRegisterSuccess = async (token: string, userData: any) => {
    try {
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setAuthToken(token);
      setUser(userData);
      setIsAuthenticated(true);
      setCurrentScreen('main');
    } catch (error) {
      console.error('Register success error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      
      setAuthToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchToRegister = () => {
    setCurrentScreen('register');
  };

  const switchToLogin = () => {
    setCurrentScreen('login');
  };

  if (isLoading) {
    // Loading screen göster
    return (
      <ThemeProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="auto" />
          {/* Basit loading ekranı */}
        </GestureHandlerRootView>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        
        {!isAuthenticated ? (
          // Authentication ekranları
          currentScreen === 'login' ? (
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <RegisterScreen
              onRegisterSuccess={handleRegisterSuccess}
              onSwitchToLogin={switchToLogin}
            />
          )
        ) : (
          // Ana uygulama
          <SarjetMainScreen
            authToken={authToken}
            user={user}
            onLogout={handleLogout}
          />
        )}
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
