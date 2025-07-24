import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useRouter } from 'expo-router';

// Import the different app screens
import { RegisterScreenFormik } from '@/components/forms/UserRegistrationFormik';

// We need to create a wrapper for the welcome screen since it's currently a page component
// For now, we'll let the main app handle welcome via routing

interface AppStateManagerProps {
  children: React.ReactNode; // This will be the main app (Stack with tabs)
}

const AppStateManager: React.FC<AppStateManagerProps> = ({ children }) => {
  console.log('🎯 AppStateManager rendering...');
  
  const { authState, isLoading } = useAuth();
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  console.log('📱 Auth State:', {
    isAuthenticated: authState.isAuthenticated,
    isFirstTimeUser: authState.isFirstTimeUser,
    hasCompletedOnboarding: authState.hasCompletedOnboarding,
    isLoading
  });

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isLoading && authState.isAuthenticated && !authState.hasCompletedOnboarding) {
      console.log('👋 Navigating to welcome page for onboarding...');
      router.replace('/welcome');
    }
  }, [authState.isAuthenticated, authState.hasCompletedOnboarding, isLoading, router]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    console.log('⏳ Showing loading state...');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // Conditional rendering based on auth state - no navigation needed!
  
  // Case 1: First time user OR logged out user - show registration
  if (!authState.isAuthenticated) {
    console.log('🆕 Showing registration screen for unauthenticated user');
    return <RegisterScreenFormik />;
  }

  // Case 2: Authenticated but hasn't completed onboarding - show main app 
  // (which will route to welcome screen based on the current routing setup)
  if (authState.isAuthenticated && !authState.hasCompletedOnboarding) {
    console.log('👋 User authenticated but needs onboarding - showing main app (will route to welcome)');
    return children as React.ReactElement;
  }

  // Case 3: Fully authenticated and onboarded - show main app
  if (authState.isAuthenticated && authState.hasCompletedOnboarding) {
    console.log('🏠 Showing main app for fully authenticated user');
    return children as React.ReactElement;
  }

  // Fallback case - should never reach here, but show registration to be safe
  console.warn('⚠️ Unexpected auth state, falling back to registration');
  return <RegisterScreenFormik />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppStateManager;
