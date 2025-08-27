import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  View,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import BrandLogo from "@/components/BrandLogo";
import EventLogo from "@/components/EventLogo";
import CedoLogo from "@/components/CedoLogo";
import EnhancedNotificationBell from "@/components/EnhancedNotificationBell";
import { NotificationTray } from "@/components/NotificationTray";
import scheduleDataFull from "@/race_data/scheduleData_FULL.json";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/hooks/useAuth";
import { experiencesService, type Experience } from '@/services/ExperiencesService';
import { ExperienceDetailTray } from '@/components/ExperienceDetailTray';
import FocusTransition from "@/components/ui/FocusTransition";

import { useNotification } from "@/context/NotificationContext";


const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

// --- Types for schedule data ---
type Venue = {
  id: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  [key: string]: any;
};

type Stage = {
  id: string;
  description: string;
  scheduled: string;
  scheduled_end?: string;
  type: string;
  status?: string;
  stages?: Stage[];
  venue?: Venue;
  [key: string]: any;
};

type Event = {
  id: string;
  description: string;
  scheduled: string;
  scheduled_end?: string;
  type: string;
  status?: string;
  venue?: Venue;
  stages?: Stage[];
  [key: string]: any;
};

type ScheduleData = {
  generated_at: string;
  schema: string;
  stages: Event[];
};

// --- Find next race helper ---
function getNextRace(events: Event[]): { race: Stage; event: Event } | null {
  const now = new Date();
  let next: { race: Stage; event: Event } | null = null;
  let minDiff = Infinity;
  for (const event of events) {
    if (!event.stages) continue;
    for (const stage of event.stages) {
      if (stage.type === "race" && stage.scheduled) {
        const raceDate = new Date(stage.scheduled);
        const diff = raceDate.getTime() - now.getTime();
        if (diff > 0 && diff < minDiff) {
          minDiff = diff;
          next = { race: stage, event };
        }
      }
    }
  }
  return next;
}

// --- Get upcoming races helper ---
function getUpcomingRaces(events: Event[], count: number = 3): { race: Stage; event: Event }[] {
  const now = new Date();
  const upcomingRaces: { race: Stage; event: Event; raceDate: Date }[] = [];
  
  for (const event of events) {
    if (!event.stages) continue;
    for (const stage of event.stages) {
      if (stage.type === "race" && stage.scheduled) {
        const raceDate = new Date(stage.scheduled);
        if (raceDate.getTime() > now.getTime()) {
          upcomingRaces.push({ race: stage, event, raceDate });
        }
      }
    }
  }
  
  // Sort by race date and take the requested count
  return upcomingRaces
    .sort((a, b) => a.raceDate.getTime() - b.raceDate.getTime())
    .slice(0, count)
    .map(({ race, event }) => ({ race, event }));
}

