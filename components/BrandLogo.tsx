import React from "react";
import { Image, StyleSheet, View, ImageStyle, useColorScheme } from "react-native";

type BrandLogoProps = {
  width?: number;
  height?: number;
  style?: ImageStyle;
};

const LOGO_DARK =
  "https://timely-actor-10dfb03957.media.strapiapp.com/Team_Penske_Dark_065c23a38d.png";
const LOGO_LIGHT =
  "https://timely-actor-10dfb03957.media.strapiapp.com/Team_Penske_Light_50c419f34d.png";

export default function BrandLogo({
  width = 250,
  height = 120,
  style,
}: BrandLogoProps) {
  const colorScheme = useColorScheme();
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
  },
});
