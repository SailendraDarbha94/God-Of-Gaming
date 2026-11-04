// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

// Expo configures Metro for monorepos on its own since SDK 52: it finds the workspace root from
// pnpm-workspace.yaml and sets watchFolders and nodeModulesPaths for the hoisted root node_modules,
// so @gog/domain and @gog/data resolve without manual wiring (docs.expo.dev/guides/monorepos).
module.exports = getDefaultConfig(__dirname);
