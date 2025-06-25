import { Tabs } from "expo-router";
import React from "react";
import { Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";


export default function TabLayout() {
    const colorScheme = useColorScheme() || 'light';
    const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint, // <-- Use team primary color
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/schedule-icon.png")}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: "Track",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/trackIcon.png")}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={{
          title: "Team",
          tabBarIcon: ({ color }) => (
            <Image
              source={require("@/assets/icons/groupIcon.png")}
              style={{ width: 28, height: 28, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="registration"
        options={{
          title: "Account",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="userID"
        options={{
          title: "User",
          tabBarIcon: ({ color }) => (
            <Ionicons name="qr-code" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
