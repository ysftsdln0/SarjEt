import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './src/contexts/ThemeContext';
import SarjetMainScreen from './src/screens/SarjetMainScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SarjetMainScreen />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
