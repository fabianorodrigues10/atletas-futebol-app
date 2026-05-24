const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure react-native-css-interop .cache is watched by Metro
// This fixes the "Failed to get the SHA-1" error on Netlify
config.watchFolders = config.watchFolders || [];
config.watchFolders.push(path.resolve(__dirname, "node_modules/react-native-css-interop/.cache"));

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
