import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { parseISO, format, isSameDay, isPast, startOfDay } from 'date-fns';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import BrandLogo from '@/components/BrandLogo';
import { experiencesService, type Experience } from '@/services/ExperiencesService';
import { ExperienceDetailTray } from '@/components/ExperienceDetailTray';
import { Ionicons } from '@expo/vector-icons';
import NotificationDebugger from '@/components/NotificationDebugger';

interface GroupedExperiences {
  [dateKey: string]: Experience[];
}

const ScheduleScreen = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [isPastEventsOpen, setIsPastEventsOpen] = useState(false);
  const [notificationStates, setNotificationStates] = useState<{ [key: number]: boolean }>({});
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  const loadExperiences = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      console.log('📅 Loading experiences...');
      
      // Check notification count before loading
      const notificationCountBefore = await experiencesService.getScheduledNotificationCount();
      console.log(`📊 Notifications before loading: ${notificationCountBefore}`);
      
      const response = await experiencesService.getExperiences();
      const scheduleData = response.data?.data;
      const experiencesData = scheduleData?.schedule_experiences
        ?.map(item => item.schedule_experience)
        .filter(exp => exp && exp.id && exp.experience_start_date_time) || [];
      setExperiences(experiencesData);
      
      // Check notification count after loading
      const notificationCountAfter = await experiencesService.getScheduledNotificationCount();
      console.log(`📊 Notifications after loading: ${notificationCountAfter}`);
      
      // Load notification states for all experiences
      const states: { [key: number]: boolean } = {};
      for (const exp of experiencesData) {
        if (exp && exp.id) {
          states[exp.id] = await experiencesService.getNotificationStatus(exp.id);
        }
      }
      setNotificationStates(states);
    } catch (error) {
      console.error('Error loading experiences:', error);
      console.log("Gorlak the destroyer");
      Alert.alert(
        'Connection Error',
        'Unable to load experiences. Showing cached data if available.',
        [{ text: 'OK' }]
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await experiencesService.refreshData();
    await loadExperiences(false);
    setRefreshing(false);
  }, [loadExperiences]);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  const handleNotificationToggle = async (experienceId: number, enabled: boolean) => {
    try {
      console.log("IN HERE " + experienceId);
      if (enabled) {
        await experiencesService.scheduleNotifications(experienceId);
      } else {
        await experiencesService.cancelNotifications(experienceId);
      }
      setNotificationStates(prev => ({ ...prev, [experienceId]: enabled }));
    } catch (error) {
    //  console.log("ERROR IN experience probabl");
     // console.error('Error toggling notifications:', error);
     // Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  // Group experiences by date using corrected timezone
  const groupExperiencesByDate = (experiences: Experience[]): GroupedExperiences => {
    return experiences.reduce((acc, experience) => {
      if (!experience || !experience.experience_start_date_time) return acc;
      // Use the timezone-corrected date for consistent grouping
      const eventDate = experiencesService.convertToEventLocalTime(experience.experience_start_date_time);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(experience);
      return acc;
    }, {} as GroupedExperiences);
  };

  // Sort experiences within each day by time using corrected timezone
  const sortExperiencesByTime = (experiences: Experience[]): Experience[] => {
    return experiences
      .filter(exp => exp && exp.experience_start_date_time)
      .sort((a, b) => {
        const timeA = experiencesService.convertToEventLocalTime(a.experience_start_date_time);
        const timeB = experiencesService.convertToEventLocalTime(b.experience_start_date_time);
        // Apply 7-hour correction for proper sorting
        const correctedTimeA = new Date(timeA.getTime() - (7 * 60 * 60 * 1000));
        const correctedTimeB = new Date(timeB.getTime() - (7 * 60 * 60 * 1000));
        return correctedTimeA.getTime() - correctedTimeB.getTime();
      });
  };

  const now = new Date();
  const today = startOfDay(now);

  // Separate experiences into past, current (happening now), and future using corrected timezone
  const pastExperiences = experiences.filter(exp => {
    if (!exp || !exp.experience_start_date_time || !exp.experience_end_date_time) return false;
    const eventEndDate = experiencesService.convertToEventLocalTime(exp.experience_end_date_time);
    const correctedEventEndTime = new Date(eventEndDate.getTime() - (7 * 60 * 60 * 1000));
    return isPast(correctedEventEndTime);
  });

  const currentExperiences = experiences.filter(exp => {
    if (!exp || !exp.experience_start_date_time || !exp.experience_end_date_time) return false;
    const eventStartDate = experiencesService.convertToEventLocalTime(exp.experience_start_date_time);
    const eventEndDate = experiencesService.convertToEventLocalTime(exp.experience_end_date_time);
    const correctedEventStartTime = new Date(eventStartDate.getTime() - (7 * 60 * 60 * 1000));
    const correctedEventEndTime = new Date(eventEndDate.getTime() - (7 * 60 * 60 * 1000));
    // Event is current if: start time has passed AND end time has not passed
    return now >= correctedEventStartTime && now <= correctedEventEndTime;
  });
  
  const futureExperiences = experiences.filter(exp => {
    if (!exp || !exp.experience_start_date_time) return false;
    const eventStartDate = experiencesService.convertToEventLocalTime(exp.experience_start_date_time);
    const correctedEventStartTime = new Date(eventStartDate.getTime() - (7 * 60 * 60 * 1000));
    // Event is future if start time has not passed yet
    return now < correctedEventStartTime;
  });

  const groupedPastExperiences = groupExperiencesByDate(pastExperiences);
  const groupedCurrentExperiences = groupExperiencesByDate(currentExperiences);
  const groupedFutureExperiences = groupExperiencesByDate(futureExperiences);

  // Debug logging to verify categorization
  console.log(`📊 Event categorization:
    - Past: ${pastExperiences.length} events
    - Current: ${currentExperiences.length} events  
    - Future: ${futureExperiences.length} events`);
  
  if (currentExperiences.length > 0) {
    console.log('🔴 Current events:', currentExperiences.map(e => e.experience_title));
  }

  // Sort date keys chronologically
  const sortedPastDates = Object.keys(groupedPastExperiences).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime() // Most recent first for past events
  );

  const sortedCurrentDates = Object.keys(groupedCurrentExperiences).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime() // Earliest first for current events
  );
  
  const sortedFutureDates = Object.keys(groupedFutureExperiences).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime() // Earliest first for future events
  );

  const renderNotificationIcon = (experienceId: number) => {
    const isEnabled = notificationStates[experienceId];
    return (
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={isEnabled ? "notifications" : "notifications-off"} 
          size={16} 
          color={isEnabled ? colors.tint : colors.tabIconDefault} 
        />
        {isEnabled && (
          <Ionicons 
            name="checkmark-circle" 
            size={10} 
            color={colors.tint} 
            style={styles.notificationCheck}
          />
        )}
      </View>
    );
  };

  const renderExperienceItem = (experience: Experience, key: string) => {
    if (!experience || !experience.experience_start_date_time) return null;
    
    // Use timezone-corrected event time for consistent display
    const eventStartDate = experiencesService.convertToEventLocalTime(experience.experience_start_date_time);
    const eventEndDate = experience.experience_end_date_time ? experiencesService.convertToEventLocalTime(experience.experience_end_date_time) : null;
    
    // Temporarily subtract 7 hours to show correct local event time
    const correctedEventStartTime = new Date(eventStartDate.getTime() - (7 * 60 * 60 * 1000));
    const correctedEventEndTime = eventEndDate ? new Date(eventEndDate.getTime() - (7 * 60 * 60 * 1000)) : null;
    
    const startTimeString = format(correctedEventStartTime, 'h:mm a');
    const endTimeString = correctedEventEndTime ? format(correctedEventEndTime, 'h:mm a') : '';
    const timeString = endTimeString ? `${startTimeString} - ${endTimeString}` : startTimeString;
    
    const isToday = isSameDay(eventStartDate, now);
    const isPastEvent = correctedEventEndTime ? isPast(correctedEventEndTime) : isPast(correctedEventStartTime);
    const isCurrentEvent = correctedEventEndTime ? 
      (now >= correctedEventStartTime && now <= correctedEventEndTime) : 
      false;
    
    const venueLocationName = experience.experience_venue_location?.venue_location_name || 'Location TBD';
    
    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.experienceCard,
          { backgroundColor: colors.card },
          isToday && styles.todayCard,
          isPastEvent && styles.pastCard,
          isCurrentEvent && [styles.currentCard, { borderLeftColor: colors.tint }],
        ]}
        onPress={() => setSelectedExperience(experience)}
        accessibilityLabel={`${experience.experience_title} at ${timeString}`}
        accessibilityHint="Tap to view details"
      >
        <View style={styles.experienceHeader}>
          <View style={styles.experienceInfo}>
            <Text style={[styles.experienceTitle, { color: colors.text }]} numberOfLines={2}>
              {experience.experience_title || 'Untitled Experience'}
              {isCurrentEvent}
            </Text>
            <Text style={[styles.experienceTime, { color: colors.text }]}>
              {timeString}
            </Text>
            <Text style={[styles.experienceLocation, { color: colors.text }]} numberOfLines={1}>
              📍 {venueLocationName}
            </Text>
            {isCurrentEvent && (
              <Text style={[styles.happeningNowLabel, { color: colors.tint }]}>
                Happening Now
              </Text>
            )}
          </View>
          {renderNotificationIcon(experience.id)}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDateSection = (dateKey: string, experiences: Experience[], isPast = false) => {
    // Use timezone-corrected date for consistent display
    const date = experiencesService.convertToEventLocalTime(dateKey + 'T00:00:00');
    const isToday = isSameDay(date, now);
    const displayDate = isToday ? 'Today' : format(date, 'EEEE, MMMM d');
    const sortedExperiences = sortExperiencesByTime(experiences);

    return (
      <View key={dateKey} style={styles.dateSection}>
        <Text style={[
          styles.dateTitle, 
          { color: colors.tint },
          isToday && styles.todayTitle
        ]}>
          {displayDate}
        </Text>
        {sortedExperiences.map((experience, idx) => 
          renderExperienceItem(experience, `${dateKey}-${experience.id}-${idx}`)
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading experiences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
      >
        <BrandLogo style={styles.logo} />
        <Text style={[styles.header, { color: colors.text }]}>Race Weekend Experiences</Text>
        
        {/* Temporary debugging component */}
        {/* <NotificationDebugger /> */}

        {experiences.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: colors.tabIconDefault }]}>
              No experiences available at this time.
            </Text>
            <TouchableOpacity style={[styles.refreshButton, { borderColor: colors.tint }]} onPress={onRefresh}>
              <Text style={[styles.refreshButtonText, { color: colors.tint }]}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Happening Now Events */}
            {sortedCurrentDates.length > 0 && (
              <View style={styles.happeningNowSection}>
                <Text style={[styles.happeningNowTitle, { color: colors.tint }]}>
                  🏁 Happening Now
                </Text>
                {sortedCurrentDates.map(dateKey => 
                  renderDateSection(dateKey, groupedCurrentExperiences[dateKey], false)
                )}
              </View>
            )}

            {/* Future Events */}
            {sortedFutureDates.map(dateKey => 
              renderDateSection(dateKey, groupedFutureExperiences[dateKey], false)
            )}

            {/* Past Events (Collapsible) */}
            {sortedPastDates.length > 0 && (
              <View style={styles.pastEventsSection}>
                <TouchableOpacity
                  style={styles.pastEventsHeader}
                  onPress={() => setIsPastEventsOpen(!isPastEventsOpen)}
                  accessibilityLabel={`${isPastEventsOpen ? 'Hide' : 'Show'} past events`}
                >
                  <Text style={[styles.pastEventsTitle, { color: colors.tabIconDefault }]}>
                    Past Events ({pastExperiences.length})
                  </Text>
                  <Ionicons 
                    name={isPastEventsOpen ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.tabIconDefault} 
                  />
                </TouchableOpacity>
                
                {isPastEventsOpen && (
                  <View style={styles.pastEventsContent}>
                    {sortedPastDates.map(dateKey => 
                      renderDateSection(dateKey, groupedPastExperiences[dateKey], true)
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Experience Detail Tray */}
      {selectedExperience && (
        <ExperienceDetailTray
          experience={selectedExperience}
          visible={selectedExperience !== null}
          onClose={() => setSelectedExperience(null)}
          isNotificationEnabled={notificationStates[selectedExperience.id] || false}
          onToggleNotification={(enabled: boolean) => handleNotificationToggle(selectedExperience.id, enabled)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    // Platform-specific bottom padding to account for tab bar on iOS
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  scrollContent: { 
    padding: 16,
    // Additional scroll padding for content breathing room
    paddingBottom: Platform.OS === 'ios' ? 32 : 16
  },
  logo: { 
    marginBottom: 16 
  },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 24 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateSection: { 
    marginBottom: 24 
  },
  dateTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 12 
  },
  todayTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  experienceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  pastCard: {
    opacity: 0.7,
  },
  currentCard: {
    borderLeftWidth: 4,
    // borderLeftColor will be set dynamically
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  experienceInfo: {
    flex: 1,
    marginRight: 12,
  },
  experienceTitle: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 6,
  },
  experienceTime: { 
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  experienceLocation: { 
    fontSize: 12,
  },
  happeningNowLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  notificationIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  notificationCheck: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  happeningNowSection: {
    marginBottom: 24,
  },
  happeningNowTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pastEventsSection: {
    marginTop: 24,
  },
  pastEventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  pastEventsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  pastEventsContent: {
    paddingTop: 8,
  },
});

export default ScheduleScreen;
