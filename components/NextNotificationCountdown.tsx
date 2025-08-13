import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getNextScheduledNotification } from '@/services/NotificationScheduler';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

function formatRemaining(ms: number) {
  if (ms <= 0) return 'now';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

type Props = {
  experienceIds?: number[];
  // Fallback to next event start time when no notification is scheduled (e.g., past the 20-min window)
  fallbackWhen?: Date | null;
  fallbackTitle?: string;
};

export function NextNotificationCountdown({ experienceIds, fallbackWhen, fallbackTitle }: Props) {
  const [target, setTarget] = useState<{ title?: string; when?: Date; kind: 'notification' | 'event' | 'none' }>({ kind: 'none' });
  const [remaining, setRemaining] = useState<string>('');
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const next = await getNextScheduledNotification(experienceIds);
      if (!mounted) return;
      const now = Date.now();
      if (next) {
        setTarget({ title: next.title, when: next.fireAt, kind: 'notification' });
        return;
      }

      // Fallback to next event start time if provided and in the future
      if (fallbackWhen && fallbackWhen.getTime() > now) {
        setTarget({ title: fallbackTitle, when: fallbackWhen, kind: 'event' });
      } else {
        setTarget({ kind: 'none' });
      }
    };

    refresh();
    const poll = setInterval(refresh, 10_000); // poll every 10s in case schedules change
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [experienceIds, fallbackWhen?.getTime(), fallbackTitle]);

  useEffect(() => {
    if (!target?.when) {
      setRemaining('');
      return;
    }
    const tick = () => {
      const ms = target.when!.getTime() - Date.now();
      setRemaining(formatRemaining(ms));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.secondaryText }]}>
        {target.kind === 'notification' ? 'Next notification' : target.kind === 'event' ? 'Next event' : 'Next notification'}
      </Text>
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {target.when ? (target.title || (target.kind === 'event' ? 'Upcoming event' : 'Scheduled experience')) : 'None scheduled'}
      </Text>
      <Text style={[styles.remaining, { color: colors.tint }]}>
        {target.when ? remaining : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  remaining: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
  },
});

export default NextNotificationCountdown;
