/*
  NotificationScheduler
  - Timezone-safe parsing using Luxon
  - Schedules local notifications with expo-notifications
  - Avoids duplicates via persisted map
  - Works with mixed time fields from Strapi
  - Single configurable offset (minutesBefore)
*/

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTime } from 'luxon';
import { Platform } from 'react-native';
import { ENV_CONFIG } from '@/constants/Environment';

export type ExperienceItem = {
  id: number;
  experience_title: string;
  experience_description?: any[] | string | null;
  auto_notification_enable?: boolean | null;
  experience_start_date_time?: string | null; // ISO string, event-local
  experience_date?: string | null; // YYYY-MM-DD (event-local)
  experience_start_time?: number | null; // HHMM as integer e.g., 1415
  event_timezone?: string | null; // IANA TZ like 'America/Los_Angeles' (preferred)
};

export type SchedulePayload = {
  schedule_experiences: { schedule_experience: ExperienceItem }[];
  event_timezone?: string | null; // Optional event-wide TZ fallback
};

const STORAGE_KEY = 'scheduled_experience_notifications_v1';

// Backward-compatible scheduled record: either legacy string id or structured entry
export type ScheduledEntry = { id: string; fireAt?: string; title?: string } | string;
export type ScheduledRecord = {
  [experienceId: number]: ScheduledEntry;
};

export type SchedulerOptions = {
  minutesBefore?: number; // default 20
  allowForegroundPresentation?: boolean; // allow banner in foreground for dev/demo
  forceSound?: boolean; // request sound for local notification
};

function firstSentenceFromRichText(input: any[] | string | null | undefined): string {
  if (!input) return '';
  let plain = '';
  if (Array.isArray(input)) {
    plain = input
      .map((block: any) => (Array.isArray(block?.children) ? block.children.map((c: any) => c?.text || '').join(' ') : ''))
      .join(' ');
  } else if (typeof input === 'string') {
    plain = input;
  }
  plain = plain.replace(/\s+/g, ' ').trim();
  const match = plain.match(/[^.!?]*[.!?]/);
  return match ? match[0].trim() : plain;
}

function parseEventDate(ex: ExperienceItem, _fallbackTz?: string): any | null {
  // Requirement: trigger at the same wall-clock time regardless of device timezone.
  // So we intentionally parse as naive local time (device zone), ignoring any provided tz.
  // Prefer full datetime
  if (ex.experience_start_date_time) {
    const dt = DateTime.fromISO(ex.experience_start_date_time); // local zone
    return dt.isValid ? dt : null;
  }

  // Fallback to date + HHMM integer
  if (ex.experience_date && typeof ex.experience_start_time === 'number') {
    const hh = Math.floor(ex.experience_start_time / 100);
    const mm = ex.experience_start_time % 100;
    const dt = DateTime.fromISO(ex.experience_date).set({ hour: hh, minute: mm });
    return dt.isValid ? dt : null;
  }

  return null;
}

async function ensurePermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

async function getScheduledMap(): Promise<ScheduledRecord> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as ScheduledRecord) : {};
}

async function setScheduledMap(map: ScheduledRecord): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function scheduleAllFromStrapi(
  payload: SchedulePayload,
  options: SchedulerOptions = {}
): Promise<void> {
  const minutesBefore = options.minutesBefore ?? 20;

  const ok = await ensurePermissions();

  const scheduled = await getScheduledMap();
  const fallbackTz = payload.event_timezone || undefined;

  // Android: ensure a high-importance channel exists so banners show
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
      });
    } catch {}
  }

  for (const item of payload.schedule_experiences || []) {
    const ex = item?.schedule_experience;
    if (!ex || !ex.id) continue;
    if (ex.auto_notification_enable === false) continue;

    const dt = parseEventDate(ex, fallbackTz);
    if (!dt) continue;

    // Use event-local time and schedule for X minutes before
    let fireAt = dt.minus({ minutes: minutesBefore });
    const now = DateTime.now();
    const eventInFuture = dt > now;
    const missedWindow = fireAt <= now && eventInFuture; // within the last 20 minutes

    // Avoid duplicates, but allow upgrading 'pending' entries when permissions become available
    const existing = scheduled[ex.id];
    const isPending = typeof existing !== 'string' && typeof (existing as any)?.id === 'string' && (existing as any).id.startsWith('pending:');
    if (existing && !(ok && isPending)) {
      // If we already have a real scheduled entry, or permissions are still not granted for a pending one, skip
      continue;
    }

  // Convert to absolute delay seconds from now for reliability across platforms
  let seconds = Math.ceil(fireAt.diff(now, 'seconds').seconds);
  if (missedWindow) {
    // Schedule ASAP (5s) if user opened the app after the 20-minute mark but before event start
    seconds = 5;
  }

    const body = firstSentenceFromRichText(ex.experience_description) || 'Starting soon.';

    if (ok && (eventInFuture || seconds > 0)) {
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: 'timeInterval',
        seconds,
        repeats: false,
        ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
      } as Notifications.TimeIntervalTriggerInput;

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: ex.experience_title,
          body,
          data: { 
            experienceId: ex.id,
            forceForegroundBanner: options.allowForegroundPresentation === true ? true : undefined,
            forceSound: (options.forceSound === true || ENV_CONFIG.IS_PRODUCTION === true) ? true : undefined,
          },
          sound: (options.forceSound === true || ENV_CONFIG.IS_PRODUCTION === true) ? true : undefined,
        },
        trigger,
      });

      // Persist identifier and the absolute scheduled time for countdowns
      scheduled[ex.id] = { id: identifier, fireAt: fireAt.toISO(), title: ex.experience_title } as any;
    } else {
      // No permission: persist a pending entry so countdown still works; will be upgraded later
      scheduled[ex.id] = { id: `pending:${ex.id}`, fireAt: fireAt.toISO(), title: ex.experience_title } as any;
    }
  }

  await setScheduledMap(scheduled);
}

// Helper to cancel all scheduled notifications for these experiences (by id)
export async function cancelByExperienceIds(ids: number[]): Promise<void> {
  const scheduled = await getScheduledMap();
  for (const id of ids) {
    const entry = scheduled[id];
    const identifier = typeof entry === 'string' ? entry : entry?.id;
    if (identifier) {
      try {
        await Notifications.cancelScheduledNotificationAsync(identifier);
      } catch {}
      delete scheduled[id];
    }
  }
  await setScheduledMap(scheduled);
}

// Helper: get the next scheduled notification entry (soonest by fireAt)
export async function getNextScheduledNotification(filterIds?: number[]): Promise<{ experienceId: number; fireAt: Date; title?: string } | null> {
  const scheduled = await getScheduledMap();
  const now = new Date();
  let best: { experienceId: number; fireAt: Date; title?: string } | null = null;
  for (const key of Object.keys(scheduled)) {
    const expId = Number(key);
    if (filterIds && !filterIds.includes(expId)) continue;
    const entry = scheduled[expId];
  const fireISO = typeof entry === 'string' ? undefined : (entry as any)?.fireAt;
  const title = typeof entry === 'string' ? undefined : (entry as any)?.title;
    if (!fireISO) continue;
    const when = new Date(fireISO);
    if (isNaN(when.getTime())) continue;
    if (when <= now) continue;
    if (!best || when < best.fireAt) {
      best = { experienceId: expId, fireAt: when, title };
    }
  }
  return best;
}

// Example integration with a mock file placed in assets or a local json import can call scheduleAllFromStrapi
