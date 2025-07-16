import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Text } from 'react-native';
import { VideoView, useVideoPlayer, VideoSource } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function VideoPlayerScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const { completeOnboarding } = useAuth();
  
  const [showContinue, setShowContinue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);

  // Video source
  const videoSource: VideoSource = require('@/assets/videos/justin-bell-cedo-motorsport-intro.mp4');
  
  // Create video player
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.play();
  });

  // Simplified event handling
  useEffect(() => {
    // Auto-hide loading after 2 seconds
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Auto-show continue button after video duration 
    // TODO: Adjust this timer to match your actual video length
    // Current estimate: 30 seconds + 2 second buffer = 32 seconds
    const continueTimer = setTimeout(() => {
      setShowContinue(true);
    }, 32000); // Adjust this value based on your video's actual duration

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(continueTimer);
    };
  }, []);

  // Cleanup effect to pause video when component unmounts
  useEffect(() => {
    return () => {
      if (player) {
        player.pause();
      }
    };
  }, [player]);

  const handleContinue = async () => {
    try {
      player.pause();
      // Complete onboarding when user finishes video
      await completeOnboarding();
      router.push('/welcome');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.push('/welcome');
    }
  };

  const handleClose = () => {
    player.pause();
    router.back();
  };

  const togglePlayPause = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleVideoPress = () => {
    setShowControls(!showControls);
    // Hide controls after 3 seconds
    if (!showControls) {
      setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="white" />
      </Pressable>

      {/* Video player */}
      <Pressable style={styles.videoContainer} onPress={handleVideoPress}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          contentFit="contain"
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Play/Pause button overlay */}
        {!isLoading && showControls && (
          <View style={styles.playPauseOverlay}>
            {!player.playing && (
              <Pressable style={styles.playButton} onPress={togglePlayPause}>
                <Ionicons name="play" size={40} color="white" />
              </Pressable>
            )}
            {player.playing && (
              <Pressable style={styles.playButton} onPress={togglePlayPause}>
                <Ionicons name="pause" size={40} color="white" />
              </Pressable>
            )}
          </View>
        )}

        {/* Continue button */}
        {showContinue && (
          <View style={styles.continueContainer}>
            <Pressable 
              style={[styles.continueButton, { backgroundColor: colors.tint }]} 
              onPress={handleContinue}
            >
              <Text style={[styles.continueText, { color: colors.background }]}>
                Continue to Welcome
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.background} />
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Simple progress indicator */}
      {!isLoading && (
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>
            Tap video to show/hide controls
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoContainer: {
    width: screenWidth,
    height: screenHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
  },
  playPauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeText: {
    color: 'white',
    fontSize: 12,
  },
});
