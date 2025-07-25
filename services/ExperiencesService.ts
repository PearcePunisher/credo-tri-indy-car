import { enhancedNotificationService } from './EnhancedNotificationService';
import { ENV_CONFIG } from '@/constants/Environment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';

export interface VenueLocation {
  id: number;
  documentId: string;
  venue_location_name: string;
  venue_location_description: any[]; // Rich text array
  venue_location_address_link?: string;
  venue_location_directions_to_find: any[]; // Rich text array
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Experience {
  id: number;
  documentId: string;
  experience_id: string;
  experience_title: string;
  experience_description: any[]; // Rich text array
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  experience_start_date_time: string;
  experience_end_date_time: string;
  experience_venue_location: VenueLocation;
}

export interface ScheduleExperienceItem {
  id: number;
  schedule_experience: Experience;
}

export interface ScheduleResponse {
  data: {
    id: number;
    documentId: string;
    event_schedule_human_title: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    schedule_experiences: ScheduleExperienceItem[];
  };
  meta: {};
}

class ExperiencesService {
  private readonly API_URL = 'https://nodejs-production-0e5a.up.railway.app/get_dummy_schedule';
  private readonly CACHE_KEY = 'experiencesData';
  private readonly CACHE_TIMESTAMP_KEY = 'experiencesDataTimestamp';
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  async fetchExperiences(): Promise<ScheduleResponse | null> {
    try {
      // Get current user to access their Event Schedule Document ID
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser?.eventScheduleDocumentId) {
        console.warn('No eventScheduleDocumentId found for user, cannot fetch user-specific experiences');
        return null;
      }

      // Prepare the request payload with the user's Event Schedule Document ID
      const requestBody = {
        event_schedule_document_id: currentUser.eventScheduleDocumentId
      };

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ScheduleResponse = await response.json();
      
      // Cache the data locally with user-specific key
      await this.cacheExperiences(data, currentUser.id);
      
      return data;
    } catch (error) {
      console.error('Error fetching experiences:', error);
      return null;
    }
  }

  async getCachedExperiences(): Promise<ScheduleResponse | null> {
    try {
      // Get current user to access user-specific cache
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        return null;
      }

      // User-specific cache keys
      const userCacheKey = `${this.CACHE_KEY}_${currentUser.id}`;
      const userTimestampKey = `${this.CACHE_TIMESTAMP_KEY}_${currentUser.id}`;
      
      // Simple in-memory cache for now - in production, use AsyncStorage
      const cachedData = (globalThis as any)[userCacheKey];
      const cachedTimestamp = (globalThis as any)[userTimestampKey];
      
      if (cachedData && cachedTimestamp) {
        const now = Date.now();
        if (now - cachedTimestamp < this.CACHE_DURATION) {
          return cachedData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached experiences:', error);
      return null;
    }
  }

  private async cacheExperiences(data: ScheduleResponse, userId: string): Promise<void> {
    try {
      // User-specific cache keys
      const userCacheKey = `${this.CACHE_KEY}_${userId}`;
      const userTimestampKey = `${this.CACHE_TIMESTAMP_KEY}_${userId}`;
      
      // Simple in-memory cache for now - in production, use AsyncStorage
      (globalThis as any)[userCacheKey] = data;
      (globalThis as any)[userTimestampKey] = Date.now();
    } catch (error) {
      console.error('Error caching experiences:', error);
    }
  }

  async getExperiences(forceRefresh: boolean = false): Promise<{
    data: ScheduleResponse | null;
    isOffline: boolean;
  }> {
    if (!forceRefresh) {
      const cachedData = await this.getCachedExperiences();
      if (cachedData) {
        return { data: cachedData, isOffline: false };
      }
    }

    // Try to fetch fresh data
    const freshData = await this.fetchExperiences();
    if (freshData) {
      // Auto-subscribe to all experience notifications for new users
      await this.autoSubscribeToAllExperiences(freshData);
      return { data: freshData, isOffline: false };
    }

    // Fallback to any cached data if network fails
    const cachedData = await this.getCachedExperiences();
    return { 
      data: cachedData, 
      isOffline: true 
    };
  }

  // Auto-subscribe users to all experience notifications by default
  private async autoSubscribeToAllExperiences(scheduleData: ScheduleResponse): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser || !scheduleData.data.schedule_experiences) {
        return;
      }

      // Check if this is the first time the user is getting their experiences
      const userStatusKey = `notificationStatuses_${currentUser.id}`;
      const hasExistingStatuses = !!(globalThis as any)[userStatusKey];
      
      // If user already has notification statuses, respect their choices
      if (hasExistingStatuses) {
        return;
      }

      console.log('🔔 Auto-subscribing user to all experience notifications...');
      
