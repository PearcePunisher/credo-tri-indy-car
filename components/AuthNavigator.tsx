import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from '@react-navigation/native';

const AuthNavigator: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    try {
      if (isLoading) return; // Don't navigate while loading

      const inTabsGroup = segments[0] === '(tabs)';
      const currentPath = segments.join('/');
      const inAuthFlow = currentPath.includes('userID') || currentPath.includes('welcome');
      // Define allowed standalone pages that can be accessed without authentication
      const allowedStandalonePages = ['userQR', 'experience', 'directions', 'track', 'team', 'car', 'schedule', 'faq'];
      
      const inAllowedStandalonePage = allowedStandalonePages.some(page => currentPath.includes(page));

      console.log('🧭 Navigation check:', {
        isAuthenticated: authState.isAuthenticated,
        isFirstTimeUser: authState.isFirstTimeUser,
        hasCompletedOnboarding: authState.hasCompletedOnboarding,
        currentPath,
        inTabsGroup,
        inAuthFlow
      });

      // Route users based on authentication and onboarding state
      if (!authState.isAuthenticated && authState.isFirstTimeUser) {
        // First time user - redirect to userID page
        if (!inAuthFlow) {
          console.log('🔄 Redirecting first-time user to userID');
          router.replace('/userID');
        }
      } else if (authState.isAuthenticated && !authState.hasCompletedOnboarding) {
        // User created account but hasn't completed onboarding - go to welcome page with video
        if (!currentPath.includes('welcome')) {
          console.log('🔄 Redirecting authenticated user to welcome (onboarding)');
          router.replace('/welcome');
        }
      } else if (authState.isAuthenticated && authState.hasCompletedOnboarding) {
        // User has completed onboarding - go to main app (but allow welcome page and standalone pages)
        if (!inTabsGroup && !inAuthFlow && !inAllowedStandalonePage) {
          console.log('🔄 Redirecting to main app (tabs)');
          router.replace('/(tabs)');
        }
      } else {
        // Returning user without account - redirect to userID page
        if (!inAuthFlow) {
          console.log('🔄 Redirecting returning user to userID');
          router.replace('/userID');
        }
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // On navigation error, try to go to a safe default
      try {
        router.replace('/userID');
      } catch (fallbackError) {
        console.error('❌ Fallback navigation also failed:', fallbackError);
      }
    }
  }, [authState, isLoading, segments]);

  // Prevent going back to userID after authentication
  useFocusEffect(
    React.useCallback(() => {
      const currentPath = segments.join('/');
      
      // If user is authenticated and tries to go back to userID, redirect them
      if (authState.isAuthenticated && currentPath.includes('userID')) {
        if (authState.hasCompletedOnboarding) {
          router.replace('/(tabs)');
        } else {
          router.replace('/welcome');
        }
      }
    }, [authState, segments])
  );

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AuthNavigator;
