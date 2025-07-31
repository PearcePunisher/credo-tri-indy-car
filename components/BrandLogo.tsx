import React from "react";
import { Image, StyleSheet, View, ImageStyle } from "react-native";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type BrandLogoProps = {
  width?: number;
  height?: number;
  style?: ImageStyle;
};

const LOGO_DARK =
  "https://harmonious-wealth-6294946a0c.media.strapiapp.com/denver_broncos_logo_transparent_d12ff67de8.png";
const LOGO_LIGHT =
  "https://harmonious-wealth-6294946a0c.media.strapiapp.com/denver_broncos_logo_transparent_d12ff67de8.png";

export default function BrandLogo({
  width = 250,
  height = 120,
  style,
}: BrandLogoProps) {
  
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const logoUri = colorScheme === "light" ? LOGO_LIGHT : LOGO_DARK;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: logoUri }}
        style={[styles.logo, { width, height }, style]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    alignSelf: "center",
  },
});
