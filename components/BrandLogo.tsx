import React from "react";
import { Image, StyleSheet, View, ImageStyle } from "react-native";

type BrandLogoProps = {
  width?: number;
  height?: number;
  style?: ImageStyle;
};

const LOGO_URI =
  "https://www.juncoshollinger.com/wp-content/themes/juncoshollinger/assets/images/logo.png";

export default function BrandLogo({
  width = 250,
  height = 120,
  style,
}: BrandLogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: LOGO_URI }}
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