// --- Countdown calculation helper ---
function getCountdownParts(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const diff = Math.max(0, new Date(targetDate).getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function HomeScreen() {

  const { notification, expoPushToken, error } = useNotification();
  
  const { debugUserData, authState } = useAuth();
  
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  const [nextRace, setNextRace] = useState<{
    race: Stage;
    event: Event;
  } | null>(null);

  const [upcomingRaces, setUpcomingRaces] = useState<{
    race: Stage;
    event: Event;
  }[]>([]);

  const [notificationTrayVisible, setNotificationTrayVisible] = useState(false);
  const [upcomingExperiences, setUpcomingExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [loadingExperiences, setLoadingExperiences] = useState(true);

  // Carousel navigation state
  const [currentRaceIndex, setCurrentRaceIndex] = useState(0);
  const [currentExperienceIndex, setCurrentExperienceIndex] = useState(0);
  const raceScrollRef = useRef<ScrollView>(null);
  const experienceScrollRef = useRef<ScrollView>(null);

  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  // Navigation functions for carousels
  const navigateRaceCarousel = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, currentRaceIndex - 1)
      : Math.min(upcomingRaces.length - 1, currentRaceIndex + 1);
    
    setCurrentRaceIndex(newIndex);
    raceScrollRef.current?.scrollTo({
      x: newIndex * (CARD_WIDTH + 20),
      animated: true,
    });
  };

  const navigateExperienceCarousel = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? Math.max(0, currentExperienceIndex - 1)
      : Math.min(upcomingExperiences.length - 1, currentExperienceIndex + 1);
    
    setCurrentExperienceIndex(newIndex);
    experienceScrollRef.current?.scrollTo({
      x: newIndex * (CARD_WIDTH + 20),
      animated: true,
    });
  };

  const handleRaceScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + 20));
    setCurrentRaceIndex(index);
  };

  const handleExperienceScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + 20));
    setCurrentExperienceIndex(index);
  };

  // Load upcoming experiences
  const loadUpcomingExperiences = async () => {
    try {
      setLoadingExperiences(true);
      const response = await experiencesService.getExperiences();
      const scheduleData = response.data?.data;
      const experiencesData = scheduleData?.schedule_experiences
        ?.map(item => item.schedule_experience)
        .filter(exp => exp && exp.id && exp.experience_start_date_time) || [];

      // Remove potential duplicates based on experience ID
      const uniqueExperiences = experiencesData.filter((exp, index, arr) => 
        arr.findIndex(e => e.id === exp.id) === index
      );

      // Filter for future experiences only
      const now = new Date();
      const futureExperiences = uniqueExperiences.filter(exp => {
        if (!exp || !exp.experience_start_date_time) return false;
        const eventStartDate = experiencesService.convertToEventLocalTime(exp.experience_start_date_time);
        return now < eventStartDate;
      });

      // Sort by start time (soonest first) and take the next 3
      const sortedFutureExperiences = futureExperiences
        .sort((a, b) => {
          const timeA = experiencesService.convertToEventLocalTime(a.experience_start_date_time);
          const timeB = experiencesService.convertToEventLocalTime(b.experience_start_date_time);
          return timeA.getTime() - timeB.getTime();
        })
        .slice(0, 3); // Take only the next 3 experiences

      setUpcomingExperiences(sortedFutureExperiences);
    } catch (error) {
      console.error('Error loading upcoming experiences:', error);
      setUpcomingExperiences([]);
    } finally {
      setLoadingExperiences(false);
    }
  };

  useEffect(() => {
    const found = getNextRace((scheduleDataFull as ScheduleData).stages);
    setNextRace(found);
    
    // Get upcoming races for the slider
    const upcoming = getUpcomingRaces((scheduleDataFull as ScheduleData).stages, 3);
    setUpcomingRaces(upcoming);
    
    if (found) {
      setCountdown(getCountdownParts(found.race.scheduled));
      const interval = setInterval(() => {
        setCountdown(getCountdownParts(found.race.scheduled));
      }, 1000);
      
      // Load upcoming experiences
      loadUpcomingExperiences();
      
      return () => clearInterval(interval);
    } else {
      // Load upcoming experiences even if no race found
      loadUpcomingExperiences();
    }
  }, []);

  return (
    <FocusTransition variant="fade">
    <>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
        translucent={false}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}>
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/account")}>
              <Ionicons
                name="person-circle-outline"
                size={28}
                color={colors.tint}
              />
            </TouchableOpacity>

            <EnhancedNotificationBell 
              size={24} 
              userId={authState.user?.id}
              jwtToken={authState.user?.serverId}
              isVIP={authState.user?.userIsStaff}
              onPress={() => setNotificationTrayVisible(true)}
            />
          </View>

          <View style={styles.logoContainer}>
            <BrandLogo style={styles.brand} />
          </View>

          <View style={styles.logoContainer}>
            <EventLogo style={styles.brand} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Races
          </Text>
          
          {/* Race Carousel with Navigation */}
          <View style={styles.carouselWrapper}>
            {/* Left Arrow */}
            <TouchableOpacity 
              style={[styles.navArrow, styles.leftArrow, { backgroundColor: colors.card }]}
              onPress={() => navigateRaceCarousel('left')}
              disabled={currentRaceIndex === 0}>
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={currentRaceIndex === 0 ? colors.secondaryText : colors.tint} 
              />
            </TouchableOpacity>

            {/* Right Arrow */}
            <TouchableOpacity 
              style={[styles.navArrow, styles.rightArrow, { backgroundColor: colors.card }]}
              onPress={() => navigateRaceCarousel('right')}
              disabled={currentRaceIndex === upcomingRaces.length - 1}>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={currentRaceIndex === upcomingRaces.length - 1 ? colors.secondaryText : colors.tint} 
              />
            </TouchableOpacity>

            <ScrollView
              ref={raceScrollRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + 20}
              snapToAlignment="start"
              contentContainerStyle={styles.experiencesScrollContainer}
              style={styles.experiencesScroll}
              onMomentumScrollEnd={handleRaceScroll}>
              {upcomingRaces.map((raceData, index) => {
              const { race, event } = raceData;
              
              // Get race track images - placeholders for now
              let raceImageUri = "";
              if (event.description?.includes("Portland")) {
                // Portland International Raceway placeholder
                raceImageUri = "https://timely-actor-10dfb03957.media.strapiapp.com/3_A3_340_2088053_929996971_2_ae6493b85c.jpg";
              } else if (event.description?.includes("Milwaukee")) {
                // Milwaukee Mile placeholder
                raceImageUri = "https://timely-actor-10dfb03957.media.strapiapp.com/Milwaukee_638652660e.jpg";
              } else if (event.description?.includes("Nashville")) {
                // Nashville Superspeedway placeholder
                raceImageUri = "https://timely-actor-10dfb03957.media.strapiapp.com/Nashville_8f3860df9d.jpg";
              } else {
                // Default race track placeholder
                raceImageUri = "https://timely-actor-10dfb03957.media.strapiapp.com/245_1_E_2088053_534197834_2_12dee71b8c.jpg";
              }
              
              // Format race date
              const start = new Date(race.scheduled);
              const end = race.scheduled_end ? new Date(race.scheduled_end) : null;
              const options: Intl.DateTimeFormatOptions = {
                month: "long",
                day: "numeric",
                year: "numeric",
              };
              const startStr = start.toLocaleDateString(undefined, options);
              const endStr = end ? end.toLocaleDateString(undefined, options) : "";
              
              // Format location
              const cityRaw = event.venue?.city;
              const countryCode = event.venue?.country_code;
              let city = cityRaw || "";
              let state = "";
              let country = event.venue?.country;

              if (countryCode === "USA" && cityRaw?.includes(", ")) {
                const parts = cityRaw.split(", ");
                if (parts.length === 2) {
                  city = parts[0];
                  state = parts[1];
                  country = "USA";
                }
              }

              let location = city;
              if (state) location += `, ${state}`;
              if (countryCode === "USA") {
                location += `, USA`;
              } else if (country) {
                location += `, ${country}`;
              }

              const dateRange = `${startStr}${endStr && startStr !== endStr ? " - " + endStr : ""}`;
              
              return (
                <View key={`race-${index}-${race.id}`} style={styles.experienceCard}>
                  <View style={styles.carouselContainer}>
                    <View style={styles.experienceCardImage}>
                      <Image
                        source={{ uri: raceImageUri }}
                        style={styles.cardImage}
                        defaultSource={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop' }}
                      />
                      {/* Up Next badge for first race */}
                      {index === 0 && (
                        <View
                          style={[
                            styles.upNextBadge,
                            styles.sponsoredBadge,
                            { backgroundColor: colors.tint },
                          ]}>
                          <Text
                            style={[styles.upNextText, { color: colors.textOnGreen }]}>
                            Up Next
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Race info */}
                  <View style={styles.eventInfo}>
                    <Text style={[styles.eventTitle, { color: colors.text }]}>
                      {event.description}
                    </Text>
                    <Text style={[styles.eventDetails, { color: colors.tint }]}>
                      {dateRange} • {location}
                    </Text>
                    <Text style={[styles.eventSubDetails, { color: colors.tint }]}>
                      {event.venue?.name}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          
          {/* Pagination dots */}
          <View style={styles.paginationContainer}>
            {upcomingRaces.map((_: any, index: number) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentRaceIndex && styles.paginationDotActive,
                  { backgroundColor: index === currentRaceIndex ? colors.tint : colors.border }
                ]}
              />
            ))}
          </View>
        </View>

          <Text style={[styles.countdownTitle, { color: colors.text }]}>
            COUNTDOWN TO RACE DAY:
          </Text>
          <View
            style={[
              styles.countdownContainer,
              { backgroundColor: colors.card },
            ]}>
            <View style={styles.countdownItem}>
              <Text style={[styles.countdownValue, { color: colors.text }]}>
                {countdown.days}
              </Text>
              <Text style={[styles.countdownLabel, { color: colors.tint }]}>
                Days
              </Text>
            </View>
            <View style={styles.countdownItem}>
              <Text style={[styles.countdownValue, { color: colors.text }]}>
                {countdown.hours}
              </Text>
              <Text style={[styles.countdownLabel, { color: colors.tint }]}>
                Hours
              </Text>
            </View>
            <View style={styles.countdownItem}>
              <Text style={[styles.countdownValue, { color: colors.text }]}>
                {countdown.minutes}
              </Text>
              <Text style={[styles.countdownLabel, { color: colors.tint }]}>
                Minutes
              </Text>
            </View>
            <View style={styles.countdownItem}>
              <Text style={[styles.countdownValue, { color: colors.text }]}>
                {countdown.seconds}
              </Text>
              <Text style={[styles.countdownLabel, { color: colors.tint }]}>
                Seconds
              </Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push("/team")}>
              <Image
                source={{
                  uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Juncos_Hollinger_Racing_2024_IndyCar_at_Iowa_Speedway_crew.jpg/960px-Juncos_Hollinger_Racing_2024_IndyCar_at_Iowa_Speedway_crew.jpg",
                }}
                style={styles.gridImage}
              />
              <Text style={[styles.gridTitle, { color: colors.text }]}>
                Our Team
              </Text>
              <Text style={[styles.gridSubtitle, { color: colors.tint }]}>
                Learn More
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push("/(tabs)/schedule")}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1667921686462-da83bb890fed?q=80&w=4031&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                }}
                style={styles.gridImage}
              />
              <Text style={[styles.gridTitle, { color: colors.text }]}>
                Weekend Schedule
              </Text>
              <Text style={[styles.gridSubtitle, { color: colors.tint }]}>
                See full schedule
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push("/faq")}>
              <Image
                source={{
                  uri: "https://cdn-1.motorsport.com/images/amp/YMdy8432/s1200/callum-ilott-juncos-hollinger-.webp",
                }}
                style={styles.gridImage}
              />
              <Text style={[styles.gridTitle, { color: colors.text }]}>
                What to Expect
              </Text>
              <Text style={[styles.gridSubtitle, { color: colors.tint }]}>
                Learn more
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => router.push("/directions")}>
              <Image
                source={{
                  uri: "https://timely-actor-10dfb03957.media.strapiapp.com/D250712_IIS_17293_CJM_b9ea3036fd.jpg",
                }}
                style={styles.gridImage}
              />
              <Text style={[styles.gridTitle, { color: colors.text }]}>
                Getting to the Circuit
              </Text>
              <Text style={[styles.gridSubtitle, { color: colors.tint }]}>
                Travel info
              </Text>
            </TouchableOpacity>
          </View>

          {/* Only show Upcoming Experiences section if there are experiences */}
          {upcomingExperiences.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Upcoming Experiences
              </Text>
              
              {/* Experience Carousel with Navigation */}
              <View style={styles.carouselWrapper}>
                {/* Left Arrow */}
                <TouchableOpacity 
                  style={[styles.navArrow, styles.leftArrow, { backgroundColor: colors.card }]}
                  onPress={() => navigateExperienceCarousel('left')}
                  disabled={currentExperienceIndex === 0}>
                  <Ionicons 
                    name="chevron-back" 
                    size={24} 
                    color={currentExperienceIndex === 0 ? colors.secondaryText : colors.tint} 
                  />
                </TouchableOpacity>

                {/* Right Arrow */}
                <TouchableOpacity 
                  style={[styles.navArrow, styles.rightArrow, { backgroundColor: colors.card }]}
                  onPress={() => navigateExperienceCarousel('right')}
                  disabled={currentExperienceIndex >= upcomingExperiences.length - 1}>
                  <Ionicons 
                    name="chevron-forward" 
                    size={24} 
                    color={currentExperienceIndex >= upcomingExperiences.length - 1 ? colors.secondaryText : colors.tint} 
                  />
                </TouchableOpacity>

                <ScrollView
                  ref={experienceScrollRef}
                  horizontal
                  pagingEnabled={false} // Disable pagingEnabled to use custom snapping
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={CARD_WIDTH + 20} // Card width + margin for proper spacing
                  snapToAlignment="start"
                  contentContainerStyle={styles.experiencesScrollContainer}
                  style={styles.experiencesScroll}
                  onMomentumScrollEnd={handleExperienceScroll}>
                {upcomingExperiences.map((experience, index) => {
                  const imageUrl = experiencesService.getImageUrl(experience);
                  // Create a unique key combining index and id to prevent duplicate key warnings
                  const uniqueKey = `experience-${index}-${experience.id || 'unknown'}`;
                  
                  return (
                    <View key={uniqueKey} style={styles.experienceCard}>
                      <View style={styles.carouselContainer}>
                        <TouchableOpacity
                          style={styles.experienceCardImage}
                          onPress={() => setSelectedExperience(experience)}>
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.cardImage}
                            defaultSource={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=300&fit=crop' }}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Experience info that slides with each card */}
                      <View style={styles.eventInfo}>
                        <Text style={[styles.eventTitle, { color: colors.text }]}>
                          {experience.experience_title}
                        </Text>
                        <Text style={[styles.eventDetails, { color: colors.tint }]}>
                          {experiencesService.formatEventTime(experience.experience_start_date_time, { includeDate: true })}
                          {experience.experience_venue_location?.venue_location_name && 
                            ` • ${experience.experience_venue_location.venue_location_name}`
                          }
                        </Text>
                        
                        {/* See more button */}
                        <TouchableOpacity
                          style={[styles.seeMoreButton, { backgroundColor: colors.tint }]}
                          onPress={() => setSelectedExperience(experience)}>
                          <Text style={[styles.seeMoreButtonText, { color: colors.textOnGreen }]}>
                            See More
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              
              {/* Pagination dots */}
              <View style={styles.paginationContainer}>
                {upcomingExperiences.map((_: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentExperienceIndex && styles.paginationDotActive,
                      { backgroundColor: index === currentExperienceIndex ? colors.tint : colors.border }
                    ]}
                  />
                ))}
              </View>
            </View>
            </>
          )}

          {/* Commenting out push token testing */}
            {/* <Text
              style={[styles.shareButtonText, { color: colors.tint }]}>
              Your push token:
            </Text>
            <Text
              style={[styles.shareButtonText, { color: colors.tint }]}>
              {expoPushToken}
            </Text> */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by</Text>
            <CedoLogo />
          </View>
        </ScrollView>
      </SafeAreaView>

      <NotificationTray 
        visible={notificationTrayVisible}
        onClose={() => setNotificationTrayVisible(false)}
      />

      <ExperienceDetailTray
        experience={selectedExperience}
        visible={selectedExperience !== null}
        onClose={() => setSelectedExperience(null)}
      />
  </>
  </FocusTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    // Platform-specific bottom padding to account for tab bar
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  containerSlider: {
    flex: 1,
    paddingHorizontal: 10,
    // Platform-specific bottom padding to account for tab bar
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
  },
  notificationBell: {
    backgroundColor: "transparent",
  },
  notificationDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "red",
    borderWidth: 2,
    borderColor: "#000",
  },
  logoContainer: {
    alignItems: "center",
    paddingVertical: 5,
    backgroundColor: "transparent",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    
  },
  carouselContainer: {
    // height: 200,
    aspectRatio: 1 / 1,
  },
  carousel: {},
  card: {
    width: CARD_WIDTH,
    borderRadius: 15,
    overflow: "hidden",
    marginRight: 10,
    aspectRatio: 1 / 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  upNextBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#00dd00",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  sponsoredBadge: {
    backgroundColor: "#00dd00",
  },
  upNextText: {
    color: "black",
    fontWeight: "bold",
    
  },
  raceInfo: {
    marginTop: 15,
    backgroundColor: "transparent",
  },
  raceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    
  },
  raceDate: {
    fontSize: 14,
    marginTop: 5,
    
  },
  countdownTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 10,
    
  },
  countdownContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1c1c1e",
    borderRadius: 15,
    padding: 20,
  },
  countdownItem: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
  countdownValue: {
    fontSize: 32,
    fontWeight: "bold",
    
  },
  countdownLabel: {
    fontSize: 14,
    marginTop: 5,
    
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 30,
  },
  gridItem: {
    width: "48%",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  gridImage: {
    width: "100%",
    minHeight: 120,
    borderRadius: 15,
    aspectRatio: 1 / 1,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    
  },
  gridSubtitle: {
    fontSize: 14,
    marginTop: 5,
    
  },
  eventInfo: {
    marginTop: 15,
    backgroundColor: "transparent",
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: "bold",
    
  },
  eventDetails: {
    fontSize: 14,
    marginTop: 5,
    
  },
  eventSubDetails: {
    fontSize: 14,
    marginTop: 5,
    
  },
  shareButton: {
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  footerText: {
    color: "#888",
    fontSize: 12,
    
  },
  experiencesScroll: {
    marginTop: 10,
  },
  experiencesScrollContainer: {
    paddingLeft: 0,
    paddingRight: 0, // Extra padding on the right to ensure last card is fully visible
  },
  experienceCard: {
    width: CARD_WIDTH,
    marginRight: 20, // Add spacing between cards
  },
  experienceCardImage: {
    width: CARD_WIDTH,
    borderRadius: 15,
    overflow: "hidden",
    marginRight: 0, // No margin for experience cards to prevent cutoff
    aspectRatio: 1 / 1,
  },
  seeMoreButton: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  seeMoreButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  carouselWrapper: {
    position: 'relative',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  leftArrow: {
    left: 10,
  },
  rightArrow: {
    right: 10,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 5,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 12,
    height: 8,
    borderRadius: 6,
  },
});
