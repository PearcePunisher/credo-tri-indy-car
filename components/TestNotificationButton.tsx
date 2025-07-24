import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { notificationService } from '@/services/NotificationService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export const TestNotificationButton: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  const sendTestNotification = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive race updates.',
          [{ text: 'OK' }]
        );
        return;
      }

      await notificationService.sendRaceUpdateNotification(
        'Our driver just set the fastest lap time in practice! 🏁'
      );
      
      Alert.alert(
        'Test Notification Sent!',
        'Check your notification tray to see the new notification.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: '#FF3B30' }]} // Red color
      onPress={sendTestNotification}
    >
      <Text style={[styles.buttonText, { color: 'white' }]}>
        Send Test Notification
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'RoobertMedium',
  },
});
