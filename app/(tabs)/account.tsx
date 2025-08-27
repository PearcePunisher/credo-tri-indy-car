import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import BrandLogo from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/services/AuthService";
import { Ionicons } from "@expo/vector-icons";
import UserQRCode from "@/components/UserQRCode";
import { useRouter } from "expo-router";
import FocusTransition from "@/components/ui/FocusTransition";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

export const options = {
  title: "Account",
};

const AccountScreen = () => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const { authState, logout, createLocalAuthState } = useAuth();
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState("");
  const [isUpdatingCode, setIsUpdatingCode] = useState(false);

  const handleInvitationCodeSubmit = async () => {
    if (!invitationCode.trim()) return;
    
    setIsUpdatingCode(true);
  // ...existing code...
    
    try {
      // Create payload similar to registration using cached user data
      const user = authState.user!;
      const payload = {
        email: user.email,
        invitation_code: invitationCode.trim(),
        id: user.serverId || user.id, // Send existing user ID
      };

  // ...existing code...

      const response = await fetch(
        "https://nodejs-production-0e5a.up.railway.app/get_dummy_schedule",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

  // ...existing code...

      if (response.status === 200) {
        // Get the response data from the server
        const responseData = await response.json();
  // ...existing code...
        
        // Server returns data directly (not nested under "response")
        if (responseData && (responseData.event_code_document_id || responseData.event_schedule_document_id)) {
          // Update the current user with new event data from server
          const updatedUserData = {
            ...user,
            invitationCode: invitationCode.trim(),
            eventCodeDocumentId: responseData.event_code_document_id || user.eventCodeDocumentId,
            eventScheduleDocumentId: responseData.event_schedule_document_id || user.eventScheduleDocumentId,
            userIsStaff: responseData.user_is_staff !== undefined ? responseData.user_is_staff : user.userIsStaff,
            updatedAt: new Date().toISOString(),
          };

          // Store the updated user data and refresh auth state
          await updateUserInStorage(updatedUserData);
          
          // Clear the experiences cache so fresh data is fetched with the new document IDs
          const { experiencesService } = await import('@/services/ExperiencesService');
          await experiencesService.refreshData();
          
          // ...existing code...
          Alert.alert(
            "Event Switch Successful",
            `Your invitation code "${invitationCode.trim()}" has been accepted. You now have access to the new event schedule!`,
            [{ text: "OK" }]
          );
        } else {
          // Still update the invitation code locally even without server data
          const updatedUserData = {
            ...user,
            invitationCode: invitationCode.trim(),
            updatedAt: new Date().toISOString(),
          };
          
          // Store the updated user data preserving all states
          await updateUserInStorage(updatedUserData);
          
          // ...existing code...
          Alert.alert(
            "Code Accepted",
            `Your invitation code "${invitationCode.trim()}" has been accepted!`,
            [{ text: "OK" }]
          );
        }
        
        // Clear the input after successful submission
        setInvitationCode("");
      } else {
        const errorData = await response.text();
        Alert.alert(
          "Invalid Invitation Code",
          `The invitation code "${invitationCode.trim()}" is not valid or has expired. Please check the code and try again.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Connection Error", 
        "Unable to validate invitation code. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingCode(false);
    }
  };

  // Helper function to update user data in storage while preserving auth state
  const updateUserInStorage = async (userData: User): Promise<void> => {
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify(userData));
      
      // Get the auth service and refresh the auth state to pick up the changes
      const AuthService = (await import('@/services/AuthService')).default;
      const authService = AuthService.getInstance();
      
      // Force re-initialization to pick up the updated user data
      const updatedAuthState = await authService.initializeAuth();
  // ...existing code...
    } catch (error) {
  // ...existing code...
      throw error;
    }
  };

  const handleLogout = async () => {
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
              // ...existing code...
            }
          },
        },
      ]
    );
  };

  if (!authState.user) {
    return (
      <FocusTransition variant="fade">
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centerContent}>
            <Text style={[styles.errorText, { color: colors.text }]}>
              No user information available
            </Text>
          </View>
        </SafeAreaView>
      </FocusTransition>
    );
  }

  return (
    <FocusTransition variant="fade">
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

        {/* Change Event Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Change Event
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
            Enter a new invitation code to access a different event
          </Text>
          
          <View style={styles.invitationCodeSection}>
            <TextInput
              style={[
                styles.invitationCodeInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Enter invitation code"
              placeholderTextColor={colors.secondaryText}
              value={invitationCode}
              onChangeText={setInvitationCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isUpdatingCode}
            />
            <TouchableOpacity
              style={[
                styles.submitCodeButton,
                {
                  backgroundColor: invitationCode.trim() && !isUpdatingCode ? colors.tint : colors.secondaryText,
                },
              ]}
              onPress={handleInvitationCodeSubmit}
              disabled={!invitationCode.trim() || isUpdatingCode}
              activeOpacity={0.8}
            >
              {isUpdatingCode ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="arrow-forward" size={16} color="white" />
              )}
            </TouchableOpacity>
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

          {authState.user.invitationCode && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
                Current Invitation Code:
              </Text>
              <Text style={[styles.infoValue, { color: colors.text, fontFamily: 'monospace' }]}>
                {authState.user.invitationCode}
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

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.secondaryText }]}>
              Theme:
            </Text>
            <TouchableOpacity
              style={[styles.themeToggle, { backgroundColor: colors.tint }]}
              onPress={toggleColorScheme}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={colorScheme === 'light' ? 'sunny' : 'moon'} 
                size={16} 
                color="white" 
              />
              <Text style={styles.themeToggleText}>
                {colorScheme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </Text>
            </TouchableOpacity>
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
    </FocusTransition>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: Platform.OS === 'ios' ? 20 : 0 }, // Platform-specific tab bar spacing
  scroll: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 100 : 80 }, // Increased bottom padding for logout button
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
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
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  invitationCodeSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  invitationCodeInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  submitCodeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 48,
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
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  themeToggleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
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
