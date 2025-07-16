// Configuration for Strapi backend connection
export const STRAPI_CONFIG = {
  // Replace with your actual Strapi URL
  baseUrl: process.env.EXPO_PUBLIC_STRAPI_URL || 'https://your-strapi-instance.com',
  
  // API endpoints
  endpoints: {
    auth: '/api/auth/local',
    register: '/api/auth/local/register',
    users: '/api/users',
    notifications: '/api/notifications'
  }
};

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
