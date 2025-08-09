import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { experiencesService } from '@/services/ExperiencesService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const OptInNotificationTest: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const [notificationCount, setNotificationCount] = useState<number>(0);

  useEffect(() => {
    checkInitialNotificationCount();
  }, []);

  const checkInitialNotificationCount = async () => {
    try {
      const count = await experiencesService.getScheduledNotificationCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('Failed to get initial notification count:', error);
    }
  };

  const testOptOutBehavior = async () => {
    try {
      Alert.alert('Testing Opt-Out Behavior', 'Check console for details...');
      
      // Get experiences and check default notification statuses
      const response = await experiencesService.getExperiences();
      if (response.data?.data.schedule_experiences) {
        console.log('🧪 Testing Opt-Out Notification Behavior');
        console.log('📊 Total experiences:', response.data.data.schedule_experiences.length);
        
        let enabledCount = 0;
        let disabledCount = 0;
        
        for (const item of response.data.data.schedule_experiences) {
          const experience = item.schedule_experience;
          
          // Skip null/undefined experiences
          if (!experience || !experience.id) {
            console.warn('⚠️ Skipping invalid experience:', experience);
            continue;
          }
          
          const isEnabled = await experiencesService.getNotificationStatus(experience.id);
          
          if (isEnabled) {
            enabledCount++;
            console.log(`✅ ENABLED: ${experience.experience_title || 'Unknown'}`);
          } else {
            disabledCount++;
            console.log(`❌ DISABLED: ${experience.experience_title || 'Unknown'}`);
          }
        }
        
        console.log('📈 Summary:');
        console.log(`  Enabled: ${enabledCount}`);
        console.log(`  Disabled: ${disabledCount}`);
        console.log(`  Expected with opt-out: All should be enabled by default`);
        
        // Update notification count
        const finalCount = await experiencesService.getScheduledNotificationCount();
        setNotificationCount(finalCount);
        
        Alert.alert(
          'Opt-Out Test Results',
          `Enabled: ${enabledCount}\nDisabled: ${disabledCount}\nScheduled notifications: ${finalCount}\n\nExpected: All enabled by default with opt-out approach`
        );
      }
    } catch (error) {
      console.error('❌ Opt-in test failed:', error);
      Alert.alert('Error', 'Failed to test opt-in behavior');
    }
  };

  const simulateUserOptOut = async () => {
    try {
      const response = await experiencesService.getExperiences();
      if (response.data?.data.schedule_experiences && response.data.data.schedule_experiences.length > 0) {
        // Find the first valid experience
        const validExperience = response.data.data.schedule_experiences.find(
          item => item.schedule_experience && item.schedule_experience.id
        );
        
        if (!validExperience) {
          Alert.alert('Error', 'No valid experiences found for testing');
          return;
        }
        
        const firstExperience = validExperience.schedule_experience;
        
        // Simulate user opting out of notifications for the first experience
        await experiencesService.setNotificationStatus(firstExperience.id, false);
        await experiencesService.cancelNotifications(firstExperience.id);
        
        const newCount = await experiencesService.getScheduledNotificationCount();
        setNotificationCount(newCount);
        
        Alert.alert(
          'User Opt-Out Simulated',
          `Opted out of notifications for: ${firstExperience.experience_title}\n\nNew notification count: ${newCount}`
        );
      }
    } catch (error) {
      console.error('❌ Opt-out simulation failed:', error);
      Alert.alert('Error', 'Failed to simulate user opt-out');
    }
  };

  const clearAutoSubscriptionStatus = async () => {
    try {
      await experiencesService.clearAutoSubscriptionStatus();
      await experiencesService.clearNotificationPreferences();
      
      const newCount = await experiencesService.getScheduledNotificationCount();
      setNotificationCount(newCount);
      
      Alert.alert(
        'Auto-Subscription Status Cleared',
        'You can now test the auto-subscription behavior again. Fetch experiences to trigger auto-subscription.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to clear auto-subscription status:', error);
      Alert.alert('Error', 'Failed to clear auto-subscription status');
    }
  };

  const debugScheduledNotifications = async () => {
    try {
      // Import Notifications to check scheduled notifications
      const Notifications = await import('expo-notifications');
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      
      console.log('📋 Debug: All Scheduled Notifications');
      console.log(`📊 Total scheduled: ${scheduled.length}`);
      
      if (scheduled.length > 0) {
        console.log('📝 Scheduled notification details:');
        scheduled.forEach((notification, index) => {
          console.log(`${index + 1}. Notification ID: ${notification.identifier}`);
          console.log(`   Title: ${notification.content.title}`);
          console.log(`   Body: ${notification.content.body}`);
          console.log(`   Trigger: ${JSON.stringify(notification.trigger, null, 2)}`);
          console.log(`   Data: ${JSON.stringify(notification.content.data, null, 2)}`);
          console.log('   ---');
        });
      } else {
        console.log('📋 No scheduled notifications found');
      }
      
      Alert.alert(
        'Scheduled Notifications Debug',
        `Found ${scheduled.length} scheduled notifications.\n\nCheck console for detailed information.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to debug scheduled notifications:', error);
      Alert.alert('Error', 'Failed to debug scheduled notifications');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Opt-Out Test</Text>
      
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
        Current scheduled notifications: {notificationCount}
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]} 
        onPress={testOptOutBehavior}
      >
        <Text style={[styles.buttonText, { color: colors.textOnGreen }]}>
          Test Opt-Out Default Behavior
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]} 
        onPress={simulateUserOptOut}
      >
        <Text style={[styles.buttonText, { color: colors.textOnGreen }]}>
          Simulate User Opt-Out
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#ff9500' }]} 
        onPress={clearAutoSubscriptionStatus}
      >
        <Text style={[styles.buttonText, { color: 'white' }]}>
          Clear Auto-Subscription Status
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#ff6b6b' }]} 
        onPress={checkInitialNotificationCount}
      >
        <Text style={[styles.buttonText, { color: 'white' }]}>
          Refresh Notification Count
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#9b59b6' }]} 
        onPress={debugScheduledNotifications}
      >
        <Text style={[styles.buttonText, { color: 'white' }]}>
          Debug Scheduled Notifications
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OptInNotificationTest;
