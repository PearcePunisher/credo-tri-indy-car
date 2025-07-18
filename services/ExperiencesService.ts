import { notificationService } from './NotificationService';
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
      return { data: freshData, isOffline: false };
    }

    // Fallback to any cached data if network fails
    const cachedData = await this.getCachedExperiences();
    return { 
      data: cachedData, 
      isOffline: true 
    };
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

  // Get the best image URL for display
  getImageUrl(): string {
    // Return placeholder image URL since new API doesn't have image field
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop';
  }

  // Schedule notifications for an experience
  async scheduleExperienceNotifications(experience: Experience): Promise<void> {
    if (!experience.experience_start_date_time) return;

    const startTime = new Date(experience.experience_start_date_time);
    const now = new Date();

    // Don't schedule notifications for past events
    if (startTime <= now) return;

    try {
      // For now, we'll schedule immediate notifications
      // In production, you'd want to use proper date triggers
      // 20 minutes before
      await notificationService.scheduleLocalNotification(
        {
          title: `${experience.experience_title} - Reminder`,
          body: 'Experience notification scheduled successfully!',
          data: { 
            type: 'experience_reminder', 
            experienceId: experience.id,
            scheduledFor: experience.experience_start_date_time
          },
          badge: 1,
        },
        null // Immediate for now - in production use date triggers
      );

    } catch (error) {
      console.error('Error scheduling experience notifications:', error);
    }
  }

  // Cancel all notifications for an experience
  async cancelExperienceNotifications(experienceId: number): Promise<void> {
    try {
      const scheduledNotifications = await notificationService.getAllScheduledNotifications();
      
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.experienceId === experienceId) {
          await notificationService.cancelNotification(notification.identifier);
        }
      }
    } catch (error) {
      console.error('Error canceling experience notifications:', error);
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

  async cancelNotifications(experienceId: number): Promise<void> {
    await this.cancelExperienceNotifications(experienceId);
    await this.setNotificationStatus(experienceId, false);
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
      return statuses[experienceId] || false;
    } catch (error) {
      console.error('Error getting notification status:', error);
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
}

export const experiencesService = new ExperiencesService();
