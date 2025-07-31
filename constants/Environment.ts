// Environment configuration and validation
export const ENV_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE === 'true',
  STRAPI_URL: process.env.EXPO_PUBLIC_STRAPI_URL || 'https://harmonious-wealth-6294946a0c.strapiapp.com',
  PROJECT_ID: process.env.EXPO_PUBLIC_PROJECT_ID || 'db70e71b-2bb8-4da5-9442-a8f0ce48fd2f',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
};

// Log environment status on app start
console.log('🌍 Environment Configuration:', {
  NODE_ENV: ENV_CONFIG.NODE_ENV,
  DEV_MODE: ENV_CONFIG.DEV_MODE,
  IS_PRODUCTION: ENV_CONFIG.IS_PRODUCTION,
  HAS_STRAPI_URL: !!ENV_CONFIG.STRAPI_URL,
  HAS_PROJECT_ID: !!ENV_CONFIG.PROJECT_ID,
});

// Validate critical environment variables
if (!ENV_CONFIG.STRAPI_URL) {
  console.error('❌ Missing EXPO_PUBLIC_STRAPI_URL');
}

if (!ENV_CONFIG.PROJECT_ID) {
  console.error('❌ Missing EXPO_PUBLIC_PROJECT_ID');
}

if (!ENV_CONFIG.NODE_ENV) {
  console.warn('⚠️ NODE_ENV not set, defaulting to development');
}

export default ENV_CONFIG;
