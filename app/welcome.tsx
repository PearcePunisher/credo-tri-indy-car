import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';

export const options = {
  title: 'Welcome',
  headerBackTitle: 'Back',
};

const WelcomeScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bgColor = isDark ? '#111' : '#f9f9f9';
  const cardColor = isDark ? '#1c1c1e' : '#ededed';
  const textColor = isDark ? '#fff' : '#000';

  const [subscribed, setSubscribed] = useState(false);

  const bulletItems = [
    'Event Schedule',
    'How to get to the track and our suite',
    'Information about the team, our drivers, and our car',
    'Dress Code',
    'Bag Policy',
  ];

  const handleSubscribe = async () => {
    const existing = await Notifications.getPermissionsAsync();

    if (existing.status === 'granted') {
      setSubscribed(true);
      Alert.alert('Already Subscribed', 'You are already subscribed to notifications.');
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();

    if (status === 'granted') {
      setSubscribed(true);
      Alert.alert('Subscribed!', 'You will now receive updates.');
    } else {
      Alert.alert(
        'Enable Notifications',
        'Notifications are currently disabled. To enable them, go to your system settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <Image
          source={{ uri: 'https://timely-actor-10dfb03957.media.strapiapp.com/Motorsports_Logo_1_f5dd153fb8.png' }}
          style={styles.brand}
        />

        {/* Title */}
        <Text style={[styles.title, { color: textColor }]}>Welcome</Text>

        {/* Intro Paragraphs */}
        <Text style={[styles.paragraph, { color: textColor }]}>
          Welcome to our Indy Car Team Event Portal. We welcome you to the Acura Grand Prix of Long Beach.
        </Text>
        <Text style={[styles.paragraph, { color: textColor }]}>
          We look forward to hosting you and making your experience the absolute best it can be. Before heading to the track, we wanted to ensure all the vital information needed to help you make the most out of your experience.
        </Text>

        {/* Subheading */}
        <Text style={[styles.subheading, { color: textColor }]}>Here, you will find:</Text>

        {/* Bullet list */}
        <View style={styles.bulletList}>
          {bulletItems.map((item, i) => (
            <Text key={i} style={[styles.bullet, { color: textColor }]}>
              • {item}
            </Text>
          ))}
        </View>

        {/* Notification Box */}
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <Image
            source={{ uri: 'https://timely-actor-10dfb03957.media.strapiapp.com/Motorsports_Logo_1_f5dd153fb8.png' }}
            style={styles.cardLogo}
          />
          <Text style={[styles.cardText, { color: textColor }]}>
            We would like to send you notifications for your personal schedule and other relevant updates. Please subscribe below, you can unsubscribe at any time.
          </Text>
          <TouchableOpacity
            style={[
              styles.subscribeBtn,
              subscribed && styles.subscribedBtn,
            ]}
            onPress={handleSubscribe}
            disabled={subscribed}
          >
            <Text style={styles.subscribeBtnText}>
              {subscribed ? 'Subscribed' : 'Subscribe'}
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
  subscribeBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  subscribedBtn: {
    backgroundColor: '#34C759', // iOS green
  },
  subscribeBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default WelcomeScreen;
