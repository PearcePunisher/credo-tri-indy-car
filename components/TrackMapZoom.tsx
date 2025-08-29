import React from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Cast to any to bypass missing children typing in the lib's defs.
const ImageZoomAny: any = ImageZoom;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Map asset (remote). If you later want local: require('@/assets/images/track-map.png')
const MAP = { uri: 'https://timely-actor-10dfb03957.media.strapiapp.com/Nashville_2025_track_map_a394da20cd.png' };

// Expose configurable props if desired later
interface TrackMapZoomProps {
  width?: number;
  height?: number;
  maxScale?: number;
  minScale?: number;
}

export const TrackMapZoom: React.FC<TrackMapZoomProps> = ({
  width = SCREEN_WIDTH - 40, // align with card horizontal padding on track screen
  height = 320,
  maxScale = 6,
  minScale = 1,
}) => {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>      
      <ImageZoomAny
        cropWidth={width}
        cropHeight={height}
        imageWidth={width}
        imageHeight={height}
        minScale={minScale}
        maxScale={maxScale}
        enableCenterFocus
      >
        <Image source={MAP} style={{ width, height, resizeMode: 'contain' }} />
      </ImageZoomAny>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default TrackMapZoom;
