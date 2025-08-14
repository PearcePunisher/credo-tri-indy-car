import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from '@/constants/Environment';

export interface PushTokenRegistrationResult {
  success: boolean;
  token?: string;
  error?: string;
  requiresPermission?: boolean;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  providedByUser: boolean;
}

class PushTokenService {
  private static instance: PushTokenService;
  private readonly STORAGE_KEY_TOKEN = 'expo_push_token';
  private readonly STORAGE_KEY_PERMISSION = 'notification_permission_status';
  private readonly STORAGE_KEY_REGISTERED = 'push_token_registered';

  public static getInstance(): PushTokenService {
    if (!PushTokenService.instance) {
      PushTokenService.instance = new PushTokenService();
    }
    return PushTokenService.instance;
  }

  /**
   * Request notification permissions following platform best practices
   */
  async requestNotificationPermissions(): Promise<NotificationPermissionStatus> {
    try {
      // First check current permission status
      const currentStatus = await Notifications.getPermissionsAsync();
      
      if (currentStatus.granted) {
        console.log('✅ Notification permissions already granted');
        return {
          granted: true,
          canAskAgain: currentStatus.canAskAgain,
          providedByUser: true
        };
      }

      // Check if we can ask for permissions
      if (!currentStatus.canAskAgain) {
        console.log('⚠️ Cannot ask for notification permissions again');
        return {
          granted: false,
          canAskAgain: false,
          providedByUser: false
        };
      }

      // Request permissions
      console.log('🔔 Requesting notification permissions...');
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
          allowProvisional: false,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      const result = {
        granted: status === 'granted',
        canAskAgain,
        providedByUser: true
      };

      // Store permission status
      await AsyncStorage.setItem(
        this.STORAGE_KEY_PERMISSION,
        JSON.stringify({
          ...result,
          timestamp: Date.now(),
          platform: Platform.OS
        })
      );

      if (result.granted) {
        console.log('✅ Notification permissions granted');
      } else {
        console.log('❌ Notification permissions denied');
      }

      return result;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return {
        granted: false,
        canAskAgain: true,
        providedByUser: false
      };
    }
  }

  /**
   * Get Expo push token with comprehensive error handling
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Check for project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? ENV_CONFIG.PROJECT_ID;
      if (!projectId) {
        console.error('❌ No Expo project ID found. Push tokens require a valid project ID.');
        return null;
      }

      console.log('📱 Generating Expo push token...');
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenResponse.data;
      console.log('✅ Expo push token generated:', token.substring(0, 20) + '...');

      // Store token locally
      await AsyncStorage.setItem(this.STORAGE_KEY_TOKEN, token);
      await AsyncStorage.setItem('push_token_timestamp', Date.now().toString());

      return token;
    } catch (error) {
      console.error('❌ Error getting Expo push token:', error);
      return null;
    }
  }

  /**
   * Register push token with backend
   */
  async registerTokenWithBackend(userId: string, token: string, authToken?: string): Promise<boolean> {
    try {
      if (!ENV_CONFIG.STRAPI_URL) {
        console.warn('⚠️ No Strapi URL configured, skipping backend registration');
        return false;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      console.log('🌐 Registering push token with backend...');
      const response = await fetch(
        `${ENV_CONFIG.STRAPI_URL}/api/notifications/push-token/${userId}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            expoPushToken: token,
            platform: Platform.OS,
            deviceInfo: {
              modelName: Device.modelName,
              osName: Device.osName,
              osVersion: Device.osVersion,
              appVersion: Constants.expoConfig?.version,
            },
            registeredAt: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        console.log('✅ Push token registered with backend');
        await AsyncStorage.setItem(this.STORAGE_KEY_REGISTERED, 'true');
        await AsyncStorage.setItem('push_token_backend_registered', Date.now().toString());
        return true;
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Backend push token registration failed (this is optional):', response.status, errorText);
        
        // If it's a method not allowed error, the backend doesn't support this endpoint yet
        if (response.status === 405) {
          console.log('ℹ️ Backend push token endpoint not implemented yet - notification system will work locally');
        }
        
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Error registering push token with backend (this is optional):', error);
      console.log('ℹ️ Notification system will continue to work locally without backend integration');
      return false;
    }
  }

  /**
   * Complete push token registration process
   */
  async registerPushToken(userId: string, authToken?: string): Promise<PushTokenRegistrationResult> {
    try {
      // Step 1: Request permissions
      const permissionStatus = await this.requestNotificationPermissions();
      
      if (!permissionStatus.granted) {
        return {
          success: false,
          requiresPermission: true,
          error: 'Notification permissions not granted'
        };
      }

      // Step 2: Get push token
      const token = await this.getExpoPushToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Failed to generate push token'
        };
      }

      // Step 3: Register with backend (optional, will fallback gracefully)
      const backendRegistered = await this.registerTokenWithBackend(userId, token, authToken);
      
      if (!backendRegistered) {
        console.warn('⚠️ Backend registration failed, but local token is available');
      }

      // Step 4: Configure notification handler
      this.configureNotificationHandler();

      return {
        success: true,
        token
      };
    } catch (error) {
      console.error('❌ Error in push token registration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Configure notification behavior
   */
  private configureNotificationHandler(): void {
  // Handler is configured centrally; only set categories here
  // Configure notification categories for interactive notifications
    this.setupNotificationCategories();
  }

  /**
   * Setup notification categories for interactive actions
   */
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

      // Race update actions
      await Notifications.setNotificationCategoryAsync('race_update', [
        {
          identifier: 'view_update',
          buttonTitle: 'View Update',
          options: { opensAppToForeground: true },
        },
      ]);

      console.log('✅ Notification categories configured');
    } catch (error) {
      console.error('❌ Error setting up notification categories:', error);
    }
  }

  /**
   * Check if push token is already registered
   */
  async isTokenRegistered(): Promise<boolean> {
    try {
      const registered = await AsyncStorage.getItem(this.STORAGE_KEY_REGISTERED);
      const token = await AsyncStorage.getItem(this.STORAGE_KEY_TOKEN);
      return registered === 'true' && !!token;
    } catch (error) {
      console.error('Error checking token registration status:', error);
      return false;
    }
  }

  /**
   * Get stored push token
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEY_TOKEN);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  /**
   * Clear stored token and registration status
   */
  async clearRegistration(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.STORAGE_KEY_TOKEN,
        this.STORAGE_KEY_REGISTERED,
        'push_token_timestamp',
        'push_token_backend_registered'
      ]);
      console.log('✅ Push token registration cleared');
    } catch (error) {
      console.error('Error clearing token registration:', error);
    }
  }

  /**
   * Check notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      return {
        granted: status === 'granted',
        canAskAgain,
        providedByUser: true
      };
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        granted: false,
        canAskAgain: true,
        providedByUser: false
      };
    }
  }

  /**
   * Send test notification (for debugging)
   */
  async sendTestNotification(title: string, body: string): Promise<void> {
    try {
      const permissionStatus = await this.getPermissionStatus();
      if (!permissionStatus.granted) {
        console.warn('⚠️ Cannot send test notification: permissions not granted');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { test: true },
          sound: 'default',
        },
        trigger: null, // Send immediately
      });

      console.log('✅ Test notification sent');
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
    }
  }
}

export const pushTokenService = PushTokenService.getInstance();
export default PushTokenService;
