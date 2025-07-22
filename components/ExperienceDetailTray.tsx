import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Experience, experiencesService } from '@/services/ExperiencesService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TRAY_HEIGHT = SCREEN_HEIGHT * 0.85; // 85% of screen height

interface ExperienceDetailTrayProps {
  visible: boolean;
  experience: Experience | null;
  onClose: () => void;
  isNotificationEnabled?: boolean;
  onToggleNotification?: (enabled: boolean) => void;
}

export const ExperienceDetailTray: React.FC<ExperienceDetailTrayProps> = ({
  visible,
  experience,
  onClose,
  isNotificationEnabled = false,
  onToggleNotification,
}) => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const slideAnim = useState(new Animated.Value(TRAY_HEIGHT))[0];

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 12,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: TRAY_HEIGHT,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    }
  }, [visible]);

  if (!experience) return null;

  const handleToggleNotification = async () => {
    if (onToggleNotification) {
      const newState = !isNotificationEnabled;
      onToggleNotification(newState);
      
      if (newState) {
        await experiencesService.scheduleExperienceNotifications(experience);
      } else {
        await experiencesService.cancelExperienceNotifications(experience.id);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Time TBD';
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Time TBD';
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (error) {
      return 'Invalid time';
    }
  };

  const formatLastUpdated = (updatedAt: string) => {
    try {
      return format(new Date(updatedAt), 'MMMM d, yyyy \'at\' h:mm a');
    } catch (error) {
      return 'Unknown';
    }
  };

  const getDescriptionText = () => {
    return experiencesService.convertRichTextToPlainText(experience.experience_description);
  };

  const getImageUrl = () => {
    return experiencesService.getImageUrl();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Background overlay */}
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
          {/* Drag Handle */}
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
                Experience Details
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Last Updated */}
            <Text style={[styles.lastUpdated, { color: colors.secondaryText }]}>
              Last updated: {formatLastUpdated(experience.updatedAt)}
            </Text>

            {/* Experience Image */}
            <Image
              source={{ uri: getImageUrl() }}
              style={styles.experienceImage}
              resizeMode="cover"
            />

            {/* Experience Title */}
            <Text style={[styles.experienceTitle, { color: colors.text }]}>
              {experience.experience_title}
            </Text>

            {/* Date and Time */}
            <View style={styles.timeContainer}>
              <View style={styles.timeItem}>
                <Ionicons name="calendar" size={20} color={colors.tint} />
                <Text style={[styles.timeLabel, { color: colors.text }]}>
                  {formatDate(experience.experience_start_date_time)}
                </Text>
              </View>
              
              {experience.experience_start_date_time && (
                <View style={styles.timeItem}>
                  <Ionicons name="time" size={20} color={colors.tint} />
                  <Text style={[styles.timeLabel, { color: colors.text }]}>
                    {formatTime(experience.experience_start_date_time)}
                    {experience.experience_end_date_time && 
                      ` - ${formatTime(experience.experience_end_date_time)}`
                    }
                  </Text>
                </View>
              )}
              
              {experience.experience_venue_location?.venue_location_name && (
                <View style={styles.timeItem}>
                  <Ionicons name="location" size={20} color={colors.tint} />
                  <Text style={[styles.timeLabel, { color: colors.text }]}>
                    {experience.experience_venue_location.venue_location_name}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              About This Experience
            </Text>
            <Text style={[styles.description, { color: colors.text }]}>
              {getDescriptionText()}
            </Text>

            {/* Notification Toggle Button */}
            {experience.experience_start_date_time && (
              <TouchableOpacity
                style={[
                  styles.notificationButton,
                  { 
                    backgroundColor: isNotificationEnabled ? colors.tint : colors.card,
                    borderColor: colors.tint,
                  }
                ]}
                onPress={handleToggleNotification}
              >
                <Ionicons 
                  name={isNotificationEnabled ? "notifications" : "notifications-off"} 
                  size={20} 
                  color={isNotificationEnabled ? colors.textOnGreen : colors.tint} 
                />
                <Text style={[
                  styles.notificationButtonText,
                  { color: isNotificationEnabled ? colors.textOnGreen : colors.tint }
                ]}>
                  {isNotificationEnabled ? 'Notifications Enabled' : 'Enable Notifications'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Bottom spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
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
    bottom: 0,
    left: 0,
    right: 0,
    height: TRAY_HEIGHT,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandleArea: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 50,
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'RoobertSemi',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  lastUpdated: {
    fontSize: 12,
    
    marginTop: 16,
    marginBottom: 16,
  },
  experienceImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  experienceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'RoobertSemi',
    marginBottom: 16,
  },
  timeContainer: {
    marginBottom: 24,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 16,
    fontFamily: 'RoobertMedium',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'RoobertMedium',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    
    marginBottom: 24,
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  notificationButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'RoobertMedium',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 40,
  },
});
