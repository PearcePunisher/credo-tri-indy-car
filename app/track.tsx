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
  Alert
} from 'react-native';
import BrandLogo from '@/components/BrandLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as FileSystem from 'expo-file-system';



const fileUrl = "https://timely-actor-10dfb03957.media.strapiapp.com/Facility_Map_4_8_25_V2_ed8b563de1.jpg";

// Optional: Generate a local filename
const fileName = fileUrl.split('/').pop();

// Function to handle the download
const handleDownload = async () => {
  try {
    if (!FileSystem.documentDirectory || !fileName) {
      Alert.alert('Download Failed', 'Cannot determine download location or file name.');
      return;
    }
    const end_name = FileSystem.documentDirectory + fileName;
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,  end_name
    );

    const result = await downloadResumable.downloadAsync();
    if (result && result.uri) {
      Alert.alert('Download Complete', `Saved to:\n${result.uri}`);
      console.log('Finished downloading to:', result.uri);
    } else {
      Alert.alert('Download Failed', 'Could not download the file.');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Download Failed', 'An error occurred while downloading the file.');
  }
};



const TrackDetailScreen = () => {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
    const [downloadables, setDownloadables] = useState<any>(null);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch('https://harmonious-wealth-6294946a0c.strapiapp.com/api/events/vu1onbgx4osmfr94vstx9i1l?populate=*');
        const json = await res.json();
        setEvent(json.data);
        const res2 = await fetch('https://harmonious-wealth-6294946a0c.strapiapp.com/api/events/vu1onbgx4osmfr94vstx9i1l/?populate[event_downloadables][populate][event_downloadables_file]=true&populate[event_downloadables][populate][event_downloadables_cover_image]=true');
        const cover_image_json = await res2.json();
        setDownloadables(cover_image_json);
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
  const donwloadable_img = downloadables.data.event_downloadables[0].event_downloadables_cover_image.formats?.medium?.url;
  console.log(downloadables.data.event_downloadables[0].event_downloadables_cover_image.formats?.medium?.url);
  //const download2 = downloables.event_downloadables[0].event_downloadable_file?.formats?.medium?.url;
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
            source={{ uri: donwloadable_img }}
            style={styles.mapImage}
          />
          <Text style={[styles.downloadText, { color: colors.text }]}>
            {download.event_downloadables_description}
          </Text>
          <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.tint }]}   onPress={handleDownload}
>
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
