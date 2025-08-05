import React, { useEffect, useState } from "react";
console.log('✅ React imported');
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
console.log('✅ React Native components imported');
import { SafeAreaView } from "react-native-safe-area-context";
console.log('✅ SafeAreaView imported');
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
console.log('✅ Expo vector icons imported');
import { router } from "expo-router";
console.log('✅ Expo router imported');
import BrandLogo from "@/components/BrandLogo";
console.log('✅ BrandLogo component imported');
import EventLogo from "@/components/EventLogo";
console.log('✅ EventLogo component imported');
import CedoLogo from "@/components/CedoLogo";
console.log('✅ CedoLogo component imported');
// import { NotificationBell } from "@/components/NotificationBell"; // TEMPORARILY COMMENTED OUT
// import { TestNotificationButton } from "@/components/TestNotificationButton";
import EnhancedNotificationBell from "@/components/EnhancedNotificationBell";
console.log('✅ EnhancedNotificationBell component imported');
import { NotificationTray } from "@/components/NotificationTray";
console.log('✅ Enhanced Notification Bell Imported')
import scheduleData from "@/race_data/scheduleData.json";
console.log('✅ Schedule data imported');
import { Colors } from "@/constants/Colors";
console.log('✅ Colors constants imported');
import { useColorScheme } from "@/hooks/useColorScheme";
console.log('✅ useColorScheme hook imported');
import { useAuth } from "@/hooks/useAuth";
console.log('✅ useAuth hook imported');
import { Button } from "@/components/Button";
console.log('✅ Button component imported');

