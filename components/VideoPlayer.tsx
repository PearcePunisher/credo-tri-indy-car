import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, View, Dimensions, Platform, TouchableOpacity, Text } from 'react-native';
import { useEvent } from 'expo';
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface VideoPlayerProps {
  videoUri: string;
  aspectRatio?: number; // width/height ratio, defaults to 16:9
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  style?: any;
  fullWidth?: boolean; // If true, uses full screen width regardless of parent padding
  showPlayButton?: boolean; // Show play/pause overlay button
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  stop: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ 
  videoUri, 
  aspectRatio = 16/9, 
  autoPlay = true, 
  loop = true, 
  muted = false,
  fullWidth = false, // Changed default to false to respect parent margins
  showPlayButton = true, // Show play/pause overlay by default
  style
}, ref) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const [showControls, setShowControls] = useState(true);

  const screenWidth = Dimensions.get('window').width;
  const videoWidth = fullWidth ? screenWidth : '100%';
  const videoHeight = fullWidth ? screenWidth / aspectRatio : undefined;

  const player = useVideoPlayer(videoUri, player => {
    player.loop = loop;
    player.muted = muted;
    
    // iOS-specific settings for stability
    if (Platform.OS === 'ios') {
      player.audioMixingMode = 'mixWithOthers';
      player.staysActiveInBackground = false;
    }
  });

  // Track playing state
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  // Handle autoplay after player is ready
  useEffect(() => {
    if (autoPlay) {
      // Small delay to ensure player is ready
      const timer = setTimeout(() => {
        player.play();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, player]);

  // Auto-hide controls after a delay when video is playing
  useEffect(() => {
    if (isPlaying && showPlayButton) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    } else {
      setShowControls(true);
    }
  }, [isPlaying, showPlayButton]);

  const togglePlayPause = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setShowControls(true); // Show controls when user interacts
  };

  const handleVideoPress = () => {
    if (!showPlayButton) return; // If overlay is disabled, don't handle press
    togglePlayPause();
  };

  // Expose player controls via ref
  useImperativeHandle(ref, () => ({
    play: () => player.play(),
    pause: () => player.pause(),
    stop: () => {
      player.pause();
      // Optionally seek to beginning
      // player.currentTime = 0;
    }
  }), [player]);

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.videoContainer} 
        onPress={handleVideoPress}
        activeOpacity={1}
      >
        <VideoView 
          style={[
            styles.video,
            fullWidth ? {
              width: videoWidth,
              height: videoHeight,
            } : {
              width: '100%',
              aspectRatio: aspectRatio,
            }
          ]} 
          player={player} 
          allowsFullscreen={true}
          allowsPictureInPicture={true}
          nativeControls={true} // Disable native controls to use our overlay
          contentFit="contain" // Changed from "cover" to "contain" to prevent cutoff
          showsTimecodes={false}
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
  },
  video: {
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  playButtonText: {
    fontSize: 24,
    color: 'white',
  },
});
