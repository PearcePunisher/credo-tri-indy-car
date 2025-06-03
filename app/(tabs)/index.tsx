// app/(tabs)/vip.tsx
import { View, Text, StyleSheet, ScrollView } from "react-native";
import VIPTile from "@/components/VIPTile";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";

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
  title: 'Home',
};

export default function VIPHomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const iconColor = isDarkMode ? "#FFFFFF" : "#1A1A1A"; // Dynamic color for icons

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#1A1A1A" : "#F2F2F7",
      }}>
      <ScrollView contentContainerStyle={styles.container}>
        <BrandLogo style={styles.brand} />
        <Text
          style={[
            styles.header,
            { color: isDarkMode ? "#FFFFFF" : "#1A1A1A" }, // Dynamic color
          ]}>
          PIT LANE CLUB
        </Text>
        <Text
          style={[
            styles.sub,
            { color: isDarkMode ? "#CCCCCC" : "#333333" }, // Dynamic color for sub text
          ]}>
          The ultimate individual VIP Hospitality experience
        </Text>

        <View style={styles.grid}>
          <VIPTile
            icon="qr-code"
            label="My ID"
            iconColor={iconColor}
            onPress={() => { }} />
          <VIPTile
            iconComponent={<DoorIcon />}
            label="Welcome"
            onPress={() => router.push("/welcome")}
          />
          <VIPTile
            iconComponent={<CelebrationIcon />}
            label="Experience"
            onPress={() => router.push("/experience")}
          />
          <VIPTile
            iconComponent={<EventIcon />}
            label="Weekend Schedule"
            onPress={() => router.push("/schedule")}
          />
          <VIPTile
            iconComponent={<PinIcon />}
            label="Venue Directions"
            onPress={() => router.push("/directions")}
          />
          <VIPTile
            iconComponent={<TrackIcon />}
            label="Track Info"
            onPress={() => router.push("/track")}
          />
          <VIPTile
            iconComponent={<GroupIcon />}
            label="The Team"
            onPress={() => router.push("/team")}
          />
          <VIPTile
            iconComponent={<CarIcon />}
            label="The Car"
            onPress={() => router.push("/car")}
          />
          <VIPTile
            iconComponent={<CalendarIcon />}
            label="2025 Indy Car Calendar"
            onPress={() => { }}
          />
          <VIPTile
            iconComponent={<QuizIcon />}
            label="FAQ’s"
            onPress={() => { }}
          />
          <VIPTile
            iconComponent={<CommentIcon />}
            label="Feedback"
            onPress={() => { }}
          />
          <VIPTile
            iconComponent={<LogoutIcon />}
            label="Log Out"
            onPress={() => { }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "transparent", // Keep transparent for SafeAreaView bg
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brand: { width: 250, height: 120, alignSelf: 'center', marginBottom: 10, objectFit: 'contain' },
  sub: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
});
