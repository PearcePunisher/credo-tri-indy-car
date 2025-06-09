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
import BrandLogo from '@/components/BrandLogo';
// Import the local JSON file
// Adjust 'scheduleData.json' if your filename is different
import scheduleData from '/Users/rileypearce/dev/credo-tri-indy-car/race_data/scheduleData.json';

const ScheduleScreen = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    try {
      // Assuming your JSON file has a 'stages' array like the API response.
      // If your JSON file is directly an array of events, use:
      // setSchedule(scheduleData || []);
      setSchedule(scheduleData.stages || []);
    } catch (error) {
      console.error('Error loading schedule from local file:', error);
      setSchedule([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Group schedule by month
  const groupedSchedule = schedule.reduce((acc, item) => {
    const date = parseISO(item.scheduled);
    const month = format(date, 'MMMM');
    if (!acc[month]) acc[month] = [];
    acc[month].push(item);
    return acc;
  }, {});

  const monthOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const sortedMonths = Object.keys(groupedSchedule).sort((a, b) => {
    return monthOrder.indexOf(a) - monthOrder.indexOf(b);
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
              const eventDate = format(parseISO(event.scheduled), 'MMMM d, yyyy, h:mm a');
              const isCancelled = event.status === 'cancelled'; // Assuming 'status' field indicates cancellation

              return (
                <View 
                  key={idx} 
                  style={[
                    styles.card, 
                    { backgroundColor: colors.card },
                    isCancelled && styles.cancelledCard // Apply cancelled style
                  ]}
                >
                  <Text style={[styles.eventTitle, { color: colors.text }]}>{event.description}</Text>
                  {isCancelled && (
                    <Text style={[styles.cancelledText, { color: colors.error }]}>Cancelled</Text>
                  )}
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
  cancelledCard: {
    borderColor: 'red',
    borderWidth: 1,
  },
  cancelledText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

export default ScheduleScreen;
