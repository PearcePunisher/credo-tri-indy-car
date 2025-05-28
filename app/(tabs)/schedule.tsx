import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { format, parseISO } from 'date-fns';

const ScheduleScreen = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [description, setDescription] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#111' : '#f9f9f9';
  const textColor = isDark ? '#fff' : '#000';

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch(
          'https://timely-actor-10dfb03957.strapiapp.com/api/events/vu1onbgx4osmfr94vstx9i1l?populate=event_schedule'
        );
        const json = await res.json();
        setSchedule(json.data.event_schedule || []);
        setDescription(
          (json.data.event_schedule_description || [])
            .map((block: any) => block.children[0]?.text)
            .filter(Boolean)
        );
      } catch (err) {
        console.error('Failed to fetch schedule', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const renderDay = (day: any, index: number) => {
    const formattedDate = format(parseISO(day.event_schedule_date_date), 'EEEE, MMMM do');
    return (
      <View key={index} style={styles.dayBlock}>
        <Text style={[styles.dayHeading, { color: textColor }]}>{formattedDate}</Text>
        {day.event_schedule_date_details.map((entry: any, idx: number) => {
          const rawText = entry.children[0]?.text || '';
          const [time, ...descParts] = rawText.split(/\t+/);
          const description = descParts.join(' ').trim();

          return (
            <View key={idx} style={styles.row}>
              <Text style={[styles.time, { color: textColor }]}>{time}</Text>
              <Text style={[styles.description, { color: textColor }]}>{description}</Text>
            </View>
          );
        })}
        <View style={styles.divider} />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: textColor }]}>Weekend Schedule</Text>
        {description.map((line, index) => (
          <Text key={index} style={[styles.paragraph, { color: textColor }]}>
            {line}
          </Text>
        ))}
        {schedule.map((day, index) => renderDay(day, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 15,
    marginBottom: 10,
  },
  dayBlock: {
    marginTop: 24,
  },
  dayHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  time: {
    width: 80,
    fontWeight: '600',
    fontSize: 14,
  },
  description: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 8,
  },
  divider: {
    marginTop: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default ScheduleScreen;
