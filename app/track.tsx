import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import BrandLogo from '@/components/BrandLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const TrackDetailScreen = () => {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch('https://timely-actor-10dfb03957.strapiapp.com/api/events/vu1onbgx4osmfr94vstx9i1l?populate=*');
        const json = await res.json();
        setEvent(json.data);
      } catch (e) {
        console.error('Failed to fetch event', e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, []);

  if (loading || !event) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  const callouts = event.event_detail_callout;
  const factFile = event.event_fact_file;
  const download = event.event_downloadables[0];
  const imageUrl = event.event_images?.[0]?.formats?.medium?.url;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{event.event_name}</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text }]}>
          {event.event_description}
        </Text>

        {/* Track Image */}
        {imageUrl && (
          <Image source={{ uri: imageUrl }} style={styles.trackImage} resizeMode="cover" />
        )}

        {/* Callouts */}
        <View style={styles.calloutGrid}>
          {callouts.map((item: any) => (
            <View key={item.id} style={[styles.calloutItem, { borderColor: colors.border }]}>
              <Text style={[styles.calloutTitle, { color: colors.secondaryText }]}>
                {item.event_detail_callout_title}
              </Text>
              <Text style={[styles.calloutValue, { color: colors.tint }]}>
                {item.event_detail_callouts_details}
              </Text>
            </View>
          ))}
        </View>

        {/* Fact File */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {factFile.event_fact_file_title}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {factFile.event_fact_file_details[0].children.map((li: any, index: number) => (
            <Text key={index} style={[styles.factText, { color: colors.text }]}>
              • {li.children[0].text}
            </Text>
          ))}
        </View>

        {/* Download Map CTA */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: 'https://timely-actor-10dfb03957.media.strapiapp.com/Chat_GPT_Image_May_6_2025_04_23_58_PM_07886895f5.png' }}
            style={styles.mapImage}
          />
          <Text style={[styles.downloadText, { color: colors.text }]}>
            {download.event_downloadables_description}
          </Text>
          <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.tint }]}>
            <Text style={[styles.downloadBtnText, { color: colors.textOnGreen }]}>Download Map</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { 
    padding: 20, 
    paddingBottom: Platform.OS === 'ios' ? 36 : 16 // iOS needs more space for tab bar
  },
  brand: { width: 250, height: 120, alignSelf: 'center', marginBottom: 10, objectFit: 'contain' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 20, textAlign: 'left' },
  trackImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20 },
  calloutGrid: { marginBottom: 20 },
  calloutItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  calloutValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  factText: {
    fontSize: 15,
    marginBottom: 8,
  },
  mapImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  downloadText: {
    fontSize: 14,
    marginBottom: 12,
  },
  downloadBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadBtnText: {
    fontWeight: 'bold',
  },
});

export default TrackDetailScreen;
