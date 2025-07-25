import { enhancedNotificationService } from './EnhancedNotificationService';
import { ENV_CONFIG } from '@/constants/Environment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';

interface VenueLocation {
  id: number;
  documentId: string;
  venue_location_name: string;
  venue_location_description: any[];
  venue_location_address_link: string | null;
  venue_location_directions_to_find: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ExperienceImage {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: any; // We won't use this
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string; // This is what we want to use
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
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
  experience_image?: ExperienceImage;
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
      // Note: Using opt-in method instead of auto-subscription to prevent notification bombardment
      // Users can manually enable notifications for experiences they're interested in
      return { data: freshData, isOffline: false };
    }

    // Fallback to any cached data if network fails
    const cachedData = await this.getCachedExperiences();
    return { 
      data: cachedData, 
      isOffline: true 
    };
  }

  // Opt-in method: Users manually enable notifications for experiences they want
  // This replaces the auto-subscription approach to prevent notification bombardment
  private async enableOptInNotifications(): Promise<void> {
    console.log('� Notification system ready - users can opt-in to specific experience notifications');
    // No automatic subscriptions - users must manually enable notifications
    // This gives users full control over which experiences they want to be notified about
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
  getImageUrl(experience?: Experience): string {
    // If experience has an image, use the direct URL
    if (experience?.experience_image?.url) {
      return experience.experience_image.url;
    }
    
    // Return placeholder image URL as fallback
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop';
  }

  // Schedule notifications for an experience
  async scheduleExperienceNotifications(experience: Experience): Promise<void> {
    if (!experience.experience_start_date_time) return;

    try {
      // First, cancel any existing notifications for this experience to prevent duplicates
     //console.log("HENLO");
      await this.cancelExperienceNotifications(experience.id);
      
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


  //simple filter to ensure that the whole thign doesn't crash with the experiences. 

  // Convenience methods for the UI
  async scheduleNotifications(experienceId: number): Promise<void> {
   /// console.log('DESPO 1');
    const response = await this.getExperiences();
  //  console.log("FIXING ERRORS THIS RESPO: "+JSON.stringify(response));
   // console.log(response);
 //   console.log("IDK MAYBE");
  //  console.log(response.data);
    if (response.data) {
  //    console.log("Test 1");
    //  console.log(response.data.data.schedule_experiences);
      const experience = response.data.data.schedule_experiences.filter(item => 
     item.schedule_experience && item.schedule_experience.id
  ).find(item => item.schedule_experience.id !=null && item.schedule_experience.id === experienceId)?.schedule_experience;
     // console.log("experience1 is done");
    //        console.log("HOWDY!");
    //  console.log(experience);
     //       console.log("HOWDY2!");
     // console.log(experienceId);
      if (experience) {
        await this.scheduleExperienceNotifications(experience);
        await this.setNotificationStatus(experienceId, true);
      }else{
        console.error("WE HIT A NON EXPERIENC#!!!");
      }
    }else{
      console.warn("Yeah guess it didn't work");
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
      
      // Default to false (opt-in) - users must explicitly enable notifications
      // This prevents notification bombardment by requiring conscious choice
      return statuses[experienceId] === true;
    } catch (error) {
      console.error('Error getting notification status:', error);
      // Default to disabled on error to prevent unwanted notifications
      return false;
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

  // Clear all notification preferences to reset to opt-in defaults
  async clearNotificationPreferences(): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // Clear user-specific notification statuses
        const userStatusKey = `notificationStatuses_${currentUser.id}`;
        (globalThis as any)[userStatusKey] = {};
        
        // Cancel all scheduled notifications for this user
        await this.clearAllNotifications();
        
        console.log('✅ Notification preferences cleared - reset to opt-in defaults');
      }
    } catch (error) {
      console.error('Error clearing notification preferences:', error);
    }
  }

  // Clear all scheduled notifications (for debugging)
  async clearAllNotifications(): Promise<void> {
    try {
      // Use Expo Notifications to cancel all scheduled notifications
      const Notifications = await import('expo-notifications');
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  // Get count of scheduled notifications (for debugging)
  async getScheduledNotificationCount(): Promise<number> {
    try {
      const Notifications = await import('expo-notifications');
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📊 Currently have ${scheduled.length} scheduled notifications`);
      
      // Log details about each scheduled notification
      if (scheduled.length > 0) {
        console.log('📋 Scheduled notification details:');
        scheduled.forEach((notification, index) => {
          console.log(`  ${index + 1}. ID: ${notification.identifier}`);
          console.log(`     Title: ${notification.content.title}`);
          console.log(`     Trigger: ${JSON.stringify(notification.trigger)}`);
        });
      } else {
        console.log('📋 No scheduled notifications found');
      }
      
      return scheduled.length;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  // Debug method to check what's happening with notifications
  async debugNotificationFlow(): Promise<void> {
    try {
      console.log('🔍 =============  NOTIFICATION DEBUG FLOW =============');
      
      // 1. Check permissions
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      console.log(`📋 Notification permission status: ${status}`);
      
      // 2. Check current scheduled notifications
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📊 Currently scheduled notifications: ${scheduled.length}`);
      
      // 3. Check experiences data
      const response = await this.getExperiences();
      if (response.data) {
        const experiences = response.data.data.schedule_experiences;
        const now = new Date();
        
        console.log(`📅 Total experiences: ${experiences.length}`);
        
        let futureCount = 0;
        experiences.forEach(item => {
          const experience = item.schedule_experience;
          if (experience && experience.experience_start_date_time) {
            const eventTime = this.convertToEventLocalTime(experience.experience_start_date_time);
            const correctedEventTime = new Date(eventTime.getTime() - (7 * 60 * 60 * 1000));
            
            if (correctedEventTime > now) {
              futureCount++;
              console.log(`   ✓ Future: ${experience.experience_title} - ${correctedEventTime.toLocaleString()}`);
            } else {
              console.log(`   ✗ Past: ${experience.experience_title} - ${correctedEventTime.toLocaleString()}`);
            }
          }
        });
        
        console.log(`📊 Future experiences count: ${futureCount}`);
      }
      
      console.log('🔍 ================================================');
    } catch (error) {
      console.error('❌ Debug flow failed:', error);
    }
  }

  // Manually reset notification preferences for testing
  async manuallyResetNotificationPreferences(): Promise<void> {
    try {
      console.log('🔧 Manually resetting notification preferences...');
      
      // First check current notification count
      const initialCount = await this.getScheduledNotificationCount();
      console.log(`📊 Initial notification count: ${initialCount}`);
      
      const response = await this.getExperiences();
      if (response.data) {
        // Clear notification preferences (resets to opt-in defaults)
        await this.clearNotificationPreferences();
        
        // Check count after clearing preferences
        const afterClearCount = await this.getScheduledNotificationCount();
        console.log(`📊 Count after clearing preferences: ${afterClearCount}`);
        
        // Initialize opt-in notification system
        await this.enableOptInNotifications();
        
        // Check final count (should be 0 since opt-in defaults to no notifications)
        const finalCount = await this.getScheduledNotificationCount();
        console.log(`📊 Final notification count: ${finalCount}`);
        
        console.log('✅ Manual notification preference reset complete - users can now opt-in');
      }
    } catch (error) {
      console.error('❌ Manual notification preference reset failed:', error);
    }
  }
}

export const experiencesService = new ExperiencesService();
