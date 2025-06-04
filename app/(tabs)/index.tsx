// app/(tabs)/vip.tsx
import { View, Text, StyleSheet, ScrollView } from "react-native";
import VIPTile from "@/components/VIPTile";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Importing icons
import TrackIcon from "@/assets/icons/trackIcon.svg";
import DoorIcon from "@/assets/icons/doorIcon.svg";
import CelebrationIcon from "@/assets/icons/celebrationIcon.svg";
import EventIcon from "@/assets/icons/scheduleIcon.svg";
import PinIcon from "@/assets/icons/pinIcon.svg";
import GroupIcon from "@/assets/icons/groupIcon.svg";
import CarIcon from "@/assets/icons/carIcon.svg";
import CalendarIcon from "@/assets/icons/calendarIcon.svg";
import QuizIcon from "@/assets/icons/quizIcon.svg";
import CommentIcon from "@/assets/icons/commentIcon.svg";
import LogoutIcon from "@/assets/icons/logoutIcon.svg";
import BrandLogo from "@/components/BrandLogo";

const router = useRouter();

export const options = {
  title: "Home",
};

export default function VIPHomeScreen() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme];
  const iconColor = colors.text;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandLogo style={styles.brand} />
        <Text style={[styles.header, { color: colors.text }]}>
          PIT LANE CLUB
        </Text>
        <Text style={[styles.sub, { color: colors.secondaryText || colors.text }]}>
          The ultimate individual VIP Hospitality experience
        </Text>

        <View style={styles.grid}>
          <View style={styles.tile}>
            <VIPTile icon="qr-code" label="My ID" iconColor={iconColor} onPress={() => {}} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<DoorIcon />} label="Welcome" onPress={() => router.push("/welcome")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<CelebrationIcon />} label="Experience" onPress={() => router.push("/experience")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<EventIcon />} label="Weekend Schedule" onPress={() => router.push("/schedule")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<PinIcon />} label="Venue Directions" onPress={() => router.push("/directions")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<TrackIcon />} label="Track Info" onPress={() => router.push("/track")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<GroupIcon />} label="The Team" onPress={() => router.push("/team")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<CarIcon />} label="The Car" onPress={() => router.push("/car")} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<CalendarIcon />} label="2025 Indy Car Calendar" onPress={() => {}} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<QuizIcon />} label="FAQ’s" onPress={() => {}} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<CommentIcon />} label="Feedback" onPress={() => {}} />
          </View>
          <View style={styles.tile}>
            <VIPTile iconComponent={<LogoutIcon />} label="Log Out" onPress={() => {}} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brand: {
    width: 250,
    height: 120,
    alignSelf: "center",
    marginBottom: 10,
    objectFit: "contain",
  },
  sub: {
    fontSize: 14,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly", // evenly spaced in each row
  },
  tile: {
    width: "45%", // slightly smaller to ensure no overflow
    marginBottom: 10,
  },
});
