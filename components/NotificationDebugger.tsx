import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { experiencesService } from '@/services/ExperiencesService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const NotificationDebugger: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  const handleClearAutoSubscription = async () => {
    try {
      await experiencesService.clearAutoSubscriptionStatus();
      Alert.alert('Success', 'Auto-subscription status cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear auto-subscription status');
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await experiencesService.clearAllNotifications();
      Alert.alert('Success', 'All notifications cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear notifications');
    }
  };

  const handleCheckNotificationCount = async () => {
    try {
      const count = await experiencesService.getScheduledNotificationCount();
      Alert.alert('Notification Count', `Currently scheduled: ${count} notifications`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get notification count');
    }
  };

  const handleManualAutoSubscribe = async () => {
    try {
      await experiencesService.manuallyTriggerAutoSubscription();
      Alert.alert('Success', 'Manual auto-subscription triggered. Check console for details.');
    } catch (error) {
      Alert.alert('Error', 'Failed to trigger auto-subscription');
    }
  };

  const handleDebugFlow = async () => {
    try {
      await experiencesService.debugNotificationFlow();
      Alert.alert('Debug Complete', 'Check console for detailed debug information.');
    } catch (error) {
      Alert.alert('Error', 'Failed to run debug flow');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Notification Debugger</Text>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleCheckNotificationCount}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Check Notification Count</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleClearAutoSubscription}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Clear Auto-Subscription</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleClearAllNotifications}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Clear All Notifications</Text>
      </TouchableOpacity>
      
            <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleManualAutoSubscribe}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Manual Auto-Subscribe</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleDebugFlow}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Debug Flow</Text>
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
  button: {
    borderWidth: 1,
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

export default NotificationDebugger;
