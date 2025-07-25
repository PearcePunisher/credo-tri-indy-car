import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Experience } from './ExperiencesService';

// Notification Categories
export enum NotificationCategory {
  EXPERIENCE_REMINDER = 'experience_reminder',
  EXPERIENCE_UPDATE = 'experience_update',
  EXPERIENCE_CANCELLATION = 'experience_cancellation',
  RACE_UPDATE = 'race_update',
  GENERAL_ANNOUNCEMENT = 'general_announcement',
}

// Notification Types
export enum NotificationType {
  ONE_HOUR_BEFORE = 'one_hour_before',
  TWENTY_MINUTES_BEFORE = 'twenty_minutes_before',
  AT_EVENT_TIME = 'at_event_time',
  UPDATE = 'update',
  CANCELLATION = 'cancellation',
}

export interface NotificationData {
  title: string;
  body: string;
  data?: {
    category: NotificationCategory;
    type: NotificationType;
    experienceId?: number;
    experienceTitle?: string;
    location?: string;
    startTime?: string;
    actions?: NotificationAction[];
    [key: string]: any;
  };
  sound?: boolean;
  badge?: number;
}

export interface NotificationAction {
  id: string;
  title: string;
  options?: {
    foreground?: boolean;
    destructive?: boolean;
    authenticationRequired?: boolean;
  };
}

export interface ScheduledNotificationInfo {
  id: string;
  experienceId: number;
  type: NotificationType;
  category: NotificationCategory;
  scheduledTime: Date;
  content: NotificationData;
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  type: NotificationType;
  experienceId?: number;
  receivedAt: Date;
  isRead: boolean;
  data?: any;
}

class EnhancedNotificationService {
  private readonly STORAGE_KEY_HISTORY = 'notification_history';
  private readonly STORAGE_KEY_SCHEDULED = 'scheduled_notifications';
  private readonly MAX_HISTORY_ITEMS = 100;

  constructor() {
    this.setupNotificationCategories();
  }

  // Setup notification categories with actions
  private async setupNotificationCategories(): Promise<void> {
    try {
      // Experience reminder actions
      await Notifications.setNotificationCategoryAsync('experience_reminder', [
        {
          identifier: 'view_details',
          buttonTitle: 'View Details',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'get_directions',
          buttonTitle: 'Get Directions',
          options: { opensAppToForeground: true },
        },
      ]);

      // Experience update actions
      await Notifications.setNotificationCategoryAsync('experience_update', [
        {
          identifier: 'view_update',
          buttonTitle: 'View Update',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: { opensAppToForeground: false },
        },
      ]);

      // Experience cancellation actions
      await Notifications.setNotificationCategoryAsync('experience_cancellation', [
        {
          identifier: 'view_details',
          buttonTitle: 'View Details',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'dismiss',
          buttonTitle: 'Dismiss',
          options: { opensAppToForeground: false },
        },
      ]);

      console.log('✅ Notification categories setup complete');
    } catch (error) {
      console.error('❌ Error setting up notification categories:', error);
    }
  }

