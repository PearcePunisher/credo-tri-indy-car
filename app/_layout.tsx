import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
// import { useFonts } from 'expo-font'; // TEMPORARILY DISABLED FOR CRASH TESTING
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from 'react-error-boundary';
import { Text, View } from 'react-native';

// Check if reanimated import causes issues in production
try {
  console.log('📦 Importing react-native-reanimated...');
  // Temporarily disable reanimated import for production debugging
  // require("react-native-reanimated");
  console.log('⚠️ Reanimated import temporarily disabled for debugging');
} catch (error) {
  console.error('❌ Reanimated import failed:', error);
}

import { useColorScheme } from "@/hooks/useColorScheme";
import { TeamThemeProvider } from "@/theme/TeamThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import AppStateManager from "../components/AppStateManager";
import { PushTokenInitializer } from "../components/PushTokenInitializer";

// Add native crash logging and environment validation
console.log('📱 App starting - Native level');
console.log('🌍 Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  DEV_MODE: process.env.EXPO_PUBLIC_DEV_MODE,
  hasProjectId: !!process.env.EXPO_PUBLIC_PROJECT_ID
});

// Import environment config early to validate
import { ENV_CONFIG } from '@/constants/Environment';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Error fallback component
function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  console.error('App Error Boundary caught:', error);
  console.error('Error stack:', error.stack);
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>App Error</Text>
      <Text style={{ fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
        {error.message || 'An unexpected error occurred'}
      </Text>
      <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 20, color: 'gray' }}>
        {error.stack ? error.stack.substring(0, 200) + '...' : ''}
      </Text>
      <Text 
        style={{ fontSize: 16, color: 'blue', textDecorationLine: 'underline', padding: 10 }}
        onPress={resetErrorBoundary}
      >
        Try again
      </Text>
    </View>
  );
}

export default function RootLayout() {
  console.log('🚀 RootLayout starting...');
  const { colorScheme } = useColorScheme();
  
  console.log('📝 Skipping font loading for crash testing...');
  // TEMPORARILY DISABLED FOR CRASH TESTING
  // const [loaded] = useFonts({
  //   Roobert: require("../assets/fonts/Roobert-Regular.ttf"),
  //   RoobertSemi: require("../assets/fonts/Roobert-SemiBold.ttf"),
  //   RoobertMedium: require("../assets/fonts/Roobert-Medium.ttf"),
  // });
  const loaded = true; // Force to true for testing
  
  console.log('✅ Fonts loaded status (forced for testing):', loaded);

  useEffect(() => {
    console.log('📱 useEffect triggered, loaded:', loaded);
    if (loaded) {
      console.log('🎯 Hiding splash screen...');
      // Add a small delay to ensure everything is ready before hiding splash
      setTimeout(() => {
        SplashScreen.hideAsync();
        console.log('✅ Splash screen hidden');
      }, 100);
    }
  }, [loaded]);

  if (!loaded) {
    console.log('⏳ Fonts not loaded yet, returning null');
    return null;
  }

  console.log('🏗️ Rendering main app structure...');

  try {
    console.log('🔧 Starting app render...');
    return (
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error, errorInfo) => {
          console.error('💥 App crashed in ErrorBoundary:', error, errorInfo);
        }}
      >
        <AuthProvider>
          <PushTokenInitializer />
          <TeamThemeProvider>
            <SafeAreaProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
              <AppStateManager>
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
              </AppStateManager>
            </ThemeProvider>
          </SafeAreaProvider>
        </TeamThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
  } catch (error) {
    console.error('💥 Critical app render error:', error);
    // Return a minimal fallback UI
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
          App failed to start
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: 'gray' }}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </View>
    );
  }
}
