# Notification System Improvements

## Problem Solved

**Issue**: Users were being bombarded with notifications when opening the schedule page, and notifications were firing at incorrect times due to timezone issues.

## Solution Overview

### 1. Controlled Auto-Subscription
- **One-time Only**: Auto-subscription happens only once per user
- **Persistent Tracking**: Uses AsyncStorage to prevent repeated auto-subscriptions
- **User Choice Respect**: If user has made any notification choices, auto-subscription is skipped

### 2. Corrected Notification Timing
- **6-Hour Offset**: All notifications now use the corrected event time (6 hours earlier than stored UTC)
- **Proper Scheduling**: Notifications fire at the actual event time, not the incorrect UTC time
- **Three Notification Types**:
  - 1 hour before event
  - 20 minutes before event  
  - At event start time

### 3. Improved User Experience
- **No Bombardment**: Users only get auto-subscribed once
- **Individual Control**: Users can opt-out of specific event notifications
- **Clear Reset**: Developers can clear auto-subscription status for testing

## Technical Implementation

### Auto-Subscription Logic
```typescript
// Check if user has been auto-subscribed before
const autoSubscribeKey = `autoSubscribed_${currentUser.id}`;
const hasBeenAutoSubscribed = await AsyncStorage.getItem(autoSubscribeKey);

if (!hasBeenAutoSubscribed) {
  // Mark as auto-subscribed to prevent future auto-subscriptions
  await AsyncStorage.setItem(autoSubscribeKey, 'true');
  // Auto-subscribe to future events only
}
```

### Corrected Time Scheduling
```typescript
// Use corrected event time for notification scheduling
const eventTime = experiencesService.convertToEventLocalTime(experience.experience_start_date_time);
const correctedEventTime = new Date(eventTime.getTime() - (6 * 60 * 60 * 1000));

// Schedule notifications relative to corrected time
const oneHourBefore = new Date(correctedEventTime.getTime() - 60 * 60 * 1000);
const twentyMinutesBefore = new Date(correctedEventTime.getTime() - 20 * 60 * 1000);
```

### Key Methods Added

#### ExperiencesService
- `clearAutoSubscriptionStatus()`: Reset auto-subscription status for testing

#### Enhanced Auto-Subscription
- Checks both existing notification statuses AND auto-subscription history
- Only schedules for future events using corrected times
- Prevents notification bombardment on app load

## Benefits

1. **Better User Experience**: No more notification bombardment
2. **Accurate Timing**: Notifications fire at correct local event times
3. **Respectful**: Users maintain control over their notification preferences
4. **Reliable**: Consistent behavior across app sessions
5. **Testable**: Developers can reset auto-subscription status

## Testing

To test the auto-subscription behavior:

```typescript
// Clear auto-subscription status
await experiencesService.clearAutoSubscriptionStatus();

// Clear notification statuses  
const authService = AuthService.getInstance();
const currentUser = authService.getCurrentUser();
if (currentUser) {
  const userStatusKey = `notificationStatuses_${currentUser.id}`;
  delete (globalThis as any)[userStatusKey];
}

// Now reload the schedule to trigger auto-subscription
```

## Production Considerations

- **Timezone Handling**: Consider implementing proper timezone support using venue location data
- **Backend Integration**: Current solution uses local storage; consider server-side notification management
- **Notification Limits**: Monitor notification frequency to avoid OS limits
- **User Preferences**: Consider adding global notification preferences

## Related Files

- `services/ExperiencesService.ts`: Auto-subscription logic and timezone handling
- `services/EnhancedNotificationService.ts`: Notification scheduling with corrected times
- `app/(tabs)/schedule.tsx`: Schedule display with corrected times
- `components/ExperienceDetailTray.tsx`: Detail view with corrected times
