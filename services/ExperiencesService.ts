import { notificationService } from './NotificationService';

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
      const response = await fetch(this.API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ScheduleResponse = await response.json();
      
      // Cache the data locally
      await this.cacheExperiences(data);
      
      return data;
    } catch (error) {
      console.error('Error fetching experiences:', error);
      return null;
    }
  }

  async getCachedExperiences(): Promise<ScheduleResponse | null> {
    try {
      // Simple in-memory cache for now - in production, use AsyncStorage
      const cachedData = (globalThis as any).experiencesCache;
      const cachedTimestamp = (globalThis as any).experiencesCacheTimestamp;
      
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

  private async cacheExperiences(data: ScheduleResponse): Promise<void> {
    try {
      // Simple in-memory cache for now - in production, use AsyncStorage
      (globalThis as any).experiencesCache = data;
      (globalThis as any).experiencesCacheTimestamp = Date.now();
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
      // Simple in-memory storage for now - in production, use AsyncStorage
      const statuses = (globalThis as any).notificationStatuses || {};
      return statuses[experienceId] || false;
    } catch (error) {
      console.error('Error getting notification status:', error);
      return false;
    }
  }

  async setNotificationStatus(experienceId: number, enabled: boolean): Promise<void> {
    try {
      // Simple in-memory storage for now - in production, use AsyncStorage
      if (!(globalThis as any).notificationStatuses) {
        (globalThis as any).notificationStatuses = {};
      }
      (globalThis as any).notificationStatuses[experienceId] = enabled;
    } catch (error) {
      console.error('Error setting notification status:', error);
    }
  }

  async refreshData(): Promise<void> {
    // Clear cache and fetch fresh data
    (globalThis as any).experiencesCache = null;
    (globalThis as any).experiencesCacheTimestamp = null;
    await this.fetchExperiences();
  }
}

export const experiencesService = new ExperiencesService();
