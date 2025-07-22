import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import BrandLogo from '@/components/BrandLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export const options = {
  title: 'Experience',
  headerBackTitle: 'Back',
};

const ExperienceScreen = () => {
  const [experience, setExperience] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const res = await fetch(
          'https://timely-actor-10dfb03957.strapiapp.com/api/experiences/w8ulpgi0pvn8p46heb7hv9my?populate=*'
        );
        const json = await res.json();
        setExperience(json.data);
      } catch (e) {
        console.error('Error loading experience', e);
      } finally {
        setLoading(false);
      }
    };

    fetchExperience();
  }, []);

  if (loading || !experience) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  const imageUrl = experience.experience_image?.formats?.medium?.url;
  const bullets = experience.experience_description?.[0]?.children || [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Experiences</Text>

        {/* Experience Name */}
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Your “{experience.experience_title}”
        </Text>

        {/* Bullet Points */}
        <View style={{ marginBottom: 20 }}>
          {bullets.map((item: any, i: number) => (
            <Text key={i} style={[styles.bullet, { color: colors.text }]}>
              • {item.children[0].text}
            </Text>
          ))}
        </View>

        {/* Feature Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Pit Stop Challenge</Text>

          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <Text style={[styles.cardDescription, { color: colors.text }]}>
            Step into the adrenaline-fuel world of Indy Car with our team in the Pit Stop
            Challenge. Under the guidance of our professional Pit Stop Team, guests will immerse
            themselves in the action precision of an actual Indy Car stop. You will learn how
            teamwork and seamless communications are crucial in the split-second decisions that
            make or break a race.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  brand: {
    width: 250,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
    objectFit: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'RoobertSemi',
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    fontFamily: 'RoobertMedium',
  },
  bullet: {
    fontSize: 16,
    marginBottom: 8,
    
  },
  card: {
    padding: 16,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'RoobertMedium',
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
});

export default ExperienceScreen;
