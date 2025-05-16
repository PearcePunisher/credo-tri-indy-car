// app/(tabs)/vip.tsx
import { View, Text, StyleSheet, ScrollView } from "react-native";
import VIPTile from "@/components/VIPTile";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import TeamBackground from "@/components/TeamBackground";
import useTeamTheme from "@/theme/useTeamTheme";

const router = useRouter();

export default function VIPHomeScreen() {
  const { primary, secondary } = useTeamTheme(); // Get team colors

  return (
    <TeamBackground primaryColor={primary} secondaryColor={secondary}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>PIT LANE CLUB</Text>
          <Text style={styles.sub}>
            The ultimate individual VIP Hospitality experience
          </Text>

          <View style={styles.grid}>
            <VIPTile icon="qr-code" label="My ID" onPress={() => {}} />
            <VIPTile icon="medal" label="Welcome" onPress={() => {}} />
            <VIPTile icon="flash" label="Experience" onPress={() => {}} />
            <VIPTile
              icon="calendar"
              label="Weekend Schedule"
              onPress={() => {}}
            />
            <VIPTile
              icon="location"
              label="Venue Directions"
              onPress={() => {}}
            />
            <VIPTile icon="car-sport" label="Track Info" onPress={() => {}} />
            <VIPTile
              icon="people"
              label="The Team"
              onPress={() => router.push("/team")}
            />
            <VIPTile icon="car" label="The Car" onPress={() => {}} />
            <VIPTile
              icon="calendar-clear"
              label="2025 Indy Car Calendar"
              onPress={() => {}}
            />
            <VIPTile icon="help-circle" label="FAQ’s" onPress={() => {}} />
            <VIPTile icon="chatbubbles" label="Feedback" onPress={() => {}} />
            <VIPTile icon="log-out" label="Log Out" onPress={() => {}} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </TeamBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "transparent", // Ensure transparency to show the gradient
  },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
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
