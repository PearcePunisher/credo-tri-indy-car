import React from "react";
import { Image, StyleSheet, View, ImageStyle, useColorScheme } from "react-native";

type BrandLogoProps = {
  width?: number;
  height?: number;
  style?: ImageStyle;
};

const LOGO_DARK =
  "https://www.juncoshollinger.com/wp-content/themes/juncoshollinger/assets/images/logo.png";
const LOGO_LIGHT =
  "https://upload.wikimedia.org/wikipedia/en/9/9b/2023_Juncos_Hollinger_Racing_Logo.png";

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
