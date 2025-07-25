import { View, Text, StyleSheet, ScrollView } from "react-native";
import VIPTile from "@/components/VIPTile";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

// Importing icons - TEMPORARILY COMMENTED FOR CRASH TESTING
// import TrackIcon from "@/assets/icons/trackIcon.svg";
// import DoorIcon from "@/assets/icons/doorIcon.svg";
// import CelebrationIcon from "@/assets/icons/celebrationIcon.svg";
// import EventIcon from "@/assets/icons/scheduleIcon.svg";
// import PinIcon from "@/assets/icons/pinIcon.svg";
// import GroupIcon from "@/assets/icons/groupIcon.svg";
// import CarIcon from "@/assets/icons/carIcon.svg";
// import CalendarIcon from "@/assets/icons/calendarIcon.svg";
// import QuizIcon from "@/assets/icons/quizIcon.svg";
// import CommentIcon from "@/assets/icons/commentIcon.svg";
// import LogoutIcon from "@/assets/icons/logoutIcon.svg"; // TEMPORARILY REMOVED FOR CRASH TESTING

// Importing the brand logo component
import BrandLogo from "@/components/BrandLogo";

export const options = {
  title: "Home",
};

export default function VIPHomeScreen() {
  console.log('🏠 VIPHomeScreen component starting...');
  
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const iconColor = colors.text;

  console.log('✅ VIPHomeScreen hooks initialized successfully');

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
            <VIPTile icon="qr-code" label="My ID" iconColor={iconColor} onPress={() => router.push("/userQR")} />
          </View>
          <View style={styles.tile}>
            <VIPTile icon="person-add" label="Register" onPress={() => {
              console.log('📝 User tapped Register button - navigating to userID for form testing');
              router.push("/userID");
            }} />
          </View>
          <View style={styles.tile}>
            <VIPTile icon="home" label="Welcome" onPress={() => router.push("/welcome")} />
          </View>
          {/* <View style={styles.tile}>
            <VIPTile icon="star" label="Experience" onPress={() => router.push("/experience")} />
          </View> */}
          <View style={styles.tile}>
            <VIPTile icon="calendar" label="Weekend Schedule" onPress={() => router.push("/schedule")} />
          </View>
          <View style={styles.tile}>
            <VIPTile icon="location" label="Venue Directions" onPress={() => router.push("/directions")} />
          </View>
          <View style={styles.tile}>
            <VIPTile icon="map" label="Track Info" onPress={() => router.push("/track")} />
          </View>
          <View style={styles.tile}>
            <VIPTile icon="people" label="The Team" onPress={() => router.push("/team")} />
          </View>
          {/* <View style={styles.tile}>
            <VIPTile icon="car" label="Notifications Test" onPress={() => router.push("/notifications-demo")} />
          </View> */}
          <View style={styles.tile}>
            <VIPTile icon="help" label="FAQ's" onPress={() => router.push("/faq")} />
          </View>
          {/* <View style={styles.tile}>
            <VIPTile icon="mail" label="Feedback" onPress={() => {}} />
          </View> */}
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
    // Remove excessive paddingBottom - tab navigator handles spacing
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
