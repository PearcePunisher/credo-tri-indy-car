import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// import { useFonts } from 'expo-font'; // TEMPORARILY DISABLED FOR CRASH TESTING
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "react-error-boundary";
import { Text, View } from "react-native";

import * as Notifications from "expo-notifications";
import { NotificationProvider } from "@/context/NotificationContext";
import * as TaskManager from "expo-task-manager";

import { useColorScheme } from "@/hooks/useColorScheme";
import { TeamThemeProvider } from "@/theme/TeamThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import AppStateManager from "../components/AppStateManager";
import { resyncScheduledNotifications } from "@/services/NotificationScheduler";
import { AppState } from "react-native";
import { PushTokenInitializer } from "../components/PushTokenInitializer"; // Disabling for new notification testing
import { initNotifications } from "@/services/NotificationBootstrap";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error, executionInfo }) => {
  // ...existing code...
    // Do something with the notification data
  }
);

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

// Add native crash logging and environment validation
// ...existing code...

// Import environment config early to validate
import { ENV_CONFIG } from "@/constants/Environment";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Error fallback component
function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // ...existing code...

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}>
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        App Error
      </Text>
      <Text style={{ fontSize: 12, textAlign: "center", marginBottom: 10 }}>
        {error.message || "An unexpected error occurred"}
      </Text>
      <Text
        style={{
          fontSize: 10,
          textAlign: "center",
          marginBottom: 20,
          color: "gray",
        }}>
        {error.stack ? error.stack.substring(0, 200) + "..." : ""}
      </Text>
      <Text
        style={{
          fontSize: 16,
          color: "blue",
          textDecorationLine: "underline",
          padding: 10,
        }}
        onPress={resetErrorBoundary}>
        Try again
      </Text>
    </View>
  );
}

export default function RootLayout() {
  // ...existing code...
  const { colorScheme } = useColorScheme();

  // ...existing code...
  // TEMPORARILY DISABLED FOR CRASH TESTING
  // const [loaded] = useFonts({
  //   Roobert: require("../assets/fonts/Roobert-Regular.ttf"),
  //   RoobertSemi: require("../assets/fonts/Roobert-SemiBold.ttf"),
  //   RoobertMedium: require("../assets/fonts/Roobert-Medium.ttf"),
  // });
  const loaded = true; // Force to true for testing

  // ...existing code...

  useEffect(() => {
    // Initialize notifications once at app start (single handler + Android channel)
  initNotifications().catch(() => {});

    // Kick a resync after boot
    setTimeout(() => {
      resyncScheduledNotifications()
        .then(() => {})
        .catch(() => {});
    }, 500);

    // Resync on app foreground
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        resyncScheduledNotifications()
          .then(() => {})
          .catch(() => {});
      }
    });

    // ...existing code...
    if (loaded) {
      // Add a small delay to ensure everything is ready before hiding splash
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 100);
    }
    return () => sub.remove();
  }, [loaded]);

  if (!loaded) {
  // ...existing code...
    return null;
  }

  // ...existing code...

  try {
  // ...existing code...
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          // ...existing code...
        }}>
        <AuthProvider>
          <NotificationProvider>
            <TeamThemeProvider>
              <SafeAreaProvider>
                <ThemeProvider
                  value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                  <AppStateManager>
                    <Stack screenOptions={{ animation: "fade" }}>
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      <Stack.Screen
                        name="userID"
                        options={{
                          title: "Register",
                          headerShown: false,
                          gestureEnabled: false, // Prevent swipe back
                        }}
                      />
                      <Stack.Screen
                        name="welcome"
                        options={{
                          title: "Welcome",
                          headerBackTitle: "Back",
                          gestureEnabled: false, // Prevent swipe back during onboarding
                        }}
                      />
                      <Stack.Screen
                        name="experience"
                        options={{
                          title: "Experience",
                          headerBackTitle: "Back",
                        }}
                      />
                      <Stack.Screen
                        name="directions"
                        options={{
                          title: "Directions",
                          headerBackTitle: "Back",
                        }}
                      />
                      <Stack.Screen
                        name="video"
                        options={{
                          title: "Video",
                          headerShown: false,
                          presentation: "fullScreenModal",
                          gestureEnabled: false, // Prevent swipe back during onboarding
                        }}
                      />
                      <Stack.Screen
                        name="faq"
                        options={{
                          title: "FAQ",
                          headerShown: true,
                          headerBackTitle: "Back",
                        }}
                      />
                      <Stack.Screen
                        name="team"
                        options={{
                          title: "Team",
                          headerShown: true,
                          headerBackTitle: "Back",
                        }}
                      />
                      <Stack.Screen
                        name="track"
                        options={{
                          title: "Track",
                          headerShown: true,
                          headerBackTitle: "Back",
                        }}
                      />
                      <Stack.Screen
                        name="userQR"
                        options={{
                          title: "My QR Code",
                          headerShown: true,
                          headerBackTitle: "Back",
                        }}
                      />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="auto" />
                  </AppStateManager>
                </ThemeProvider>
              </SafeAreaProvider>
            </TeamThemeProvider>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    );
  } catch (error) {
  // ...existing code...
    // Return a minimal fallback UI
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
        <Text style={{ fontSize: 18, textAlign: "center", marginBottom: 20 }}>
          App failed to start
        </Text>
        <Text style={{ fontSize: 14, textAlign: "center", color: "gray" }}>
          {error instanceof Error ? error.message : "Unknown error"}
        </Text>
      </View>
    );
  }
}
