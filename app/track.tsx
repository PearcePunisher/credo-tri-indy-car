import React, { useEffect, useState } from "react";
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
  Alert,
  Dimensions,
} from "react-native";
import BrandLogo from "@/components/BrandLogo";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import * as FileSystem from "expo-file-system";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

const fileUrl =
  "https://timely-actor-10dfb03957.media.strapiapp.com/Facility_Map_4_8_25_V2_ed8b563de1.jpg";

// Optional: Generate a local filename
const fileName = fileUrl.split("/").pop();

// Function to handle the download
const handleDownload = async () => {
  try {
    if (!FileSystem.documentDirectory || !fileName) {
      Alert.alert(
        "Download Failed",
        "Cannot determine download location or file name."
      );
      return;
    }
    const end_name = FileSystem.documentDirectory + fileName;
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      end_name
    );

    const result = await downloadResumable.downloadAsync();
    if (result && result.uri) {
      Alert.alert("Download Complete", `Saved to:\n${result.uri}`);
      console.log("Finished downloading to:", result.uri);
    } else {
      Alert.alert("Download Failed", "Could not download the file.");
    }
  } catch (error) {
    console.error(error);
    Alert.alert(
      "Download Failed",
      "An error occurred while downloading the file."
    );
  }
};

const TrackDetailScreen = () => {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadables, setDownloadables] = useState<any>(null);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  // --- Helpers to robustly render Strapi rich text regardless of shape ---
  const extractText = (node: any): string => {
    if (!node) return "";
    // If node is a plain string
    if (typeof node === "string") return node;
    // Slate-like text node
    if (typeof node.text === "string") return node.text;
    // Children array: recursively accumulate
    if (Array.isArray(node.children)) {
      return node.children.map(extractText).filter(Boolean).join("");
    }
    // Object with value/content field
    if (node.value) return String(node.value);
    return "";
  };

  const renderRichListOrParagraphs = (details: any) => {
    // Accept: array of nodes, single node, or string
    const nodes: any[] = Array.isArray(details)
      ? details
      : details && typeof details === "object" && details.children
      ? [details]
      : typeof details === "string"
      ? [{ type: "paragraph", children: [{ text: details }] }]
      : [];

    if (nodes.length === 0) {
      return (
        <Text style={[styles.factText, { color: colors.secondaryText }]}>
          Details coming soon.
        </Text>
      );
    }

    const rows: React.ReactNode[] = [];
    nodes.forEach((node, idx) => {
      const type = node?.type;
      // Handle lists
      if (
        type === "list" ||
        type === "bulleted-list" ||
        type === "numbered-list" ||
        type === "unordered-list" ||
        type === "ordered-list"
      ) {
        const items = Array.isArray(node.children) ? node.children : [];
        items.forEach((li: any, liIdx: number) => {
          const txt = extractText(li);
          if (txt) {
            rows.push(
              <Text
                key={`li-${idx}-${liIdx}`}
                style={[styles.factText, { color: colors.text }]}>
                • {txt}
              </Text>
            );
          }
        });
        return;
      }
      // Handle paragraphs or any node: render as simple text line
      const txt = extractText(node);
      if (txt) {
        rows.push(
          <Text
            key={`p-${idx}`}
            style={[styles.factText, { color: colors.text }]}>
            {txt}
          </Text>
        );
      }
    });

    return rows.length > 0 ? (
      rows
    ) : (
      <Text style={[styles.factText, { color: colors.secondaryText }]}>
        Details coming soon.
      </Text>
    );
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(
          "https://timely-actor-10dfb03957.strapiapp.com/api/events/rxo4ckamd5zisayqmf53ooiv?populate=*"
        );
        const json = await res.json();
        setEvent(json.data);
        const res2 = await fetch(
          "https://timely-actor-10dfb03957.strapiapp.com/api/events/rxo4ckamd5zisayqmf53ooiv/?populate[event_downloadables][populate][event_downloadables_file]=true&populate[event_downloadables][populate][event_downloadables_cover_image]=true"
        );
        const cover_image_json = await res2.json();
        setDownloadables(cover_image_json);
      } catch (e) {
        console.error("Failed to fetch event", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, []);

  if (loading || !event) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  const callouts = Array.isArray(event?.event_detail_callout)
    ? event.event_detail_callout
    : [];
  const factFile = event?.event_fact_file ?? {};
  const download = Array.isArray(event?.event_downloadables)
    ? event.event_downloadables[0]
    : undefined;
  const donwloadable_img =
    downloadables?.data?.event_downloadables?.[0]
      ?.event_downloadables_cover_image?.formats?.medium?.url;
  if (donwloadable_img) {
    console.log(donwloadable_img);
  }
  //const download2 = downloables.event_downloadables[0].event_downloadable_file?.formats?.medium?.url;
  const imageUrl = event.event_images?.[0]?.formats?.medium?.url;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {event.event_name}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text }]}>
          {event.event_description}
        </Text>

        {/* Track Image */}
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.trackImage}
            resizeMode="cover"
          />
        )}

        {/* Callouts */}
        {callouts.length > 0 && (
          <View style={styles.calloutGrid}>
            {callouts.map((item: any, i: number) => (
              <View
                key={item?.id ?? `callout-${i}`}
                style={[styles.calloutItem, { borderColor: colors.border }]}>
                <Text
                  style={[
                    styles.calloutTitle,
                    { color: colors.secondaryText },
                  ]}>
                  {item?.event_detail_callout_title ?? ""}
                </Text>
                <Text style={[styles.calloutValue, { color: colors.tint }]}>
                  {item?.event_detail_callouts_details ?? ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Fact File */}
        {factFile?.event_fact_file_title ? (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {factFile.event_fact_file_title}
          </Text>
        ) : null}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {renderRichListOrParagraphs(factFile?.event_fact_file_details)}
        </View>

        {/* Download Map CTA */}
        {/* {donwloadable_img && download ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Image
              source={{ uri: donwloadable_img }}
              style={styles.mapImage}
            />
            <Text style={[styles.downloadText, { color: colors.text }]}> 
              {download?.event_downloadables_description ?? 'Event map'}
            </Text>
            <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: colors.tint }]} onPress={handleDownload}>
              <Text style={[styles.downloadBtnText, { color: colors.textOnGreen }]}>Download Map</Text>
            </TouchableOpacity>
          </View>
        ) : null} */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 16, // iOS needs more space for tab bar
  },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: "left",
  },
  trackImage: { width: "100%", height: 200, borderRadius: 8, marginBottom: 20 },
  calloutGrid: { marginBottom: 20 },
  calloutItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  calloutValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
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
    width: "100%",
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
    alignItems: "center",
  },
  downloadBtnText: {
    fontWeight: "bold",
  },
});

export default TrackDetailScreen;
