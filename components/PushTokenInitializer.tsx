import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { pushTokenService } from '@/services/PushTokenService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PushTokenInitializerProps {
  children?: React.ReactNode;
}

/**
 * PushTokenInitializer handles automatic push token registration
 * for authenticated users who have consented to notifications.
 * This should be placed near the root of your app component tree.
 */
export const PushTokenInitializer: React.FC<PushTokenInitializerProps> = ({ children }) => {
  const { authState, updateNotificationSubscription } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] = useState(false);

  useEffect(() => {
    if (authState.isAuthenticated && authState.user && !hasAttemptedRegistration) {
      initializePushTokens();
    }
  }, [authState.isAuthenticated, authState.user, hasAttemptedRegistration]);

  const initializePushTokens = async () => {
    try {
      setHasAttemptedRegistration(true);
      
      const user = authState.user;
      if (!user) return;

      console.log('🔔 Initializing push tokens for authenticated user...');

      // Check if user has consented to notifications
      const hasConsented = user.notificationSubscribed;
      if (!hasConsented) {
        console.log('📵 User has not consented to notifications, skipping push token registration');
        setIsInitialized(true);
        return;
      }

      // Check if token is already registered
      const isAlreadyRegistered = await pushTokenService.isTokenRegistered();
      if (isAlreadyRegistered) {
        console.log('✅ Push token already registered');
        setIsInitialized(true);
        return;
      }

      // Check permission status first
      const permissionStatus = await pushTokenService.getPermissionStatus();
      if (!permissionStatus.granted) {
        console.log('⚠️ Notification permissions not granted, will request during registration');
      }

      // Attempt to register push token
      const userId = user.serverId || user.id;
      const authToken = await AsyncStorage.getItem('authToken'); // Get auth token if available
      
      const result = await pushTokenService.registerPushToken(userId, authToken || undefined);
      
      if (result.success) {
        console.log('✅ Push token registration successful during app initialization');
        
        // Update user's notification subscription with the new token
        await updateNotificationSubscription(true, result.token);
        
      } else if (result.requiresPermission) {
        console.log('⚠️ Push token registration requires permission - will prompt user when needed');
        // Don't show permission prompt immediately on app start
        // Let the user discover notification features naturally
        
      } else {
        console.warn('⚠️ Push token registration failed during initialization:', result.error);
      }

    } catch (error) {
      console.error('❌ Error during push token initialization:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  // This component doesn't render anything visible, it just handles initialization
  return null;
};

/**
 * Hook to handle push token registration with user interaction.
 * Use this when you need to prompt the user for notification permissions
 * in response to user action (e.g., when they toggle notifications in settings).
 */
export const usePushTokenRegistration = () => {
  const { authState, updateNotificationSubscription } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const registerWithUserPrompt = async (): Promise<boolean> => {
    if (!authState.user) {
      console.warn('No authenticated user found');
      return false;
    }

    setIsRegistering(true);
    
    try {
      const userId = authState.user.serverId || authState.user.id;
      const authToken = await AsyncStorage.getItem('authToken');
      
      const result = await pushTokenService.registerPushToken(userId, authToken || undefined);
      
      if (result.success) {
        console.log('✅ Push token registered with user interaction');
        await updateNotificationSubscription(true, result.token);
        
        Alert.alert(
          'Notifications Enabled',
          'You will now receive race updates, experience reminders, and important announcements.',
          [{ text: 'OK' }]
        );
        
        return true;
        
      } else if (result.requiresPermission) {
        Alert.alert(
          'Notification Permission Required',
          'To receive notifications, please enable them in your device settings.\n\nGo to Settings → Apps → Credo Tri Indy Car → Notifications',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // On iOS, you can't directly open app settings, but this will open general settings
              if (Platform.OS === 'ios') {
                // Linking.openURL('app-settings:') doesn't work reliably
                Alert.alert(
                  'Enable Notifications',
                  'Go to Settings → Notifications → Credo Tri Indy Car and turn on notifications.',
                  [{ text: 'OK' }]
                );
              } else {
                // On Android, you could potentially open app-specific settings
                Alert.alert(
                  'Enable Notifications',
                  'Go to Settings → Apps → Credo Tri Indy Car → Notifications and enable them.',
                  [{ text: 'OK' }]
                );
              }
            }}
          ]
        );
        
        return false;
        
      } else {
        Alert.alert(
          'Notification Setup Failed',
          'There was an issue setting up notifications. Please try again later.',
          [{ text: 'OK' }]
        );
        
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error during user-prompted registration:', error);
      
      Alert.alert(
        'Error',
        'An unexpected error occurred while setting up notifications.',
        [{ text: 'OK' }]
      );
      
      return false;
      
    } finally {
      setIsRegistering(false);
    }
  };

  const disableNotifications = async (): Promise<boolean> => {
    try {
      setIsRegistering(true);
      
      // Clear local registration
      await pushTokenService.clearRegistration();
      
      // Update user subscription status
      await updateNotificationSubscription(false);
      
      console.log('✅ Notifications disabled successfully');
      
      Alert.alert(
        'Notifications Disabled',
        'You will no longer receive push notifications. You can re-enable them anytime in settings.',
        [{ text: 'OK' }]
      );
      
      return true;
      
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
      
      Alert.alert(
        'Error',
        'There was an issue disabling notifications. Please try again.',
        [{ text: 'OK' }]
      );
      
      return false;
      
    } finally {
      setIsRegistering(false);
    }
  };

  const checkRegistrationStatus = async (): Promise<boolean> => {
    try {
      return await pushTokenService.isTokenRegistered();
    } catch (error) {
      console.error('Error checking registration status:', error);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<void> => {
    try {
      await pushTokenService.sendTestNotification(
        'Test Notification',
        'This is a test notification to verify your setup is working correctly.'
      );
      
      Alert.alert(
        'Test Sent',
        'Test notification sent! You should see it momentarily.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error sending test notification:', error);
      
      Alert.alert(
        'Test Failed',
        'Unable to send test notification. Please check your notification settings.',
        [{ text: 'OK' }]
      );
    }
  };

  return {
    registerWithUserPrompt,
    disableNotifications,
    checkRegistrationStatus,
    sendTestNotification,
    isRegistering,
    isAuthenticated: authState.isAuthenticated,
    hasConsentedToNotifications: authState.user?.notificationSubscribed || false,
  };
};

export default PushTokenInitializer;
