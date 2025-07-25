import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { experiencesService } from '@/services/ExperiencesService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const NotificationDebugger: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  const handleClearNotificationPreferences = async () => {
    try {
      await experiencesService.clearNotificationPreferences();
      Alert.alert('Success', 'Notification preferences reset to opt-in defaults');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear notification preferences');
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

  const handleManualResetPreferences = async () => {
    try {
      await experiencesService.manuallyResetNotificationPreferences();
      Alert.alert('Success', 'Notification preferences reset. Check console for details.');
    } catch (error) {
      Alert.alert('Error', 'Failed to reset notification preferences');
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
      <Text style={[styles.title, { color: colors.text }]}>Notification Debugger (Opt-In)</Text>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleCheckNotificationCount}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Check Notification Count</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleClearNotificationPreferences}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Reset Notification Preferences</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleClearAllNotifications}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Clear All Notifications</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { borderColor: colors.tint }]} 
        onPress={handleManualResetPreferences}
      >
        <Text style={[styles.buttonText, { color: colors.tint }]}>Manual Reset Preferences</Text>
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
