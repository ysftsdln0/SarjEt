import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { HomeScreen } from '../screens/HomeScreen';
import { StationDetailScreen } from '../screens/StationDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false, // Custom header kullanacağız
          gestureEnabled: true,
          cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Şarjet',
          }}
        />
        <Stack.Screen
          name="StationDetail"
          component={StationDetailScreen}
          options={{
            title: 'İstasyon Detayı',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
