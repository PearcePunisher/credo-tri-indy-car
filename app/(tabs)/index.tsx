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
  
  const { debugUserData } = useAuth();
  
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

  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

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
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}>
              <View style={styles.card}>
                <Image
                  source={{
                    uri: "https://timely-actor-10dfb03957.media.strapiapp.com/JHR_Laguna_98de1e39c8.png",
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
                    style={[styles.upNextText, { color: colors.textOnGreen }]}>
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
                : "No Upcoming Race"}
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
                  uri: "https://timely-actor-10dfb03957.media.strapiapp.com/2_EA_190_2088053_79694176_2_62735d8d5b.jpg",
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
                    style={[styles.upNextText, { color: colors.textOnGreen }]}>
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
              style={[styles.shareButtonText, { color: colors.textOnGreen }]}>
              Share Your Thoughts
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
