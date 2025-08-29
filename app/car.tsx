import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator, Dimensions } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import BrandLogo from "@/components/BrandLogo";
import ChevroletLogo from "@/assets/images/chevy-logo.svg";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 60 },
  brand: { width: CARD_WIDTH, minHeight: 40, alignSelf: "center", marginTop: 10 },
  heroImage: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  paragraph: { fontSize: 15, lineHeight: 24, marginBottom: 16 },
  heading: { fontSize: 18, fontWeight: "bold", marginTop: 24, marginBottom: 12 },
  bulletItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  bulletDot: { fontSize: 18, lineHeight: 22, marginRight: 8 },
  subBulletDot: { fontSize: 14, lineHeight: 20, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 22 },
});

const CarScreen = () => {
  // Assumption: Client wants to replace per-driver detail cards with top stacked car images and static informational content.
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const textColor = colors.text;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          "https://timely-actor-10dfb03957.strapiapp.com/api/drivers?populate[driver_image]=true&populate[car][populate][car_images][populate]=car_image_side"
        );
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  // Extract unique car images (first image per driver's car)
  const carImages: string[] = [];
  data.forEach((driver) => {
    const carImageObj = driver?.car?.car_images?.[0]?.car_image_side;
    const carImageUrl = carImageObj?.formats?.medium?.url || carImageObj?.url;
    if (carImageUrl && !carImages.includes(carImageUrl)) carImages.push(carImageUrl);
  });

  return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <BrandLogo style={styles.brand} />
        <Text style={[styles.pageTitle, { color: textColor }]}>Our Cars</Text>
        <View>
          {carImages.slice(0, 4).map((uri, idx) => (
            <Image
              key={idx}
              source={{ uri }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ))}
        </View>
        <View style={{ alignItems: "center", marginBottom: 28, marginTop: 4 }}>
          <Text style={[styles.heading, { color: textColor, textAlign: "center" }]}>
            Juncos-Hollinger Racing engines are provided by:
          </Text>
          <ChevroletLogo width={180} height={60} />
        </View>
        <Text style={[styles.heading, { color: textColor }]}>Hybrid Power Unit Overview</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>In 2024, INDYCAR will introduce the 2.2-liter twin-turbocharged V-6 engine with hybrid technology as its powerplant. Through meticulous development and collaborative innovation, INDYCAR’s hybrid power unit will enhance racing action and further series’ efforts to deliver the most competitive motorsport on the planet.</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>The new power unit features additional horsepower and overtake ("push-to-pass") options generating opportunities for additional passing, ultimately giving INDYCAR SERIES drivers more control and options – further amplifying the racing challenge and excitement.</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>Beginning in November 2022, INDYCAR SERIES engine manufacturers Chevrolet and Honda worked in collaboration on the development of the first-of-its-kind hybrid unit.</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>The hybrid system is comprised of the Motor Generator Unit (MGU) and Energy Storage System (ESS), which both fit inside the bellhousing, located between the INDYCAR SERIES combustion engine and the gearbox. Multiple strategies for regeneration and deployment have been tested as the power unit builds and transmits energy through the MGU before being saved in the supercapacitor ESS. The additional horsepower is deployed through the same motor generator. Unlike the traditional INDYCAR "push-to-pass" system, the hybrid power unit will not have a restriction on total time used over the course of a race.</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>The start of the 2024 NTT INDYCAR SERIES season features enhanced possibilities of track records with lighter chassis components (aeroscreen, bellhousing and gearbox) prepared for the hybrid addition. Once the hybrid unit is integrated beginning at the Mid-Ohio Sports Car Course in July, the remaining 2024 races will feature the intensified engineering and wheel-to-wheel precision of the hybrid power era.</Text>
        <Text style={[styles.heading, { color: textColor }]}>PROJECT TIMELINE</Text>
        <Text style={[styles.paragraph, { color: textColor }]}>Initial on-track testing of hybrid power unit concepts began in October 2022. The combustion engine was initially paired and tested with the hybrid unit on August 16, 2023, at Sebring International Raceway with drivers Scott Dixon (Honda) and Will Power (Chevrolet). Additional testing sessions included ovals at Indianapolis Motor Speedway, Milwaukee Mile and World Wide Technology Raceway, road courses at Barber Motorsports Park, Homestead-Miami Speedway, IMS and Road America.</Text>
        <Text style={[styles.heading, { color: textColor }]}>NOTEWORTHY</Text>
        <View style={{ marginBottom: 8 }}>
          {[
            "The 2.2-liter, twin-turbocharged V-6 engine with hybrid technology is a hybrid power unit unique to INDYCAR and developed collaboratively with Chevrolet (Ilmor) and Honda (HRC).",
            "The hybrid assist unit will produce up additional horsepower ultimately producing a combined 900 horsepower for INDYCAR SERIES race cars.",
            "The INDYCAR hybrid powerplant maintains the fast, loud and authentic sound of INDYCAR SERIES machinery.",
            "The new engine package has safety in mind:",
          ].map((t, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={[styles.bulletDot, { color: textColor }]}>•</Text>
              <Text style={[styles.bulletText, { color: textColor }]}>{t}</Text>
            </View>
          ))}
          {/* Sub bullets for safety */}
          {[
            "The hybrid component is low voltage (48V)",
            "The engine will not require on-track “starters” (teams will continue to use portable starters on pit road), so if the car stalls on the track, the driver can quickly restart the car by themselves – avoiding the need for the AMR INDYCAR Safety Team to be deployed.",
          ].map((t, i) => (
            <View key={"s-" + i} style={[styles.bulletItem, { marginLeft: 16 }] }>
              <Text style={[styles.subBulletDot, { color: textColor }]}>•</Text>
              <Text style={[styles.bulletText, { color: textColor }]}>{t}</Text>
            </View>
          ))}
          <View style={styles.bulletItem}>
            <Text style={[styles.bulletDot, { color: textColor }]}>•</Text>
            <Text style={[styles.bulletText, { color: textColor }]}>With the ability to harness, otherwise wasted energy, the hybrid package is part of the greater sustainability program in the NTT INDYCAR SERIES in addition to:</Text>
          </View>
          {[
            "Shell’s 100% Renewable Race Fuel, which made its debut in 2023",
            "Renewable diesel used in the team’s race car transporters",
            "Firestone’s innovative and sustainable alternate race tire with green sidewalls made from guayule rubber",
          ].map((t, i) => (
            <View key={"s2-" + i} style={[styles.bulletItem, { marginLeft: 16 }] }>
              <Text style={[styles.subBulletDot, { color: textColor }]}>•</Text>
              <Text style={[styles.bulletText, { color: textColor }]}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
  );
};

export default CarScreen;
