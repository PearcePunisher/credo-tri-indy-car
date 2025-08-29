import React, { useRef } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import BrandLogo from "@/components/BrandLogo";
import { VideoPlayer, VideoPlayerRef } from "@/components/VideoPlayer";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

export const options = {
  title: "Welcome",
  headerBackTitle: "Back",
};

const WelcomeScreen = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const { completeOnboarding } = useAuth();
  const router = useRouter();
  const videoRef = useRef<VideoPlayerRef>(null);

  const bulletItems = [
    'Full event schedule',
    'Directions and logistics',
    'Details about our drivers and cars',
    'A track map',
    'Real-time notifications so you don\'t miss out!',
  ];

  const handleContinue = async () => {
    // Stop the video before navigating
    if (videoRef.current) {
      videoRef.current.stop();
    }

    await completeOnboarding();
    router.push("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Welcome Video -- REMOVED FOR NASHVILLE
        <VideoPlayer
          ref={videoRef}
          videoUri="https://timely-actor-10dfb03957.media.strapiapp.com/SRR_Portland2025_appwelcome01_5157f41ac6.mp4"
          aspectRatio={9 / 16}
          autoPlay={true}
          loop={false} // Don't loop to avoid distraction
          muted={false} // Allow sound for user engagement
          showPlayButton={true} // Show play/pause overlay
          style={styles.welcomeVideo}
        />
        */}

  {/* Intro Paragraphs */}
  <Text style={[styles.title, { color: colors.text }]}>Welcome to Juncos Hollinger Racing!</Text>
  <Text style={[styles.paragraph, { color: colors.text }]}>We’re thrilled to have you join us here in Nashville for the INDYCAR Series season finale. It’s going to be an incredible weekend of racing, and we’re excited to host you and make your experience unforgettable.</Text>
  <Text style={[styles.paragraph, { color: colors.text }]}>To help you get the most out of your time with us, please use this JHR app, where you’ll find everything you need in one place:</Text>

  {/* Subheading */}
  <Text style={[styles.subheading, { color: colors.text }]}>Here, you will find:</Text>

        {/* Bullet list */}
        <View style={styles.bulletList}>
          {bulletItems.map((item, i) => (
            <Text key={i} style={[styles.bullet, { color: colors.text }]}>
              • {item}
            </Text>
          ))}
        </View>

  {/* Final line */}
  <Text style={[styles.paragraph, { color: colors.text }]}>Let’s make this finale weekend one to remember — welcome to Nashville!</Text>

  {/* Continue Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <BrandLogo style={styles.cardLogo} />
          <Text style={[styles.cardText, { color: colors.text }]}>
            Ready to explore your race weekend experience? You can customize
            notification preferences later in your account settings.
          </Text>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.tint }]}
            onPress={handleContinue}>
            <Text style={[styles.continueBtnText, { color: "white" }]}>
              Continue to App
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 16 },
  welcomeVideo: {
    marginBottom: 20,
    alignSelf: "center", // Center the video within the container
  },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  subheading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6,
  },
  bulletList: { marginBottom: 24 },
  bullet: { fontSize: 15, marginBottom: 8 },
  card: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cardLogo: { width: 250, height: 120, marginBottom: 12, objectFit: "contain" },
  cardText: { fontSize: 14, textAlign: "center", marginBottom: 12 },
  continueBtn: {
    backgroundColor: "#FF3B30", // fallback, will be overridden by inline style
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  continueBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default WelcomeScreen;
