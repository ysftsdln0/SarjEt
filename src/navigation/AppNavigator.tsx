import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { RootStackParamList, User } from '../types';
import SarjetMainScreen from '../screens/SarjetMainScreen';
import { StationDetailScreen } from '../screens/StationDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  authToken: string | null;
  user: User | null;
  onLogout: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ authToken, user, onLogout }) => {
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
          options={{
            title: 'Şarjet',
          }}
        >
          {props => <SarjetMainScreen {...props} authToken={authToken} user={user} onLogout={onLogout} />}
        </Stack.Screen>
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
