import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { NotificationHistory, NotificationCategory, NotificationType } from '@/services/EnhancedNotificationService';
import useEnhancedNotifications from '@/hooks/useEnhancedNotifications';

interface NotificationHistoryComponentProps {
  userId?: string;
  jwtToken?: string;
  isVIP?: boolean;
}

const NotificationHistoryComponent: React.FC<NotificationHistoryComponentProps> = ({
  userId,
  jwtToken,
  isVIP,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const {
    notificationHistory,
    unreadCount,
    markAsRead,
    clearHistory,
    sendTestNotification,
  } = useEnhancedNotifications({ userId, jwtToken, isVIP });

  // Get icon for notification category
  const getCategoryIcon = (category: NotificationCategory): string => {
    switch (category) {
      case NotificationCategory.EXPERIENCE_REMINDER:
        return 'calendar-outline';
      case NotificationCategory.EXPERIENCE_UPDATE:
        return 'information-circle-outline';
      case NotificationCategory.EXPERIENCE_CANCELLATION:
        return 'close-circle-outline';
      case NotificationCategory.RACE_UPDATE:
        return 'car-sport-outline';
      case NotificationCategory.GENERAL_ANNOUNCEMENT:
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  // Get color for notification type
  const getTypeColor = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.ONE_HOUR_BEFORE:
      case NotificationType.TWENTY_MINUTES_BEFORE:
      case NotificationType.AT_EVENT_TIME:
        return colors.tint;
      case NotificationType.UPDATE:
        return '#FFA500';
      case NotificationType.CANCELLATION:
        return '#FF6B6B';
      default:
        return colors.text;
    }
  };

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    
    return date.toLocaleDateString();
  };

  // Handle notification item press
  const handleNotificationPress = async (notification: NotificationHistory) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Here you could navigate to specific screens based on notification data
    console.log('Notification pressed:', notification);
  };

  // Confirm clear history
  const handleClearHistory = () => {
    Alert.alert(
      'Clear Notification History',
      'Are you sure you want to clear all notification history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: clearHistory
        },
      ]
    );
  };

  // Render notification item
  const renderNotificationItem = ({ item }: { item: NotificationHistory }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { 
          backgroundColor: item.isRead ? colors.card : colors.card + '80',
          borderLeftColor: getTypeColor(item.type),
        }
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Ionicons
            name={getCategoryIcon(item.category) as any}
            size={20}
            color={getTypeColor(item.type)}
            style={styles.categoryIcon}
          />
          <Text
            style={[
              styles.notificationTitle,
              { 
                color: colors.text,
                fontWeight: item.isRead ? 'normal' : 'bold'
              }
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {!item.isRead && (
            <View style={[styles.unreadDot, { backgroundColor: colors.tint }]} />
          )}
        </View>
        
        <Text
          style={[styles.notificationBody, { color: colors.secondaryText }]}
          numberOfLines={3}
        >
          {item.body}
        </Text>
        
        <View style={styles.notificationFooter}>
          <Text style={[styles.timestamp, { color: colors.secondaryText }]}>
            {formatTimestamp(new Date(item.receivedAt))}
          </Text>
          {item.experienceId && (
            <Text style={[styles.experienceTag, { color: colors.tint }]}>
              Experience #{item.experienceId}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="notifications-off-outline"
        size={64}
        color={colors.secondaryText}
        style={styles.emptyIcon}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Notifications
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.secondaryText }]}>
        You'll see your notification history here
      </Text>
      <TouchableOpacity
        style={[styles.testButton, { backgroundColor: colors.tint }]}
        onPress={sendTestNotification}
      >
        <Text style={[styles.testButtonText, { color: colors.textOnGreen }]}>
          Send Test Notification
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.tint }]}>
              <Text style={[styles.unreadCount, { color: colors.textOnGreen }]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        {notificationHistory.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Ionicons name="trash-outline" size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      <FlatList
        data={notificationHistory}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unreadBadge: {
    marginLeft: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 7,
  },
  notificationBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
  },
  experienceTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  testButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationHistoryComponent;
