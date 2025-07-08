import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  badge?: number;
}

class NotificationService {
  
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }
      
      // Get push token for remote notifications
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }
  
  async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }
  
  async scheduleLocalNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Notification permissions not granted');
      }

      // Build content object, only including badge if it's a valid number
      const content: any = {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound !== false,
      };

      // Only include badge if it's a valid number
      if (typeof notification.badge === 'number' && notification.badge >= 0) {
        content.badge = notification.badge;
      }
      
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger: trigger || null, // null means immediate
      });
      
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }
  
  async sendImmediateNotification(notification: NotificationData): Promise<string | null> {
    return this.scheduleLocalNotification(notification);
  }
  
  async scheduleRaceReminder(
    raceTitle: string,
    raceDate: Date,
    minutesBefore: number = 60
  ): Promise<string | null> {
    const triggerDate = new Date(raceDate.getTime() - minutesBefore * 60 * 1000);
    
    if (triggerDate <= new Date()) {
      console.warn('Race reminder time is in the past');
      return null;
    }
    
    return this.scheduleLocalNotification(
      {
        title: 'Race Starting Soon! 🏁',
        body: `${raceTitle} starts in ${minutesBefore} minutes`,
        data: { type: 'race_reminder', raceTitle, raceDate: raceDate.toISOString() },
      },
      null // Use null for immediate notification for now
    );
  }
  
  async scheduleEventReminder(
    eventTitle: string,
    eventDate: Date,
    minutesBefore: number = 30
  ): Promise<string | null> {
    const triggerDate = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
    
    if (triggerDate <= new Date()) {
      console.warn('Event reminder time is in the past');
      return null;
    }
    
    return this.scheduleLocalNotification(
      {
        title: 'Upcoming Event Reminder',
        body: `${eventTitle} starts in ${minutesBefore} minutes`,
        data: { type: 'event_reminder', eventTitle, eventDate: eventDate.toISOString() },
      },
      null // Use null for immediate notification for now
    );
  }
  
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }
  
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }
  
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
  
  // Predefined notification templates for common use cases
  async sendRaceUpdateNotification(message: string): Promise<string | null> {
    return this.sendImmediateNotification({
      title: 'Race Update 🏎️',
      body: message,
      data: { type: 'race_update' },
      badge: 1,
    });
  }
  
  async sendTeamNewsNotification(message: string): Promise<string | null> {
    return this.sendImmediateNotification({
      title: 'Team News 📰',
      body: message,
      data: { type: 'team_news' },
      badge: 1,
    });
  }
  
  async sendWeatherUpdateNotification(message: string): Promise<string | null> {
    return this.sendImmediateNotification({
      title: 'Weather Update 🌤️',
      body: message,
      data: { type: 'weather_update' },
      badge: 1,
    });
  }
  
  async sendParkingInfoNotification(message: string): Promise<string | null> {
    return this.sendImmediateNotification({
      title: 'Parking Information 🅿️',
      body: message,
      data: { type: 'parking_info' },
      badge: 1,
    });
  }
}

export const notificationService = new NotificationService();
