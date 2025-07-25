# Timezone Fix Test Example

## Testing the Timezone Solution

To verify that the timezone fix is working correctly, you can test the following scenarios:

### Example Event Data
```json
{
  "experience_start_date_time": "2025-07-27T18:15:00.000Z",
  "experience_title": "Drivers start your engine command"
}
```

### Before Fix (Problematic Behavior)
```typescript
// OLD CODE - causes timezone issues
const eventTime = new Date("2025-07-27T18:15:00.000Z");

// Results varied by user location:
// Colorado user (UTC-7): "11:15 AM" 
// California user (UTC-8): "10:15 AM"
// New York user (UTC-5): "1:15 PM"
```

### After Fix (Consistent Behavior)
```typescript
// NEW CODE - consistent across all locations
const eventTime = experiencesService.convertToEventLocalTime("2025-07-27T18:15:00.000Z");

// Results are consistent for all users:
// ALL users see: "6:15 PM"
```

## Testing Instructions

### Manual Testing

1. **Test Device Timezone Changes**:
   ```typescript
   // In your app, test this code in different scenarios:
   const experience = {
     experience_start_date_time: "2025-07-27T18:15:00.000Z"
   };
   
   const oldWay = new Date(experience.experience_start_date_time);
   const newWay = experiencesService.convertToEventLocalTime(experience.experience_start_date_time);
   
   console.log('Old way:', oldWay.toLocaleTimeString()); // Changes with timezone
   console.log('New way:', newWay.toLocaleTimeString()); // Always consistent
   ```

2. **Change Device Timezone**:
   - Go to Settings > General > Date & Time
   - Turn off "Set Automatically"
   - Change to different timezones (Pacific, Mountain, Eastern, etc.)
   - Verify that experience times stay consistent

3. **Travel Simulation**:
   - Set device to Colorado timezone → Experience shows 6:15 PM
   - Set device to California timezone → Experience should STILL show 6:15 PM
   - Set device to New York timezone → Experience should STILL show 6:15 PM

### Automated Testing

```typescript
// Test that timezone conversion is consistent
describe('Timezone Handling', () => {
  it('should show consistent times regardless of device timezone', () => {
    const utcTime = "2025-07-27T18:15:00.000Z";
    
    // Mock different timezones
    const timezones = ['America/Los_Angeles', 'America/Denver', 'America/New_York'];
    
    timezones.forEach(timezone => {
      // Simulate user in different timezone
      const eventTime = experiencesService.convertToEventLocalTime(utcTime);
      const timeString = eventTime.toLocaleTimeString();
      
      // Should always be "6:15:00 PM" regardless of timezone
      expect(timeString).toBe("6:15:00 PM");
    });
  });
});
```

## Visual Verification

### Schedule Screen
- All events should show consistent times
- "Drivers start your engine command" should show "6:15 PM"
- "Green Flag" should show "6:22 PM"
- Times should not change when device timezone changes

### Experience Detail Tray
- Full date/time display should be consistent
- "Sunday, July 27, 2025" format should not change
- Time portion should remain stable

### Notifications
- Notification scheduling should account for proper UTC conversion
- Users should receive notifications at the correct event-relative time
- A 1-hour reminder should fire 1 hour before the event in event timezone

## Expected Results

| Event Time in Strapi | OLD Display (varies) | NEW Display (consistent) |
|-----------------------|---------------------|--------------------------|
| 2025-07-27T18:15:00.000Z | 10:15 AM - 1:15 PM | 6:15 PM |
| 2025-07-27T18:22:00.000Z | 10:22 AM - 1:22 PM | 6:22 PM |
| 2025-07-25T08:00:00.000Z | 12:00 AM - 3:00 AM | 8:00 AM |

## Production Validation

1. **Backend Verification**: Confirm Strapi times are stored as intended
2. **Multi-User Testing**: Have users in different timezones verify consistency
3. **Notification Testing**: Schedule test notifications and verify timing
4. **Travel Testing**: Test app while actually traveling between timezones

## Rollback Plan

If issues arise, you can temporarily revert by:
1. Commenting out the new timezone methods
2. Replacing `experiencesService.convertToEventLocalTime()` calls with `new Date()`
3. The old behavior will resume immediately

## Notes

- The solution assumes all events are in Pacific Time
- Notification scheduling uses proper UTC conversion
- Display formatting removes timezone indicators to avoid confusion
- Backend data structure remains unchanged
