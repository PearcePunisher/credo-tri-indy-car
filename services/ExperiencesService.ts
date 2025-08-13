import { enhancedNotificationService } from './EnhancedNotificationService';
import { scheduleAllFromStrapi } from './NotificationScheduler';
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
      
      // Schedule notifications for all experiences using the new scheduler (20 minutes before by default)
      try {
        if (data?.data?.schedule_experiences && Array.isArray(data.data.schedule_experiences)) {
          await scheduleAllFromStrapi({
            schedule_experiences: data.data.schedule_experiences as any,
            // Optionally pass event-wide timezone if available in your API response
          }, { minutesBefore: 20 });
        }
      } catch (schedErr) {
        console.warn('⚠️ Scheduling notifications from fetch failed:', schedErr);
      }
      
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
      // Auto-subscribe users to all experience notifications by default (opt-out model)
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

  // Auto-subscribe method: Enable notifications for all experiences by default (opt-out model)
  private async autoSubscribeToAllExperiences(data: ScheduleResponse): Promise<void> {
    try {
      console.log('🔔 Auto-subscribing to all experience notifications (opt-out model)');
      
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        console.warn('No current user found, cannot auto-subscribe to notifications');
        return;
      }

      // Check if user has been auto-subscribed before to avoid re-subscribing
      const autoSubscribeKey = `autoSubscribed_${currentUser.id}`;
      const hasBeenAutoSubscribed = await AsyncStorage.getItem(autoSubscribeKey);
      
      if (hasBeenAutoSubscribed) {
        console.log('ℹ️ User has already been auto-subscribed, respecting existing preferences');
        return;
      }

      // Get current notification statuses
      const userStatusKey = `notificationStatuses_${currentUser.id}`;
      const raw = await AsyncStorage.getItem(userStatusKey);
      const existingStatuses = raw ? JSON.parse(raw) as Record<number, boolean> : {};
      
      // Check if user has any existing notification preferences
      const hasExistingPreferences = Object.keys(existingStatuses).length > 0;
      
      if (hasExistingPreferences) {
        console.log('ℹ️ User has existing notification preferences, not auto-subscribing');
        return;
      }

      // Auto-subscribe to all future experiences
      if (data?.data?.schedule_experiences && Array.isArray(data.data.schedule_experiences)) {
        let subscriptionCount = 0;
        const now = new Date();
        
        console.log(`🔔 Auto-subscribing user ${currentUser.id} to future experiences...`);
        console.log(`📊 Found ${data.data.schedule_experiences.length} total experiences`);
        
        for (const item of data.data.schedule_experiences) {
          // Ensure item exists and has the expected structure
          if (!item || typeof item !== 'object') {
            console.warn('⚠️ Skipping invalid experience item:', item);
            continue;
          }
          
          const experience = item.schedule_experience;
          
          // Skip if experience is null or undefined
          if (!experience) {
            console.warn('⚠️ Skipping null/undefined experience in auto-subscription');
            continue;
          }
          
          // Skip if no experience ID
          if (!experience.id) {
            console.warn('⚠️ Skipping experience without ID:', experience.experience_title || 'Unknown');
            continue;
          }
          
          // Only auto-subscribe to future experiences with valid start times
          if (experience.experience_start_date_time) {
            try {
              const eventTime = this.convertToEventLocalTime(experience.experience_start_date_time);
              console.log(`📅 Checking experience: ${experience.experience_title || 'Unknown'}`);
              console.log(`   Event time: ${eventTime.toISOString()}`);
              console.log(`   Current time: ${now.toISOString()}`);
              console.log(`   Is future: ${eventTime > now}`);
              
              if (eventTime > now) {
                // Set notification status to enabled (this will trigger scheduling via the UI)
                await this.setNotificationStatus(experience.id, true);
                subscriptionCount++;
                console.log(`✅ Auto-subscribed to: ${experience.experience_title || 'Unknown'}`);
              } else {
                console.log(`⏭️ Skipping past experience: ${experience.experience_title || 'Unknown'}`);
              }
            } catch (error) {
              console.error(`❌ Error processing experience ${experience.experience_title || 'Unknown'}:`, error);
            }
          } else {
            console.log(`⏭️ Skipping experience without start time: ${experience.experience_title || 'Unknown'}`);
          }
        }
        
        // Mark user as auto-subscribed to prevent future auto-subscriptions
        await AsyncStorage.setItem(autoSubscribeKey, 'true');
        
        console.log(`✅ Auto-subscribed to ${subscriptionCount} future experiences`);
      }
    } catch (error) {
      console.error('❌ Error during auto-subscription:', error);
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

  // Convert timestamp to Date object without timezone conversion
  // The API returns timestamps without timezone indicators, so we treat them as-is
  convertToEventLocalTime(timestamp: string): Date {
    if (!timestamp) return new Date();
    
    // Create a date object directly from the timestamp
    // No timezone conversion needed as the API provides local event time
    return new Date(timestamp);
  }

  // Format time for display (without timezone correction)
  formatEventTime(timestamp: string, options: {
    includeDate?: boolean;
    format12Hour?: boolean;
  } = {}): string {
    if (!timestamp) return '';
    
    const { includeDate = false, format12Hour = true } = options;
    const eventTime = this.convertToEventLocalTime(timestamp);
    
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
  getEventDateTime(timestamp: string): {
    date: string;
    time: string;
    dayOfWeek: string;
  } {
    if (!timestamp) {
      return { date: '', time: '', dayOfWeek: '' };
    }
    
    const eventTime = this.convertToEventLocalTime(timestamp);
    
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
    const response = await this.getExperiences();
    if (response.data) {
      const experience = response.data.data.schedule_experiences
        .filter(item => item?.schedule_experience && item.schedule_experience.id)
        .find(item => item.schedule_experience.id === experienceId)?.schedule_experience as any;

      if (experience) {
        // Use new scheduler to avoid duplicates and follow unified logic
        await scheduleAllFromStrapi({
          schedule_experiences: [{ schedule_experience: experience }],
        }, { minutesBefore: 20 });
        await this.setNotificationStatus(experienceId, true);
      } else {
        console.warn('Experience not found when scheduling:', experienceId);
      }
    } else {
      console.warn('No experiences data available to schedule');
    }
  }

  // Opt-out method: Cancel notifications for a specific experience
  async optOutOfNotifications(experienceId: number): Promise<void> {
    await this.cancelExperienceNotifications(experienceId);
    await this.setNotificationStatus(experienceId, false);
  }

  // Legacy method for backwards compatibility - now maps to opt-out
  async cancelNotifications(experienceId: number): Promise<void> {
    // Cancel via new scheduler and update status
    const { cancelByExperienceIds } = await import('./NotificationScheduler');
    await cancelByExperienceIds([experienceId]);
    await this.setNotificationStatus(experienceId, false);
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

  // User-specific notification statuses (persisted)
  const userStatusKey = `notificationStatuses_${currentUser.id}`;
  const raw = await AsyncStorage.getItem(userStatusKey);
  const statuses = raw ? JSON.parse(raw) as Record<number, boolean> : {};
      
  // Default to true (opt-out) - notifications are enabled by default
  // Users must explicitly disable notifications if they don't want them
  return statuses[experienceId] !== false;
    } catch (error) {
      console.error('Error getting notification status:', error);
      // Default to enabled on error to ensure users get notifications
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

  // User-specific notification statuses (persisted)
  const userStatusKey = `notificationStatuses_${currentUser.id}`;
  const raw = await AsyncStorage.getItem(userStatusKey);
  const statuses = raw ? JSON.parse(raw) as Record<number, boolean> : {};
  statuses[experienceId] = enabled;
  await AsyncStorage.setItem(userStatusKey, JSON.stringify(statuses));
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

  // Clear all notification preferences to reset to opt-out defaults
  async clearNotificationPreferences(): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // Clear user-specific notification statuses
        const userStatusKey = `notificationStatuses_${currentUser.id}`;
        await AsyncStorage.removeItem(userStatusKey);
        
        // Cancel all scheduled notifications for this user
        await this.clearAllNotifications();
        
        console.log('✅ Notification preferences cleared - reset to opt-out defaults');
      }
    } catch (error) {
      console.error('Error clearing notification preferences:', error);
    }
  }

  // Clear auto-subscription status (for testing)
  async clearAutoSubscriptionStatus(): Promise<void> {
    try {
      const authService = AuthService.getInstance();
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        const autoSubscribeKey = `autoSubscribed_${currentUser.id}`;
        await AsyncStorage.removeItem(autoSubscribeKey);
        console.log('✅ Auto-subscription status cleared');
      }
    } catch (error) {
      console.error('Error clearing auto-subscription status:', error);
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
        
        // Initialize opt-out notification system (notifications enabled by default)
        console.log('🔔 Notification system initialized with opt-out model');
        
        // Check final count (should be 0 since we cleared preferences, but new experiences will auto-subscribe)
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
