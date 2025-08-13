import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scheduleAllFromStrapi, type SchedulePayload } from '@/services/NotificationScheduler';

export default function MockScheduleNotificationDemo() {
  const [status, setStatus] = useState<string>('Idle');

  const handleSchedule = useCallback(async () => {
    setStatus('Scheduling...');

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
      await scheduleAllFromStrapi(payload, { minutesBefore: 1 });
      setStatus('Scheduled a demo notification');
    } catch (e) {
      console.warn('Mock schedule failed', e);
      setStatus('Failed to schedule');
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mock Schedule Demo</Text>
      <TouchableOpacity style={styles.button} onPress={handleSchedule}>
        <Text style={styles.buttonText}>Schedule Demo Notification</Text>
      </TouchableOpacity>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
  button: { backgroundColor: '#0a7', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '700' },
  status: { marginTop: 12 },
});
