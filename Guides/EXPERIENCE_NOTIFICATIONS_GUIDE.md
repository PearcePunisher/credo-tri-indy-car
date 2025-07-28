# Experience Notifications Implementation Guide

This guide provides step-by-step instructions for implementing experience notifications in the Credo Tri Indy Car app, including both frontend and backend components.

## Table of Contents
- [Overview](#overview)
- [Current Implementation Status](#current-implementation-status)
- [Frontend Implementation](#frontend-implementation)
- [Backend Integration](#backend-integration)
- [Testing Experience Notifications](#testing-experience-notifications)
- [Troubleshooting](#troubleshooting)

## Overview

Experience notifications provide users with timely reminders about their scheduled experiences:
- **1 Hour Before**: Initial reminder with event details
- **20 Minutes Before**: Location-specific reminder with directions
- **At Event Time**: Final reminder to head to the venue

## Current Implementation Status

### ✅ Already Implemented
- `ExperienceDetailTray` component with notification toggle
- `ExperienceNotificationSettings` component for advanced settings
- `EnhancedNotificationService` with local notification scheduling
- `ExperiencesService` with backend integration fallback
- Notification tray with sample notifications

### 🔄 Integration Points
- Backend API endpoints for notification scheduling
- Push token registration with Strapi
- User authentication token handling
- Experience data synchronization

## Frontend Implementation

### 1. Experience Detail Tray Integration

The `ExperienceDetailTray` component already includes notification functionality. Here's how to use it properly:

```tsx
import { ExperienceDetailTray } from '@/components/ExperienceDetailTray';
import { experiencesService } from '@/services/ExperiencesService';

function ExperienceScreen() {
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);

  // Load notification status when experience is selected
  useEffect(() => {
    if (selectedExperience) {
      loadNotificationStatus();
    }
  }, [selectedExperience]);

  const loadNotificationStatus = async () => {
    if (selectedExperience) {
      const status = await experiencesService.getNotificationStatus(selectedExperience.id);
      setNotificationEnabled(status);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!selectedExperience) return;

    try {
      if (enabled) {
        await experiencesService.scheduleNotifications(selectedExperience.id);
      } else {
        await experiencesService.cancelNotifications(selectedExperience.id);
      }
      setNotificationEnabled(enabled);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      // Show error alert to user
    }
  };

  return (
    <ExperienceDetailTray
      visible={!!selectedExperience}
      experience={selectedExperience}
      onClose={() => setSelectedExperience(null)}
      isNotificationEnabled={notificationEnabled}
      onToggleNotification={handleNotificationToggle}
    />
  );
}
```

### 2. Enhanced Notification Bell Integration

The notification bell is already integrated in the index page and shows real notifications:

```tsx
// In app/(tabs)/index.tsx
<EnhancedNotificationBell 
  size={24} 
  onPress={() => setNotificationTrayVisible(true)}
/>

<NotificationTray 
  visible={notificationTrayVisible}
  onClose={() => setNotificationTrayVisible(false)}
/>
```

### 3. User Registration and Push Tokens

To enable push notifications, ensure users register their push tokens:

```tsx
// In your auth flow or app initialization
import { useEnhancedNotifications } from '@/hooks/useEnhancedNotifications';
import { useAuth } from '@/hooks/useAuth';

function AppInitializer() {
  const { user } = useAuth();
  const { registerForPushNotifications } = useEnhancedNotifications({
    userId: user?.id,
    jwtToken: user?.authToken,
    isVIP: user?.isVIP
  });

  useEffect(() => {
    if (user) {
      // Register for push notifications when user logs in
      registerForPushNotifications();
    }
  }, [user]);

  return null;
}
```

## Backend Integration

### 1. Database Setup

Ensure your Strapi backend has the correct content types. The key schemas needed are:

**Experience Schema Extensions:**
```json
{
  "reminderEnabled": {
    "type": "boolean",
    "default": true
  },
  "reminderTimes": {
    "type": "json",
    "description": "Array of reminder times in minutes before event",
    "default": [60, 20, 0]
  }
}
```

**User Schema Extensions:**
```json
{
  "expoPushToken": {
    "type": "string",
    "description": "Expo push notification token"
  },
  "notificationsEnabled": {
    "type": "boolean",
    "default": true
  },
  "notificationPreferences": {
    "type": "json",
    "default": {
      "experienceReminders": true,
      "raceUpdates": true,
      "generalAnnouncements": true
    }
  }
}
```

### 2. API Endpoint Testing

Test the notification endpoints manually first:

```bash
# Schedule notifications for an experience
curl -X POST "http://your-strapi-url/api/notifications/schedule-experience/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId": "user123"}'

# Cancel notifications for an experience
curl -X DELETE "http://your-strapi-url/api/notifications/cancel-experience/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"userId": "user123"}'

# Update push token
curl -X PUT "http://your-strapi-url/api/notifications/push-token/user123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"expoPushToken": "ExponentPushToken[...]"}'
```

### 3. Environment Configuration

Update your `.env` file with notification settings:

```env
# Strapi Configuration
EXPO_PUBLIC_STRAPI_URL=https://your-strapi-instance.strapiapp.com

# Expo Push Notifications (Backend)
EXPO_ACCESS_TOKEN=your_expo_access_token

# Notification Settings
NOTIFICATION_SCHEDULE_ENABLED=true
NOTIFICATION_DEBUG_MODE=false
```

## Testing Experience Notifications

### 1. Local Testing (Without Backend)

The app will automatically fall back to local notifications if the backend is unavailable:

```typescript
// Test local notifications in development
import { experiencesService } from '@/services/ExperiencesService';

// Create a test experience
const testExperience = {
  id: 999,
  title: 'Test Garage Tour',
  experience_start_date_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
  location: 'Test Garage',
  // ... other required fields
};

// Schedule test notifications
await experiencesService.scheduleExperienceNotifications(testExperience);
```

### 2. Push Notification Testing

Create a test endpoint in your app for development:

```tsx
// Add to your debug/development menu
import { enhancedNotificationService } from '@/services/EnhancedNotificationService';

const TestNotificationButton = () => {
  const sendTestNotification = async () => {
    await enhancedNotificationService.sendTestNotification(
      'Test Experience Reminder',
      'Your test experience starts in 1 hour!'
    );
  };

  return (
    <TouchableOpacity onPress={sendTestNotification}>
      <Text>Send Test Notification</Text>
    </TouchableOpacity>
  );
};
```

### 3. Backend Integration Testing

Test the full flow with backend integration:

1. **User Registration**: Ensure push tokens are properly registered
2. **Experience Scheduling**: Test scheduling via API
3. **Notification Delivery**: Verify notifications are sent at correct times
4. **Cancellation**: Test that cancellations work properly

## Troubleshooting

### Common Issues

#### 1. Notifications Not Appearing
```typescript
// Check notification permissions
import * as Notifications from 'expo-notifications';

const checkPermissions = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') {
      console.log('Notification permissions denied');
      return false;
    }
  }
  return true;
};
```

#### 2. Push Token Not Registering
```typescript
// Debug push token registration
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const debugPushToken = async () => {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    console.log('Push token:', token.data);
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};
```

#### 3. Backend Connectivity Issues
```typescript
// Test backend connectivity
const testBackendConnection = async () => {
  try {
    const response = await fetch(`${ENV_CONFIG.STRAPI_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Backend connection successful');
    } else {
      console.log('❌ Backend connection failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend connection error:', error);
  }
};
```

#### 4. Notification Timing Issues
```typescript
// Verify notification scheduling
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugScheduledNotifications = async () => {
  const notifications = await AsyncStorage.getItem('scheduled_notifications');
  console.log('Scheduled notifications:', JSON.parse(notifications || '[]'));
  
  // Check if notifications are scheduled for the future
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('System scheduled notifications:', scheduled);
};
```

### Performance Considerations

1. **Batch Operations**: Schedule/cancel multiple notifications efficiently
2. **Cache Management**: Store notification status locally for quick access
3. **Background Processing**: Handle notifications when app is backgrounded
4. **Error Recovery**: Implement fallback mechanisms for failed operations

### Production Checklist

- [ ] Push notification credentials configured
- [ ] Backend API endpoints tested
- [ ] User permission flows implemented
- [ ] Error handling and fallbacks in place
- [ ] Notification content localized if needed
- [ ] Analytics tracking for notification engagement
- [ ] Rate limiting for notification API calls

## Integration with Experience Flow

The notification system integrates seamlessly with the existing experience flow:

1. **Experience Discovery**: Users browse available experiences
2. **Experience Selection**: Users select an experience they're interested in
3. **Notification Setup**: Users can enable/disable notifications via the detail tray
4. **Automatic Scheduling**: Notifications are automatically scheduled based on experience timing
5. **Reminder Delivery**: Users receive timely reminders before their experience
6. **Experience Participation**: Users arrive on time thanks to the reminders

This creates a complete user journey that enhances the overall experience participation rate and user satisfaction.
