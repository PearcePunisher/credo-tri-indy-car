import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ENV_CONFIG } from '@/constants/Environment';

// Global flags to avoid duplicate handler registration and to allow dev overrides
declare global {
  // eslint-disable-next-line no-var
  var __notifHandlerInitialized__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __notifDevBanner__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __notifDevSound__: boolean | undefined;
}

function applyHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data: any = notification?.request?.content?.data || {};
      // Production: always show. Dev: allow force flags or global overrides.
      const allowBanner = ENV_CONFIG.IS_PRODUCTION === true || data?.forceForegroundBanner === true || global.__notifDevBanner__ === true;
      const allowSound = ENV_CONFIG.IS_PRODUCTION === true || data?.forceSound === true || global.__notifDevSound__ === true;
      return {
        shouldShowBanner: !!allowBanner,
        shouldShowList: !!allowBanner,
        shouldPlaySound: !!allowSound,
        shouldSetBadge: false,
      };
    },
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFFFFFFF',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch (e) {
    console.warn('[Notifications] Failed to set Android channel', e);
  }
}

export async function initNotifications() {
  if (global.__notifHandlerInitialized__) {
    return;
  }
  global.__notifHandlerInitialized__ = true;
  // Default dev overrides disabled
  if (typeof global.__notifDevBanner__ === 'undefined') global.__notifDevBanner__ = false;
  if (typeof global.__notifDevSound__ === 'undefined') global.__notifDevSound__ = false;

  applyHandler();
  await ensureAndroidChannel();
  console.log('[Notifications] Initialized (handler + channel)');
}

export function setForegroundOverride(enableBanner: boolean, enableSound?: boolean) {
  global.__notifDevBanner__ = !!enableBanner;
  if (typeof enableSound !== 'undefined') {
    global.__notifDevSound__ = !!enableSound;
  } else if (enableBanner) {
    // if enabling banner override, default sound to true as well for dev
    global.__notifDevSound__ = true;
  }
  // Re-apply handler so overrides take effect immediately
  applyHandler();
  console.log('[Notifications] Foreground override set:', { banner: global.__notifDevBanner__, sound: global.__notifDevSound__ });
}

export default initNotifications;
