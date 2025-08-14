import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { scheduleAllFromStrapi, type SchedulePayload } from '@/services/NotificationScheduler';
import { enableForegroundBanners } from '@/services/ForegroundNotificationHandler';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function MockScheduleNotificationDemo() {
  const [status, setStatus] = useState<string>('Idle');
  const [permission, setPermission] = useState<string>('unknown');
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  // Basic debug: permission + scheduled list count
  const refreshDebug = useCallback(async () => {
    try {
      const perm = await Notifications.getPermissionsAsync();
      setPermission(`${perm.status}${perm.canAskAgain ? ' (canAskAgain)' : ''}`);
      const list = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledCount(list.length);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      // Request permissions up front for more reliable iOS behavior
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      await refreshDebug();
    })();
  }, [refreshDebug]);

  const handleSchedule = useCallback(async () => {
    setStatus('Scheduling...');
  // Enable foreground banners/sound for demo in Expo Go
  enableForegroundBanners(true);

    // Create a simple mock payload emulating Strapi response shape
    const now = new Date();
    const inMinutes = 2; // schedule 2 minutes from now (then the scheduler subtracts 1 minute lead we choose below)
    const eventDate = new Date(now.getTime() + inMinutes * 60 * 1000);

    const isoLocal = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      eventDate.getHours(),
      eventDate.getMinutes(),
      0,
      0
    ).toISOString();

    const payload: SchedulePayload = {
      schedule_experiences: [
        {
          schedule_experience: {
            id: 999999,
            experience_title: 'Demo Experience',
            experience_description: [
              { type: 'paragraph', children: [{ text: 'This is a mock event used to test local notifications.' }] },
            ],
            auto_notification_enable: true,
            experience_start_date_time: isoLocal,
          },
        },
      ],
    };

    try {
      // Use 1 minute lead so it fires ~1 minute from now
  await scheduleAllFromStrapi(payload, { minutesBefore: 1, allowForegroundPresentation: true, forceSound: true });
      setStatus('Scheduled a demo notification');
      await refreshDebug();
    } catch (e) {
      console.warn('Mock schedule failed', e);
      setStatus('Failed to schedule');
    }
  }, []);

  const handleImmediate = useCallback(async () => {
    try {
      // Ensure banners in foreground for this immediate test
      enableForegroundBanners(true);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Immediate Test',
          body: 'If you see this, local notifications work.',
          data: { forceForegroundBanner: true, forceSound: true },
          sound: true,
        },
        trigger: null, // fire now
      });
      setStatus('Fired immediate test notification');
    } catch (e) {
      setStatus('Immediate test failed');
    }
  }, []);

  const handleInTenSeconds = useCallback(async () => {
    try {
      enableForegroundBanners(true);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '10s Test',
          body: 'Should appear in ~10s.',
          data: { forceForegroundBanner: true, forceSound: true },
          sound: true,
        },
        trigger: { date: new Date(Date.now() + 10_000) } as Notifications.NotificationTriggerInput,
      });
      setStatus('Scheduled 10s test');
      await refreshDebug();
    } catch (e) {
      setStatus('10s test failed');
    }
  }, [refreshDebug]);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.title, { color: colors.text }]}>Mock Schedule Demo</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={handleSchedule}>
        <Text style={[styles.buttonText, { color: colors.textOnGreen }]}>Schedule Demo Notification (~1 min)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.card }]} onPress={handleImmediate}>
        <Text style={[styles.buttonTextAlt, { color: colors.text }]}>Fire Immediate Test</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.card }]} onPress={handleInTenSeconds}>
        <Text style={[styles.buttonTextAlt, { color: colors.text }]}>Schedule 10s Test</Text>
      </TouchableOpacity>
      <Text style={[styles.status, { color: colors.secondaryText }]}>{status}</Text>
      <Text style={[styles.debug, { color: colors.secondaryText }]}>Permission: {permission} • Scheduled: {scheduledCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  button: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  buttonText: { fontWeight: '700' },
  buttonTextAlt: { fontWeight: '700' },
  status: { marginTop: 12 },
  debug: { marginTop: 4, fontSize: 12 },
});
