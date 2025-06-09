import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity, // Added
} from 'react-native';
import { parseISO, format } from 'date-fns';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import BrandLogo from '@/components/BrandLogo';
// Corrected import path
import scheduleData from '/Users/rileypearce/dev/credo-tri-indy-car/race_data/scheduleData.json';

interface Venue {
  name?: string;
  city?: string;
  country?: string;
}

interface EventType {
  id?: string | number; // Assuming id can be string or number, and is optional
  scheduled: string;
  description: string;
  status?: string; // Assuming status is optional or might not always be 'cancelled'
  venue?: Venue;
}

const ScheduleScreen = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const [isPastRacesOpen, setIsPastRacesOpen] = useState(false); // State for accordion

  useEffect(() => {
    try {
      setSchedule(scheduleData.stages || []);
    } catch (error) {
      console.error('Error loading schedule from local file:', error);
      setSchedule([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const monthOrder = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Group schedule by 'yyyy-MMMM'
  const groupedScheduleByYearMonth = schedule.reduce((acc, item) => {
    const date = parseISO(item.scheduled);
    const yearMonthKey = format(date, 'yyyy-MMMM'); // e.g., "2025-March"
    if (!acc[yearMonthKey]) acc[yearMonthKey] = [];
    acc[yearMonthKey].push(item);
    return acc;
  }, {});

  // Sort the 'yyyy-MMMM' keys chronologically
  const sortedYearMonthKeys = Object.keys(groupedScheduleByYearMonth).sort((a, b) => {
    const [yearAStr, monthAName] = a.split('-');
    const [yearBStr, monthBName] = b.split('-');
    const yearA = parseInt(yearAStr);
    const yearB = parseInt(yearBStr);
    const monthAIndex = monthOrder.indexOf(monthAName);
    const monthBIndex = monthOrder.indexOf(monthBName);

    if (yearA !== yearB) {
      return yearA - yearB;
    }
    return monthAIndex - monthBIndex;
  });

  const today = new Date(); // Current date for comparison (June 9, 2025, as per context)
  const currentActualMonthIndex = today.getMonth(); // 0-indexed (e.g., 5 for June)
  const currentActualYear = today.getFullYear(); // e.g., 2025

  const pastRacesCollection = [];
  let currentMonthData = null;
  const futureMonthsData = [];

  if (!loading && schedule.length > 0) {
    for (const yearMonthKey of sortedYearMonthKeys) {
      const eventsInGroup = groupedScheduleByYearMonth[yearMonthKey];
      if (!eventsInGroup || eventsInGroup.length === 0) continue;

      const [yearStr, monthNameStr] = yearMonthKey.split('-');
      const eventYear = parseInt(yearStr, 10);
      const eventMonthIndex = monthOrder.indexOf(monthNameStr);

      if (eventYear < currentActualYear || (eventYear === currentActualYear && eventMonthIndex < currentActualMonthIndex)) {
        pastRacesCollection.push(...eventsInGroup);
      } else if (eventYear === currentActualYear && eventMonthIndex === currentActualMonthIndex) {
        currentMonthData = { yearMonthKey, monthName: monthNameStr, events: eventsInGroup };
      } else {
        futureMonthsData.push({ yearMonthKey, monthName: monthNameStr, events: eventsInGroup });
      }
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  const renderEventItem = (event: EventType, key: string) => {
    const eventDate = format(parseISO(event.scheduled), 'MMMM d, yyyy, h:mm a');
    const isCancelled = event.status === 'cancelled';
    return (
      <View
        key={key}
        style={[
          styles.card,
          { backgroundColor: colors.card },
          isCancelled && styles.cancelledCard,
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
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo style={{ marginBottom: 16 }} />
        <Text style={[styles.header, { color: colors.text }]}>2025 Schedule</Text>

        {/* Past Races Accordion */}
        {pastRacesCollection.length > 0 && (
          <View style={styles.monthSection}>
            <TouchableOpacity
              onPress={() => setIsPastRacesOpen(!isPastRacesOpen)}
              style={styles.accordionHeader}
            >
              <Text style={[styles.monthTitle, { color: colors.tint }]}>Past Races</Text>
              <Text style={[styles.accordionToggleText, { color: colors.tint }]}>
                {isPastRacesOpen ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
            {isPastRacesOpen &&
              pastRacesCollection.map((event: EventType, idx: number) => renderEventItem(event, `past-${event.id || idx}`))}
          </View>
        )}

        {/* Current Month */}
        {currentMonthData && (
          <View key={currentMonthData.yearMonthKey} style={styles.monthSection}>
            <Text style={[styles.monthTitle, { color: colors.tint }]}>
              {currentMonthData.monthName} {currentMonthData.yearMonthKey.split('-')[0]}
            </Text>
            {currentMonthData.events.map((event: EventType, idx: number) =>
              renderEventItem(event, `current-${event.id || idx}`)
            )}
          </View>
        )}

        {/* Future Months */}
        {futureMonthsData.map(({ yearMonthKey, monthName, events }) => (
          <View key={yearMonthKey} style={styles.monthSection}>
            <Text style={[styles.monthTitle, { color: colors.tint }]}>
              {monthName} {yearMonthKey.split('-')[0]}
            </Text>
            {events.map((event: EventType, idx: number) => renderEventItem(event, `${yearMonthKey}-${event.id || idx}`))}
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
  monthTitle: { fontSize: 18, fontWeight: '600', flex: 1 }, // Added flex: 1
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
  accordionHeader: { // Added
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accordionToggleText: { // Added
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ScheduleScreen;
