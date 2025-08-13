import * as Notifications from 'expo-notifications';

let enabled = false;

export function enableForegroundBanners(enable: boolean) {
  enabled = enable;
  if (!enabled) return;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data: any = notification?.request?.content?.data || {};
      const allow = data?.forceForegroundBanner === true;
      const sound = data?.forceSound === true;
      return {
        shouldShowBanner: allow,
        shouldShowList: allow,
        shouldPlaySound: sound,
        shouldSetBadge: false,
      };
    },
  });
}

export default enableForegroundBanners;
