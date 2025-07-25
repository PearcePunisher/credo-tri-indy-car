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

  const testOptInBehavior = async () => {
    try {
      Alert.alert('Testing Opt-In Behavior', 'Check console for details...');
      
      // Get experiences and check default notification statuses
      const response = await experiencesService.getExperiences();
      if (response.data?.data.schedule_experiences) {
        console.log('🧪 Testing Opt-In Notification Behavior');
        console.log('📊 Total experiences:', response.data.data.schedule_experiences.length);
        
        let enabledCount = 0;
        let disabledCount = 0;
        
        for (const item of response.data.data.schedule_experiences) {
          const experience = item.schedule_experience;
          const isEnabled = await experiencesService.getNotificationStatus(experience.id);
          
          if (isEnabled) {
            enabledCount++;
            console.log(`✅ ENABLED: ${experience.experience_title}`);
          } else {
            disabledCount++;
            console.log(`❌ DISABLED: ${experience.experience_title}`);
          }
        }
        
        console.log('📈 Summary:');
        console.log(`  Enabled: ${enabledCount}`);
        console.log(`  Disabled: ${disabledCount}`);
        console.log(`  Expected with opt-in: All should be disabled by default`);
        
        // Update notification count
        const finalCount = await experiencesService.getScheduledNotificationCount();
        setNotificationCount(finalCount);
        
        Alert.alert(
          'Opt-In Test Results',
          `Enabled: ${enabledCount}\nDisabled: ${disabledCount}\nScheduled notifications: ${finalCount}\n\nExpected: All disabled by default with opt-in approach`
        );
      }
    } catch (error) {
      console.error('❌ Opt-in test failed:', error);
      Alert.alert('Error', 'Failed to test opt-in behavior');
    }
  };

  const simulateUserOptIn = async () => {
    try {
      const response = await experiencesService.getExperiences();
      if (response.data?.data.schedule_experiences && response.data.data.schedule_experiences.length > 0) {
        const firstExperience = response.data.data.schedule_experiences[0].schedule_experience;
        
        // Simulate user opting in to notifications for the first experience
        await experiencesService.setNotificationStatus(firstExperience.id, true);
        await experiencesService.scheduleExperienceNotifications(firstExperience);
        
        const newCount = await experiencesService.getScheduledNotificationCount();
        setNotificationCount(newCount);
        
        Alert.alert(
          'User Opt-In Simulated',
          `Opted into notifications for: ${firstExperience.experience_title}\n\nNew notification count: ${newCount}`
        );
      }
    } catch (error) {
      console.error('❌ Opt-in simulation failed:', error);
      Alert.alert('Error', 'Failed to simulate user opt-in');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Opt-In Test</Text>
      
      <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
        Current scheduled notifications: {notificationCount}
      </Text>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]} 
        onPress={testOptInBehavior}
      >
        <Text style={[styles.buttonText, { color: colors.textOnGreen }]}>
          Test Opt-In Default Behavior
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: colors.tint }]} 
        onPress={simulateUserOptIn}
      >
        <Text style={[styles.buttonText, { color: colors.textOnGreen }]}>
          Simulate User Opt-In
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
