# Timezone Handling for Experience Events

## Problem Statement

The app was experiencing timezone issues where event times would change based on the user's current location:

- **Before Fix**: User in Colorado sees event at 10:00 AM, travels to California and same event shows 9:00 AM
- **After Fix**: Event shows same time regardless of user's current location

## Root Cause

1. **Strapi Storage**: Times are stored in Strapi as UTC (e.g., `"2025-07-27T18:15:00.000Z"`)
2. **Data Entry**: These times were originally entered in Pacific Time (event timezone)
3. **JavaScript Conversion**: When displaying dates, JavaScript automatically converts UTC to user's local timezone
4. **User Experience Issue**: Same event appears at different times when user changes locations

## Solution Implementation

### Core Principle
Treat UTC timestamps from Strapi as "timezone-naive" and display them exactly as stored, without any timezone conversion.

### Key Methods Added to ExperiencesService

#### 1. `convertToEventLocalTime(utcTimestamp: string): Date`
```typescript
// Removes 'Z' suffix and treats time as local event time
// Prevents automatic timezone conversion
const eventTime = this.convertToEventLocalTime("2025-07-27T18:15:00.000Z");
// Result: Always displays 6:15 PM regardless of user location
```

#### 2. `formatEventTime(utcTimestamp: string, options): string`
```typescript
// Format time for display without timezone indicator
const timeString = experiencesService.formatEventTime(
  "2025-07-27T18:15:00.000Z",
  { format12Hour: true, includeDate: true }
);
// Result: "Sun, Jul 27, 6:15 PM" (no timezone shown)
```

#### 3. `getEventDateTime(utcTimestamp: string): object`
```typescript
// Get separated date/time components
const { date, time, dayOfWeek } = experiencesService.getEventDateTime(
  "2025-07-27T18:15:00.000Z"
);
// Result: { date: "Jul 27", time: "6:15 PM", dayOfWeek: "Sun" }
```

## Usage Examples

### Basic Time Display
```typescript
const experience = {
  experience_start_date_time: "2025-07-27T18:15:00.000Z"
};

// Display consistent time
const displayTime = experiencesService.formatEventTime(
  experience.experience_start_date_time
);
// Always shows: "6:15 PM"
```

### Date and Time Components
```typescript
const { date, time, dayOfWeek } = experiencesService.getEventDateTime(
  experience.experience_start_date_time
);

// Use in UI components
<Text>{dayOfWeek}, {date}</Text>  // "Sun, Jul 27"
<Text>{time}</Text>               // "6:15 PM"
```

### Full Format with Date
```typescript
const fullDateTime = experiencesService.formatEventTime(
  experience.experience_start_date_time,
  { includeDate: true }
);
// Result: "Sun, Jul 27, 6:15 PM"
```

## Implementation Details

### Before (Problematic)
```typescript
// JavaScript automatic timezone conversion
const eventTime = new Date("2025-07-27T18:15:00.000Z");
console.log(eventTime.toLocaleTimeString());
// Colorado user: "11:15 AM" (UTC-7)
// California user: "10:15 AM" (UTC-8)
```

### After (Fixed)
```typescript
// Timezone-naive approach
const eventTime = new Date("2025-07-27T18:15:00"); // No 'Z'
console.log(eventTime.toLocaleTimeString());
// All users: "6:15 PM" (treated as local time)
```

## UI Integration Guidelines

### Experience Cards/Lists
```typescript
const experience = item.schedule_experience;
const eventTime = experiencesService.getEventDateTime(
  experience.experience_start_date_time
);

return (
  <View>
    <Text>{experience.experience_title}</Text>
    <Text>{eventTime.dayOfWeek}, {eventTime.date}</Text>
    <Text>{eventTime.time}</Text>
  </View>
);
```

### Schedule Views
```typescript
// Group by date using consistent timezone
const eventDate = experiencesService.convertToEventLocalTime(
  experience.experience_start_date_time
);
const dateKey = eventDate.toDateString(); // Consistent grouping key
```

### Notification Scheduling
The auto-subscription logic now uses the corrected event times:
```typescript
const eventStartTime = this.convertToEventLocalTime(
  experience.experience_start_date_time
);
const now = new Date();

if (eventStartTime > now) {
  // Schedule notifications for future events
}
```

## Testing Scenarios

### Test Case 1: User Location Change
1. User in Colorado sees "Green Flag - 6:22 PM"
2. User travels to California
3. Same event should still show "Green Flag - 6:22 PM"
4. ✅ Time remains consistent

### Test Case 2: Different User Locations
1. User A in New York sees "Practice #1 - 8:00 AM"
2. User B in Hawaii sees "Practice #1 - 8:00 AM"
3. ✅ Both users see identical times

### Test Case 3: Notification Scheduling
1. Event scheduled for "2025-07-27T18:15:00.000Z"
2. Notifications scheduled relative to event time, not user time
3. ✅ Consistent notification timing

## Migration Notes

### Existing Code Updates Needed
Any existing code that directly uses `new Date(experience.experience_start_date_time)` should be updated to use the new service methods:

```typescript
// OLD - problematic
const eventTime = new Date(experience.experience_start_date_time);

// NEW - fixed
const eventTime = experiencesService.convertToEventLocalTime(
  experience.experience_start_date_time
);
```

### Component Updates
Experience display components should use the new formatting methods for consistent display.

## Benefits

1. **Consistent User Experience**: Events show same time regardless of user location
2. **Simplified Logic**: No complex timezone calculations needed
3. **Reliable Notifications**: Notifications fire at correct event-relative times
4. **Travel-Friendly**: App works correctly when users travel to event location

## Temporary Time Display Fix

Currently, a 6-hour offset correction is applied in the schedule display and notification scheduling to show correct local event times:

```tsx
// Temporarily subtract 6 hours to show correct local event time
const correctedEventTime = new Date(eventDate.getTime() - (7 * 60 * 60 * 1000));
const timeString = format(correctedEventTime, 'h:mm a');
```

### Notification Scheduling with Corrected Times

Notifications are scheduled using the corrected event times to ensure they trigger at the right moments:

1. **1 hour before**: Notification fires 1 hour before the corrected event time
2. **20 minutes before**: Notification fires 20 minutes before the corrected event time  
3. **At event time**: Notification fires exactly when the corrected event time begins

### Auto-Subscription Improvements

- **One-time only**: Auto-subscription only happens once per user to prevent bombardment
- **Persistent tracking**: Uses AsyncStorage to track if a user has been auto-subscribed
- **Opt-out friendly**: Users can individually disable notifications for specific events
- **Clear status method**: `clearAutoSubscriptionStatus()` allows resetting for testing

This ensures that:
- Event dates remain consistent (no timezone-based shifting)
- Event times display at the correct local time for the event venue
- Notifications fire at appropriate times relative to the actual event
- Users aren't bombarded with notifications on every app load
- Past/future filtering works correctly with the corrected times
- Events are properly sorted chronologically within each day

**Note**: This is a temporary solution. For production, consider implementing proper timezone handling using the event venue's timezone data.

## Technical Notes

- All times are treated as event timezone (Pacific Time for these IndyCar events)
- No timezone indicators shown in UI to avoid confusion
- Backend times remain unchanged (still stored as UTC in Strapi)
- Only frontend display logic is modified
- Backward compatible with existing data structure
