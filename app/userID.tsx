import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import BrandLogo from "@/components/BrandLogo";
import { RegisterScreenFormik } from "@/components/forms/UserRegistrationFormik";
import { LoginForm } from "@/components/forms/LoginForm";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from 'react-native-safe-area-context';


const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

export const options = {
  title: "Welcome",
  headerBackTitle: "Back",
};

type AuthMode = "register" | "login" | "guest";

export const UserActivationFormik = () => {
  // ...existing code...

  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { createLocalAuthState, authState } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>("register");

  // ...existing code...

  const handleGuestContinue = async () => {
    Alert.alert(
      "Continue as Guest?",
      "You'll have limited access to features. You can create an account later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue as Guest",
          onPress: async () => {
            try {
              // Create a basic guest user
              await createLocalAuthState({
                email: `guest_${Date.now()}@indycar.app`,
                firstName: "Guest",
                lastName: "User",
                dateOfBirth: "1990-01-01",
                phoneNumber: "",
                userIsStaff: false, // <-- Add this line
              });
              router.push("/welcome");
            } catch (error) {
              // ...existing code...
              router.push("/welcome");
            }
          },
        },
      ]
    );
  };

  const renderAuthModeSelector = () => (
    <View style={[styles.modeSelector, { borderColor: colors.border }]}>
      <TouchableOpacity
        style={[
          styles.modeButton,
          authMode === "register" && { backgroundColor: colors.tint },
        ]}
        onPress={() => setAuthMode("register")}>
        <Text
          style={[
            styles.modeButtonText,
            {
              color: authMode === "register" ? colors.background : colors.text,
            },
          ]}>
          Register
        </Text>
      </TouchableOpacity>

      <View
        style={[styles.modeSeparator, { backgroundColor: colors.border }]}
      />

      <TouchableOpacity
        style={[
          styles.modeButton,
          authMode === "login" && { backgroundColor: colors.tint },
        ]}
        onPress={() => setAuthMode("login")}>
        <Text
          style={[
            styles.modeButtonText,
            { color: authMode === "login" ? colors.background : colors.text },
          ]}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (authMode) {
      case "register":
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome to the Team!
            </Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              We are excited to have you join us. Please create your account
              below.
            </Text>
            <RegisterScreenFormik />
          </>
        );
      case "login":
        return (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back!
            </Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
              Please sign in to your account to continue.
            </Text>
            <LoginForm />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo style={styles.brand} />

        {/* Testing Section - User ID Display */}
        {authState.user && (
          <View
            style={[
              styles.testingSection,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <Text style={[styles.testingTitle, { color: colors.text }]}>
              Testing Info
            </Text>
            <View style={styles.testingField}>
              <Text
                style={[styles.testingLabel, { color: colors.secondaryText }]}>
                User ID:
              </Text>
              <Text style={[styles.testingValue, { color: colors.text }]}>
                {authState.user.id}
              </Text>
            </View>
            <View style={styles.testingField}>
              <Text
                style={[styles.testingLabel, { color: colors.secondaryText }]}>
                Email:
              </Text>
              <Text style={[styles.testingValue, { color: colors.text }]}>
                {authState.user.email}
              </Text>
            </View>
            {authState.user.serverId && (
              <View style={styles.testingField}>
                <Text
                  style={[
                    styles.testingLabel,
                    { color: colors.secondaryText },
                  ]}>
                  Server ID:
                </Text>
                <Text style={[styles.testingValue, { color: colors.text }]}>
                  {authState.user.serverId}
                </Text>
              </View>
            )}
          </View>
        )}

        {renderAuthModeSelector()}
        {renderContent()}

        {/* Guest/Skip Option */}
        <View style={styles.guestSection}>
          <Text style={[styles.guestText, { color: colors.secondaryText }]}>
            Don't want to create an account right now?
          </Text>
          <TouchableOpacity
            style={[styles.guestButton, { borderColor: colors.border }]}
            onPress={handleGuestContinue}>
            <Text style={[styles.guestButtonText, { color: colors.tint }]}>
              Continue as Guest
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  bulletList: { marginBottom: 24 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: { fontSize: 18, marginRight: 8 },
  bulletText: { fontSize: 15, flex: 1, lineHeight: 22 },
  modeSelector: {
    flexDirection: "row",
    marginBottom: 24,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  modeSeparator: {
    width: 1,
    height: "100%",
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  guestSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "center",
  },
  guestText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  guestButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  testingSection: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  testingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  testingField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  testingLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  testingValue: {
    fontSize: 12,
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
});

export default UserActivationFormik;
