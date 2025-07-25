import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { notificationService } from '@/services/NotificationService';
import { STRAPI_CONFIG, buildApiUrl } from '@/constants/StrapiConfig';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface UseNotificationsProps {
  userId?: string;
  jwtToken?: string;
  isVIP?: boolean;
}

export function useNotifications({ userId, jwtToken, isVIP }: UseNotificationsProps) {
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Delay initialization to avoid crashes during app startup
    const initializeNotifications = async () => {
      try {
        // Wait for app to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (userId && jwtToken) {
          // Register for push notifications
          await registerForPushNotifications();
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Listen for incoming notifications
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
        // Handle the notification when app is in foreground
        handleNotificationReceived(notification);
      });

      // Listen for notification responses (when user taps notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        // Handle navigation based on notification data
        handleNotificationResponse(response);
      });
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
    }

    return () => {
      try {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        console.error('Error cleaning up notification listeners:', error);
      }
    };
  }, [userId, jwtToken]);

  const registerForPushNotifications = async () => {
    try {
      // Request permissions
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        console.warn('Push notification permissions denied');
        return;
      }

      // Register token with backend
      if (userId && jwtToken) {
        const success = await notificationService.registerPushTokenWithBackend(
          userId,
          jwtToken,
          STRAPI_CONFIG.baseUrl
        );
        
        if (success) {
          console.log('Successfully registered for push notifications');
        } else {
          console.error('Failed to register push token with backend');
        }
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    // You can customize this based on notification type
    const { data } = notification.request.content;
    
    switch (data?.type) {
      case 'race_update':
        // Handle race update notifications
        console.log('Race update received:', data);
        break;
      case 'vip_experience':
        // Handle VIP experience notifications
        console.log('VIP experience notification:', data);
        break;
      default:
        console.log('General notification received');
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content;
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'race_update':
        // Navigate to schedule or race info
        if (data.raceId) {
          // router.push(`/race/${data.raceId}`);
        }
        break;
      case 'vip_experience':
        // Navigate to experience page
        if (data.experienceId) {
          // router.push(`/experience/${data.experienceId}`);
        }
        break;
      case 'schedule_change':
        // Navigate to schedule
        // router.push('/schedule');
        break;
      default:
        // Navigate to home
        // router.push('/');
    }
  };

  const sendTestNotification = async () => {
    if (!userId || !jwtToken) {
      console.warn('User not authenticated');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/notifications/send-immediate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from your IndyCar app!',
          data: { type: 'general' },
          targetType: 'specific',
          userIds: [userId]
        })
      });

      if (response.ok) {
        console.log('Test notification sent successfully');
      } else {
        console.error('Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  const updateActivity = async () => {
    if (userId && jwtToken) {
      await notificationService.updateUserActivity(userId, jwtToken, STRAPI_CONFIG.baseUrl);
    }
  };

  return {
    notificationService,
    sendTestNotification,
    updateActivity,
    registerForPushNotifications
  };
}
