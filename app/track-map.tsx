import React from 'react';
import { SafeAreaView, Dimensions, Image, StyleSheet } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
// The library's TypeScript definitions in this project don't include the children
// slot we use (the <Image/>). Cast to any so we can use the runtime component
// without changing package types.
const ImageZoomAny: any = ImageZoom;
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

// Use either a local asset or a hosted URL. Example local:
// const MAP = require('@/assets/images/track-map.png');
const MAP = { uri: 'https://timely-actor-10dfb03957.media.strapiapp.com/Nashville_2025_track_map_a394da20cd.png' };

export default function TrackMapScreen() {
  const { colorScheme } = useColorScheme();
  const bg = Colors[colorScheme].background;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <ImageZoomAny
        cropWidth={width}
        cropHeight={height}
        imageWidth={width}
        imageHeight={height}
        minScale={1}
        maxScale={6}
        enableCenterFocus={true}
      >
        <Image source={MAP} style={{ width, height, resizeMode: 'contain' }} />
      </ImageZoomAny>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});