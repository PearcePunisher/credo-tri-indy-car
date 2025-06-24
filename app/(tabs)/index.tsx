import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Text,
  View,
  SafeAreaView, // <-- add import
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import BrandLogo from "@/components/BrandLogo";
import CedoLogo from "@/components/CedoLogo";
import scheduleData from "@/race_data/scheduleData.json";
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Button } from "@/components/Button";

const colorScheme = useColorScheme() || 'light';
const colors = Colors[colorScheme];

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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

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
function getCountdownParts(targetDate: string): { days: number; hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const diff = Math.max(0, new Date(targetDate).getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export default function HomeScreen() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [nextRace, setNextRace] = useState<{ race: Stage; event: Event } | null>(null);

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
    <SafeAreaView style={{ flex: 1, }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Button style={styles.loginButton}>
            Login
          </Button>
          <View style={styles.notificationBell}>
            <FontAwesome5 name="bell" size={24} color="white" solid />
            <View style={styles.notificationDot} />
          </View>
        </View>

        <View style={styles.logoContainer}>
          <BrandLogo style={styles.brand} />
        </View>

        <Text style={styles.sectionTitle}>Upcoming Races</Text>
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}>
            <View style={styles.card}>
              <Image
                source={{
                  uri: "https://digbza2f4g9qo.cloudfront.net/-/media/IndyCar/News/Standard/2025/01/01-08-StPete.jpg?vs=1&d=20250108T213909Z",
                }}
                style={styles.cardImage}
              />
              <View style={styles.upNextBadge}>
                <Text style={styles.upNextText}>Up Next</Text>
              </View>
            </View>
            {/* Add more race cards here */}
          </ScrollView>
          {/* Add pagination dots here */}
        </View>
        <View style={styles.raceInfo}>
          <Text style={styles.raceTitle}>
            {nextRace
              ? (nextRace.event.description || "Next Race").toUpperCase()
              : "No Upcoming Race"}
          </Text>
          <Text style={styles.raceDate}>
            {nextRace
              ? (() => {
                  const start = new Date(nextRace.race.scheduled);
                  const end = nextRace.race.scheduled_end ? new Date(nextRace.race.scheduled_end) : null;
                  const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" };
                  const startStr = start.toLocaleDateString(undefined, options);
                  const endStr = end ? end.toLocaleDateString(undefined, options) : "";
                  const city = nextRace.event.venue?.city;
                  const state = nextRace.event.venue?.country_code === "USA"
                    ? (city?.split(", ")[1] || "")
                    : nextRace.event.venue?.country;
                  return `${startStr}${endStr && startStr !== endStr ? " - " + endStr : ""} • ${city}${state ? ", " + state : ""}`;
                })()
              : ""}
          </Text>
        </View>

        <Text style={styles.countdownTitle}>COUNTDOWN TO NEXT RACE:</Text>
        <View style={styles.countdownContainer}>
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>{countdown.days}</Text>
            <Text style={styles.countdownLabel}>Days</Text>
          </View>
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>{countdown.hours}</Text>
            <Text style={styles.countdownLabel}>Hours</Text>
          </View>
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>{countdown.minutes}</Text>
            <Text style={styles.countdownLabel}>Minutes</Text>
          </View>
          <View style={styles.countdownItem}>
            <Text style={styles.countdownValue}>{countdown.seconds}</Text>
            <Text style={styles.countdownLabel}>Seconds</Text>
          </View>
        </View>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1554774853-719586f82d77?q=80&w=2940&auto=format&fit=crop",
              }}
              style={styles.gridImage}
            />
            <Text style={styles.gridTitle}>Guest Registration</Text>
            <Text style={styles.gridSubtitle}>Register now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1590442187458-49b1b46561e4?q=80&w=2874&auto=format&fit=crop",
              }}
              style={styles.gridImage}
            />
            <Text style={styles.gridTitle}>Weekend Schedule</Text>
            <Text style={styles.gridSubtitle}>See full schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1611826522189-0c25a7864587?q=80&w=2874&auto=format&fit=crop",
              }}
              style={styles.gridImage}
            />
            <Text style={styles.gridTitle}>What to Expect</Text>
            <Text style={styles.gridSubtitle}>Learn more</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridItem}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1470104345625-700a501b78c8?q=80&w=2848&auto=format&fit=crop",
              }}
              style={styles.gridImage}
            />
            <Text style={styles.gridTitle}>Getting to the Circuit</Text>
            <Text style={styles.gridSubtitle}>Travel info</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Upcoming Events</Text>
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}>
            <View style={styles.card}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1611826522189-0c25a7864587?q=80&w=2874&auto=format&fit=crop",
                }}
                style={styles.cardImage}
              />
              <View style={[styles.upNextBadge, styles.sponsoredBadge]}>
                <Text style={styles.upNextText}>Sponsored Event</Text>
              </View>
            </View>
            {/* Add more event cards here */}
          </ScrollView>
          {/* Add pagination dots here */}
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>Garage Tour</Text>
          <Text style={styles.eventDetails}>
            Exclusive Event • Meet the Beta Testers
          </Text>
          <Text style={styles.eventSubDetails}>Invitation Only</Text>
        </View>

        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share Your Thoughts</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by</Text>
          <CedoLogo />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
    minHeight: 120,
    alignSelf: "center",
    // marginBottom: 20,
    objectFit: "contain",
  },
  loginButton: {
    borderColor: "#00dd00",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
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
    color: "#00dd00",
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
    color: "#00dd00",
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
    height: 120,
    borderRadius: 15,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  gridSubtitle: {
    color: "#00dd00",
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
    color: "#00dd00",
    fontSize: 14,
    marginTop: 5,
  },
  eventSubDetails: {
    fontSize: 14,
    marginTop: 5,
  },
  shareButton: {
    backgroundColor: "#00dd00",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 20,
  },
  shareButtonText: {
    color: "black",
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
