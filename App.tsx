import React from 'react';
import { ThemeProvider } from './src/contexts/ThemeContext';
import SarjetMainScreen from './src/screens/SarjetMainScreen';

export default function App() {
  return (
    <ThemeProvider>
      <SarjetMainScreen />
    </ThemeProvider>
  );
}
