import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { enhancedNotificationService, NotificationHistory } from '@/services/EnhancedNotificationService';
import { useRouter } from 'expo-router';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UseEnhancedNotificationsProps {
  userId?: string;
  jwtToken?: string;
  isVIP?: boolean;
}

export function useEnhancedNotifications({ userId, jwtToken, isVIP }: UseEnhancedNotificationsProps) {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const router = useRouter();
  
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Wait for app to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (userId && jwtToken) {
          // Register for push notifications
          await enhancedNotificationService.registerForPushNotifications(userId, jwtToken);
        }

        // Load notification history
        await loadNotificationHistory();
        
        setIsInitialized(true);
        console.log('✅ Enhanced notifications initialized');
      } catch (error) {
        console.error('❌ Error initializing enhanced notifications:', error);
      }
    };

    initializeNotifications();
  }, [userId, jwtToken]);

  // Setup notification listeners
  useEffect(() => {
    if (!isInitialized) return;

    // Listen for incoming notifications (when app is in foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('📱 Notification received in foreground:', notification);
      
      // Handle the notification
      await enhancedNotificationService.handleNotificationReceived(notification);
      
      // Refresh local state
      await loadNotificationHistory();
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      console.log('👆 Notification response received:', response);
      
      // Handle the response
      const result = await enhancedNotificationService.handleNotificationResponse(response);
      
      if (result) {
        // Handle navigation based on action
        handleNotificationAction(result.action, result.data);
      }
      
      // Refresh local state
      await loadNotificationHistory();
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isInitialized]);

  // Load notification history from storage
  const loadNotificationHistory = async () => {
    try {
      const history = await enhancedNotificationService.getNotificationHistory();
      const unread = await enhancedNotificationService.getUnreadCount();
      
      setNotificationHistory(history);
      setUnreadCount(unread);
    } catch (error) {
      console.error('❌ Error loading notification history:', error);
    }
  };

  // Handle notification actions
  const handleNotificationAction = (action: string, data: any) => {
    try {
      switch (action) {
        case 'view_details':
          if (data?.experienceId) {
            // Navigate to experience details
            router.push(`/experience?id=${data.experienceId}`);
          }
          break;
          
        case 'get_directions':
          if (data?.experienceId) {
            // Navigate to directions page
            router.push('/directions');
          }
          break;
          
        case 'view_update':
          if (data?.experienceId) {
            // Navigate to experience details with update highlight
            router.push(`/experience?id=${data.experienceId}&highlight=update`);
          }
          break;
          
        case 'dismiss':
          // Just mark as read (already handled)
          break;
          
        default:
          console.log('🔍 Unknown notification action:', action);
          break;
      }
    } catch (error) {
      console.error('❌ Error handling notification action:', error);
    }
  };

  // Schedule notifications for an experience
  const scheduleExperienceNotifications = async (experienceId: number) => {
    try {
      // This will be called from the ExperiencesService
      console.log(`📅 Scheduling notifications for experience: ${experienceId}`);
    } catch (error) {
      console.error('❌ Error scheduling experience notifications:', error);
      throw error;
    }
  };

  // Cancel notifications for an experience
  const cancelExperienceNotifications = async (experienceId: number) => {
    try {
      await enhancedNotificationService.cancelExperienceNotifications(experienceId);
      console.log(`🚫 Cancelled notifications for experience: ${experienceId}`);
    } catch (error) {
      console.error('❌ Error canceling experience notifications:', error);
      throw error;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await enhancedNotificationService.markNotificationAsRead(notificationId);
      await loadNotificationHistory();
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Clear all notification history
  const clearHistory = async () => {
    try {
      await enhancedNotificationService.clearNotificationHistory();
      await loadNotificationHistory();
    } catch (error) {
      console.error('❌ Error clearing notification history:', error);
    }
  };

  // Request notification permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      return await enhancedNotificationService.requestPermissions();
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      await enhancedNotificationService.sendTestNotification();
      await loadNotificationHistory(); // Refresh history
      console.log('📨 Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  };

  return {
    // State
    notificationHistory,
    unreadCount,
    isInitialized,
    
    // Actions
    scheduleExperienceNotifications,
    cancelExperienceNotifications,
    markAsRead,
    clearHistory,
    requestPermissions,
    sendTestNotification,
    loadNotificationHistory,
  };
}

export default useEnhancedNotifications;
