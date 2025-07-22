// Configuration for Strapi backend connection
export const STRAPI_CONFIG = {
  // Using the existing Strapi URL from the track.tsx file
  baseUrl: process.env.EXPO_PUBLIC_STRAPI_URL || 'https://timely-actor-10dfb03957.strapiapp.com',
  
  // API endpoints
  endpoints: {
    auth: '/api/auth/local',
    register: '/api/auth/local/register',
    users: '/api/users',
    notifications: '/api/notifications'
  }
};

// Validate configuration on app start
if (!STRAPI_CONFIG.baseUrl) {
  console.error('❌ STRAPI_CONFIG.baseUrl is not defined');
}

console.log('🔧 Strapi Config loaded:', {
  baseUrl: STRAPI_CONFIG.baseUrl,
  hasEnvVar: !!process.env.EXPO_PUBLIC_STRAPI_URL
});

// Notification types for better organization
export const NOTIFICATION_TYPES = {
  RACE_UPDATE: 'race_update',
  VIP_EXPERIENCE: 'vip_experience',
  SCHEDULE_CHANGE: 'schedule_change',
  GENERAL: 'general'
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${STRAPI_CONFIG.baseUrl}${endpoint}`;
};
