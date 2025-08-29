import React from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";
import UserQRCode from "@/components/UserQRCode";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

export const options = {
  title: "My QR Code",
  headerBackTitle: "Back",
};

const UserQRScreen = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const { authState } = useAuth();
  const router = useRouter();

  if (!authState.user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Please sign in to view your QR code
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.tint }]}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          My Event QR Code
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.secondaryText }]}>
          Show this QR code at the event for quick check-in and access to your
          personalized experience.
        </Text>

        {/* QR Code Component */}
        <UserQRCode user={authState.user} size={250} showActions={true} />

        {/* Additional Information */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={colors.tint} />
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              How to Use
            </Text>
          </View>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Present this QR code at event check-in
            </Text>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Keep your phone screen bright for scanning
            </Text>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Screenshot this code for offline backup
            </Text>
            <Text style={[styles.infoItem, { color: colors.text }]}>
              • Use the share button to send to others if needed
            </Text>
          </View>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.tint }]}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text style={styles.backButtonText}>Back to Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { 
    padding: 20, 
    paddingBottom: 40 
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  infoList: {
    paddingLeft: 8,
  },
  infoItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserQRScreen;
