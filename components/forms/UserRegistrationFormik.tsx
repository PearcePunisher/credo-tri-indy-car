import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Platform } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Switch,
  Menu,
  Provider as PaperProvider,
} from "react-native-paper";
import { Formik } from "formik";
import * as Yup from "yup";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { SafeAreaView } from "react-native-safe-area-context";

const countryCodes = [
  { label: "🇺🇸/🇨🇦 +1", value: "+1" },
  { label: "🇬🇧 +44", value: "+44" },
  { label: "🇦🇺 +61", value: "+61" },
  { label: "🇮🇳 +91", value: "+91" },
];

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email Required"),
  password: Yup.string().min(6, "Too short").required("Password Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password Required"),
  firstName: Yup.string().required("First Name Required"),
  lastName: Yup.string().required("Last Name Required"),
  phone: Yup.string().required("Phone Number Required"),
});

export function RegisterScreenFormik() {
  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme];
  const [dobPickerVisible, setDobPickerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  // Helper function to format US phone numbers
  function formatUSPhoneNumber(value: string) {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      10
    )}`;
  }

  // Helper function for international numbers (basic, just digits and spaces)
  function formatInternationalPhoneNumber(value: string) {
    return value.replace(/[^\d\s]/g, "");
  }

  return (
    <PaperProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: colors.background },
          ]}>
          <Formik
            initialValues={{
              email: "",
              password: "",
              confirmPassword: "",
              firstName: "",
              lastName: "",
              phone: "",
              countryCode: "+1",
              dob: "",
              signedWaiver: true,
              waiverLink: "https://signedwaiver.com",
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              try {
                // Example guest data; replace with real guest fields if you collect them
                const userGuests = [
                  {
                    guest_first_name: "Meeeindo",
                    guest_last_name: "Meeeado",
                    guest_DOB: "2102-05-05",
                    guest_phone_num: "123231231231231231",
                  },
                  {
                    guest_first_name: "MeeeAKO",
                    guest_last_name: "LeeeAKO",
                    guest_DOB: "2002-05-05",
                    guest_phone_num: "34343423423242342",
                  },
                ];

                const payload = {
                  email: values.email,
                  password: values.password,
                  first_name: values.firstName,
                  last_name: values.lastName,
                  DOB: values.dob || "1920-05-05", // Replace with actual DOB field if present
                  signed_waiver: values.signedWaiver ? "True" : "False",
                  signed_waiver_link: values.waiverLink,
                  user_guests: userGuests,
                };

                const response = await fetch(
                  "https://nodejs-production-0e5a.up.railway.app/create_user_test_2",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  }
                );

                if (response.status === 200) {
                  alert("Registration successful!");
                } else {
                  alert(`Registration failed. Error code: ${response.status}`);
                }
              } catch (error) {
                alert("An unexpected error occurred.");
              }
            }}>
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              setFieldValue,
              values,
              errors,
              touched,
            }) => (
              <>
                <TextInput
                  label="First Name"
                  value={values.firstName}
                  onChangeText={handleChange("firstName")}
                  onBlur={handleBlur("firstName")}
                  style={styles.input}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: colors.tint,
                      background: colors.card,
                      text: colors.text,
                      placeholder: colors.secondaryText,
                    },
                  }}
                  error={!!(touched.firstName && errors.firstName)}
                />
                {/* First Name Error Message */}
                {touched.firstName && errors.firstName && (
                  <Text style={{ color: colors.error, marginBottom: 4 }}>
                    {errors.firstName}
                  </Text>
                )}
                {/* END First Name Error Message */}
                <TextInput
                  label="Last Name"
                  value={values.lastName}
                  onChangeText={handleChange("lastName")}
                  onBlur={handleBlur("lastName")}
                  style={styles.input}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: colors.tint,
                      background: colors.card,
                      text: colors.text,
                      placeholder: colors.secondaryText,
                    },
                  }}
                  error={!!(touched.lastName && errors.lastName)}
                />
                {/* Last Name Error Message */}
                {touched.lastName && errors.lastName && (
                  <Text style={{ color: colors.error, marginBottom: 4 }}>
                    {errors.lastName}
                  </Text>
                )}
                {/* END Last Name Error Message */}
                <TextInput
                  label="Email"
                  value={values.email}
                  onChangeText={handleChange("email")}
                  onBlur={handleBlur("email")}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  theme={{
                    colors: {
                      primary: colors.tint,
                      background: colors.card,
                      text: colors.text,
                      placeholder: colors.secondaryText,
                    },
                  }}
                  error={!!(touched.email && errors.email)}
                />
                {/* Email Error Message */}
                {touched.email && errors.email && (
                  <Text style={{ color: colors.error, marginBottom: 4 }}>
                    {errors.email}
                  </Text>
                )}
                {/* END Email Error Message */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}>
                  <View style={{ alignSelf: "center", zIndex: 10 }}>
                    <Menu
                      visible={menuVisible}
                      onDismiss={() => setMenuVisible(false)}
                      anchor={
                        <Button
                          mode="outlined"
                          onPress={() => setMenuVisible(true)}
                          style={{
                            marginRight: 8,
                            minWidth: 90,
                            borderColor: colors.border,
                            borderRadius: 25,
                            backgroundColor: colors.card,
                          }}
                          labelStyle={{ color: colors.text }}
                          contentStyle={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}>
                          {
                            countryCodes.find(
                              (c) => c.value === values.countryCode
                            )?.label
                          }
                        </Button>
                      }
                      contentStyle={{
                        backgroundColor: colors.card,
                        minWidth: 120,
                      }}
                      style={{
                        // Ensures the menu appears above other elements
                        zIndex: 20,
                      }}>
                      {countryCodes.map((c) => (
                        <Menu.Item
                          key={c.value}
                          onPress={() => {
                            setFieldValue("countryCode", c.value);
                            setMenuVisible(false);
                          }}
                          title={c.label}
                          titleStyle={{ color: colors.text }}
                        />
                      ))}
                    </Menu>
                  </View>
                  <TextInput
                    label="Phone Number"
                    value={values.phone}
                    onChangeText={(text) => {
                      let formatted = text;
                      if (values.countryCode === "+1") {
                        formatted = formatUSPhoneNumber(text);
                      } else {
                        formatted = formatInternationalPhoneNumber(text);
                      }
                      setFieldValue("phone", formatted);
                    }}
                    onBlur={handleBlur("phone")}
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    mode="outlined"
                    keyboardType="phone-pad"
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                    }}
                    error={!!(touched.phone && errors.phone)}
                  />
                </View>
                <TextInput
                  label="Password"
                  value={values.password}
                  onChangeText={handleChange("password")}
                  onBlur={handleBlur("password")}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  theme={{
                    colors: {
                      primary: colors.tint,
                      background: colors.card,
                      text: colors.text,
                      placeholder: colors.secondaryText,
                    },
                  }}
                  error={!!(touched.password && errors.password)}
                />
                <TextInput
                  label="Confirm Password"
                  value={values.confirmPassword}
                  onChangeText={handleChange("confirmPassword")}
                  onBlur={handleBlur("confirmPassword")}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  theme={{
                    colors: {
                      primary: colors.tint,
                      background: colors.card,
                      text: colors.text,
                      placeholder: colors.secondaryText,
                    },
                  }}
                  error={!!(touched.confirmPassword && errors.confirmPassword)}
                />
                <Button
                  mode="contained"
                  onPress={() => handleSubmit()} // Fix: wrap in arrow function
                  style={styles.button}
                  contentStyle={{ backgroundColor: colors.tint }}
                  labelStyle={{ color: colors.textOnGreen }} // Use a valid color from your Colors object
                >
                  Register
                </Button>
                {/* Payload Preview */}
                <View
                  style={{
                    marginTop: 24,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    padding: 12,
                  }}>
                  <Text
                    style={{
                      color: colors.tint,
                      fontWeight: "bold",
                      marginBottom: 4,
                    }}>
                    Payload Preview
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 12 }}>
                    {JSON.stringify(
                      {
                        email: values.email,
                        password: values.password,
                        first_name: values.firstName,
                        last_name: values.lastName,
                        DOB: values.dob || "1920-05-05",
                        signed_waiver: values.signedWaiver ? "True" : "False",
                        signed_waiver_link: values.waiverLink,
                        user_guests: [
                          {
                            guest_first_name: "Meeeindo",
                            guest_last_name: "Meeeado",
                            guest_DOB: "2102-05-05",
                            guest_phone_num: "123231231231231231",
                          },
                          {
                            guest_first_name: "MeeeAKO",
                            guest_last_name: "LeeeAKO",
                            guest_DOB: "2002-05-05",
                            guest_phone_num: "34343423423242342",
                          },
                        ],
                      },
                      null,
                      2
                    )}
                  </Text>
                </View>
                {touched.phone && errors.phone && (
                  <Text style={{ color: colors.error, marginTop: 4 }}>
                    {errors.phone}
                  </Text>
                )}
                {touched.password && errors.password && (
                  <Text style={{ color: colors.error, marginTop: 4 }}>
                    {errors.password}
                  </Text>
                )}
                {touched.confirmPassword && errors.confirmPassword && (
                  <Text style={{ color: colors.error, marginTop: 4 }}>
                    {errors.confirmPassword}
                  </Text>
                )}
              </>
            )}
          </Formik>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 20,
    borderRadius: 25,
  },
});
