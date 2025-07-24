import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService, { AuthState, User } from '@/services/AuthService';

interface AuthContextType {
  authState: AuthState;
  isLoading: boolean;
  createUser: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isFirstTimeUser' | 'hasCompletedOnboarding' | 'notificationSubscribed'>) => Promise<User>;
  createLocalAuthState: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isFirstTimeUser' | 'hasCompletedOnboarding' | 'notificationSubscribed'>) => Promise<User>;
  completeOnboarding: () => Promise<void>;
  updateNotificationSubscription: (subscribed: boolean, pushToken?: string) => Promise<void>;
  fetchUserDataFromStrapi: (userId: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshAuthState: () => Promise<void>;
  debugUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('❌ useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isFirstTimeUser: true,
    hasCompletedOnboarding: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const authService = AuthService.getInstance();

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔧 Starting auth initialization...');
      
      // Add a small delay to ensure all modules are loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const initialAuthState = await authService.initializeAuth();
      console.log('✅ Auth initialization complete:', initialAuthState);
      setAuthState(initialAuthState);
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      // Set safe fallback state
      setAuthState({
        isAuthenticated: false,
        user: null,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isFirstTimeUser' | 'hasCompletedOnboarding' | 'notificationSubscribed'>): Promise<User> => {
    try {
      const user = await authService.createUser(userData);
      setAuthState(authService.getAuthState());
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const createLocalAuthState = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isFirstTimeUser' | 'hasCompletedOnboarding' | 'notificationSubscribed'>): Promise<User> => {
    try {
      const user = await authService.createLocalAuthState(userData);
      setAuthState(authService.getAuthState());
      return user;
    } catch (error) {
      console.error('Error creating local auth state:', error);
      throw error;
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    try {
      await authService.completeOnboarding();
      setAuthState(authService.getAuthState());
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const updateNotificationSubscription = async (subscribed: boolean, pushToken?: string): Promise<void> => {
    try {
      await authService.updateNotificationSubscription(subscribed, pushToken);
      setAuthState(authService.getAuthState());
    } catch (error) {
      console.error('Error updating notification subscription:', error);
      throw error;
    }
  };

  const fetchUserDataFromStrapi = async (userId: string): Promise<User> => {
    try {
      const user = await authService.fetchUserDataFromStrapi(userId);
      setAuthState(authService.getAuthState());
      return user;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setAuthState(authService.getAuthState());
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const refreshAuthState = async (): Promise<void> => {
    const currentState = authService.getAuthState();
    setAuthState(currentState);
  };

  const debugUserData = async (): Promise<void> => {
    await authService.debugUserData();
  };

  const value: AuthContextType = {
    authState,
    isLoading,
    createUser,
    createLocalAuthState,
    completeOnboarding,
    updateNotificationSubscription,
    fetchUserDataFromStrapi,
    logout,
    refreshAuthState,
    debugUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