  // Request permissions with enhanced handling
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
            allowProvisional: false,
          },
        });
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ Notification permissions not granted');
        return false;
      }
      
      // Setup Android notification channels
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }
      
      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  // Setup Android notification channels
  private async setupAndroidChannels(): Promise<void> {
    try {
      // Experience reminders channel
      await Notifications.setNotificationChannelAsync('experience_reminders', {
        name: 'Experience Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        description: 'Notifications for upcoming experiences',
      });

      // Updates channel
      await Notifications.setNotificationChannelAsync('updates', {
        name: 'Updates & Changes',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#FFA500',
        description: 'Important updates about experiences',
      });

      // General channel
      await Notifications.setNotificationChannelAsync('general', {
        name: 'General Announcements',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#0066CC',
        description: 'General race and event announcements',
      });

      console.log('✅ Android notification channels setup complete');
    } catch (error) {
      console.error('❌ Error setting up Android channels:', error);
    }
  }

  // Schedule all notifications for an experience
  async scheduleExperienceNotifications(experience: Experience): Promise<ScheduledNotificationInfo[]> {
    const scheduledNotifications: ScheduledNotificationInfo[] = [];
    
    console.log(`🔔 Scheduling notifications for: ${experience.experience_title}`);
    
    if (!experience.experience_start_date_time) {
      console.warn('⚠️ Experience has no start time, cannot schedule notifications');
      return scheduledNotifications;
    }

    // Import the experiences service for timezone handling
    const { experiencesService } = await import('./ExperiencesService');
    
    // Use corrected event time with 6-hour offset for notification scheduling
    const eventTime = experiencesService.convertToEventLocalTime(experience.experience_start_date_time);
    const correctedEventTime = new Date(eventTime.getTime() - (7 * 60 * 60 * 1000));
    const displayTime = correctedEventTime;
    const now = new Date();

    console.log(`⏰ Event time calculations:`);
    console.log(`   Original: ${experience.experience_start_date_time}`);
    console.log(`   Event time: ${eventTime.toISOString()}`);
    console.log(`   Corrected time: ${correctedEventTime.toISOString()}`);
    console.log(`   Current time: ${now.toISOString()}`);

    // Don't schedule notifications for past events
    if (correctedEventTime <= now) {
      console.warn('⚠️ Experience is in the past, not scheduling notifications');
      return scheduledNotifications;
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.error('❌ Notification permissions not granted');
      throw new Error('Notification permissions not granted');
    }
    
    console.log('✅ Notification permissions granted, proceeding with scheduling...');

    try {
      // 1 hour before notification
      const oneHourBefore = new Date(correctedEventTime.getTime() - 60 * 60 * 1000);
      console.log(`   1 hour before: ${oneHourBefore.toISOString()}`);
      
      if (oneHourBefore > now) {
        console.log('📱 Scheduling 1-hour notification...');
        console.log(`   Trigger date: ${oneHourBefore.toISOString()}`);
        console.log(`   Current time: ${now.toISOString()}`);
        console.log(`   Time difference: ${Math.round((oneHourBefore.getTime() - now.getTime()) / 1000 / 60)} minutes from now`);
        
        const oneHourNotificationId = await this.scheduleNotification({
          title: `${experience.experience_title} in 1 hour`,
          body: `Get ready! Your experience starts at ${displayTime.toLocaleTimeString()}.`,
          data: {
            category: NotificationCategory.EXPERIENCE_REMINDER,
            type: NotificationType.ONE_HOUR_BEFORE,
            experienceId: experience.id,
            experienceTitle: experience.experience_title,
            location: experience.experience_venue_location?.venue_location_name,
            startTime: experience.experience_start_date_time,
          },
        }, {
          date: oneHourBefore,
        } as Notifications.DateTriggerInput);

        if (oneHourNotificationId) {
          console.log(`✅ 1-hour notification scheduled with ID: ${oneHourNotificationId}`);
          scheduledNotifications.push({
            id: oneHourNotificationId,
            experienceId: experience.id,
            type: NotificationType.ONE_HOUR_BEFORE,
            category: NotificationCategory.EXPERIENCE_REMINDER,
            scheduledTime: oneHourBefore,
            content: {
              title: `${experience.experience_title} in 1 hour`,
              body: `Get ready! Your experience starts at ${displayTime.toLocaleTimeString()}.`,
            },
          });
        } else {
          console.warn('⚠️ Failed to schedule 1-hour notification (no ID returned)');
        }
      } else {
        console.log('⏰ Skipping 1-hour notification (time has passed)');
      }

      // 20 minutes before notification
      const twentyMinutesBefore = new Date(correctedEventTime.getTime() - 20 * 60 * 1000);
      console.log(`   20 minutes before: ${twentyMinutesBefore.toISOString()}`);
      
      if (twentyMinutesBefore > now) {
        console.log('📱 Scheduling 20-minute notification...');
        console.log(`   Trigger date: ${twentyMinutesBefore.toISOString()}`);
        console.log(`   Time difference: ${Math.round((twentyMinutesBefore.getTime() - now.getTime()) / 1000 / 60)} minutes from now`);
        
        const twentyMinNotificationId = await this.scheduleNotification({
          title: `${experience.experience_title} starting soon`,
          body: `Your experience starts in 20 minutes at ${experience.experience_venue_location?.venue_location_name || 'the venue'}.`,
          data: {
            category: NotificationCategory.EXPERIENCE_REMINDER,
            type: NotificationType.TWENTY_MINUTES_BEFORE,
            experienceId: experience.id,
            experienceTitle: experience.experience_title,
            location: experience.experience_venue_location?.venue_location_name,
            startTime: experience.experience_start_date_time,
          },
        }, {
          date: twentyMinutesBefore,
        } as Notifications.DateTriggerInput);

        if (twentyMinNotificationId) {
          scheduledNotifications.push({
            id: twentyMinNotificationId,
            experienceId: experience.id,
            type: NotificationType.TWENTY_MINUTES_BEFORE,
            category: NotificationCategory.EXPERIENCE_REMINDER,
            scheduledTime: twentyMinutesBefore,
            content: {
              title: `${experience.experience_title} starting soon`,
              body: `Your experience starts in 20 minutes at ${experience.experience_venue_location?.venue_location_name || 'the venue'}.`,
            },
          });
        }
      }

      // At event time notification
      if (correctedEventTime > now) {
        const eventTimeNotificationId = await this.scheduleNotification({
          title: `${experience.experience_title} is starting now!`,
          body: `Your experience is beginning at ${experience.experience_venue_location?.venue_location_name || 'the venue'}. Enjoy!`,
          data: {
            category: NotificationCategory.EXPERIENCE_REMINDER,
            type: NotificationType.AT_EVENT_TIME,
            experienceId: experience.id,
            experienceTitle: experience.experience_title,
            location: experience.experience_venue_location?.venue_location_name,
            startTime: experience.experience_start_date_time,
          },
        }, {
          date: correctedEventTime,
        } as Notifications.DateTriggerInput);

        if (eventTimeNotificationId) {
          scheduledNotifications.push({
            id: eventTimeNotificationId,
            experienceId: experience.id,
            type: NotificationType.AT_EVENT_TIME,
            category: NotificationCategory.EXPERIENCE_REMINDER,
            scheduledTime: correctedEventTime,
            content: {
              title: `${experience.experience_title} is starting now!`,
              body: `Your experience is beginning at ${experience.experience_venue_location?.venue_location_name || 'the venue'}. Enjoy!`,
            },
          });
        }
      }

      // Save scheduled notifications
      await this.saveScheduledNotifications(experience.id, scheduledNotifications);
      
      console.log(`✅ Scheduled ${scheduledNotifications.length} notifications for experience: ${experience.experience_title}`);
      return scheduledNotifications;

    } catch (error) {
      console.error('❌ Error scheduling experience notifications:', error);
      throw error;
    }
  }

  // Schedule a single notification
  private async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      // Determine Android channel based on category
      let androidChannelId = 'general';
      if (notification.data?.category === NotificationCategory.EXPERIENCE_REMINDER) {
        androidChannelId = 'experience_reminders';
      } else if (notification.data?.category === NotificationCategory.EXPERIENCE_UPDATE || 
                 notification.data?.category === NotificationCategory.EXPERIENCE_CANCELLATION) {
        androidChannelId = 'updates';
      }

      const content: any = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound !== false,
        categoryIdentifier: notification.data?.category,
      };

      // Add Android-specific properties
      if (Platform.OS === 'android') {
        content.channelId = androidChannelId;
      }

      // Only include badge if it's a valid number
      if (typeof notification.badge === 'number' && notification.badge >= 0) {
        content.badge = notification.badge;
      }
      
      console.log(`📱 Attempting to schedule notification:`, {
        title: content.title,
        trigger: trigger,
        channelId: content.channelId,
        hasData: !!content.data
      });
      
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });
      
      console.log(`✅ Scheduled notification with ID: ${id}`);
      return id;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      console.error('❌ Notification content:', notification);
      console.error('❌ Trigger:', trigger);
      return null;
    }
  }

  // Cancel all notifications for an experience
  async cancelExperienceNotifications(experienceId: number): Promise<void> {
    try {
      const scheduledNotifications = await this.getScheduledNotificationsForExperience(experienceId);
      
      for (const notification of scheduledNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.id);
        console.log(`✅ Cancelled notification: ${notification.id}`);
      }

      // Remove from storage
      await this.removeScheduledNotifications(experienceId);
      
      console.log(`✅ Cancelled all notifications for experience: ${experienceId}`);
    } catch (error) {
      console.error('❌ Error canceling experience notifications:', error);
      throw error;
    }
  }

  // Send immediate experience update notification
  async sendExperienceUpdate(
    experience: Experience,
    updateMessage: string,
    updateType: NotificationType = NotificationType.UPDATE
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      await this.scheduleNotification({
        title: `Update: ${experience.experience_title}`,
        body: updateMessage,
        data: {
          category: NotificationCategory.EXPERIENCE_UPDATE,
          type: updateType,
          experienceId: experience.id,
          experienceTitle: experience.experience_title,
          location: experience.experience_venue_location?.venue_location_name,
          startTime: experience.experience_start_date_time,
        },
        badge: 1,
      }, null); // Immediate notification

      // Add to history
      await this.addToHistory({
        id: `update_${experience.id}_${Date.now()}`,
        title: `Update: ${experience.experience_title}`,
        body: updateMessage,
        category: NotificationCategory.EXPERIENCE_UPDATE,
        type: updateType,
        experienceId: experience.id,
        receivedAt: new Date(),
        isRead: false,
      });

      console.log(`✅ Sent update notification for experience: ${experience.experience_title}`);
    } catch (error) {
      console.error('❌ Error sending experience update:', error);
      throw error;
    }
  }

  // Get all scheduled notifications for an experience
  async getScheduledNotificationsForExperience(experienceId: number): Promise<ScheduledNotificationInfo[]> {
    try {
      const stored = await AsyncStorage.getItem(`${this.STORAGE_KEY_SCHEDULED}_${experienceId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting scheduled notifications:', error);
      return [];
    }
  }

  // Save scheduled notifications to storage
  private async saveScheduledNotifications(experienceId: number, notifications: ScheduledNotificationInfo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.STORAGE_KEY_SCHEDULED}_${experienceId}`,
        JSON.stringify(notifications)
      );
    } catch (error) {
      console.error('❌ Error saving scheduled notifications:', error);
    }
  }

  // Remove scheduled notifications from storage
  private async removeScheduledNotifications(experienceId: number): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.STORAGE_KEY_SCHEDULED}_${experienceId}`);
    } catch (error) {
      console.error('❌ Error removing scheduled notifications:', error);
    }
  }

  // Notification History Management
  async addToHistory(notification: NotificationHistory): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      history.unshift(notification);
      
      // Keep only the most recent notifications
      const trimmedHistory = history.slice(0, this.MAX_HISTORY_ITEMS);
      
      await AsyncStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(trimmedHistory));
      console.log('✅ Added notification to history');
    } catch (error) {
      console.error('❌ Error adding to notification history:', error);
    }
  }

  async getNotificationHistory(): Promise<NotificationHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      );
      
      await AsyncStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(updated));
      console.log(`✅ Marked notification as read: ${notificationId}`);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  async clearNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY_HISTORY);
      console.log('✅ Cleared notification history');
    } catch (error) {
      console.error('❌ Error clearing notification history:', error);
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const history = await this.getNotificationHistory();
      return history.filter(notification => !notification.isRead).length;
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      return 0;
    }
  }

  // Send test notification (public method)
  async sendTestNotification(): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      await this.scheduleNotification({
        title: 'Test Notification',
        body: 'This is a test notification from the Enhanced Notification Service!',
        data: {
          category: NotificationCategory.GENERAL_ANNOUNCEMENT,
          type: NotificationType.UPDATE,
        },
        badge: 1,
      }, null);

      // Add to history
      await this.addToHistory({
        id: `test_${Date.now()}`,
        title: 'Test Notification',
        body: 'This is a test notification from the Enhanced Notification Service!',
        category: NotificationCategory.GENERAL_ANNOUNCEMENT,
        type: NotificationType.UPDATE,
        receivedAt: new Date(),
        isRead: false,
      });

      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  // Backend integration for push notifications
  async registerForPushNotifications(userId: string, jwtToken: string): Promise<string | null> {
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'db70e71b-2bb8-4da5-9442-a8f0ce48fd2f', // Your Expo project ID
      });
      
      // Here you would typically send the token to your backend
      // For now, just return the token
      console.log('✅ Push token obtained:', pushToken.data);
      return pushToken.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  }

  // Handle incoming notifications
  async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    try {
      const { title, body, data } = notification.request.content;
      
      // Add to history
      await this.addToHistory({
        id: notification.request.identifier,
        title: title || 'Notification',
        body: body || '',
        category: (data?.category as NotificationCategory) || NotificationCategory.GENERAL_ANNOUNCEMENT,
        type: (data?.type as NotificationType) || NotificationType.UPDATE,
        experienceId: data?.experienceId as number | undefined,
        receivedAt: new Date(),
        isRead: false,
        data,
      });

      console.log('✅ Handled received notification:', title);
    } catch (error) {
      console.error('❌ Error handling received notification:', error);
    }
  }

  // Handle notification responses (when user taps actions)
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<{ action: string; data: any } | void> {
    try {
      const { notification, actionIdentifier } = response;
      const { data } = notification.request.content;

      // Mark as read when user interacts
      await this.markNotificationAsRead(notification.request.identifier);

      console.log('✅ Handled notification response:', actionIdentifier, data);
      
      // Here you can handle different actions like 'view_details', 'get_directions', etc.
      // Return the action info for the calling component to handle navigation
      return {
        action: actionIdentifier,
        data,
      };
    } catch (error) {
      console.error('❌ Error handling notification response:', error);
    }
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
