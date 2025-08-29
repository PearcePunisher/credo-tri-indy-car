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
  "https://timely-actor-10dfb03957.media.strapiapp.com/nashville_logo_2025_150x220_alternate_27dd7be061.png";
const LOGO_LIGHT =
  "https://timely-actor-10dfb03957.media.strapiapp.com/Nashville2025_BB_V2_996293212d.png";

export default function BrandLogo({
  width = 180,
  height = 180,
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
    marginBottom: 20,
  },
  logo: {
    alignSelf: "center",
    aspectRatio: 2,
  },
});
