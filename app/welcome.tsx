import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import BrandLogo from '@/components/BrandLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';

export const options = {
  title: 'Welcome',
  headerBackTitle: 'Back',
};

const WelcomeScreen = () => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const { completeOnboarding } = useAuth();
  const router = useRouter();

  const bulletItems = [
    'Event Schedule',
    'How to get to the track and our suite',
    'Information about the team, our drivers, and our car',
    'Dress Code',
    'Bag Policy',
  ];

  const handleContinue = async () => {
    await completeOnboarding();
    router.push('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>

        {/* Intro Paragraphs */}
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Welcome to the Juncos Team event application. We welcome you to the Java House Grand Prix of Monterey at the Weather Tech Laguna Seca Raceway.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We look forward to hosting you and making your experience the absolute best it can be. Before heading to the track, we wanted to ensure all the vital information needed to help you make the most out of your experience.
        </Text>

        {/* Subheading */}
        <Text style={[styles.subheading, { color: colors.text }]}>Here, you will find:</Text>

        {/* Bullet list */}
        <View style={styles.bulletList}>
          {bulletItems.map((item, i) => (
            <Text key={i} style={[styles.bullet, { color: colors.text }]}>
              • {item}
            </Text>
          ))}
        </View>

        {/* Continue Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <BrandLogo style={styles.cardLogo} />
          <Text style={[styles.cardText, { color: colors.text }]}>
            Ready to explore your race weekend experience? You can customize notification preferences later in your account settings.
          </Text>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: colors.tint }]}
            onPress={handleContinue}
          >
            <Text style={[styles.continueBtnText, { color: 'white' }]}>
              Continue to App
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  brand: { width: 250, height: 120, alignSelf: 'center', marginBottom: 20, objectFit: 'contain' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 16 },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  subheading: { fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  bulletList: { marginBottom: 24 },
  bullet: { fontSize: 15, marginBottom: 8 },
  card: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cardLogo: { width: 250, height: 120, marginBottom: 12, objectFit: 'contain' },
  cardText: { fontSize: 14, textAlign: 'center', marginBottom: 12 },
  continueBtn: {
    backgroundColor: '#FF3B30', // fallback, will be overridden by inline style
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  continueBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WelcomeScreen;
