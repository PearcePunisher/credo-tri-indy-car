import { setForegroundOverride } from '@/services/NotificationBootstrap';

export function enableForegroundBanners(enable: boolean) {
  setForegroundOverride(enable, enable);
}

export default enableForegroundBanners;
