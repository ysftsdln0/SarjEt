import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import SarjetMainScreen from '../screens/SarjetMainScreen';
import { StationDetailScreen } from '../screens/StationDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import LoadingScreen from '../components/LoadingScreen';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../constants/colors';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user, token, error, login, logout, clearError } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Yükleniyor..." type="spinner" />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              options={{ title: 'Giriş' }}
            >
              {props => (
                <LoginScreen
                  {...props}
                  onLoginSuccess={(token, userData) => {
                    // Ensure userData has all required User properties
                    const user = {
                      ...userData,
                      id: userData.id || Math.random().toString(),
                      email: userData.email || '',
                    };
                    login(token, user);
                  }}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Register"
              options={{ title: 'Kayıt' }}
            >
              {props => (
                <RegisterScreen
                  {...props}
                  onRegisterSuccess={(token, userData) => {
                    // Ensure userData has all required User properties
                    const user = {
                      ...userData,
                      id: userData.id || Math.random().toString(),
                      email: userData.email || '',
                    };
                    login(token, user);
                  }}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="Home"
              options={{ title: 'Şarjet' }}
            >
              {props => (
                <SarjetMainScreen
                  {...props}
                  authToken={token}
                  user={user}
                  onLogout={logout}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="StationDetail"
              component={StationDetailScreen}
              options={{ title: 'İstasyon Detayı' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.lightBg,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
});
