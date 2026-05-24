const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// For web builds (Netlify), disable forceWriteFileSystem to avoid cache issues
// For native builds, keep it enabled for proper styling
const isWebBuild = process.env.EXPO_OS === "web" || process.env.NODE_ENV === "production";

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Only force write CSS to file system for native builds
  // This prevents cache issues on Netlify web builds
  forceWriteFileSystem: !isWebBuild,
});
