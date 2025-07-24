import React, { useState, useEffect, useRef } from 'react';
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
import ENV_CONFIG from '@/constants/Environment';
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
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [showStaticContent, setShowStaticContent] = useState(false);
  
  // Screen dimensions for video sizing
  const { width: screenWidth } = Dimensions.get('window');
  const videoHeight = (screenWidth * 16) / 9; // 16:9 aspect ratio

  // Initialize video player with better iOS compatibility
  const [currentVideoSource, setCurrentVideoSource] = useState<VideoSource | null>(null);
  const [hasTriedAlternative, setHasTriedAlternative] = useState(false);
  const [playerKey, setPlayerKey] = useState(0); // Key to force player recreation
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug logging for static content state
  useEffect(() => {
    console.log(`📊 showStaticContent changed to: ${showStaticContent}`);
  }, [showStaticContent]);

  // Initialize video source
  useEffect(() => {
    const loadVideoSource = async () => {
      try {
        // Using the working Justin Bell intro video
        const primarySource = Platform.select({
          ios: require('@/assets/videos/Justin Bell CEDO Motorsport intro.mp4'),
          android: require('@/assets/videos/Justin Bell CEDO Motorsport intro.mp4'),
          default: require('@/assets/videos/Justin Bell CEDO Motorsport intro.mp4'),
        }) as VideoSource;
        setCurrentVideoSource(primarySource);
        console.log('📹 Primary video source loaded (Justin Bell CEDO Motorsport intro.mp4) - Working Justin Bell video');
        console.log('📹 Platform-specific source for:', Platform.OS);
      } catch (error) {
        console.error('❌ Error loading primary video source:', error);
        console.log('📹 Falling back to static content due to source loading error');
        setShowStaticContent(true);
      }
    };

    loadVideoSource();
  }, []);

  const player = useVideoPlayer(currentVideoSource, (player) => {
    if (!player || !currentVideoSource) return;
    
    player.loop = false;
    player.muted = true; // Start muted to avoid iOS autoplay restrictions
    player.playbackRate = 1.0;
    console.log('📹 Video player initialized with key:', playerKey);
    // Don't autoplay immediately - let component mount first
  });

  // Add video event listeners
  useEffect(() => {
    if (!player || !currentVideoSource) return;

    const subscription = player.addListener('statusChange', (status) => {
      console.log('📹 Video status changed:', status);
      console.log('📹 Platform:', Platform.OS);
      
      if (status.status === 'error') {
        console.error('❌ Video playback error:', status.error);
        console.error('❌ Error details:', JSON.stringify(status, null, 2));
        
        // Check for specific iOS codec/format errors
        const errorMessage = status.error?.message || '';
        const isCodecError = errorMessage.includes('Failed to load the player item') || 
                           errorMessage.includes('unknown cause') ||
                           errorMessage.includes('codec') ||
                           errorMessage.includes('format');
        
        console.log(`🔍 Error analysis - Message: "${errorMessage}", isCodecError: ${isCodecError}, Platform: ${Platform.OS}`);
        
        if (Platform.OS === 'ios' && isCodecError) {
          console.log('🚨 Detected iOS codec/format error, switching to static content immediately...');
          
          // Clear any pending video play timeouts
          if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
            playTimeoutRef.current = null;
            console.log('⏰ Cleared pending video play timeout');
          }
          
          setShowStaticContent(true);
          setVideoError(false); // Don't show error UI, show static content instead
          setIsVideoReady(false);
          setHasTriedAlternative(true); // Mark as tried to prevent retry loops
          
          // Stop the video player to prevent background playback attempts
          try {
            if (player) {
              player.pause();
              console.log('⏹️ Video player paused due to codec error');
            }
          } catch (pauseError) {
            console.log('Video pause error (expected):', pauseError);
          }
          
          return;
        }
        
        // For other errors, show error state with retry option
        console.log('❌ Non-codec video error occurred');
        setVideoError(true);
        setIsVideoReady(false);
      } else if (status.status === 'readyToPlay') {
        console.log('✅ Video ready to play');
        setIsVideoReady(true);
        setVideoError(false);
        // Start playing once ready (but not if showing static content)
        try {
          // Clear any existing timeout
          if (playTimeoutRef.current) {
            clearTimeout(playTimeoutRef.current);
          }
          
          playTimeoutRef.current = setTimeout(() => {
            // Double-check the current state before playing
            if (player && !videoError && currentVideoSource && !showStaticContent) {
              console.log('🎬 Attempting to start video playback...');
              player.play();
              console.log('▶️ Video playback started');
            } else {
              console.log('Skipping auto-play: showStaticContent =', showStaticContent, 'videoError =', videoError);
            }
            playTimeoutRef.current = null; // Clear the ref
          }, Platform.OS === 'ios' ? 500 : 100); // Longer delay for iOS
        } catch (error) {
          console.error('❌ Error starting video playback:', error);
          setVideoError(true);
        }
      } else if (status.status === 'loading') {
        console.log('⏳ Video loading...');
      } else if (status.status === 'idle') {
        console.log('⏸️ Video idle');
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [player, videoError, currentVideoSource, hasTriedAlternative, showStaticContent]);

  // Cleanup video player on unmount
  useEffect(() => {
    return () => {
      try {
        // Clear any pending timeout
        if (playTimeoutRef.current) {
          clearTimeout(playTimeoutRef.current);
          playTimeoutRef.current = null;
        }
        player.release();
      } catch (error) {
        console.log('Video player cleanup error:', error);
      }
    };
  }, [player]);

  // Handle video play/pause based on screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Screen is focused - resume video if it was paused (but not if showing static content)
      if (player && !videoError && !showStaticContent && currentVideoSource) {
        try {
          // Add a small delay to ensure the screen is fully focused
          setTimeout(() => {
            if (player && !videoError && !showStaticContent && currentVideoSource) {
              player.play();
              console.log('Video resumed on screen focus');
            } else {
              console.log('Skipping video resume: showStaticContent =', showStaticContent);
            }
          }, 100);
        } catch (error) {
          console.log('Error resuming video:', error);
          setVideoError(true);
        }
      } else {
        console.log('Video resume conditions not met: showStaticContent =', showStaticContent, 'videoError =', videoError);
      }

      return () => {
        // Screen is losing focus - pause video (but not if showing static content)
        if (player && !videoError && !showStaticContent && currentVideoSource) {
          try {
            player.pause();
            console.log('Video paused on screen blur');
          } catch (error) {
            console.log('Error pausing video:', error);
          }
        }
      };
    }, [player, videoError, showStaticContent, currentVideoSource])
  );

  // Complete onboarding when welcome page loads (if not already completed)
  // REMOVED: We now wait for user to make notification choice before completing onboarding
  // useEffect(() => {
  //   const completeOnboardingProcess = async () => {
  //     if (!authState.hasCompletedOnboarding) {
  //       try {
  //         console.log('Completing onboarding from welcome page...');
  //         await completeOnboarding();
  //         console.log('Onboarding completed successfully');
  //       } catch (error) {
  //         console.error('Error completing onboarding:', error);
  //       }
  //     }
  //   };

  //   completeOnboardingProcess();
  // }, [authState.hasCompletedOnboarding, completeOnboarding]);

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
          { 
            text: 'Continue', 
            onPress: async () => {
              await completeOnboarding();
              router.push('/(tabs)');
            }
          }
        ]);
        return;
      }

      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        setSubscribed(true);
        
        try {
          // Get push token with fallback for missing project ID
          const projectId = ENV_CONFIG.PROJECT_ID;
          if (!projectId) {
            console.warn('⚠️ PROJECT_ID not found, skipping push token registration');
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
          { 
            text: 'Continue', 
            onPress: async () => {
              await completeOnboarding();
              router.push('/(tabs)');
            }
          }
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
        { 
          text: 'Yes, Skip', 
          onPress: async () => {
            await completeOnboarding();
            router.push('/(tabs)');
          }, 
          style: 'destructive' 
        },
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
          {!videoError && !showStaticContent && currentVideoSource ? (
            <VideoView
              key={`video-player-${playerKey}`} // Force recreation when playerKey changes
              style={[styles.video, { height: videoHeight }]}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={Platform.OS === 'ios'} // Enable native controls on iOS for debugging
              contentFit="contain"
              showsTimecodes={false}
            />
          ) : showStaticContent ? (
            <View style={[styles.videoPlaceholder, { height: videoHeight }]}>
              <BrandLogo 
                width={200}
                height={100}
                style={{ marginBottom: 20 }}
              />
              <Text style={[styles.videoErrorText, { color: colors.text }]}>
                Welcome to the Experience
              </Text>
            </View>
          ) : (
            <View style={[styles.videoPlaceholder, { height: videoHeight }]}>
              <Text style={[styles.videoErrorText, { color: colors.secondaryText }]}>
                Video unavailable {Platform.OS === 'ios' ? '(iOS)' : '(Android)'}
              </Text>
              <Text style={[{ color: colors.secondaryText, fontSize: 12, marginTop: 5 }]}>
                Check console for error details
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  console.log('🔄 User requested video retry');
                  setVideoError(false);
                  setIsVideoReady(false);
                  
                  // Since we don't have alternative video, just try to recreate the player
                  console.log('� Recreating video player...');
                  try {
                    const originalSource = Platform.select({
                      ios: require('@/assets/videos/Justin Bell CEDO Motorsport intro.mp4'),
                      android: require('@/assets/videos/Justin Bell CEDO Motorsport intro.mp4'),
                      default: require('@/assets/videos/Justin Bell CEDO Motorsport intro.mp4'),
                    }) as VideoSource;
                    
                    // Force complete player recreation
                    setPlayerKey(prev => prev + 1);
                    setCurrentVideoSource(originalSource);
                    setHasTriedAlternative(false);
                  } catch (origError) {
                    console.error('❌ Video source failed on retry:', origError);
                    console.log('📹 Showing static content as final fallback');
                    setShowStaticContent(true);
                    setVideoError(false);
                  }
                }}
                style={{ 
                  marginTop: 10, 
                  padding: 8, 
                  backgroundColor: colors.tint, 
                  borderRadius: 6 
                }}>
                <Text style={{ color: 'white', fontSize: 14 }}>
                  🔄 Retry Video
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  console.log('👤 User chose to skip video');
                  setShowStaticContent(true);
                  setVideoError(false);
                }}
                style={{ 
                  marginTop: 10, 
                  padding: 8, 
                  backgroundColor: colors.secondaryText, 
                  borderRadius: 6 
                }}>
                <Text style={{ color: 'white', fontSize: 14 }}>
                  ⏭️ Skip Video
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>        {/* Title */}
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
