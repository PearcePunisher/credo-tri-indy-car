import React, { ReactElement, isValidElement, cloneElement } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageSourcePropType,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import type { SvgProps } from "react-native-svg";

type VIPTileProps = {
  icon?: string;
  iconSource?: ImageSourcePropType;
  iconComponent?: ReactElement<SvgProps>;
  iconColor?: string;
  label: string;
  onPress: () => void;
};

export default function VIPTile({
  icon,
  iconSource,
  iconComponent,
  iconColor,
  label,
  onPress,
}: VIPTileProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
  const fillColor = iconColor || (isDarkMode ? Colors.dark.text : Colors.light.text);

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        {
          backgroundColor: isDarkMode
            ? Colors.dark.background
            : Colors.light.background,
        },
      ]}
      onPress={onPress}
    >
      {iconComponent && isValidElement(iconComponent) ? (
        <View style={styles.iconWrapper}>
          {cloneElement(iconComponent, {
            width: 40,
            height: 40,
            fill: fillColor,
          })}
        </View>
      ) : iconSource ? (
        <Image
          source={iconSource}
          style={styles.iconImage}
          resizeMode="contain"
        />
      ) : icon ? (
        <Ionicons
          name={icon as any}
          size={40}
          color={fillColor}
        />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: fillColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: "45%",
    aspectRatio: 1,
    borderRadius: 12,
    padding: 10,
    margin: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    width: 40,
    height: 40,
    marginBottom: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  iconImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  label: {
    marginTop: 8,
    textAlign: "center",
  },
});
