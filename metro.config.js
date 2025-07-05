// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Web için react-native-maps ve ilgili native modülleri mock et
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': path.resolve(__dirname, 'web-mocks/react-native-maps.js'),
  'react-native-maps/lib/MapMarkerNativeComponent': path.resolve(__dirname, 'web-mocks/MapMarkerNativeComponent.js'),
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'web-mocks/codegenNativeCommands.js'),
};

// Platform-specific extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Web için resolver konfigürasyonu
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
