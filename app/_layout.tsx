import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { TeamThemeProvider } from "@/theme/TeamThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import AuthNavigator from "../components/AuthNavigator";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Roobert: require("../assets/fonts/Roobert-Regular.ttf"),
    RoobertSemi: require("../assets/fonts/Roobert-SemiBold.ttf"),
    RoobertMedium: require("../assets/fonts/Roobert-Medium.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <TeamThemeProvider>
        <SafeAreaProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <AuthNavigator>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </AuthNavigator>
          </ThemeProvider>
        </SafeAreaProvider>
      </TeamThemeProvider>
    </AuthProvider>
  );
}
