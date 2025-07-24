import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Experience, experiencesService } from '@/services/ExperiencesService';
import useEnhancedNotifications from '@/hooks/useEnhancedNotifications';

interface ExperienceNotificationSettingsProps {
  experience: Experience;
  userId?: string;
  jwtToken?: string;
  isVIP?: boolean;
}

const ExperienceNotificationSettings: React.FC<ExperienceNotificationSettingsProps> = ({
  experience,
  userId,
  jwtToken,
  isVIP,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { requestPermissions } = useEnhancedNotifications({ userId, jwtToken, isVIP });

  // Load current notification status
  useEffect(() => {
    loadNotificationStatus();
  }, [experience.id]);

  const loadNotificationStatus = async () => {
    try {
      const status = await experiencesService.getNotificationStatus(experience.id);
      setNotificationsEnabled(status);
    } catch (error) {
      console.error('Error loading notification status:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && !await requestPermissions()) {
      Alert.alert(
        'Notification Permission Required',
        'Please enable notifications in your device settings to receive experience reminders.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => {
            // Here you could open device settings
            console.log('Open device settings');
          }},
        ]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      if (enabled) {
        // Schedule notifications
        await experiencesService.scheduleNotifications(experience.id);
        Alert.alert(
          'Notifications Enabled',
          'You will receive reminders 1 hour before, 20 minutes before, and when your experience begins.',
          [{ text: 'OK' }]
        );
      } else {
        // Cancel notifications
        await experiencesService.cancelNotifications(experience.id);
        Alert.alert(
          'Notifications Disabled',
          'You will no longer receive reminders for this experience.',
          [{ text: 'OK' }]
        );
      }
      
      setNotificationsEnabled(enabled);
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatExperienceTime = (): string => {
    if (!experience.experience_start_date_time) return 'Time TBD';
    
    const startTime = new Date(experience.experience_start_date_time);
    const endTime = experience.experience_end_date_time 
      ? new Date(experience.experience_end_date_time)
      : null;
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    };
    
    const startTimeStr = startTime.toLocaleTimeString(undefined, timeOptions);
    const endTimeStr = endTime ? endTime.toLocaleTimeString(undefined, timeOptions) : '';
    const dateStr = startTime.toLocaleDateString(undefined, dateOptions);
    
    return `${dateStr} at ${startTimeStr}${endTimeStr ? ` - ${endTimeStr}` : ''}`;
  };

  const isExperienceInPast = (): boolean => {
    if (!experience.experience_start_date_time) return false;
    return new Date(experience.experience_start_date_time) <= new Date();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons 
          name="notifications-outline" 
          size={24} 
          color={colors.tint} 
          style={styles.headerIcon}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Experience Notifications
        </Text>
      </View>

      {/* Experience Info */}
      <View style={styles.experienceInfo}>
        <Text style={[styles.experienceTitle, { color: colors.text }]} numberOfLines={2}>
          {experience.experience_title}
        </Text>
        <Text style={[styles.experienceTime, { color: colors.secondaryText }]}>
          {formatExperienceTime()}
        </Text>
        {experience.experience_venue_location?.venue_location_name && (
          <Text style={[styles.experienceLocation, { color: colors.secondaryText }]}>
            📍 {experience.experience_venue_location.venue_location_name}
          </Text>
        )}
      </View>

      {/* Notification Toggle */}
      <View style={[styles.toggleContainer, { opacity: isExperienceInPast() ? 0.5 : 1 }]}>
        <View style={styles.toggleInfo}>
          <Text style={[styles.toggleTitle, { color: colors.text }]}>
            Receive Notifications
          </Text>
          <Text style={[styles.toggleSubtitle, { color: colors.secondaryText }]}>
            Get reminded 1 hour before, 20 minutes before, and when your experience begins
          </Text>
        </View>
        
        <Switch
          value={notificationsEnabled}
          onValueChange={handleNotificationToggle}
          disabled={isLoading || isExperienceInPast()}
          trackColor={{ 
            false: colors.secondaryText + '40', 
            true: colors.tint + '40' 
          }}
          thumbColor={notificationsEnabled ? colors.tint : colors.secondaryText}
        />
      </View>

      {/* Past Experience Warning */}
      {isExperienceInPast() && (
        <View style={styles.warningContainer}>
          <Ionicons 
            name="information-circle-outline" 
            size={16} 
            color={colors.secondaryText} 
            style={styles.warningIcon}
          />
          <Text style={[styles.warningText, { color: colors.secondaryText }]}>
            This experience has already occurred
          </Text>
        </View>
      )}

      {/* Notification Schedule Info */}
      {notificationsEnabled && !isExperienceInPast() && (
        <View style={styles.scheduleInfo}>
          <Text style={[styles.scheduleTitle, { color: colors.text }]}>
            You'll receive notifications:
          </Text>
          <View style={styles.scheduleList}>
            <View style={styles.scheduleItem}>
              <Ionicons name="time-outline" size={16} color={colors.tint} />
              <Text style={[styles.scheduleText, { color: colors.secondaryText }]}>
                1 hour before the experience
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="alarm-outline" size={16} color={colors.tint} />
              <Text style={[styles.scheduleText, { color: colors.secondaryText }]}>
                20 minutes before the experience
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Ionicons name="play-circle-outline" size={16} color={colors.tint} />
              <Text style={[styles.scheduleText, { color: colors.secondaryText }]}>
                When the experience begins
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  experienceInfo: {
    marginBottom: 16,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  experienceTime: {
    fontSize: 14,
    marginBottom: 2,
  },
  experienceLocation: {
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  warningIcon: {
    marginRight: 6,
  },
  warningText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  scheduleInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  scheduleTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  scheduleList: {
    gap: 6,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    fontSize: 13,
    marginLeft: 8,
  },
});

export default ExperienceNotificationSettings;
