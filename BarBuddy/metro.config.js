
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add resolution for react-native-maps on web
config.resolver.resolverMainFields = ['browser', 'main'];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-maps': path.resolve(__dirname, './components/maps/react-native-maps-mock.js'),
};

module.exports = config;