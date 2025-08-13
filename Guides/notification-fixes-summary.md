# Notification Scheduling and Bell/Tray Update Fixes

## Issues Identified and Fixed

### 1. **Immediate Notification Firing in Expo Go**

**Problem**: Notifications were firing immediately instead of at scheduled times
**Root Cause**: Expo Go development quirk + minimum delay not sufficient
**Fix**: 
- Increased minimum delay from 10 seconds to 30 seconds
- Added proper timing calculations and logging
- Enhanced logging to track exactly when notifications are scheduled

### 2. **Auto-Subscription Not Updating Notification Bell/Tray**

**Problem**: Auto-subscribed notifications didn't appear in the notification bell
**Root Cause**: Auto-subscription was directly calling `scheduleExperienceNotifications` without proper history tracking
**Fix**:
- Changed auto-subscription to only set notification status to `true`
- Let the UI components handle actual scheduling (which properly updates history)
- This ensures notifications go through the proper flow and update the bell/tray

### 3. **Missing Notification History Updates**

**Problem**: Scheduled notifications weren't being added to notification history
**Root Cause**: Missing `addToHistory` call in the scheduling process
**Fix**:
- Added `addToHistory` call when notifications are scheduled
- This ensures the notification bell and tray are updated immediately

### 4. **Insufficient Logging for Debugging**

**Problem**: Hard to debug scheduling issues without detailed timing information
**Fix**: Added comprehensive logging including:
- Event times and current times with ISO strings
- Local time representations
- Minutes/seconds until notification
- Trigger time calculations
- Scheduling success/failure details

## Code Changes Made

### `ExperiencesService.ts`
- **Auto-subscription logic**: Changed from direct scheduling to setting notification status
- **Enhanced logging**: Added detailed timing logs for each experience
- **Better status tracking**: Only set status to `true`, let UI handle scheduling

### `EnhancedNotificationService.ts`
- **Minimum delay**: Increased from 10 to 30 seconds for Expo Go compatibility
- **Enhanced logging**: Added comprehensive timing and trigger information
- **History tracking**: Added `addToHistory` call when scheduling notifications
- **Better trigger handling**: Improved time calculations and normalization

### `OptInNotificationTest.tsx`
- **New test functions**: Added opt-out simulation and auto-subscription clearing
- **Debug function**: Added detailed scheduled notification debugging
- **Better testing flow**: Clear separation between different test scenarios

## New Test Functions Available

1. **Test Opt-Out Default Behavior**: Verifies all experiences are enabled by default
2. **Simulate User Opt-Out**: Tests opting out of a specific experience
3. **Clear Auto-Subscription Status**: Resets auto-subscription for testing
4. **Debug Scheduled Notifications**: Shows detailed information about all scheduled notifications
5. **Refresh Notification Count**: Updates the displayed count

## Expected Behavior Now

### Auto-Subscription Flow:
1. User fetches experiences for the first time
2. System sets notification status to `true` for all future experiences
3. When user visits experience detail, notifications are scheduled properly
4. Notification bell/tray updates immediately with scheduled notifications

### Scheduling Flow:
1. Enhanced logging shows exact timing calculations
2. Minimum 30-second delay prevents immediate firing in Expo Go
3. Notifications are added to history immediately upon scheduling
4. Bell/tray updates reflect scheduled notifications

### Debugging:
- Use "Debug Scheduled Notifications" button to see all scheduled notifications
- Console logs show detailed timing information
- Can clear auto-subscription status to test fresh user flow

## Testing Instructions

1. **Clear auto-subscription status** using the test button
2. **Navigate to experiences** to trigger auto-subscription
3. **Check notification bell** - should show scheduled notifications
4. **Use debug button** to verify scheduling details in console
5. **Check console logs** for detailed timing information

The notification bell and tray should now update properly, and notifications should be scheduled at the correct times instead of firing immediately.
