import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { parseISO, format } from 'date-fns';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import BrandLogo from '@/components/BrandLogo'; // Adjust the import path as necessary
import { SPORTRADAR_API_KEY } from '@env';

const ScheduleScreen = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch(
          `https://api.sportradar.com/indycar/trial/v2/en/sport_events/sr:stage:576235/schedule.json?api_key=${SPORTRADAR_API_KEY}`
        );
        const data = await response.json();
        setSchedule(data.stages || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Group schedule by month
  const groupedSchedule = schedule.reduce((acc, item) => {
    const date = parseISO(item.scheduled);
    const month = format(date, 'MMMM');
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  // Get months sorted by the first event's date in each month
  const sortedMonths = Object.keys(groupedSchedule).sort((a, b) => {
    const aDate = parseISO(groupedSchedule[a][0].scheduled);
    const bDate = parseISO(groupedSchedule[b][0].scheduled);
    return aDate.getTime() - bDate.getTime();
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo style={{ marginBottom: 16 }} />
        <Text style={[styles.header, { color: colors.text }]}>2025 Schedule</Text>
        {sortedMonths.map((month) => (
          <View key={month} style={styles.monthSection}>
            <Text style={[styles.monthTitle, { color: colors.tint }]}>{month}</Text>
            {groupedSchedule[month].map((event: any, idx: number) => {
              const eventDate = format(parseISO(event.scheduled), 'MMMM d, h:mm a');
              return (
                <View key={idx} style={[styles.card, { backgroundColor: colors.card }]}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>{event.description}</Text>
                  <Text style={[styles.venue, { color: colors.text }]}>
                    {event.venue?.name} — {event.venue?.city}, {event.venue?.country}
                  </Text>
                  <Text style={[styles.date, { color: colors.text }]}>{eventDate}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16 },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  monthSection: { marginBottom: 24 },
  monthTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  card: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  eventTitle: { fontSize: 16, fontWeight: 'bold' },
  venue: { fontSize: 14 },
  date: { fontSize: 12, color: '#888' },
});

export default ScheduleScreen;
