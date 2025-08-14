import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as Notifications from 'expo-notifications';
import { getPersistedSchedule, listOsScheduled, resyncScheduledNotifications } from '@/services/NotificationScheduler';

export default function NotificationHealthScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const [perm, setPerm] = useState<string>('unknown');
  const [persisted, setPersisted] = useState<any>({});
  const [osList, setOsList] = useState<Notifications.NotificationRequest[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const p = await Notifications.getPermissionsAsync();
    setPerm(`${p.status}${p.canAskAgain ? ' (canAskAgain)' : ''}`);
    setPersisted(await getPersistedSchedule());
    setOsList(await listOsScheduled());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleResync = async () => {
    setBusy(true);
    try {
      const r = await resyncScheduledNotifications();
      Alert.alert('Resync Complete', `Rescheduled: ${r.rescheduled}\nRemoved stale: ${r.removed}`);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const handleClearAll = async () => {
    setBusy(true);
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Cleared', 'All OS-scheduled notifications cleared');
    } finally {
      setBusy(false);
      refresh();
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 16 }}>
      <Text style={[styles.title, { color: colors.text }]}>Notification Health</Text>
      <Text style={[styles.sub, { color: colors.secondaryText }]}>Permission: {perm}</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Actions</Text>
        <TouchableOpacity disabled={busy} style={[styles.button, { borderColor: colors.tint }]} onPress={handleResync}>
          <Text style={[styles.buttonText, { color: colors.tint }]}>{busy ? 'Resyncing…' : 'Resync from persisted map'}</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={busy} style={[styles.button, { borderColor: colors.error }]} onPress={handleClearAll}>
          <Text style={[styles.buttonText, { color: colors.error }]}>Clear all OS scheduled</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Persisted Schedule</Text>
        <Text style={[styles.mono, { color: colors.text }]}>{JSON.stringify(persisted, null, 2)}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>OS Scheduled</Text>
        <Text style={[styles.mono, { color: colors.text }]}>{JSON.stringify(osList, null, 2)}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  sub: { fontSize: 13, marginBottom: 16 },
  card: { padding: 12, borderRadius: 12, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  button: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginTop: 8, alignItems: 'center' },
  buttonText: { fontWeight: '700' },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any, fontSize: 12 },
});
