import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Small preloader to cache key images and show a subtle fade overlay with a logo
// Fires onReady when assets have been prefetched

type Props = {
  onReady?: () => void;
};

const assetsToCache = [
  require('../assets/images/icon.png'),
  require('../assets/images/splash-icon.png'),
  require('../assets/images/JHR-Dark-Logo.png'),
  require('../assets/images/JHR-Light-Logo.png'),
  require('../assets/images/cedoAppsGray.png'),
];

export default function AppPreloader({ onReady }: Props) {
  const [done, setDone] = useState(false);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let mounted = true;

    const cacheImages = async () => {
      try {
        // Keep splash visible until we're done
        await SplashScreen.preventAutoHideAsync();
        const tasks = assetsToCache.map((asset) => Image.prefetch(Image.resolveAssetSource(asset as any).uri));
        // Fallback to resolve asset if prefetch URI missing
        await Promise.all(tasks);
      } catch (e) {
        console.log('Preloader: asset cache skipped or failed', e);
      } finally {
        if (!mounted) return;
        setDone(true);
        onReady?.();
        // fade out overlay
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    };

    cacheImages();
    return () => {
      mounted = false;
    };
  }, [onReady, opacity]);

  if (!done) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.overlay, { opacity }]} />
        <View style={styles.center}>
          <Image source={require('../assets/images/splash-icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
      </View>
    );
  }
  // After fade completes, render nothing
  return null;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    opacity: 0.9,
  },
});
