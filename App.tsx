import React, { useEffect } from 'react';
import { StyleSheet, LogBox } from 'react-native';
import 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimationUtils } from './src/utils/animationUtils';

// React Navigation uyarılarını gizle
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
  // Reanimated reduced motion warning'i de ignore edelim
  '[Reanimated] Reduced motion setting is enabled on this device',
]);

export default function App() {
  console.log('🚀 [App] Starting SarjEt Application');
  
  useEffect(() => {
    console.log('📱 [App] useEffect called - initializing animation utilities');
    // Initialize animation utilities
    AnimationUtils.initialize();
  }, []);

  console.log('📱 [App] App component rendered');
  return <AppNavigator />;
}