      // Schedule notifications for all experiences that haven't started yet
      const now = new Date();
      const experiences = scheduleData.data.schedule_experiences;
      
      for (const item of experiences) {
        const experience = item.schedule_experience;
        if (!experience || !experience.experience_start_date_time) continue;
        
        // Use the corrected event time for comparison
        const eventStartTime = this.convertToEventLocalTime(experience.experience_start_date_time);
        
        // Only schedule for future experiences
        if (eventStartTime > now) {
          try {
            await this.scheduleExperienceNotifications(experience);
            await this.setNotificationStatus(experience.id, true);
            console.log(`✅ Auto-subscribed to notifications for: ${experience.experience_title}`);
          } catch (error) {
            console.error(`❌ Failed to auto-subscribe to ${experience.experience_title}:`, error);
          }
        }
      }
      
      console.log('🎉 Auto-subscription complete! Users can opt-out individually if desired.');
    } catch (error) {
      console.error('Error during auto-subscription to experiences:', error);
    }
  }

  // Convert rich text array to plain text
  convertRichTextToPlainText(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';
    
    return richText
      .map(block => {
        if (block.children) {
          return block.children
            .map((child: any) => child.text || '')
            .join(' ');
        }
        return '';
      })
      .join(' ')
      .trim();
  }

  // Convert UTC timestamp to event local time (treating UTC as event timezone)
  // This prevents automatic timezone conversion by the user's device
  convertToEventLocalTime(utcTimestamp: string): Date {
    if (!utcTimestamp) return new Date();
    
    // Remove the 'Z' suffix and treat as local time
    // This prevents JavaScript from doing automatic timezone conversion
    const withoutZ = utcTimestamp.replace('Z', '');
    
    // Create a date object treating the time as local (event timezone)
    // This way it displays the same time regardless of user's location
    return new Date(withoutZ);
  }

  // Format time for display (without timezone indicator)
  formatEventTime(utcTimestamp: string, options: {
    includeDate?: boolean;
    format12Hour?: boolean;
  } = {}): string {
    if (!utcTimestamp) return '';
    
    const { includeDate = false, format12Hour = true } = options;
    const eventTime = this.convertToEventLocalTime(utcTimestamp);
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: format12Hour,
    };
    
    if (includeDate) {
      timeOptions.month = 'short';
      timeOptions.day = 'numeric';
      timeOptions.weekday = 'short';
    }
    
    return eventTime.toLocaleString('en-US', timeOptions);
  }

  // Get event date and time separately
  getEventDateTime(utcTimestamp: string): {
    date: string;
    time: string;
    dayOfWeek: string;
  } {
    if (!utcTimestamp) {
      return { date: '', time: '', dayOfWeek: '' };
    }
    
    const eventTime = this.convertToEventLocalTime(utcTimestamp);
    
    return {
      date: eventTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      time: eventTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      dayOfWeek: eventTime.toLocaleDateString('en-US', { 
        weekday: 'short' 
      })
    };
  }

  // Convert event time to proper UTC for notification scheduling
  // This assumes the stored UTC time actually represents Pacific Time
  convertEventTimeToActualUTC(utcTimestamp: string): Date {
    if (!utcTimestamp) return new Date();
    
    // The times in Strapi are stored as UTC but actually represent Pacific Time
    // Pacific Time is UTC-8 (or UTC-7 during DST)
    // For notification scheduling, we need to convert back to actual UTC
    
    const eventLocalTime = this.convertToEventLocalTime(utcTimestamp);
    
    // Assume Pacific Time (UTC-8, or UTC-7 during DST)
    // For simplicity, we'll use UTC-8 (this could be made more sophisticated)
    const pacificOffsetMinutes = 8 * 60; // 8 hours behind UTC
    
    // Create a proper UTC time by adding the Pacific offset
    const actualUTCTime = new Date(eventLocalTime.getTime() + (pacificOffsetMinutes * 60 * 1000));
    
    return actualUTCTime;
  }

  // Get the best image URL for display
  getImageUrl(): string {
    // Return placeholder image URL since new API doesn't have image field
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop';
  }

  // Schedule notifications for an experience
  async scheduleExperienceNotifications(experience: Experience): Promise<void> {
    if (!experience.experience_start_date_time) return;

    try {
      // First try backend integration if available
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser && ENV_CONFIG.STRAPI_URL) {
        // For now, we'll use local storage to simulate a JWT token
        // In a real implementation, you'd get this from your auth system
        const authToken = await AsyncStorage.getItem('authToken');
        
        if (authToken) {
          const response = await fetch(
            `${ENV_CONFIG.STRAPI_URL}/api/notifications/schedule-experience/${experience.id}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({ userId: currentUser.id }),
            }
          );

          if (response.ok) {
            console.log('✅ Experience notifications scheduled via backend');
            return;
          } else {
            console.warn('⚠️ Backend scheduling failed, falling back to local notifications');
          }
        }
      }

      // Fallback to local notification service
      await enhancedNotificationService.scheduleExperienceNotifications(experience);
      console.log('✅ Experience notifications scheduled locally');
    } catch (error) {
      console.error('Error scheduling experience notifications:', error);
      // Try local fallback even if backend fails
      try {
        await enhancedNotificationService.scheduleExperienceNotifications(experience);
        console.log('✅ Experience notifications scheduled locally as fallback');
      } catch (fallbackError) {
        console.error('❌ Local notification fallback also failed:', fallbackError);
      }
    }
  }

  // Cancel all notifications for an experience
  async cancelExperienceNotifications(experienceId: number): Promise<void> {
    try {
      // First try backend integration if available
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser && ENV_CONFIG.STRAPI_URL) {
        // For now, we'll use local storage to simulate a JWT token
        // In a real implementation, you'd get this from your auth system
        const authToken = await AsyncStorage.getItem('authToken');
        
        if (authToken) {
          const response = await fetch(
            `${ENV_CONFIG.STRAPI_URL}/api/notifications/cancel-experience/${experienceId}`,
            {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
              body: JSON.stringify({ userId: currentUser.id }),
            }
          );

          if (response.ok) {
            console.log('✅ Experience notifications cancelled via backend');
            return;
          } else {
            console.warn('⚠️ Backend cancellation failed, falling back to local notifications');
          }
        }
      }

      // Fallback to local notification service
      await enhancedNotificationService.cancelExperienceNotifications(experienceId);
      console.log('✅ Experience notifications cancelled locally');
    } catch (error) {
      console.error('Error canceling experience notifications:', error);
      // Try local fallback even if backend fails
      try {
        await enhancedNotificationService.cancelExperienceNotifications(experienceId);
        console.log('✅ Experience notifications cancelled locally as fallback');
      } catch (fallbackError) {
        console.error('❌ Local notification cancellation fallback also failed:', fallbackError);
      }
    }
  }

  // Convenience methods for the UI
  async scheduleNotifications(experienceId: number): Promise<void> {
    const response = await this.getExperiences();
    if (response.data) {
      const experience = response.data.data.schedule_experiences.find(item => item.schedule_experience.id === experienceId)?.schedule_experience;
      if (experience) {
        await this.scheduleExperienceNotifications(experience);
        await this.setNotificationStatus(experienceId, true);
      }
    }
  }

  // Opt-out method: Cancel notifications for a specific experience
  async optOutOfNotifications(experienceId: number): Promise<void> {
    await this.cancelExperienceNotifications(experienceId);
    await this.setNotificationStatus(experienceId, false);
  }

  // Legacy method for backwards compatibility - now maps to opt-out
  async cancelNotifications(experienceId: number): Promise<void> {
    await this.optOutOfNotifications(experienceId);
  }

  // Opt back in: Re-enable notifications for a specific experience
  async optBackInToNotifications(experienceId: number): Promise<void> {
    await this.scheduleNotifications(experienceId);
  }

  async getNotificationStatus(experienceId: number): Promise<boolean> {
    try {
      // Get current user for user-specific notification statuses
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        return false;
      }

      // User-specific notification statuses
      const userStatusKey = `notificationStatuses_${currentUser.id}`;
      const statuses = (globalThis as any)[userStatusKey] || {};
      
      // Default to true (auto-subscribed) if no explicit status is set
      // User must explicitly opt-out to disable notifications
      return statuses[experienceId] !== false;
    } catch (error) {
      console.error('Error getting notification status:', error);
      // Default to enabled on error to ensure users don't miss notifications
      return true;
    }
  }

  async setNotificationStatus(experienceId: number, enabled: boolean): Promise<void> {
    try {
      // Get current user for user-specific notification statuses
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        console.warn('No current user found, cannot set notification status');
        return;
      }

      // User-specific notification statuses
      const userStatusKey = `notificationStatuses_${currentUser.id}`;
      if (!(globalThis as any)[userStatusKey]) {
        (globalThis as any)[userStatusKey] = {};
      }
      (globalThis as any)[userStatusKey][experienceId] = enabled;
    } catch (error) {
      console.error('Error setting notification status:', error);
    }
  }

  async refreshData(): Promise<void> {
    try {
      // Get current user to clear user-specific cache
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // Clear user-specific cache and fetch fresh data
        const userCacheKey = `${this.CACHE_KEY}_${currentUser.id}`;
        const userTimestampKey = `${this.CACHE_TIMESTAMP_KEY}_${currentUser.id}`;
        
        (globalThis as any)[userCacheKey] = null;
        (globalThis as any)[userTimestampKey] = null;
      }
      
      await this.fetchExperiences();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }
}

export const experiencesService = new ExperiencesService();
