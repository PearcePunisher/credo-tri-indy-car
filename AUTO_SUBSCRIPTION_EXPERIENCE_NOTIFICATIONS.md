# Auto-Subscription for Experience Notifications

## Overview

The application now automatically subscribes users to all experience notifications by default, implementing an **opt-out** model instead of opt-in. This ensures users don't miss important experience reminders and creates a better user experience.

## Implementation Details

### Auto-Subscription Behavior

1. **First-Time Users**: When a user fetches their experiences for the first time, they are automatically subscribed to notifications for all future experiences
2. **Existing Users**: Users who already have notification preferences retain their current settings
3. **Future Experiences Only**: Auto-subscription only applies to experiences that haven't started yet
4. **Individual Control**: Users can opt-out of specific experience notifications individually

### Key Changes Made

#### 1. Default Notification Status (`getNotificationStatus`)
```typescript
// Before: Default to false (opt-in)
return statuses[experienceId] || false;

// After: Default to true (auto-subscribed, opt-out)
return statuses[experienceId] !== false;
```

#### 2. Auto-Subscription Logic (`autoSubscribeToAllExperiences`)
- Automatically called when fetching fresh experience data
- Only runs for users without existing notification preferences
- Schedules notifications for all future experiences
- Logs subscription status for debugging

#### 3. Updated Convenience Methods
- `optOutOfNotifications(experienceId)`: New method for opting out
- `optBackInToNotifications(experienceId)`: New method for re-subscribing
- `cancelNotifications(experienceId)`: Legacy method (maps to opt-out)

## User Experience Flow

### New Users
1. User registers and logs in
2. User navigates to experiences page
3. System fetches user's experience schedule
4. **Auto-subscription occurs**: All future experiences get notifications scheduled
5. User sees all experiences with notifications enabled by default
6. User can individually opt-out of specific experiences if desired

### Existing Users
1. User's existing notification preferences are preserved
2. No automatic changes to their current settings
3. They continue to have full control over individual experience notifications

## Benefits

1. **Reduced Missed Experiences**: Users are less likely to miss important events
2. **Better Engagement**: Default notifications encourage participation
3. **User-Friendly**: Simple opt-out model is easier to understand
4. **Backwards Compatible**: Existing users' preferences are preserved

## Technical Implementation

### Auto-Subscription Trigger
```typescript
async getExperiences(forceRefresh: boolean = false) {
  // ... fetch logic ...
  if (freshData) {
    // Auto-subscribe to all experience notifications for new users
    await this.autoSubscribeToAllExperiences(freshData);
    return { data: freshData, isOffline: false };
  }
  // ...
}
```

### Notification Status Logic
```typescript
async getNotificationStatus(experienceId: number): Promise<boolean> {
  // Default to true (auto-subscribed) if no explicit status is set
  // User must explicitly opt-out to disable notifications
  return statuses[experienceId] !== false;
}
```

### User Control Methods
```typescript
// Opt out of specific experience
await experiencesService.optOutOfNotifications(experienceId);

// Opt back in to specific experience  
await experiencesService.optBackInToNotifications(experienceId);
```

## UI Integration

### Experience Components
Experience notification toggles should now show:
- **Default State**: ON (for new users)
- **Toggle Action**: "Turn Off Notifications" instead of "Turn On Notifications"
- **Messaging**: "You'll receive reminders for this experience" vs "Get notified about this experience"

### Settings/Preferences
Consider adding:
- Bulk opt-out option: "Turn off all experience notifications"
- Notification preferences summary
- Clear messaging about the default auto-subscription behavior

## Backend Integration

When implementing the backend API, ensure:

1. **Default Behavior**: New users get auto-subscribed to all future experiences
2. **Preference Storage**: Track explicit opt-outs vs default subscriptions
3. **Migration**: Existing users' preferences should be preserved during updates
4. **Bulk Operations**: Support for bulk opt-out/opt-in operations

## Testing Considerations

1. **New User Flow**: Verify auto-subscription works for first-time users
2. **Existing User Flow**: Confirm existing preferences are preserved
3. **Edge Cases**: Handle network failures gracefully
4. **Notification Delivery**: Test that notifications actually fire for auto-subscribed experiences
5. **Opt-Out Flow**: Verify users can successfully opt-out and notifications stop

## Migration Strategy

For existing installations:
1. Current users maintain their existing notification settings
2. Only new experience fetches trigger auto-subscription logic
3. Users who have never set any notification preferences get auto-subscribed
4. No forced changes to existing user preferences

This approach ensures a smooth transition while improving the experience for new users.
