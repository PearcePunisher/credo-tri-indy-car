import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Experience } from './ExperiencesService';

// Simple event emitter for state synchronization
class EventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(...args));
  }
}

const notificationEvents = new EventEmitter();

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
  private inFlight: Record<number, 'schedule' | 'cancel' | undefined> = {};

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
    if (this.inFlight[experience.id]) {
      console.log(`⏳ Skipping schedule; operation already in-flight for experience ${experience.id}`);
      return [];
    }
    this.inFlight[experience.id] = 'schedule';
    const scheduledNotifications: ScheduledNotificationInfo[] = [];
    
    console.log(`🔔 Scheduling notifications for: ${experience.experience_title}`);
    
    if (!experience.experience_start_date_time) {
      console.warn('⚠️ Experience has no start time, cannot schedule notifications');
      return scheduledNotifications;
    }

    // Import the experiences service for timezone handling
    const { experiencesService } = await import('./ExperiencesService');
    
  // Use event time directly without manual timezone offsets
  const eventTime = experiencesService.convertToEventLocalTime(experience.experience_start_date_time);
  const displayTime = eventTime;
    const now = new Date();

    console.log(`⏰ Event time calculations:`);
    console.log(`   Original: ${experience.experience_start_date_time}`);
  console.log(`   Event time: ${eventTime.toISOString()}`);
    console.log(`   Current time: ${now.toISOString()}`);

    // Don't schedule notifications for past events
  if (eventTime <= now) {
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
  // 20 minutes before notification (only reminder we send)
  const twentyMinutesBefore = new Date(eventTime.getTime() - 20 * 60 * 1000);
      console.log(`📅 Notification scheduling details:`);
      console.log(`   20 minutes before: ${twentyMinutesBefore.toISOString()}`);
      console.log(`   Current time: ${now.toISOString()}`);
      console.log(`   Minutes until notification: ${Math.round((twentyMinutesBefore.getTime() - now.getTime()) / (1000 * 60))}`);
      
      if (twentyMinutesBefore > now) {
        console.log('📱 Scheduling 20-minute notification...');
        const seconds = Math.ceil((twentyMinutesBefore.getTime() - now.getTime()) / 1000);
        const minutes = Math.round(seconds / 60);
        
        console.log(`📋 Scheduling details:`);
        console.log(`   Trigger date: ${twentyMinutesBefore.toISOString()}`);
        console.log(`   Time difference: ${minutes} minutes (${seconds} seconds) from now`);
        console.log(`   Local trigger time: ${twentyMinutesBefore.toLocaleString()}`);
        
        if (seconds <= 0) {
          console.log('⏭️ Skipping 20-minute notification (computed seconds <= 0)');
          return scheduledNotifications;
        }
        
        // Add minimum delay to prevent immediate firing in Expo Go
        const minDelaySeconds = Math.max(seconds, 10); // At least 10 seconds delay
        console.log(`   Using delay: ${minDelaySeconds} seconds (adjusted for Expo Go)`);
        
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
         }, twentyMinutesBefore as Date);

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

      // Save scheduled notifications
      await this.saveScheduledNotifications(experience.id, scheduledNotifications);
      
      console.log(`✅ Scheduled ${scheduledNotifications.length} notifications for experience: ${experience.experience_title}`);
      return scheduledNotifications;

    } catch (error) {
      console.error('❌ Error scheduling experience notifications:', error);
      throw error;
    } finally {
      this.inFlight[experience.id] = undefined;
    }
  }

  // Schedule a single notification
  private async scheduleNotification(
    notification: NotificationData,
    trigger: Notifications.NotificationTriggerInput | Date | null
  ): Promise<string | null> {
    try {
      // Normalize trigger: prefer timeInterval triggers for reliability (esp. in Expo Go)
      let normalizedTrigger: Notifications.NotificationTriggerInput | null = null;
      let triggerTime: Date | null = null;
      
      if (trigger instanceof Date) {
        triggerTime = trigger;
        const seconds = Math.ceil((trigger.getTime() - Date.now()) / 1000);
        if (seconds <= 0) {
          console.warn('⏭️ Skipping scheduling: trigger time is in the past');
          return null;
        }
        
        // Add minimum delay for Expo Go to prevent immediate firing
        const minDelaySeconds = Math.max(seconds, 30); // At least 30 seconds delay
        normalizedTrigger = { seconds: minDelaySeconds, repeats: false } as Notifications.TimeIntervalTriggerInput;
        
        console.log(`⏰ Normalized trigger: ${minDelaySeconds} seconds from now (${Math.round(minDelaySeconds / 60)} minutes)`);
      } else if (trigger && (trigger as any).date instanceof Date) {
        const date = (trigger as any).date as Date;
        triggerTime = date;
        const seconds = Math.ceil((date.getTime() - Date.now()) / 1000);
        if (seconds <= 0) {
          console.warn('⏭️ Skipping scheduling: trigger time is in the past');
          return null;
        }
        
        // Add minimum delay for Expo Go
        const minDelaySeconds = Math.max(seconds, 30);
        normalizedTrigger = { seconds: minDelaySeconds, repeats: false } as Notifications.TimeIntervalTriggerInput;
      } else {
        normalizedTrigger = trigger as any;
      }
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
      
      console.log(`📱 Scheduling notification:`, {
        title: content.title,
        trigger: normalizedTrigger,
        triggerTime: triggerTime?.toISOString(),
        triggerTimeLocal: triggerTime?.toLocaleString(),
        channelId: content.channelId,
        hasData: !!content.data,
        experienceId: content.data?.experienceId,
        notificationType: content.data?.type
      });
      
  const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: normalizedTrigger,
      });
      
      console.log(`✅ Successfully scheduled notification with ID: ${id}`);
      console.log(`   📅 Will fire at: ${triggerTime ? triggerTime.toLocaleString() : 'Unknown time'}`);
      
      // Add to notification history for bell/tray updates
      await this.addToHistory({
        id,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        receivedAt: new Date(),
        isRead: false,
        category: notification.data?.category || NotificationCategory.GENERAL_ANNOUNCEMENT,
        type: notification.data?.type || NotificationType.TWENTY_MINUTES_BEFORE,
        experienceId: notification.data?.experienceId,
      });
      
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
    if (this.inFlight[experienceId]) {
      console.log(`⏳ Skipping cancel; operation already in-flight for experience ${experienceId}`);
      return;
    }
    this.inFlight[experienceId] = 'cancel';
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
    } finally {
      this.inFlight[experienceId] = undefined;
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
      if (!stored) return [];
      
      const history: NotificationHistory[] = JSON.parse(stored);
      
      // Convert receivedAt strings back to Date objects
      return history.map(notification => ({
        ...notification,
        receivedAt: new Date(notification.receivedAt),
      }));
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
      
      // Emit event to sync across components
      notificationEvents.emit('notificationsUpdated');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.map(notification => ({ 
        ...notification, 
        isRead: true 
      }));
      
      await AsyncStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(updated));
      console.log(`✅ Marked all notifications as read`);
      
      // Emit event to sync across components
      notificationEvents.emit('notificationsUpdated');
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  }

  async removeNotification(notificationId: string): Promise<void> {
    try {
      const history = await this.getNotificationHistory();
      const updated = history.filter(notification => notification.id !== notificationId);
      
      await AsyncStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(updated));
      console.log(`✅ Removed notification: ${notificationId}`);
      
      // Emit event to sync across components
      notificationEvents.emit('notificationsUpdated');
    } catch (error) {
      console.error('❌ Error removing notification:', error);
    }
  }

  async clearNotificationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY_HISTORY);
      console.log('✅ Cleared notification history');
      
      // Emit event to sync across components
      notificationEvents.emit('notificationsUpdated');
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
      
      // Emit event to sync across components
      notificationEvents.emit('notificationsUpdated');
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
export { notificationEvents };
