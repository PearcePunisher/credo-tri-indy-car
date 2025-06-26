import React from "react";
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import BrandLogo from "@/components/BrandLogo";
import { RegisterScreenFormik } from '../../components/forms/UserRegistrationFormik';

export const options = {
  title: "Register",
  headerBackTitle: "Back",
};

export const UserActivationFormik = () => {
    const colorScheme = useColorScheme() || 'light';
    const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrandLogo style={styles.brand} />
        <Text style={[styles.title, { color: colors.text }]}>Welcome to the Team!</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We are excited to have you join us.
        </Text>
        <RegisterScreenFormik />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  brand: {
    width: 250,
    height: 120,
    alignSelf: "center",
    marginBottom: 20,
    objectFit: "contain",
  },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 16, textAlign: "center", fontFamily: 'Roobert' },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 12, textAlign: "center", fontFamily: 'Roobert' },
  bulletList: { marginBottom: 24 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  bullet: { fontSize: 18, marginRight: 8, fontFamily: 'Roobert' },
  bulletText: { fontSize: 15, flex: 1, lineHeight: 22, fontFamily: 'Roobert' },
});

export default UserActivationFormik;
