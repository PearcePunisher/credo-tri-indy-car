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
import { notificationService } from '@/services/NotificationService';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRAY_HEIGHT = SCREEN_HEIGHT * 0.8; // 80% of screen height for better positioning

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  type?: 'info' | 'update' | 'reminder' | 'urgent';
}

interface NotificationTrayProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationTray: React.FC<NotificationTrayProps> = ({ visible, onClose }) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
    loadNotifications();
    
    // Listen for new notifications
    const subscription = Notifications.addNotificationReceivedListener(handleNewNotification);
    
    return () => subscription.remove();
  }, []);

  const loadNotifications = async () => {
    // Load stored notifications or fetch from API
    // For now, using sample data
    const sampleNotifications: NotificationItem[] = [
      {
        id: '1',
        title: 'Race Weekend Update',
        body: 'Weather conditions look perfect for this weekend\'s race. Expected sunny skies with temperatures around 75°F.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        type: 'update',
      },
      {
        id: '2',
        title: 'Garage Tour Reminder',
        body: 'Don\'t forget about your exclusive garage tour scheduled for tomorrow at 2:00 PM.',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        read: false,
        type: 'reminder',
      },
      {
        id: '3',
        title: 'Team Update',
        body: 'Our driver finished P3 in practice! Great preparation for qualifying.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        type: 'info',
      },
      {
        id: '4',
        title: 'Parking Information',
        body: 'New parking instructions have been added to your venue directions.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        read: true,
        type: 'info',
      },
    ];
    
    setNotifications(sampleNotifications);
    const unread = sampleNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const handleNewNotification = (notification: Notifications.Notification) => {
    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      title: notification.request.content.title || 'Notification',
      body: notification.request.content.body || '',
      timestamp: new Date(),
      read: false,
      type: 'info',
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
            setUnreadCount(0);
          }
        },
      ]
    );
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'urgent':
        return 'warning';
      case 'reminder':
        return 'time';
      case 'update':
        return 'refresh';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type?: string) => {
    switch (type) {
      case 'urgent':
        return colors.error || '#FF6B6B';
      case 'reminder':
        return colors.tint;
      case 'update':
        return colors.tint;
      default:
        return colors.secondaryText;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: item.read ? colors.background : colors.card,
          borderLeftColor: getNotificationColor(item.type),
        }
      ]}
      onPress={() => markAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIconContainer}>
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={20}
            color={getNotificationColor(item.type)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            { 
              color: colors.text,
              fontWeight: item.read ? 'normal' : 'bold',
            }
          ]}>
            {item.title}
          </Text>
          <Text style={[styles.notificationBody, { color: colors.secondaryText }]}>
            {item.body}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.secondaryText }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => clearNotification(item.id)}
        >
          <Ionicons name="close" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />}
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
                  onPress={markAllAsRead}
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
            data={notifications}
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
              notifications.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearAllButton}
                  onPress={clearAllNotifications}
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
