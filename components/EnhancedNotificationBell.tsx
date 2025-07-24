import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useEnhancedNotifications from '@/hooks/useEnhancedNotifications';
import { useRouter } from 'expo-router';

interface EnhancedNotificationBellProps {
  userId?: string;
  jwtToken?: string;
  isVIP?: boolean;
  size?: number;
  onPress?: () => void;
}

const EnhancedNotificationBell: React.FC<EnhancedNotificationBellProps> = ({
  userId,
  jwtToken,
  isVIP,
  size = 24,
  onPress,
}) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();
  
  const { unreadCount } = useEnhancedNotifications({ userId, jwtToken, isVIP });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      // Default behavior: could navigate to a notifications screen when implemented
      // For now, just log the action
      console.log('📱 Notification bell pressed - unread count:', unreadCount);
      // router.push('/(tabs)/account'); // Placeholder navigation
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons
        name="notifications-outline"
        size={size}
        color={colors.tint}
      />
      
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount.toString()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 4,
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
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 11,
  },
});

export default EnhancedNotificationBell;
