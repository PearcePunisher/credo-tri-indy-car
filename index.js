// Entry point logging for production debugging
console.log('🚀 App Entry Point - index.js starting');
console.log('📱 Platform info:', {
  platform: require('react-native').Platform.OS,
  version: require('react-native').Platform.Version,
  constants: require('react-native').Platform.constants
});

console.log('🌍 Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE,
  PROJECT_ID: !!process.env.EXPO_PUBLIC_PROJECT_ID,
  STRAPI_URL: !!process.env.EXPO_PUBLIC_STRAPI_URL
});

// Check if critical modules can load
try {
  console.log('📦 Testing critical imports...');
  require('expo-router/entry');
  console.log('✅ expo-router/entry loaded successfully');
} catch (error) {
  console.error('❌ Failed to load expo-router/entry:', error);
}
