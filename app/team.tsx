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
  Platform,
} from "react-native";

// Type definitions based on API structure
type SocialMedia = {
  id: number;
  social_platform: string;
  driver_social_link: string | null;
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

type DriverCareerStats = {
  id: number;
  driver_career_stats_starts: number;
  driver_career_stats_wins: number;
  driver_career_stats_championships: number;
  driver_career_stats_indy_500_wins: number;
  driver_career_stats_poles: number;
  driver_career_stats_top_5: number;
  driver_career_stats_top_10: number;
  driver_career_stats_laps_led: number;
};

type DriverCurrentSeasonStats = {
  id: number;
  driver_current_season_stats_starts: number;
  driver_current_season_stats_wins: number;
  driver_current_season_stats_poles: number;
  driver_current_season_stats_top_5: number;
  driver_current_season_stats_top_10: number;
  driver_current_season_stats_laps_led: number;
};

type StaffImage = {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
};

type StaffMember = {
  id: number;
  Staff_name: string;
  Staff_Description: any[]; // Rich text array
  Staff_Image: StaffImage;
};

type TeamDetails = {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  team_id: string;
  team_name: string;
  team_descriptions: string;
  team_website_link: string;
  team_merch_link: string;
  team_headquarters: string | null;
  team_established_date: string | null;
  staff_members_team: StaffMember[];
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
  driver_career_stats?: DriverCareerStats;
  driver_current_season_stats?: DriverCurrentSeasonStats;
};

const TeamScreen = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchDrivers = fetch(
      "https://harmonious-wealth-6294946a0c.strapiapp.com/api/drivers?populate[driver_image]=true&populate[driver_social_medias]=true&populate[driver_record]=true&populate[car][populate][car_images][populate]=car_image_side&populate[driver_current_season_stats]=true&populate[driver_career_stats]=true"
    ).then((res) => res.json());

    const fetchTeamDetails = fetch(
      "https://harmonious-wealth-6294946a0c.strapiapp.com/api/team-details?fields[0]=team_name&fields[1]=team_descriptions"
    ).then((res) => res.json());

    const fetchStaffDetails = fetch(
      "https://harmonious-wealth-6294946a0c.strapiapp.com/api/team-details?populate[staff_members_team][populate][Staff_Image]=true"
    ).then((res) => res.json());

    Promise.all([fetchDrivers, fetchTeamDetails, fetchStaffDetails])
      .then(([driversData, teamDetailsData, staffDetailsData]) => {
        setDrivers(driversData.data);
        
        // The team details API returns an array, so we take the first item
        if (teamDetailsData.data && teamDetailsData.data.length > 0) {
          setTeamDetails(teamDetailsData.data[0]);
          setStaffMembers(teamDetailsData.data[0].staff_members_team || []);
        }
        
        // Also get staff from the separate staff API if needed
        if (staffDetailsData.data && staffDetailsData.data.length > 0) {
          const additionalStaff = staffDetailsData.data[0].staff_members_team || [];
          setStaffMembers(prev => [...prev, ...additionalStaff]);
        }
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
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[
            styles.title,
            { color: colors.text },
          ]}
        >
          The Team
        </Text>

        {teamDetails && (
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
              {teamDetails.team_name}
            </Text>
            <Text
              style={[
                styles.bio,
                { color: colors.secondaryText },
              ]}
            >
              {teamDetails.team_descriptions}
            </Text>
          </View>
        )}

        {/* Staff Members Section */}
        {staffMembers.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Leadership
            </Text>
            {staffMembers.map((staff: StaffMember) => {
              const staffImageUrl = staff.Staff_Image?.url;
              
              // Helper function to extract subtitle (bold text from first paragraph)
              const getStaffSubtitle = () => {
                if (!staff.Staff_Description || staff.Staff_Description.length === 0) return '';
                
                const firstParagraph = staff.Staff_Description[0];
                if (!firstParagraph?.children) return '';
                
                return firstParagraph.children
                  .filter((child: any) => child.bold)
                  .map((child: any) => child.text || '')
                  .join('');
              };
              
              // Helper function to extract description (excluding the subtitle)
              const getStaffDescription = () => {
                if (!staff.Staff_Description || staff.Staff_Description.length === 0) return '';
                
                return staff.Staff_Description
                  .map((paragraph, index) => {
                    if (!paragraph.children) return '';
                    
                    // For first paragraph, exclude bold text (subtitle)
                    if (index === 0) {
                      return paragraph.children
                        .filter((child: any) => !child.bold)
                        .map((child: any) => child.text || '')
                        .join('');
                    }
                    
                    // For other paragraphs, include all text
                    return paragraph.children
                      .map((child: any) => child.text || '')
                      .join('');
                  })
                  .filter(text => text.trim() !== '')
                  .join('\n\n');
              };

              const subtitle = getStaffSubtitle();
              const description = getStaffDescription();

              return (
                <View key={staff.id} style={[styles.staffCard, { backgroundColor: colors.card }]}>
                  {staffImageUrl && (
                    <Image source={{ uri: staffImageUrl }} style={styles.staffImage} />
                  )}
                  
                  <View style={styles.staffContent}>
                    <Text style={[styles.staffName, { color: colors.text }]}>
                      {staff.Staff_name}
                    </Text>
                    {subtitle && (
                      <Text style={[styles.staffSubtitle, { color: colors.tint }]}>
                        {subtitle}
                      </Text>
                    )}
                    <Text style={[styles.staffDescription, { color: colors.secondaryText }]}>
                      {description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Drivers Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Drivers
        </Text>

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
                    // Skip if no link is provided or if it's just whitespace
                    if (!s.driver_social_link || s.driver_social_link.trim() === '') return null;

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

                    // Skip if we don't have a matching icon for this platform
                    if (!iconName) return null;

                    const handleSocialPress = async () => {
                      try {
                        let url = s.driver_social_link;
                        if (!url) return;

                        // Clean up the URL - ensure it has proper protocol
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                          url = 'https://' + url;
                        }

                        console.log(`Attempting to open: ${url} for platform: ${platform}`);
                        
                        // Try to open the URL directly first
                        const canOpen = await Linking.canOpenURL(url);
                        console.log(`Can open ${url}: ${canOpen}`);
                        
                        if (canOpen) {
                          await Linking.openURL(url);
                        } else {
                          // If the main URL fails, try app-specific schemes for mobile apps
                          let fallbackUrl = null;
                          
                          if (platform.includes("instagram")) {
                            // Extract username from Instagram URL
                            const match = url.match(/instagram\.com\/([^/?]+)/);
                            if (match) {
                              fallbackUrl = `instagram://user?username=${match[1]}`;
                            }
                          } else if (platform.includes("facebook")) {
                            // Extract page name from Facebook URL
                            const match = url.match(/facebook\.com\/([^/?]+)/);
                            if (match) {
                              fallbackUrl = `fb://page/${match[1]}`;
                            }
                          }
                          
                          if (fallbackUrl) {
                            console.log(`Trying fallback URL: ${fallbackUrl}`);
                            const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
                            if (canOpenFallback) {
                              await Linking.openURL(fallbackUrl);
                            } else {
                              console.warn(`Cannot open URL or fallback: ${url}, ${fallbackUrl}`);
                              // As a last resort, try opening in browser
                              await Linking.openURL(url);
                            }
                          } else {
                            console.warn(`Cannot open URL: ${url}`);
                            // Try to open anyway - sometimes canOpenURL is overly restrictive
                            await Linking.openURL(url);
                          }
                        }
                      } catch (error) {
                        console.error(`Error opening social media link: ${error}`);
                        console.error(`Platform: ${platform}, URL: ${s.driver_social_link}`);
                      }
                    };

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.socialIcon}
                        onPress={handleSocialPress}
                        accessibilityLabel={`Open ${s.social_platform} profile`}
                        accessibilityHint={`Opens ${s.social_platform} in your browser or app`}
                      >
                        <FontAwesome name={iconName} size={24} color={colors.tint} />
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Image
                  source={{ uri: carImage }}
                  style={styles.carImage}
                  resizeMode="contain"
                />

                <Text style={[styles.subHeader, { color: colors.text }]}>Career Stats</Text>
                {driver.driver_career_stats ? (
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.tint }]}>
                        {driver.driver_career_stats.driver_career_stats_starts}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Starts</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.tint }]}>
                        {driver.driver_career_stats.driver_career_stats_wins}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Wins</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.tint }]}>
                        {driver.driver_career_stats.driver_career_stats_poles}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Poles</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.tint }]}>
                        {driver.driver_career_stats.driver_career_stats_top_5}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Top 5</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.tint }]}>
                        {driver.driver_career_stats.driver_career_stats_top_10}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Top 10</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statNumber, { color: colors.tint }]}>
                        {driver.driver_career_stats.driver_career_stats_laps_led}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Laps Led</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.noStats, { color: colors.secondaryText }]}>
                    No career stats available
                  </Text>
                )}

                {driver.driver_current_season_stats && (
                  <>
                    <Text style={[styles.subHeader, { color: colors.text }]}>2025 Season Stats</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.tint }]}>
                          {driver.driver_current_season_stats.driver_current_season_stats_starts}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Starts</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.tint }]}>
                          {driver.driver_current_season_stats.driver_current_season_stats_wins}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Wins</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.tint }]}>
                          {driver.driver_current_season_stats.driver_current_season_stats_poles}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Poles</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.tint }]}>
                          {driver.driver_current_season_stats.driver_current_season_stats_top_5}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Top 5</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.tint }]}>
                          {driver.driver_current_season_stats.driver_current_season_stats_top_10}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Top 10</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.tint }]}>
                          {driver.driver_current_season_stats.driver_current_season_stats_laps_led}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Laps Led</Text>
                      </View>
                    </View>
                  </>
                )}
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
    paddingHorizontal: 16,
    paddingTop: 8, // Reduced top padding
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 36 : 16, // iOS needs more space for tab bar
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
    padding: 4, // Add padding for better touch target
    borderRadius: 4, // Add slight border radius for better visual feedback
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 16,
  },
  statItem: {
    width: "33.33%",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  noStats: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 16,
  },
  staffCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    width: "100%",
  },
  staffImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  staffContent: {
    padding: 16,
  },
  staffName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  staffSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  staffDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TeamScreen;
