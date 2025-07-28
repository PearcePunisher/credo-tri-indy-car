# User Onboarding Flow Implementation

## Overview
Implemented a comprehensive user onboarding flow with authentication, navigation routing, and notification subscription management.

## Flow Architecture

### 1. First Time User Experience
- **Landing Page**: `userID.tsx` (registration page)
- **After Registration**: Redirects to full-screen video player
- **After Video**: Redirects to welcome page with notification subscription
- **After Welcome**: Redirects to main app (`index.tsx`)

### 2. Subsequent App Launches
- **Authenticated Users**: Direct to main app (`index.tsx`)
- **Unauthenticated Users**: Back to registration (`userID.tsx`)

## Key Components

### AuthService (`services/AuthService.ts`)
- Manages user authentication state
- Handles local storage of user data with AsyncStorage
- Integrates with Strapi backend for user management
- Supports user creation, onboarding completion, and notification subscription

### AuthProvider (`hooks/useAuth.tsx`)
- React context provider for authentication state
- Provides hooks for all auth-related operations
- Manages global authentication state across the app

### AuthNavigator (`components/AuthNavigator.tsx`)
- Handles automatic routing based on authentication state
- Redirects users to appropriate screens based on onboarding progress
- Uses `useSegments` to prevent navigation loops

## User Flow States

### State 1: First Time User
```
App Launch → userID.tsx → (Registration) → video.tsx → welcome.tsx → (tabs)/index.tsx
```

### State 2: Returning Authenticated User
```
App Launch → (tabs)/index.tsx
```

### State 3: Returning User (No Account)
```
App Launch → userID.tsx
```

## Notification Flow

### Welcome Page Improvements
- **Subscribe Button**: Requests notification permissions and registers push token
- **Skip Button**: Shows warning popup about missing important updates
- **Integration**: Updates user preferences in both local storage and Strapi backend

### Warning System
When users skip notifications:
```
"You may miss out on important track experiences, exclusive content, and event updates. Are you sure you want to skip?"
- "Yes, Skip" → Continue to main app
- "Enable Notifications" → Trigger subscription flow
```

## Backend Integration

### Strapi Configuration
- **Base URL**: `https://timely-actor-10dfb03957.strapiapp.com`
- **User Registration**: Creates user account with temporary password
- **Data Sync**: Pulls user data from Strapi and stores locally
- **Push Tokens**: Registers device tokens for notifications

### Data Storage
- **Local**: AsyncStorage for offline user state
- **Remote**: Strapi backend for user management and synchronization
- **Hybrid**: Local-first with cloud sync approach

## Technical Implementation

### Dependencies Added
- `@react-native-async-storage/async-storage`: Local data persistence
- Enhanced existing notification system integration

### Modified Files
- `app/_layout.tsx`: Added AuthProvider and AuthNavigator
- `components/forms/UserRegistrationFormik.tsx`: Integrated with AuthService
- `app/video.tsx`: Added onboarding completion trigger
- `app/welcome.tsx`: Enhanced notification subscription flow
- `constants/StrapiConfig.ts`: Updated with correct backend URL

## User Experience Features

### Seamless Onboarding
- Automatic navigation based on user state
- Persistent authentication across app restarts
- Progressive onboarding with video introduction

### Notification Management
- Clear value proposition for notifications
- Graceful handling of permission denials
- Warning system for users who skip notifications

### Data Synchronization
- Local-first approach for fast app startup
- Background sync with Strapi backend
- Offline capability with eventual consistency

## Testing Checklist

1. **First Time User Flow**
   - [ ] Fresh install lands on userID page
   - [ ] Successful registration redirects to video
   - [ ] Video completion redirects to welcome
   - [ ] Notification subscription works
   - [ ] Main app access after onboarding

2. **Returning User Flow**
   - [ ] Authenticated users go directly to main app
   - [ ] App remembers authentication state
   - [ ] Onboarding doesn't repeat

3. **Notification Flow**
   - [ ] Subscribe button requests permissions
   - [ ] Skip button shows warning
   - [ ] User preferences sync to backend
   - [ ] Push tokens registered correctly

## Environment Setup

### Required Environment Variables
```
EXPO_PUBLIC_STRAPI_URL=https://timely-actor-10dfb03957.strapiapp.com
EXPO_PUBLIC_PROJECT_ID=db70e71b-2bb8-4da5-9442-a8f0ce48fd2f
```

### Project Configuration
- Project ID already configured in `app.json`
- Strapi backend URL configured in `StrapiConfig.ts`
- Notification system ready for production use

## Next Steps

1. **Test the complete flow** in development
2. **Verify Strapi backend** is configured for user registration
3. **Test notification permissions** on both iOS and Android
4. **Validate data synchronization** between local and remote storage
5. **Test offline capabilities** and error handling

This implementation provides a robust, user-friendly onboarding experience that balances user convenience with feature adoption.
