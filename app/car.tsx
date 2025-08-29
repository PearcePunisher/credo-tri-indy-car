import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import BrandLogo from "@/components/BrandLogo";
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
    marginTop: 10,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  tags: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginVertical: 10,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#ddd",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    margin: 4,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  driver: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 20,
  },
  linkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pagerItem: {
    alignItems: "stretch",
    marginVertical: 8,
    alignSelf: "center",
  },
});

const CarScreen = () => {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const bgColor = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const cardColor = colorScheme === "dark" ? "#1c1c1e" : "#f0f0f0";

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
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const renderCar = ({ item: driver, index }: { item: any; index: number }) => {
    const car = driver?.car ?? {};
    const carImageObj = car?.car_images?.[0]?.car_image_side;
    const carImageUrl = carImageObj?.formats?.medium?.url || carImageObj?.url;
    const driverImageObj = driver?.driver_image;
    const driverImageUrl =
      driverImageObj?.formats?.medium?.url || driverImageObj?.url;

    return (
      <View style={[styles.pagerItem, { width: CARD_WIDTH }]}>
        {carImageUrl && (
          <Image
            source={{ uri: carImageUrl }}
            style={styles.image}
            resizeMode="contain"
          />
        )}

        <View style={styles.tags}>
          {[
            `Car #${car.car_number || "-"}`,
            `${driver.driver_fname || ""} ${driver.driver_lname || ""}`,
          ].map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Driver</Text>
          <View style={styles.driver}>
            {/* {driverImageUrl && <Image source={{ uri: driverImageUrl }} style={styles.avatar} />} */}
            <View>
              <Text
                style={[
                  styles.cardText,
                  { color: textColor, fontWeight: "bold" },
                ]}>
                {driver.driver_fname} {driver.driver_lname}
              </Text>
              <Text style={[styles.cardText, { color: textColor }]}>
                Born: {driver.driver_DOB}
              </Text>
              <Text style={[styles.cardText, { color: textColor }]}>
                Hometown: {driver.driver_home_town}
              </Text>
              <Text style={[styles.cardText, { color: textColor }]}>
                Residence: {driver.driver_residence}
              </Text>
            </View>
          </View>
          <Text style={[styles.cardText, { color: textColor, marginTop: 8 }]}>
            {driver.driver_bio}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            {driver.driver_merch_link && (
              <TouchableOpacity
                style={[
                  styles.linkButton,
                  { backgroundColor: Colors[colorScheme].tint },
                ]}
                onPress={() => Linking.openURL(driver.driver_merch_link)}>
                <Text style={{ color: Colors[colorScheme].textOnGreen }}>
                  Merch
                </Text>
              </TouchableOpacity>
            )}
            {driver.driver_website_link && (
              <TouchableOpacity
                style={[
                  styles.linkButton,
                  { backgroundColor: Colors[colorScheme].tint, marginLeft: 8 },
                ]}
                onPress={() => Linking.openURL(driver.driver_website_link)}>
                <Text style={{ color: Colors[colorScheme].textOnGreen }}>
                  Website
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={[styles.description, { color: textColor }]}>
          {car.car_description}
        </Text>
      </View>
    );
  };

  const keyExtractor = (item: any, index: number) =>
    item?.id?.toString?.() || index.toString();

  return (
    // <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView>
        <BrandLogo style={styles.brand} />
        <Text style={[styles.pageTitle, { color: textColor }]}>
          About Our Cars
        </Text>
        {data.map((driver, idx) => (
          <View key={keyExtractor(driver, idx)} style={{ marginBottom: 20 }}>
            {renderCar({ item: driver, index: idx } as any)}
          </View>
        ))}
      </ScrollView>
    // </SafeAreaView>
  );
};

export default CarScreen;
