import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import BrandLogo from "@/components/BrandLogo";
import { Colors } from "@/constants/Colors";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
} from "react-native";

// Type definitions based on API structure
type SocialMedia = {
  id: number;
  social_platform: string;
  driver_social_length: string;
};

type ImageFormat = {
  url: string;
};

type Media = {
  url: string;
  formats?: {
    medium?: ImageFormat;
  };
};

type CarImageSide = {
  url: string;
  formats?: {
    medium?: ImageFormat;
  };
};

type CarImage = {
  car_image_side?: CarImageSide;
};

type Car = {
  car_images?: CarImage[];
};

type DriverRecord = {
  id: number;
  record_date: string;
  record_details: string;
};

type Driver = {
  id: number;
  driver_fname: string;
  driver_lname: string;
  driver_country_origin: string;
  driver_bio: string;
  driver_social_medias?: SocialMedia[];
  driver_image?: Media;
  car?: Car;
  driver_record?: DriverRecord[];
};

const TeamScreen = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchDrivers = fetch(
      "https://timely-actor-10dfb03957.strapiapp.com/api/drivers?populate[driver_image]=true&populate[driver_social_medias]=true&populate[driver_record]=true&populate[car][populate][car_images][populate]=car_image_side"
    ).then((res) => res.json());

    const fetchTeamDetails = fetch(
      "https://timely-actor-10dfb03957.strapiapp.com/api/team-details?fields[0]=team_name&fields[1]=team_descriptions"
    ).then((res) => res.json());

    Promise.all([fetchDrivers, fetchTeamDetails])
      .then(([driversData, teamDetailsData]) => {
        setDrivers(driversData.data);
        setTeamDetails(teamDetailsData.data);
      })
      .catch((err) => console.error("Failed to fetch data:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color={colors.tint} style={{ flex: 1 }} />;
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          The Team
        </Text>

        {teamDetails?.length > 0 && (
          <View
            style={[
              styles.teamDetails,
              { backgroundColor: colors.card },
            ]}
          >
            {/* Remove the extra View and just use the logo with a small margin */}
            <BrandLogo style={{ ...styles.brand, marginBottom: 4 }} />
            <Text
              style={[
                styles.subHeader,
                { color: colors.text },
              ]}
            >
              {teamDetails[0].team_name}
            </Text>
            <Text
              style={[
                styles.bio,
                { color: colors.secondaryText },
              ]}
            >
              {teamDetails[0].team_descriptions}
            </Text>
          </View>
        )}

        {drivers.map((driver: Driver) => {
          const fullName = `${driver.driver_fname} ${driver.driver_lname}`;
          const flagUrl = `https://flagcdn.com/${driver.driver_country_origin?.toLowerCase()}.png`;
          const profileImage =
            driver.driver_image?.formats?.medium?.url ||
            driver.driver_image?.url;

          const carImage =
            driver.car?.car_images?.[0]?.car_image_side?.url || "https://placehold.co/300x100?text=Car+Image";

          const socialLinks = driver.driver_social_medias || [];

          return (
            <View key={driver.id} style={[styles.card, { backgroundColor: colors.card }]}>
              <Image source={{ uri: profileImage }} style={styles.driverImage} />

              <View style={styles.cardInner}>
                <View style={styles.driverHeader}>
                  <Text style={[styles.driverName, { color: colors.text }]}>{fullName}</Text>
                  <Image source={{ uri: flagUrl }} style={styles.flag} />
                </View>

                <Text style={[styles.bio, { color: colors.secondaryText }]}>{driver.driver_bio}</Text>

                <View style={styles.socialRow}>
                  {socialLinks.map((s: SocialMedia, idx: number) => {
                    const platform = s.social_platform.toLowerCase();

                    type FontAwesomeIconName =
                      | "instagram"
                      | "twitter"
                      | "facebook"
                      | "youtube-play";

                    let iconName: FontAwesomeIconName | null = null;
                    if (platform.includes("instagram")) iconName = "instagram";
                    else if (platform.includes("twitter") || platform.includes("x"))
                      iconName = "twitter";
                    else if (platform.includes("facebook")) iconName = "facebook";
                    else if (platform.includes("youtube")) iconName = "youtube-play";

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.socialIcon}
                        onPress={() =>
                          Linking.openURL(`https://${s.driver_social_length}`)
                        }
                      >
                        {iconName && (
                          <FontAwesome name={iconName} size={24} color={colors.tint} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Image
                  source={{ uri: carImage }}
                  style={styles.carImage}
                  resizeMode="cover"
                />

                <Text style={[styles.subHeader, { color: colors.text }]}>Achievements</Text>
                {(driver.driver_record || []).map((record) => (
                  <Text key={record.id} style={[styles.achievement, { color: colors.tint }]}>
                    {record.record_details}
                  </Text>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 55,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  brand: { width: 250, height: 120, alignSelf: 'center', marginBottom: 10, objectFit: 'contain' },
  teamDetails: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    width: "100%",
  },
  driverImage: {
    width: "100%",
    aspectRatio: 3 / 4,
    resizeMode: "contain",
  },
  cardInner: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  driverName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  flag: {
    width: 32,
    height: 20,
    borderRadius: 2,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  socialText: {
    fontSize: 13,
    marginRight: 12,
    textDecorationLine: "underline",
  },
  socialIcon: {
    marginRight: 12,
  },
  carImage: {
    width: "100%",
    height: 100,
    margin: 20,
    alignSelf: "center",
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  achievement: {
    fontSize: 13,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
});

export default TeamScreen;
