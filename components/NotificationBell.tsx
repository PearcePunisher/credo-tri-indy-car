import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { notificationService } from '@/services/NotificationService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { NotificationTray } from './NotificationTray';

interface NotificationBellProps {
  size?: number;
  style?: object;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  size = 24, 
  style 
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTray, setShowTray] = useState(false);

  useEffect(() => {
    // Delay notification initialization to prevent crashes
    const initializeWithDelay = async () => {
      try {
        // Wait for app to fully load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Initialize notification service and request permissions
        await initializeNotifications();
        
        // Load initial notification count
        await loadUnreadCount();
      } catch (error) {
        console.error('Error initializing notifications in bell:', error);
      }
    };

    initializeWithDelay();
    
    // Listen for new notifications (this is safe to set up immediately)
    const receivedSubscription = Notifications.addNotificationReceivedListener(() => {
      setUnreadCount(prev => prev + 1);
    });

    // Listen for notification interactions (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(() => {
      // Optionally handle notification tap
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const hasPermission = await notificationService.requestPermissions();
      if (!hasPermission) {
        console.log('Notification permissions not granted');
        return;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      // Don't throw - just log and continue
    }
  };

  const loadUnreadCount = async () => {
    // In a real app, you'd load this from storage or API
    // For now, simulating with 2 unread notifications
    setUnreadCount(2);
  };

  const handleBellPress = () => {
    setShowTray(true);
  };

  const handleTrayClose = () => {
    setShowTray(false);
    // Refresh unread count when tray closes
    loadUnreadCount();
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handleBellPress}
        activeOpacity={0.7}
      >
        <FontAwesome5
          name="bell"
          size={size}
          color={colorScheme === "dark" ? "white" : "black"}
          solid
        />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.tint }]}>
            <Text style={[styles.badgeText, { color: colors.textOnGreen }]}>
              {unreadCount > 99 ? '99+' : unreadCount.toString()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      <NotificationTray
        visible={showTray}
        onClose={handleTrayClose}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'RoobertMedium',
  },
});
