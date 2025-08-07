import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  FlatList,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useEnhancedNotifications from '@/hooks/useEnhancedNotifications';
import { NotificationHistory } from '@/services/EnhancedNotificationService';
import { useAuth } from '@/hooks/useAuth';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRAY_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% of screen height for better positioning

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

interface NotificationTrayProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationTray: React.FC<NotificationTrayProps> = ({ visible, onClose }) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { authState } = useAuth();
  
  // Use the enhanced notifications hook
  const {
    notificationHistory,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearHistory,
    loadNotificationHistory,
  } = useEnhancedNotifications({
    userId: authState.user?.id,
    jwtToken: authState.user?.serverId,
    isVIP: authState.user?.userIsStaff,
  });
  
  const slideAnim = useState(new Animated.Value(-TRAY_HEIGHT))[0];

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65, // Reduced from 100 for slower animation
        friction: 12, // Increased from 8 for smoother motion
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -TRAY_HEIGHT,
        useNativeDriver: true,
        tension: 80, // Slightly faster for closing
        friction: 10, // Smooth but not too slow for closing
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    // Refresh notification history when tray becomes visible
    if (visible) {
      loadNotificationHistory();
    }
  }, [visible]);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearNotification = async (id: string) => {
    // Remove the notification completely
    await removeNotification(id);
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: clearHistory
        },
      ]
    );
  };
  const getNotificationIcon = (category?: string) => {
    switch (category) {
      case 'experience_reminder':
        return 'time';
      case 'experience_update':
        return 'refresh';
      case 'experience_cancellation':
        return 'warning';
      case 'race_update':
        return 'flag';
      case 'general_announcement':
        return 'information-circle';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (category?: string) => {
    switch (category) {
      case 'experience_cancellation':
        return colors.error || '#FF6B6B';
      case 'experience_reminder':
        return colors.tint;
      case 'experience_update':
        return colors.tint;
      case 'race_update':
        return colors.tint;
      default:
        return colors.secondaryText;
    }
  };
  const formatTimestamp = (timestamp: Date | string | undefined) => {
    if (!timestamp) return 'Unknown time';
    
    let date: Date;
    if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
    }
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: NotificationHistory }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: item.isRead ? colors.background : colors.card,
          borderLeftColor: getNotificationColor(item.category),
        }
      ]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Ionicons
            name={getNotificationIcon(item.category)}
            size={20}
            color={getNotificationColor(item.category)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            { 
              color: colors.text,
              fontWeight: item.isRead ? 'normal' : 'bold',
            }
          ]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: colors.secondaryText }]}>
            {item.body}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.secondaryText }]}>
            {formatTimestamp(item.receivedAt)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleClearNotification(item.id)}
        >
          <Ionicons name="close" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
      {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Background overlay - tapping closes the tray */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          style={[
            styles.trayContainer,
            { 
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
              paddingTop: insets.top,
            }
          ]}
        >
          {/* Drag Handle - more prominent and easier to tap */}
          <TouchableOpacity 
            style={styles.dragHandleArea} 
            onPress={onClose}
            activeOpacity={0.7}
          >
            <View style={[styles.dragIndicator, { backgroundColor: colors.border }]} />
          </TouchableOpacity>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Notifications
              </Text>
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                  <Text style={[styles.badgeText, { color: colors.textOnGreen }]}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleMarkAllAsRead}
                >
                  <Text style={[styles.actionButtonText, { color: colors.tint }]}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications List */}
          <FlatList
            data={notificationHistory}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            style={styles.notificationsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="notifications-off" size={48} color={colors.secondaryText} />
                <Text style={[styles.emptyStateText, { color: colors.secondaryText }]}>
                  No notifications yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.secondaryText }]}>
                  We'll notify you when there are updates
                </Text>
              </View>
            }
            ListFooterComponent={
              notificationHistory.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={handleClearAllNotifications}
                >
                  <Text style={[styles.clearAllButtonText, { color: colors.error || colors.secondaryText }]}>
                    Clear All Notifications
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  trayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TRAY_HEIGHT,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 50, // Larger touch area
  },
  dragIndicator: {
    width: 50,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'RoobertSemi',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'RoobertMedium',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'RoobertMedium',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderLeftWidth: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  notificationHeader: {
    flexDirection: 'row',
    flex: 1,
  },
  notificationIconContainer: {
    marginRight: 12,
    paddingTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: 'RoobertMedium',
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    
  },
  notificationTime: {
    fontSize: 12,
    
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    fontFamily: 'RoobertMedium',
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    
  },
  clearAllButton: {
    padding: 20,
    alignItems: 'center',
  },
  clearAllButtonText: {
    fontSize: 14,
    fontFamily: 'RoobertMedium',
  },
});
