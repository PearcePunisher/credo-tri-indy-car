import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Text, Platform, TouchableOpacity } from 'react-native';
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
  const [videoError, setVideoError] = useState<string | null>(null);

  // Video source
  const videoSource: VideoSource = require('@/assets/videos/justin-bell-cedo-motorsport-intro.mp4');
  
  // Create video player with Android-specific configuration
  const player = useVideoPlayer(videoSource, (player) => {
    try {
      player.loop = false;
      
      // Add error handling
      player.addListener('statusChange', (status) => {
        console.log('Video status changed:', status);
        if (status.error) {
          setVideoError(`Video error: ${status.error}`);
          console.error('Video player error:', status.error);
        }
      });

      // Android-specific: Add a small delay before playing
      if (Platform.OS === 'android') {
        setTimeout(() => {
          try {
            if (player && typeof player.play === 'function') {
              player.play();
            }
          } catch (error) {
            console.error('Error starting video on Android:', error);
            setVideoError('Failed to start video on Android');
          }
        }, 500);
      } else {
        try {
          if (player && typeof player.play === 'function') {
            player.play();
          }
        } catch (error) {
          console.error('Error starting video:', error);
          setVideoError('Failed to start video');
        }
      }
    } catch (error) {
      console.error('Error initializing video player:', error);
      setVideoError('Failed to initialize video player');
    }
  });

  // Simplified event handling
  useEffect(() => {
    // Auto-hide loading after platform-specific delay
    const loadingDelay = Platform.OS === 'android' ? 4000 : 2000; // Longer delay on Android
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, loadingDelay);

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
      // Safe cleanup: check if player exists and is still valid
      try {
        if (player && typeof player.pause === 'function') {
          player.pause();
        }
      } catch (error) {
        console.log('Video player already cleaned up:', error);
      }
    };
  }, [player]);

  const handleContinue = async () => {
    console.log('Continue button pressed - iOS:', Platform.OS === 'ios');
    console.log('Starting navigation process...');
    
    try {
      // Safe pause: check if player exists and is still valid
      if (player && typeof player.pause === 'function') {
        console.log('Pausing video player...');
        player.pause();
      }
      
      // Navigate to welcome first, then complete onboarding there
      console.log('Navigating to welcome...');
      router.replace('/welcome');
      console.log('Navigation completed');
      
    } catch (error) {
      console.error('Error in handleContinue:', error);
      console.log('Fallback navigation to welcome...');
      router.replace('/welcome');
    }
  };

  const handleClose = () => {
    try {
      // Safe pause: check if player exists and is still valid
      if (player && typeof player.pause === 'function') {
        player.pause();
      }
    } catch (error) {
      console.log('Video player already cleaned up:', error);
    }
    router.back();
  };

  const togglePlayPause = () => {
    try {
      if (player && typeof player.pause === 'function' && typeof player.play === 'function') {
        if (player.playing) {
          player.pause();
        } else {
          player.play();
        }
      }
    } catch (error) {
      console.error('Error toggling video playback:', error);
      setVideoError('Video player error occurred');
    }
  };

  const handleVideoPress = () => {
    // Only show controls if video is working (no error)
    if (!videoError) {
      setShowControls(!showControls);
      // Hide controls after 3 seconds
      if (!showControls) {
        setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    }
  };

  // Android-specific: Check if video is actually playing
  useEffect(() => {
    if (Platform.OS === 'android') {
      const checkVideoStatus = setInterval(() => {
        try {
          if (player && !videoError) {
            // If we have a player but no video error and it's been loading for too long
            if (isLoading && Date.now() > 10000) { // 10 seconds
              console.log('Video taking too long to load on Android, showing fallback');
            }
          }
        } catch (error) {
          console.log('Error checking video status:', error);
        }
      }, 1000);

      return () => clearInterval(checkVideoStatus);
    }
  }, [player, videoError, isLoading]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color="white" />
      </Pressable>

      {/* Video player */}
      <View style={styles.videoContainer}>
        <Pressable 
          style={styles.videoTouchArea}
          onPress={handleVideoPress}
        >
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            contentFit="contain"
            // Android-specific props for better compatibility
            nativeControls={false}
            // Force hardware acceleration on Android
            {...(Platform.OS === 'android' && {
              surface: 'TextureView', // Better performance on Android
            })}
          />

          {/* Video Error Display */}
          {videoError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Video Error:</Text>
              <Text style={styles.errorDetails}>{videoError}</Text>
              <Pressable 
                style={styles.retryButton}
                onPress={() => {
                  setVideoError(null);
                  setIsLoading(true);
                  try {
                    if (player && typeof player.replay === 'function') {
                      player.replay();
                    } else if (player && typeof player.play === 'function') {
                      player.play();
                    }
                  } catch (error) {
                    console.error('Error retrying video:', error);
                    setVideoError('Failed to restart video');
                  }
                }}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* Loading indicator */}
          {isLoading && !videoError && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Loading...</Text>
              {Platform.OS === 'android' && (
                <Text style={styles.androidNote}>
                  Initializing video on Android...
                </Text>
              )}
              {__DEV__ && (
                <Text style={styles.androidNote}>
                  Debug: Video source loaded, player initializing...
                </Text>
              )}
            </View>
          )}

          {/* Play/Pause button overlay */}
          {!isLoading && showControls && !videoError && player && (
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

          {/* Android Debug Overlay */}
          {__DEV__ && Platform.OS === 'android' && !isLoading && !videoError && (
            <View style={styles.debugOverlay}>
              <Text style={styles.debugText}>
                Status: {player && player.playing ? 'Playing' : 'Paused'}
              </Text>
              <Text style={styles.debugText}>
                Platform: Android
              </Text>
              <Text style={styles.debugText}>
                Player: {player ? 'Available' : 'Not Available'}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Continue button - moved outside video container to prevent touch conflicts */}
      {showContinue && (
        <View style={styles.continueContainer}>
          <TouchableOpacity 
            style={[styles.continueButton, { backgroundColor: colors.tint }]} 
            onPress={handleContinue}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Increase touch area
          >
            <Text style={[styles.continueText, { color: colors.background }]}>
              Continue to Welcome
            </Text>
            <Ionicons name="arrow-forward" size={20} color={colors.background} />
          </TouchableOpacity>
          
          {__DEV__ && Platform.OS === 'ios' && (
            <Text style={styles.debugText}>
              iOS Continue Button - Should be tappable
            </Text>
          )}
        </View>
      )}

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
    // iOS-specific: Ensure video container doesn't block continue button
    ...(Platform.OS === 'ios' && {
      zIndex: 1, // Lower z-index to ensure continue button appears above
    }),
  },
  videoTouchArea: {
    width: '100%',
    height: '100%',
    position: 'relative',
    // iOS-specific: Prevent this from intercepting continue button touches
    ...(Platform.OS === 'ios' && {
      paddingBottom: 120, // Leave space for continue button
    }),
  },
  video: {
    width: '100%',
    height: '100%',
    // Android-specific fixes
    ...(Platform.OS === 'android' && {
      backgroundColor: 'black', // Ensure black background
      borderRadius: 0, // Remove any border radius that might cause issues
    }),
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
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30, // Increased z-index for iOS
    elevation: 10, // Increased elevation for Android
    pointerEvents: 'box-none', // Allow touch events to pass through container but not button
    // iOS-specific fixes
    ...(Platform.OS === 'ios' && {
      zIndex: 50, // Even higher z-index on iOS
      bottom: 100, // Move it higher on iOS to avoid conflicts
    }),
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // iOS-specific touch handling
    ...(Platform.OS === 'ios' && {
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
      zIndex: 100, // Ensure button is on top on iOS
    }),
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
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorDetails: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'white',
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  androidNote: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  debugOverlay: {
    position: 'absolute',
    top: 80,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'yellow',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});
