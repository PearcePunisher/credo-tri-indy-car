# Push Notifications Setup Guide

## Overview
This guide walks you through setting up push notifications using **Option 1: Strapi as Notification Orchestrator** for your IndyCar VIP app.

## Architecture
- **Strapi** manages notification content, targeting, and sending
- **Expo Push Notification Service** handles delivery
- **Your React Native app** receives and displays notifications

## Setup Steps

### 1. Strapi Backend Setup

#### Install Dependencies
```bash
cd your-strapi-project
npm install expo-server-sdk node-cron
```

#### Add Content Types
1. Copy `strapi-schemas/notification-content-type.json` to your Strapi project:
   ```
   src/api/notification/content-types/notification/schema.json
   ```

2. Extend the User model by copying `strapi-schemas/user-extended-schema.json` to:
   ```
   src/extensions/users-permissions/content-types/user/schema.json
   ```

#### Add Controllers and Routes
1. Copy `strapi-backend/notification-controller.js` to:
   ```
   src/api/notification/controllers/notification.js
   ```

2. Copy `strapi-backend/notification-routes.js` to:
   ```
   src/api/notification/routes/notification.js
   ```

### 2. Expo App Configuration

#### Environment Variables
Create `.env` file in your Expo project:
```
EXPO_PUBLIC_STRAPI_URL=https://your-strapi-instance.com
```

#### Update App Configuration
Your `app.json` already has the correct project ID: `db70e71b-2bb8-4da5-9442-a8f0ce48fd2f`

### 3. Integration Code

#### Use the Notification Hook
```tsx
import { useNotifications } from '@/hooks/useNotifications';

function YourComponent() {
  const { sendTestNotification, updateActivity } = useNotifications({
    userId: "current-user-id",
    jwtToken: "user-jwt-token",
    isVIP: true
  });

  // The hook automatically:
  // - Registers for push notifications
  // - Sends push token to Strapi
  // - Handles incoming notifications
  // - Updates user activity
}
```

## Usage Examples

### Send Notifications from Strapi Admin

#### Immediate Notification
```bash
POST /api/notifications/send-immediate
Content-Type: application/json
Authorization: Bearer ADMIN_JWT_TOKEN

{
  "title": "Race Update!",
  "body": "Qualifying results are now available",
  "data": { "type": "race_update", "raceId": 123 },
  "targetType": "vip"
}
```

#### Scheduled Notification
```bash
POST /api/notifications/schedule
Content-Type: application/json
Authorization: Bearer ADMIN_JWT_TOKEN

{
  "title": "Race Starting Soon!",
  "body": "IndyCar race starts in 1 hour",
  "data": { "type": "race_reminder" },
  "targetType": "all",
  "scheduledFor": "2025-07-20T14:00:00Z"
}
```

### Common Notification Types

#### Race Updates
```javascript
{
  "title": "Race Update 🏁",
  "body": "Practice session results are available",
  "data": { "type": "race_update", "sessionId": 456 },
  "targetType": "all"
}
```

#### VIP Experiences
```javascript
{
  "title": "Exclusive VIP Access! 🏎️",
  "body": "Pit lane tours now available",
  "data": { "type": "vip_experience", "experienceId": 789 },
  "targetType": "vip"
}
```

#### Schedule Changes
```javascript
{
  "title": "Schedule Update ⏰",
  "body": "Race start time moved to 3:00 PM",
  "data": { "type": "schedule_change", "newTime": "15:00" },
  "targetType": "all"
}
```

## Testing

### Send Test Notification
Use the test function in your app:
```tsx
const { sendTestNotification } = useNotifications({ userId, jwtToken, isVIP });

// Call this to test notifications
sendTestNotification();
```

### Verify Setup
1. Check that push tokens are being saved to Strapi users
2. Send a test notification from Strapi admin
3. Verify notification appears on device

## Automated Scheduling (Optional)

Create a cron job in Strapi to process scheduled notifications:

```javascript
// config/functions/cron.js
module.exports = {
  '*/5 * * * *': async () => {
    // Process scheduled notifications every 5 minutes
    await strapi.controllers['api::notification.notification'].processScheduled();
  }
};
```

## Troubleshooting

### Common Issues
1. **Permissions not granted**: Check iOS/Android notification settings
2. **Invalid push tokens**: Ensure tokens are being saved correctly
3. **Notifications not received**: Verify Expo project ID matches
4. **Strapi errors**: Check server logs for detailed error messages

### Debug Steps
1. Console log push token generation
2. Verify token registration with Strapi
3. Check notification delivery tickets
4. Test with Expo push notification tool

## Security Notes
- Store JWT tokens securely
- Validate notification content server-side
- Rate limit notification sending
- Log notification activities for audit

## Next Steps
1. Customize notification handling based on your app's navigation
2. Add notification preferences for users
3. Implement notification analytics
4. Set up automated notifications for race events
