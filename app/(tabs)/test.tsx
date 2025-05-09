import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions
} from 'react-native';

const TeamScreen = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://timely-actor-10dfb03957.strapiapp.com/api/drivers?populate=*")
      .then((res) => res.json())
      .then((json) => setDrivers(json.data))
      .catch((err) => console.error("Failed to fetch drivers:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" style={{ flex: 1 }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>The Team</Text>
      {drivers.map((driver) => {
        const fullName = `${driver.driver_fname} ${driver.driver_lname}`;
        const flagUrl = `https://flagcdn.com/${driver.driver_country_origin?.toLowerCase()}.png`;
        const profileImage = driver.driver_image?.formats?.medium?.url || driver.driver_image?.url;
        const socialLinks = driver.driver_social_medias || [];
        const carImage = driver.car?.car_image?.url || 'https://placehold.co/300x100?text=Car+Image';

        return (
          <View key={driver.id} style={styles.card}>
            <Image source={{ uri: profileImage }} style={styles.driverImage} />

            <View style={styles.cardInner}>
              <View style={styles.driverHeader}>
                <Text style={styles.driverName}>{fullName}</Text>
                <Image source={{ uri: flagUrl }} style={styles.flag} />
              </View>

              <Text style={styles.bio}>{driver.driver_bio}</Text>

              <View style={styles.socialRow}>
                {socialLinks.map((s, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => Linking.openURL(`https://${s.driver_social_length}`)}
                  >
                    <Text style={styles.socialText}>{s.social_platform}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Image source={{ uri: carImage }} style={styles.carImage} resizeMode="contain" />

              <Text style={styles.subHeader}>Achievements</Text>
              <Text style={styles.achievement}>Coming soon…</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C0F',
    padding: 16,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#01257D',
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  driverImage: {
    width: '100%',
    height: 280,
  },
  cardInner: {
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flag: {
    width: 32,
    height: 20,
    borderRadius: 2,
  },
  bio: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  socialText: {
    color: '#fff',
    fontSize: 13,
    marginRight: 12,
    textDecorationLine: 'underline',
  },
  carImage: {
    width: '100%',
    height: 80,
    marginTop: 10,
  },
  subHeader: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  achievement: {
    color: '#fff',
    fontSize: 13,
  },
});

export default TeamScreen;
