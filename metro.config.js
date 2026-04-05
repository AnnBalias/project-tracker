const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const workletsRoot = path.resolve(__dirname, 'node_modules/react-native-worklets');
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-worklets': workletsRoot,
};

module.exports = config;
