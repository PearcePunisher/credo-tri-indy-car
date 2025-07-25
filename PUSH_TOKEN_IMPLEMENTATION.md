# Push Token Registration Implementation

This document outlines the complete push token registration system implemented for the Credo Tri Indy Car app, following best practices for both iOS and Android platforms.

## Overview

The push token registration system handles:
- ✅ User consent collection during registration
- ✅ Automatic permission requests with proper iOS/Android handling
- ✅ Push token generation with comprehensive error handling
- ✅ Backend integration with graceful fallbacks
- ✅ Automatic initialization for authenticated users
- ✅ User-friendly permission management

## Implementation Components

### 1. PushTokenService (`services/PushTokenService.ts`)

**Core Features:**
- Platform-specific permission handling (iOS/Android)
- Expo push token generation with project ID validation
- Backend registration with fallback support
- Local storage for token persistence
- Notification category configuration
- Comprehensive error handling and logging

**Key Methods:**
- `requestNotificationPermissions()`: iOS/Android permission handling
- `getExpoPushToken()`: Token generation with validation
- `registerTokenWithBackend()`: Server registration
- `registerPushToken()`: Complete registration flow
- `isTokenRegistered()`: Check registration status

### 2. Registration Form Integration (`components/forms/UserRegistrationFormik.tsx`)

**Added Features:**
- Notification consent checkbox with validation
- Clear explanation of notification benefits
- Automatic push token registration on consent
- Permission prompt handling with user-friendly messages
- Graceful error handling that doesn't block registration

**User Experience:**
- Users see benefits of enabling notifications
- Clear consent requirement with validation
- Automatic token registration on successful signup
- Permission prompts with retry options
- Registration proceeds even if notifications fail

### 3. PushTokenInitializer (`components/PushTokenInitializer.tsx`)

**Automatic Initialization:**
- Runs on app startup for authenticated users
- Checks consent status before attempting registration
- Avoids duplicate registrations
- Handles permission errors gracefully
- Updates user notification status

**usePushTokenRegistration Hook:**
- `registerWithUserPrompt()`: User-initiated registration
- `disableNotifications()`: Clean notification disable
- `checkRegistrationStatus()`: Status checking
- `sendTestNotification()`: Development testing
- Loading states and authentication checks

### 4. App Integration (`app/_layout.tsx`)

**Integrated Components:**
- PushTokenInitializer in app component tree
- Runs after AuthProvider for user context
- Silent initialization without blocking UI

## Platform-Specific Handling

### iOS Best Practices ✅
- Requests permissions with specific options (alert, badge, sound)
- Handles provisional notifications appropriately
- Respects canAskAgain permission state
- Provides clear user guidance for settings

### Android Best Practices ✅
- Requests standard notification permissions
- Handles different Android API levels
- Provides device-specific settings guidance
- Manages notification channels properly

## Usage Examples

### 1. User Registration Flow

```tsx
// In registration form - automatically handled
const registrationData = {
  email: "user@example.com",
  notificationConsent: true, // User opted in
  // ... other fields
};

// System automatically:
// 1. Requests permissions if needed
// 2. Generates push token
// 3. Registers with backend
// 4. Updates user subscription status
```

### 2. Settings Toggle

```tsx
import { usePushTokenRegistration } from '@/components/PushTokenInitializer';

function NotificationSettings() {
  const { 
    registerWithUserPrompt, 
    disableNotifications,
    isRegistering,
    hasConsentedToNotifications 
  } = usePushTokenRegistration();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      await registerWithUserPrompt(); // Shows permission prompts if needed
    } else {
      await disableNotifications(); // Cleans up registration
    }
  };

  return (
    <Switch 
      value={hasConsentedToNotifications}
      onValueChange={handleToggle}
      disabled={isRegistering}
    />
  );
}
```

### 3. Testing Notifications

```tsx
import { usePushTokenRegistration } from '@/components/PushTokenInitializer';

function DeveloperSettings() {
  const { sendTestNotification } = usePushTokenRegistration();

  return (
    <Button onPress={sendTestNotification}>
      Send Test Notification
    </Button>
  );
}
```

## Error Handling & Fallbacks

### Permission Denied
- Shows user-friendly explanation
- Provides device-specific instructions
- Allows retry when user returns from settings
- Doesn't block app functionality

### Network Errors
- Backend registration failures fall back to local tokens
- Retry mechanisms for temporary failures
- Clear error messages for permanent failures
- App continues to function without push notifications

### Token Generation Failures
- Validates device requirements (physical device)
- Checks project configuration
- Provides clear error messages
- Logs detailed information for debugging

## Security Considerations

### Token Management
- Tokens stored securely in AsyncStorage
- Backend registration includes device metadata
- Tokens refreshed automatically by Expo
- Old tokens cleaned up on logout

### Privacy Compliance
- Explicit user consent required
- Clear explanation of notification types
- Easy opt-out mechanism
- No tracking without consent

## Testing Guidelines

### Local Testing
```typescript
// Test token generation
const token = await pushTokenService.getExpoPushToken();
console.log('Generated token:', token);

// Test permissions
const status = await pushTokenService.getPermissionStatus();
console.log('Permission status:', status);

// Send test notification
await pushTokenService.sendTestNotification('Test', 'Test message');
```

### Backend Testing
```bash
# Test token registration
curl -X PUT "https://your-strapi.com/api/notifications/push-token/user123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"expoPushToken": "ExponentPushToken[...]"}'
```

### Production Validation
- Test on both iOS and Android devices
- Verify permission flows work correctly
- Test background notification delivery
- Validate token persistence across app restarts

## Monitoring & Analytics

### Key Metrics to Track
- Registration success rate
- Permission grant rate
- Token generation failures
- Backend registration errors
- Notification delivery rates

### Logging Implementation
```typescript
// All major events are logged with context
console.log('✅ Push token registered successfully');
console.error('❌ Permission request failed:', error);
console.warn('⚠️ Backend registration failed, using local fallback');
```

## Troubleshooting Guide

### Common Issues

**"Push token not generating"**
- Check if running on physical device
- Verify Expo project ID is configured
- Check network connectivity
- Validate app configuration

**"Permissions not requesting"**
- Check if canAskAgain is true
- Verify not running in simulator
- Test permission request timing
- Check device notification settings

**"Backend registration failing"**
- Verify Strapi URL configuration
- Check authentication token validity
- Test API endpoint manually
- Review server logs

**"Notifications not appearing"**
- Test with immediate notification
- Check device notification settings
- Verify token is valid format
- Test with Expo Push Tool

## Future Enhancements

### Potential Improvements
- Notification categories for better targeting
- Rich notification support with images
- Interactive notification buttons
- Location-based notification triggers
- Analytics dashboard for notification engagement

### Backend Enhancements
- Notification scheduling UI
- A/B testing for notification content
- User segmentation for targeted messaging
- Delivery confirmation tracking
- Unsubscribe analytics

This implementation provides a robust, user-friendly push notification system that follows platform best practices while maintaining excellent user experience and developer maintainability.
