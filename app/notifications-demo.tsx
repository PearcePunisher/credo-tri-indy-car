import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import useEnhancedNotifications from '@/hooks/useEnhancedNotifications';
import NotificationHistoryComponent from '@/components/NotificationHistory';
import EnhancedNotificationBell from '@/components/EnhancedNotificationBell';

const NotificationDemoScreen = () => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { authState } = useAuth();
  
  const {
    isInitialized,
    unreadCount,
    requestPermissions,
    sendTestNotification,
    clearHistory,
  } = useEnhancedNotifications({
    userId: authState.user?.id,
    jwtToken: 'dummy-token', // Replace with actual token when available
    isVIP: false, // Replace with actual VIP status when available
  });

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Notification permissions granted!');
    } else {
      Alert.alert('Failed', 'Notification permissions not granted.');
    }
  };

  const handleSendTest = async () => {
    try {
      await sendTestNotification();
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification.');
    }
  };

  const demoActions = [
    {
      id: 'permissions',
      title: 'Request Permissions',
      subtitle: 'Request notification permissions',
      icon: 'shield-checkmark-outline',
      onPress: handleRequestPermissions,
    },
    {
      id: 'test',
      title: 'Send Test Notification',
      subtitle: 'Send a test notification immediately',
      icon: 'paper-plane-outline',
      onPress: handleSendTest,
    },
    {
      id: 'clear',
      title: 'Clear History',
      subtitle: 'Clear all notification history',
      icon: 'trash-outline',
      onPress: clearHistory,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Notification Bell */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Enhanced Notifications
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
              {isInitialized ? 'System Ready' : 'Initializing...'}
            </Text>
          </View>
          
          <EnhancedNotificationBell
            userId={authState.user?.id}
            jwtToken={'dummy-token'}
            isVIP={false}
            size={28}
          />
        </View>

        {/* Status Info */}
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statusTitle, { color: colors.text }]}>
            System Status
          </Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.secondaryText }]}>
              Initialized:
            </Text>
            <View style={styles.statusValue}>
              <Ionicons
                name={isInitialized ? 'checkmark-circle' : 'time'}
                size={16}
                color={isInitialized ? '#4CAF50' : colors.secondaryText}
              />
              <Text style={[styles.statusText, { color: colors.text }]}>
                {isInitialized ? 'Yes' : 'Initializing...'}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.secondaryText }]}>
              Unread Count:
            </Text>
            <View style={styles.statusValue}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {unreadCount}
              </Text>
            </View>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: colors.secondaryText }]}>
              User ID:
            </Text>
            <View style={styles.statusValue}>
              <Text style={[styles.statusText, { color: colors.text }]}>
                {authState.user?.id || 'Not logged in'}
              </Text>
            </View>
          </View>
        </View>

        {/* Demo Actions */}
        <View style={[styles.actionsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.actionsTitle, { color: colors.text }]}>
            Demo Actions
          </Text>
          
          {demoActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionItem,
                { borderBottomColor: colors.border }
              ]}
              onPress={action.onPress}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.destructive ? '#FF6B6B' : colors.tint}
                style={styles.actionIcon}
              />
              <View style={styles.actionContent}>
                <Text style={[
                  styles.actionTitle,
                  { color: action.destructive ? '#FF6B6B' : colors.text }
                ]}>
                  {action.title}
                </Text>
                <Text style={[styles.actionSubtitle, { color: colors.secondaryText }]}>
                  {action.subtitle}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.secondaryText}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Features Info */}
        <View style={[styles.featuresCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            Notification Features
          </Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Experience reminders (1 hour, 20 min, at start)
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Real-time experience updates
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="close-circle-outline" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Cancellation notifications
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="car-sport-outline" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Race updates and announcements
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="archive-outline" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Notification history tracking
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="settings-outline" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.text }]}>
                Per-experience notification control
              </Text>
            </View>
          </View>
        </View>

        {/* Notification History */}
        <NotificationHistoryComponent
          userId={authState.user?.id}
          jwtToken={'dummy-token'}
          isVIP={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    marginLeft: 6,
  },
  actionsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  featuresCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});

export default NotificationDemoScreen;
