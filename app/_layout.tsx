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
import { ErrorBoundary } from 'react-error-boundary';
import { Text, View } from 'react-native';
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { TeamThemeProvider } from "@/theme/TeamThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import AuthNavigator from "../components/AuthNavigator";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Error fallback component
function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Something went wrong</Text>
      <Text style={{ fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
        {error.message || 'An unexpected error occurred'}
      </Text>
      <Text 
        style={{ fontSize: 16, color: 'blue', textDecorationLine: 'underline' }}
        onPress={resetErrorBoundary}
      >
        Try again
      </Text>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Roobert: require("../assets/fonts/Roobert-Regular.ttf"),
    RoobertSemi: require("../assets/fonts/Roobert-SemiBold.ttf"),
    RoobertMedium: require("../assets/fonts/Roobert-Medium.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      // Add a small delay to ensure everything is ready before hiding splash
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 100);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App crashed:', error, errorInfo);
      }}
    >
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
    </ErrorBoundary>
  );
}
