import React from 'react';
import { StyleSheet, LogBox } from 'react-native';
import 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';

// React Navigation uyarılarını gizle
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

export default function App() {
  return <AppNavigator />;
}
