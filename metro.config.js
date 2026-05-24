const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const exclusionList = require("metro-config/src/defaults/exclusionList");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Block the generated .cache folder for react-native-css-interop
// This fixes the "Failed to get the SHA-1" error on Netlify
// Metro cannot compute SHA-1 for generated files in .cache, so we exclude it
config.resolver.blockList = exclusionList([
  /node_modules\/react-native-css-interop\/\.cache\/.*/,
]);

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
