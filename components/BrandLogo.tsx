import React from "react";
import { Image, StyleSheet, View, ImageStyle, useColorScheme } from "react-native";

type BrandLogoProps = {
  width?: number;
  height?: number;
  style?: ImageStyle;
};

const LOGO_DARK =
  "https://timely-actor-10dfb03957.media.strapiapp.com/JHR_Dark_Logo_f3a9db6483.png";
const LOGO_LIGHT =
  "https://timely-actor-10dfb03957.media.strapiapp.com/JHR_Light_Logo_640461bc89.png";

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
