const { getDefaultConfig } = require('expo/metro-config');

// Expo auto-configures Metro for monorepos from SDK 52+ (watchFolders,
// nodeModulesPaths, etc. are handled internally) — verified against the
// current Expo monorepo docs while setting this up. Do NOT add manual
// watchFolders/nodeModulesPaths here; it's unnecessary and can conflict
// with Expo's own resolution.
const config = getDefaultConfig(__dirname);

module.exports = config;
