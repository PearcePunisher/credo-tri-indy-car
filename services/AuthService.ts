import AsyncStorage from '@react-native-async-storage/async-storage';
import { STRAPI_CONFIG } from '@/constants/StrapiConfig';
import QRCodeService from './QRCodeService';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber?: string;
  isFirstTimeUser: boolean;
  hasCompletedOnboarding: boolean;
  notificationSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional server data from Railway
  serverId?: string;
  eventCodeDocumentId?: string;
  eventScheduleDocumentId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isFirstTimeUser: boolean;
  hasCompletedOnboarding: boolean;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    isFirstTimeUser: true,
    hasCompletedOnboarding: false,
  };

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize auth state from local storage
  async initializeAuth(): Promise<AuthState> {
    try {
      console.log('🔧 Initializing AuthService...');
      
      // Add delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const storedUser = await AsyncStorage.getItem('@user_data');
      const onboardingStatus = await AsyncStorage.getItem('@onboarding_status');
      const hasLaunchedBefore = await AsyncStorage.getItem('@has_launched_before');
      const hasEverRegistered = await AsyncStorage.getItem('@has_ever_registered');
      
      // Mark that the app has been launched
      if (!hasLaunchedBefore) {
        await AsyncStorage.setItem('@has_launched_before', 'true');
      }
      
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        this.authState = {
          isAuthenticated: true,
          user,
          isFirstTimeUser: false, // Has account, so not first time
          hasCompletedOnboarding: onboardingStatus === 'completed',
        };
        console.log('✅ Found existing user, authenticated');
      } else {
        // Determine if this is first time vs returning user who logged out
        const isFirstTime = !hasLaunchedBefore && !hasEverRegistered;
        this.authState = {
          isAuthenticated: false,
          user: null,
          isFirstTimeUser: isFirstTime,
          hasCompletedOnboarding: false,
        };
        console.log(`🆕 No user account found, isFirstTime: ${isFirstTime}`);
      }
      
      return this.authState;
    } catch (error) {
      console.error('Error initializing auth:', error);
      // Return safe default state on error
      return {
        isAuthenticated: false,
        user: null,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
      };
    }
  }

  // Create user account
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isFirstTimeUser' | 'hasCompletedOnboarding' | 'notificationSubscribed'>): Promise<User> {
    try {
      // Create user in Strapi
      const response = await fetch(`${STRAPI_CONFIG.baseUrl}/api/auth/local/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.email,
          email: userData.email,
          password: this.generateTempPassword(), // Generate temporary password
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user account');
      }

      const result = await response.json();
      
      const user: User = {
        id: result.user.id.toString(),
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        dateOfBirth: result.user.dateOfBirth,
        phoneNumber: result.user.phoneNumber,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
        notificationSubscribed: false,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt,
      };

      // Store user data locally
      await this.storeUserData(user);
      
      // Mark that app has been launched
      await AsyncStorage.setItem('@has_launched_before', 'true');
      
      this.authState = {
        isAuthenticated: true,
        user,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
      };

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Create local authenticated state (for users registered via external service like Railway)
  async createLocalAuthState(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'isFirstTimeUser' | 'hasCompletedOnboarding' | 'notificationSubscribed'>): Promise<User> {
    try {
      const user: User = {
        id: userData.serverId || `local_${Date.now()}`, // Use server ID if available, fallback to local ID
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        phoneNumber: userData.phoneNumber,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
        notificationSubscribed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Include additional server data if provided
        serverId: userData.serverId,
        eventCodeDocumentId: userData.eventCodeDocumentId,
        eventScheduleDocumentId: userData.eventScheduleDocumentId,
      };

      // Store user data locally
      await this.storeUserData(user);
      
      // Generate and store QR code
      try {
        const qrCodeService = QRCodeService.getInstance();
        await qrCodeService.storeQRCodeData(user);
        console.log('QR code generated and stored for user:', user.id);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Don't throw error as QR code generation is not critical for auth
      }
      
      // Mark that app has been launched and user has registered
      await AsyncStorage.setItem('@has_launched_before', 'true');
      await AsyncStorage.setItem('@has_ever_registered', 'true');
      
      this.authState = {
        isAuthenticated: true,
        user,
        isFirstTimeUser: true,
        hasCompletedOnboarding: false,
      };

      return user;
    } catch (error) {
      console.error('Error creating local auth state:', error);
      throw error;
    }
  }

  // Complete onboarding process
  async completeOnboarding(): Promise<void> {
    try {
      if (this.authState.user) {
        const updatedUser = {
          ...this.authState.user,
          hasCompletedOnboarding: true,
          isFirstTimeUser: false,
        };
        
        await this.storeUserData(updatedUser);
        await AsyncStorage.setItem('@onboarding_status', 'completed');
        
        this.authState = {
          ...this.authState,
          user: updatedUser,
          isFirstTimeUser: false,
          hasCompletedOnboarding: true,
        };
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  // Update notification subscription status
  async updateNotificationSubscription(subscribed: boolean, pushToken?: string): Promise<void> {
    try {
      if (this.authState.user) {
        const updatedUser = {
          ...this.authState.user,
          notificationSubscribed: subscribed,
        };

        // Update in Strapi
        await fetch(`${STRAPI_CONFIG.baseUrl}/api/users/${this.authState.user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notificationSubscribed: subscribed,
            pushToken: pushToken,
          }),
        });

        await this.storeUserData(updatedUser);
        
        this.authState = {
          ...this.authState,
          user: updatedUser,
        };
      }
    } catch (error) {
      console.error('Error updating notification subscription:', error);
      throw error;
    }
  }

  // Fetch user data from Strapi
  async fetchUserDataFromStrapi(userId: string): Promise<User> {
    try {
      const response = await fetch(`${STRAPI_CONFIG.baseUrl}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data from Strapi');
      }

      const userData = await response.json();
      
      const user: User = {
        id: userData.id.toString(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        phoneNumber: userData.phoneNumber,
        isFirstTimeUser: userData.isFirstTimeUser || false,
        hasCompletedOnboarding: userData.hasCompletedOnboarding || false,
        notificationSubscribed: userData.notificationSubscribed || false,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      await this.storeUserData(user);
      return user;
    } catch (error) {
      console.error('Error fetching user data from Strapi:', error);
      throw error;
    }
  }

  // Store user data locally
  private async storeUserData(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('@user_data', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  // Generate temporary password for Strapi registration
  private generateTempPassword(): string {
    return Math.random().toString(36).slice(-8) + 'A1!';
  }

  // Get current auth state
  getAuthState(): AuthState {
    return this.authState;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.authState.user;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  // Check if this is first time user
  isFirstTimeUser(): boolean {
    return this.authState.isFirstTimeUser;
  }

  // Check if onboarding is completed
  hasCompletedOnboarding(): boolean {
    return this.authState.hasCompletedOnboarding;
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const currentUser = this.authState.user;
      
      await AsyncStorage.removeItem('@user_data');
      await AsyncStorage.removeItem('@onboarding_status');
      
      // Clear QR code data if user exists
      if (currentUser) {
        try {
          const qrCodeService = QRCodeService.getInstance();
          await qrCodeService.clearQRCodeData(currentUser.id);
          console.log('QR code data cleared for user:', currentUser.id);
        } catch (qrError) {
          console.error('Error clearing QR code data:', qrError);
          // Don't throw error as QR code cleanup is not critical for logout
        }
      }
      
      this.authState = {
        isAuthenticated: false,
        user: null,
        isFirstTimeUser: false, // They've used the app before
        hasCompletedOnboarding: false,
      };
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }
}

export default AuthService;
