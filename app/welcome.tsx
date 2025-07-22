import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import BrandLogo from '@/components/BrandLogo';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useFocusEffect } from 'expo-router';

export const options = {
  title: 'Welcome',
  headerBackTitle: 'Back',
};

const WelcomeScreen = () => {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { updateNotificationSubscription, authState, completeOnboarding } = useAuth();
  const router = useRouter();

  const [subscribed, setSubscribed] = useState(false);
  const [videoError, setVideoError] = useState(false);
  
  // Screen dimensions for video sizing
  const { width: screenWidth } = Dimensions.get('window');
  const videoHeight = (screenWidth * 9) / 16; // 16:9 aspect ratio

  // Initialize video player with local video source
  const videoSource: VideoSource = Platform.select({
    ios: require('@/assets/videos/justin-bell-cedo-motorsport-intro.mp4'),
    android: require('@/assets/videos/justin-bell-cedo-motorsport-intro.mp4'),
  }) as VideoSource;

  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.muted = false;
    player.play(); // Autoplay the video
  });

  // Add video event listeners
  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      console.log('Video status changed:', status);
      if (status.status === 'error') {
        console.log('Video playback error');
        setVideoError(true);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [player]);

  // Cleanup video player on unmount
  useEffect(() => {
    return () => {
      try {
        player.release();
      } catch (error) {
        console.log('Video player cleanup error:', error);
      }
    };
  }, [player]);

  // Handle video play/pause based on screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - resume video if it was paused
      if (player && !videoError) {
        try {
          player.play();
          console.log('Video resumed on screen focus');
        } catch (error) {
          console.log('Error resuming video:', error);
        }
      }

      return () => {
        // Screen is losing focus - pause video
        if (player && !videoError) {
          try {
            player.pause();
            console.log('Video paused on screen blur');
          } catch (error) {
            console.log('Error pausing video:', error);
          }
        }
      };
    }, [player, videoError])
  );

  // Complete onboarding when welcome page loads (if not already completed)
  useEffect(() => {
    const completeOnboardingProcess = async () => {
      if (!authState.hasCompletedOnboarding) {
        try {
          console.log('Completing onboarding from welcome page...');
          await completeOnboarding();
          console.log('Onboarding completed successfully');
        } catch (error) {
          console.error('Error completing onboarding:', error);
        }
      }
    };

    completeOnboardingProcess();
  }, [authState.hasCompletedOnboarding, completeOnboarding]);

  const bulletItems = [
    'Event Schedule',
    'How to get to the track and our suite',
    'Information about the team, our drivers, and our car',
    'Dress Code',
    'Bag Policy',
  ];

  const handleSubscribe = async () => {
    try {
      const existing = await Notifications.getPermissionsAsync();

      if (existing.status === 'granted') {
        setSubscribed(true);
        await updateNotificationSubscription(true);
        Alert.alert('Already Subscribed', 'You are already subscribed to notifications.', [
          { text: 'Continue', onPress: () => router.push('/(tabs)') }
        ]);
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        setSubscribed(true);
        
        try {
          // Get push token with fallback for missing project ID
          const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
          if (!projectId) {
            console.warn('⚠️ EXPO_PUBLIC_PROJECT_ID not found, skipping push token registration');
            await updateNotificationSubscription(true);
          } else {
            const pushToken = await Notifications.getExpoPushTokenAsync({
              projectId: projectId,
            });
            await updateNotificationSubscription(true, pushToken.data);
          }
        } catch (tokenError) {
          console.error('❌ Error getting push token:', tokenError);
          // Still update subscription without token
          await updateNotificationSubscription(true);
        }
        
        Alert.alert('Subscribed!', 'You will now receive updates about track experiences and events.', [
          { text: 'Continue', onPress: () => router.push('/(tabs)') }
        ]);
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
    } catch (error) {
      console.error('Error handling notification subscription:', error);
      Alert.alert('Error', 'Failed to set up notifications. You can enable them later in settings.');
    }
  };

  const handleSkipNotifications = () => {
    Alert.alert(
      'Skip Notifications?',
      'You may miss out on important track experiences, exclusive content, and event updates. Are you sure you want to skip?',
      [
        { text: 'Yes, Skip', onPress: () => router.push('/(tabs)'), style: 'destructive' },
        { text: 'Enable Notifications', onPress: handleSubscribe }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />

        {/* Embedded Video */}
        <View style={[styles.videoContainer, { width: screenWidth - 40 }]}>
          {!videoError ? (
            <VideoView
              style={[styles.video, { height: videoHeight }]}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
          ) : (
            <View style={[styles.videoPlaceholder, { height: videoHeight }]}>
              <Text style={[styles.videoErrorText, { color: colors.secondaryText }]}>
                Video unavailable
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Welcome</Text>

        {/* Intro Paragraphs */}
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Welcome to our Indy Car Team Event Portal. We welcome you to the Acura Grand Prix of Long Beach.
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

        {/* Notification Box */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <BrandLogo style={styles.cardLogo} />
          <Text style={[styles.cardText, { color: colors.text }]}>
            We would like to send you notifications for your personal schedule and other relevant updates. Please subscribe below, you can unsubscribe at any time.
          </Text>
          <TouchableOpacity
            style={[
              styles.subscribeBtn,
              { backgroundColor: subscribed ? colors.secondaryText : colors.tint },
            ]}
            onPress={handleSubscribe}
            disabled={subscribed}
          >
            <Text
              style={[
                styles.subscribeBtnText,
                { color: subscribed ? 'white' : 'black' },
              ]}
            >
              {subscribed ? '✅ Subscribed' : 'Subscribe to Notifications'}
            </Text>
          </TouchableOpacity>
          
          {!subscribed && (
            <TouchableOpacity
              style={[styles.skipBtn, { borderColor: colors.border }]}
              onPress={handleSkipNotifications}
            >
              <Text style={[styles.skipBtnText, { color: colors.secondaryText }]}>
                Skip for now
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  brand: { width: 250, height: 120, alignSelf: 'center', marginBottom: 20, objectFit: 'contain' },
  videoContainer: {
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoErrorText: {
    fontSize: 16,
    fontWeight: '500',
  },
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
    backgroundColor: '#FF3B30', // fallback, will be overridden by inline style
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
  },
  subscribeBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  skipBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 12,
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
