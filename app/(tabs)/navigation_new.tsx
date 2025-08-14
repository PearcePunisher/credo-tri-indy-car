import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import VIPTile from "@/components/VIPTile";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import FocusTransition from "@/components/ui/FocusTransition";

// Importing the brand logo component
import BrandLogo from "@/components/BrandLogo";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

export const options = {
  title: "Home",
};

export default function VIPHomeScreen() {
  const { authState, logout } = useAuth();
  console.log('🏠 VIPHomeScreen component starting...');
  
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const iconColor = colors.text;

  console.log('✅ VIPHomeScreen hooks initialized successfully');

  return (
    <FocusTransition variant="slide">
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
          {/* <View style={styles.tile}>
            <VIPTile icon="person-add" label="Register" onPress={() => {
              console.log('📝 User tapped Register button - navigating to userID for form testing');
              router.push("/userID");
            }} />
          </View> */}
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
          {/* Notification Health */}
          <View style={styles.tile}>
            <VIPTile icon="alert" label="Notification Health" onPress={() => router.push("/notification-health")} />
          </View>
          {/* <View style={styles.tile}>
            <VIPTile icon="mail" label="Feedback" onPress={() => {}} />
          </View> */}
          {authState.user?.userIsStaff &&(
          <View style={styles.tile}>
            <VIPTile icon="camera" label="Camera" onPress={() => router.push("/camera")} />
          </View>)}
        </View>
      </ScrollView>
    </SafeAreaView>
    </FocusTransition>
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
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
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
