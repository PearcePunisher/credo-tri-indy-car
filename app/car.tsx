import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CarScreen = () => {
  const [car, setCar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  const textColor = isDark ? 'white' : 'black';
  const bgColor = isDark ? '#111' : '#f8f8f8';
  const cardColor = isDark ? '#1c1c1e' : '#f0f0f0';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          'https://timely-actor-10dfb03957.strapiapp.com/api/cars/k26n28fx8yqwxwgrwqv77c3l?populate=*'
        );
        const json = await res.json();
        setCar(json.data);
      } catch (err) {
        console.error('Failed to load car data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !car) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const renderSection = (title: string, items: any[], key: string) => (
    <View style={[styles.card, { backgroundColor: cardColor }]} key={key}>
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      {items.map((item, index) => (
        <Text key={index} style={[styles.cardText, { color: textColor }]}>
          • {item[key]}
        </Text>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.pageTitle, { color: textColor }]}>The Car</Text>

        {/* Car image */}
        <Image
          source={{ uri: 'https://timely-actor-10dfb03957.media.strapiapp.com/May_6_2025_02_45_47_PM_24f5bf18b5.png' }}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={[styles.subtitle, { color: textColor }]}>
          A very very cool race car
        </Text>

        {/* Tags (mocked) */}
        <View style={styles.tags}>
          {['Base Info', 'Team Entry 1970', 'Team Chief John Doe'].map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Drivers (hardcoded for now) */}
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Drivers</Text>
          <View style={styles.driver}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
              style={styles.avatar}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.cardText, { color: textColor }]}>Riley Pearce</Text>
              <Text style={[styles.cardText, { color: textColor }]}>12 – Mercedes</Text>
            </View>
            <Text style={{ marginLeft: 'auto' }}>🇺🇸</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: textColor }]}>
          {car.car_description}
        </Text>

        {/* Sections */}
        {renderSection('Chassis', car.car_chassis, 'car_chasis_detail')}
        {renderSection('Construction', car.car_construction, 'car_construction_detail')}
        {renderSection('Other Specs', car.car_other_spec, 'car_other_spec_detail')}
        {renderSection('Materials', car.car_material, 'car_material_detail')}
      </ScrollView>
    </SafeAreaView>
  );
};

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
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#ddd',
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
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  driver: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

export default CarScreen;