console.log('🚀 All imports completed for Index page');

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

  const [notificationTrayVisible, setNotificationTrayVisible] = useState(false);

  const { colorScheme, systemColorScheme, isLoaded, hasStoredPreference, clearColorSchemePreference } = useColorScheme();
  const colors = Colors[colorScheme];

  // Removed excessive debug logging that was firing on every render
  // You can temporarily uncomment this line if you need to debug color scheme issues:
  // console.log('🏠 Index page color scheme debug:', { currentScheme: colorScheme, systemScheme: systemColorScheme, isLoaded, hasStoredPreference });

  // Temporary debug function
  const debugColorScheme = async () => {
    console.log('🔍 Debug button pressed - clearing stored preference to test system following');
    console.log('🔍 Current system color scheme:', systemColorScheme);
    console.log('🔍 Current app color scheme:', colorScheme);
    console.log('🔍 Has stored preference:', hasStoredPreference);
    
    try {
      // Clear the specific key
      await clearColorSchemePreference();
      
      // Also manually check what's in AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', allKeys);
      
      const colorSchemeValue = await AsyncStorage.getItem('user-color-scheme');
      console.log('🔍 Color scheme value in storage:', colorSchemeValue);
      
    } catch (error) {
      console.error('🔍 Debug error:', error);
    }
  };

  useEffect(() => {
    const found = getNextRace((scheduleData as ScheduleData).stages);
    setNextRace(found);
    if (found) {
      setCountdown(getCountdownParts(found.race.scheduled));
      const interval = setInterval(() => {
        setCountdown(getCountdownParts(found.race.scheduled));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
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

          {/* <View style={styles.logoContainer}>
            <EventLogo style={styles.brand} />
          </View> */}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Events
          </Text>
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}>
              <View style={styles.card}>
                <Image
                  source={{
                    uri: "https://harmonious-wealth-6294946a0c.media.strapiapp.com/firestone_grand_prix_of_st_pete_3_Large_76370703d1.jpeg",
                  }}
                  style={styles.cardImage}
                />
                <View
                  style={[
                    styles.upNextBadge,
                    styles.sponsoredBadge,
                    { backgroundColor: colors.tint },
                  ]}>
                  <Text
                    style={[styles.upNextText, { color: colors.textOnRed }]}>
                    Up Next
                  </Text>
                </View>
              </View>
              {/* Add more race cards here */}
            </ScrollView>
            {/* Add pagination dots here */}
          </View>
          <View style={styles.raceInfo}>
            <Text style={[styles.raceTitle, { color: colors.text }]}>
              {nextRace
                ? (nextRace.event.description || "Next Race").toUpperCase()
                : "Back to School with the Broncos"}
            </Text>
            <Text style={[styles.raceDate, { color: colors.tint }]}>
              {nextRace
                ? (() => {
                    const start = new Date(nextRace.race.scheduled);
                    const end = nextRace.race.scheduled_end
                      ? new Date(nextRace.race.scheduled_end)
                      : null;
                    const options: Intl.DateTimeFormatOptions = {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    };
                    const startStr = start.toLocaleDateString(
                      undefined,
                      options
                    );
                    const endStr = end
                      ? end.toLocaleDateString(undefined, options)
                      : "";
                    const cityRaw = nextRace.event.venue?.city;
                    const countryCode = nextRace.event.venue?.country_code;
                    let city = cityRaw || "";
                    let state = "";
                    let country = nextRace.event.venue?.country;

                    // If USA, try to extract state from city (e.g., "Lexington, OH")
                    if (countryCode === "USA" && cityRaw?.includes(", ")) {
                      const parts = cityRaw.split(", ");
                      if (parts.length === 2) {
                        city = parts[0];
                        state = parts[1];
                        country = "USA";
                      }
                    }

                    // Compose location string
                    let location = city;
                    if (state) location += `, ${state}`;
                    if (countryCode === "USA") {
                      location += `, USA`;
                    } else if (country) {
                      location += `, ${country}`;
                    }

                    return `${startStr}${
                      endStr && startStr !== endStr ? " - " + endStr : ""
                    } • ${location}`;
                  })()
                : ""}
            </Text>
          </View>

          <Text style={[styles.countdownTitle, { color: colors.text }]}>
            EVENT STARTS IN:
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
                  uri: "https://harmonious-wealth-6294946a0c.media.strapiapp.com/firestone_grand_prix_of_st_pete_3_Large_76370703d1.jpeg",
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
                  uri: "https://harmonious-wealth-6294946a0c.media.strapiapp.com/firestone_racing_grand_prix_st_pete_1170_Large_687ecfdc35.jpeg",
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
                  uri: "https://harmonious-wealth-6294946a0c.media.strapiapp.com/firestone_grand_prix_of_st_pete_2_Large_38beae35ac.jpeg",
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
                  uri: "https://harmonious-wealth-6294946a0c.media.strapiapp.com/firestone_125th_anniversary_d8f0c8e14b.jpg",
                }}
                style={styles.gridImage}
              />
              <Text style={[styles.gridTitle, { color: colors.text }]}>
                Getting Here
              </Text>
              <Text style={[styles.gridSubtitle, { color: colors.tint }]}>
                Travel info
              </Text>
            </TouchableOpacity>
          </View>

          {/* <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Experiences
          </Text>
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}>
              <View style={styles.card}>
                <Image
                  source={{
                    uri: "https://i0.wp.com/speedsport.com/wp-content/uploads/2023/01/unnamed-2023-01-28T140339.484.jpg?fit=900%2C471&ssl=1",
                  }}
                  style={styles.cardImage}
                />
                <View
                  style={[
                    styles.upNextBadge,
                    styles.sponsoredBadge,
                    { backgroundColor: colors.tint },
                  ]}>
                  <Text
                    style={[styles.upNextText, { color: colors.textOnRed }]}>
                    Sponsored Event
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventTitle, { color: colors.text }]}>
              Garage Tour
            </Text>
            <Text style={[styles.eventDetails, { color: colors.tint }]}>
              Exclusive Event • Meet the Beta Testers
            </Text>
            <Text style={[styles.eventSubDetails, { color: colors.tint }]}>
              Invitation Only
            </Text>
          </View> */}
          {/* Commenting out share feedback button */}
          {/* <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.tint }]}>
            <Text
              style={[styles.shareButtonText, { color: colors.textOnRed }]}>
              Share Your Thoughts
            </Text>
          </TouchableOpacity> */}

          {/* Temporary debug button - remove after testing */}
          {/* <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.tint, marginVertical: 10 }]}
            onPress={debugColorScheme}>
            <Text style={[styles.shareButtonText, { color: colors.textOnRed }]}>
              🔍 Debug: Clear Theme Preference
            </Text>
          </TouchableOpacity> */}

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
    minHeight: 80,
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
    paddingVertical: 20,
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
});
