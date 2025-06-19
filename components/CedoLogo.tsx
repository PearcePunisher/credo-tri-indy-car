import React from "react";
import { Image, StyleSheet, View, ImageStyle, useColorScheme } from "react-native";

type CedoLogoProps = {
  width?: number;
  height?: number;
  style?: ImageStyle;
};

const LOGO_DARK = require("../assets/images/cedoAppsGray.png");
const LOGO_LIGHT = require("../assets/images/cedoAppsGray.png");

export default function CedoLogo({
  width = 250,
  height = 120,
  style,
}: CedoLogoProps) {
  const colorScheme = useColorScheme();
  const logoSource = colorScheme === "light" ? LOGO_LIGHT : LOGO_DARK;

  return (
    <View style={styles.container}>
      <Image
        source={logoSource}
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
