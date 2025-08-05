import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useEnhancedNotifications from '@/hooks/useEnhancedNotifications';
import { useAuth } from '@/hooks/useAuth';

export const EnhancedTestNotificationButton: React.FC = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const { authState } = useAuth();
  
  const { sendTestNotification } = useEnhancedNotifications({
    userId: authState.user?.id,
    jwtToken: authState.user?.serverId,
    isVIP: authState.user?.userIsStaff,
  });

  const handleSendTest = async () => {
    try {
      await sendTestNotification();
      
      Alert.alert(
        'Test Notification Sent!',
        'Check your notification tray to see the new notification.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        'Error',
        'Failed to send test notification. Please check your notification permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: colors.tint }]}
      onPress={handleSendTest}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, { color: colors.textOnRed }]}>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EnhancedTestNotificationButton;
