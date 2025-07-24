import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import UserQRCode from "@/components/UserQRCode";
import { useRouter } from "expo-router";

export const options = {
  title: "Account",
};

const AccountScreen = () => {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme];
  const { authState, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? You will need to register again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  if (!authState.user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No user information available
          </Text>
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
        <Text style={[styles.title, { color: colors.text }]}>My Account</Text>

        {/* User Information Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.userHeader}>
            <Ionicons name="person-circle" size={60} color={colors.tint} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {authState.user.firstName} {authState.user.lastName}
              </Text>
              <Text style={[styles.userEmail, { color: colors.secondaryText }]}>
                {authState.user.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Testing Information Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Testing Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              User ID:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {authState.user.id}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Email:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {authState.user.email}
            </Text>
          </View>

          {authState.user.serverId && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
                Server ID:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {authState.user.serverId}
              </Text>
            </View>
          )}

          {authState.user.eventCodeDocumentId && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
                Event Code Doc ID:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {authState.user.eventCodeDocumentId}
              </Text>
            </View>
          )}

          {authState.user.eventScheduleDocumentId && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
                Event Schedule Doc ID:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {authState.user.eventScheduleDocumentId}
              </Text>
            </View>
          )}
        </View>

        {/* QR Code Section */}
        <UserQRCode user={authState.user} size={180} showActions={true} />

        {/* Account Details */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Information
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Phone Number:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {authState.user.phoneNumber || "Not provided"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Date of Birth:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {authState.user.dateOfBirth || "Not provided"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Notifications:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {authState.user.notificationSubscribed
                ? "✅ Enabled"
                : "❌ Disabled"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Member Since:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {new Date(authState.user.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* App Information */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            App Status
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Onboarding:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {authState.hasCompletedOnboarding
                ? "✅ Complete"
                : "⏳ In Progress"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Account Type:
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              VIP Experience
            </Text>
          </View>
        </View>

        {/* QR Code Actions */}
        <TouchableOpacity
          style={[styles.qrButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/userQR')}>
          <Ionicons name="qr-code-outline" size={20} color="white" />
          <Text style={styles.qrButtonText}>View Full QR Code</Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: "#FF3B30" }]}
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: Platform.OS === 'ios' ? 20 : 0 }, // Platform-specific tab bar spacing
  scroll: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 32 : 16 }, // Platform-specific scroll padding
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: {
    width: 250,
    height: 120,
    alignSelf: "center",
    marginBottom: 10,
    objectFit: "contain",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  errorText: { fontSize: 16, textAlign: "center" },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "400",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  qrButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AccountScreen;
