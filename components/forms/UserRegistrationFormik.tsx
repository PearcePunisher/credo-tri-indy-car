import React, { useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
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
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "../BrandLogo";
import { useNotification } from "@/context/NotificationContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

const countryCodes = [
  { label: "🇺🇸 +1", value: "+1", placeholder: "(555) 123-4567", maxLength: 14 },
  { label: "🇨🇦 +1", value: "+1", placeholder: "(555) 123-4567", maxLength: 14 },
  { label: "🇲🇽 +52", value: "+52", placeholder: "55 1234 5678", maxLength: 13 },
  { label: "🇬🇧 +44", value: "+44", placeholder: "7700 123456", maxLength: 12 },
  { label: "🇦🇺 +61", value: "+61", placeholder: "412 345 678", maxLength: 11 },
  { label: "🇩🇪 +49", value: "+49", placeholder: "30 12345678", maxLength: 13 },
  { label: "🇫🇷 +33", value: "+33", placeholder: "1 23 45 67 89", maxLength: 12 },
  { label: "🇮🇳 +91", value: "+91", placeholder: "98765 43210", maxLength: 12 },
];

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email Required"),
  password: Yup.string().min(6, "Too short").required("Password Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password Required"),
  firstName: Yup.string().required("First Name Required"),
  lastName: Yup.string().required("Last Name Required"),
  invitationCode: Yup.string()
    .required("Invitation Code Required")
    .min(3, "Invitation code must be at least 3 characters")
    .max(20, "Invitation code cannot exceed 20 characters")
    .matches(
      /^[A-Za-z0-9\-_]+$/,
      "Invitation code can only contain letters, numbers, hyphens, and underscores"
    ),
  phone: Yup.string()
    .required("Phone Number Required")
    .min(7, "Phone number too short")
    .max(15, "Phone number too long"),
  dob: Yup.string()
    .required("Date of birth required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .test("valid-date", "Please enter a valid date", function (value) {
      if (!value) return false;
      const date = new Date(value);
      return (
        date instanceof Date &&
        !isNaN(date.getTime()) &&
        value === date.toISOString().split("T")[0]
      );
    }),
  notificationConsent: Yup.boolean()
    .oneOf([true], "You must agree to receive notifications to register")
    .required("Notification consent is required"),
});

export function RegisterScreenFormik() {

  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  const [menuVisible, setMenuVisible] = useState(false);


  // Separate date field states
  const [dobFields, setDobFields] = useState({ month: "", day: "", year: "" });
  // Guest DOB state removed (guest feature deprecated)

  // Effect to sync separate date fields when form values change
  useEffect(() => {
    // This will be used when the form is populated with existing data
    // For now, we start with empty fields
  }, []);

  const { createLocalAuthState, updateNotificationSubscription } = useAuth();
  const { expoPushToken } = useNotification();

  // Hooks initialized

  // Helper function to format date to YYYY-MM-DD
  function formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Helper function to parse date string to Date object
  function parseStringToDate(dateString: string): Date | null {
    if (!dateString) return null;
    const parts = dateString.split("-");
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const day = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  }

  // Helper function to combine separate date fields into YYYY-MM-DD format
  function combineDateFields(month: string, day: string, year: string): string {
    if (!month || !day || !year) return "";
    const paddedMonth = month.padStart(2, "0");
    const paddedDay = day.padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  }

  // Helper function to split YYYY-MM-DD date into separate fields
  function splitDateFields(dateString: string): {
    month: string;
    day: string;
    year: string;
  } {
    if (!dateString) return { month: "", day: "", year: "" };
    const parts = dateString.split("-");
    if (parts.length !== 3) return { month: "", day: "", year: "" };
    return {
      year: parts[0] || "",
      month: parseInt(parts[1]).toString() || "",
      day: parseInt(parts[2]).toString() || "",
    };
  }

  // Helper function to handle date input formatting across all platforms
  function handleDateInputChange(
    text: string,
    fieldName: string,
    setFieldValue: any
  ) {
    // Remove any non-digit characters except hyphens
    let cleanText = text.replace(/[^\d-]/g, "");

    // Auto-format as user types: YYYY-MM-DD
    if (cleanText.length >= 4 && cleanText.charAt(4) !== "-") {
      cleanText = cleanText.substring(0, 4) + "-" + cleanText.substring(4);
    }
    if (cleanText.length >= 7 && cleanText.charAt(7) !== "-") {
      cleanText = cleanText.substring(0, 7) + "-" + cleanText.substring(7);
    }

    // Limit to 10 characters (YYYY-MM-DD format)
    if (cleanText.length <= 10) {
      setFieldValue(fieldName, cleanText);
    }
  }

  // Helper function to handle separate date field changes
  function handleSeparateDateFieldChange(
    text: string,
    field: "month" | "day" | "year",
    currentValues: { month: string; day: string; year: string },
    setFieldValue: any,
    dobFieldName: string
  ) {
    // Only allow numbers
    const cleanText = text.replace(/[^\d]/g, "");

    // Apply field-specific limits
    let maxLength = 4; // year default
    let isValid = true;

    if (field === "month") {
      maxLength = 2;
      // Allow leading zeros and validate range 01-12
      if (cleanText.length === 2) {
        const numValue = parseInt(cleanText);
        isValid = numValue >= 1 && numValue <= 12;
      } else if (cleanText.length === 1) {
        // Allow single digits 0-9 for first character
        const numValue = parseInt(cleanText);
        isValid = numValue >= 0 && numValue <= 9;
      }
    } else if (field === "day") {
      maxLength = 2;
      // Allow leading zeros and validate range 01-31
      if (cleanText.length === 2) {
        const numValue = parseInt(cleanText);
        isValid = numValue >= 1 && numValue <= 31;
      } else if (cleanText.length === 1) {
        // Allow single digits 0-9 for first character
        const numValue = parseInt(cleanText);
        isValid = numValue >= 0 && numValue <= 9;
      }
    } else if (field === "year") {
      // For year, we want a reasonable range (1900-current year + 10)
      if (cleanText.length === 4) {
        const numValue = parseInt(cleanText);
        const currentYear = new Date().getFullYear();
        isValid = numValue >= 1900 && numValue <= currentYear + 10;
      }
    }

    // Apply length limit and validation
    if (cleanText.length <= maxLength && isValid) {
      // Update the individual field in state
      const updatedValues = { ...currentValues, [field]: cleanText };

      // If all fields have values with proper length, combine them into the main dob field
      if (
        updatedValues.month.length >= 1 &&
        updatedValues.day.length >= 1 &&
        updatedValues.year.length === 4
      ) {
        const paddedMonth = updatedValues.month.padStart(2, "0");
        const paddedDay = updatedValues.day.padStart(2, "0");
        const combinedDate = `${updatedValues.year}-${paddedMonth}-${paddedDay}`;
        setFieldValue(dobFieldName, combinedDate);
      } else {
        // Clear the main dob field if any part is incomplete
        setFieldValue(dobFieldName, "");
      }

      // Return the updated values for local state
      return updatedValues;
    }

    // Return unchanged values if validation failed
    return currentValues;
  }

  // Helper function to format phone numbers based on country
  function formatPhoneNumber(value: string, countryCode: string) {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");

    if (countryCode === "+1") {
      // US/Canada format: (555) 123-4567
      if (digits.length <= 3) return digits;
      if (digits.length <= 6)
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
        6,
        10
      )}`;
    } else if (countryCode === "+52") {
      // Mexico format: 55 1234 5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(
        6,
        10
      )}`;
    } else if (countryCode === "+44") {
      // UK format: 7700 123456
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
    } else if (countryCode === "+61") {
      // Australia format: 412 345 678
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(
        6,
        9
      )}`;
    } else if (countryCode === "+49") {
      // Germany format: 30 12345678
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)} ${digits.slice(2, 10)}`;
    } else if (countryCode === "+33") {
      // France format: 1 23 45 67 89
      if (digits.length <= 1) return digits;
      if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
      if (digits.length <= 5)
        return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
      if (digits.length <= 7)
        return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(
          3,
          5
        )} ${digits.slice(5)}`;
      return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(
        3,
        5
      )} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    } else if (countryCode === "+91") {
      // India format: 98765 43210
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    } else {
      // Default international format: simple space separation
      return digits.replace(/(\d{3})/g, "$1 ").trim();
    }
  }

  return (
    <PaperProvider
      theme={{
        colors: {
          primary: colors.tint,
          onPrimary: "#FFFFFF",
          primaryContainer: colors.tint + "20",
          onPrimaryContainer: colors.text,
          secondary: colors.tint,
          onSecondary: "#FFFFFF",
          secondaryContainer: colors.tint + "20",
          onSecondaryContainer: colors.text,
          tertiary: colors.tint,
          onTertiary: "#FFFFFF",
          tertiaryContainer: colors.tint + "20",
          onTertiaryContainer: colors.text,
          error: colors.error || "#BA1A1A",
          onError: "#FFFFFF",
          errorContainer: "#FFDAD6",
          onErrorContainer: "#410002",
          background: colors.background,
          onBackground: colors.text,
          surface: colors.card,
          onSurface: colors.text,
          surfaceVariant: colors.card,
          onSurfaceVariant: colors.secondaryText,
          outline: colors.secondaryText,
          outlineVariant: colors.secondaryText + "50",
          shadow: "#000000",
          scrim: "#000000",
          inverseSurface: colorScheme === "light" ? "#313033" : "#E6E1E5",
          inverseOnSurface: colorScheme === "light" ? "#F4EFF4" : "#313033",
          inversePrimary: colors.tint,
          elevation: {
            level0: "transparent",
            level1: colors.card,
            level2: colors.card,
            level3: colors.card,
            level4: colors.card,
            level5: colors.card,
          },
          surfaceDisabled: colors.secondaryText + "12",
          onSurfaceDisabled: colors.secondaryText + "38",
          backdrop: colors.background + "CC",
        },
      }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { backgroundColor: colors.background },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <BrandLogo style={styles.brand} />
            <Text
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: colors.tint,
                marginBottom: 16,
                textAlign: "left",
                fontFamily: "Roobert",
              }}>
              Register here
            </Text>
            <Formik
              initialValues={{
                email: "",
                password: "",
                confirmPassword: "",
                firstName: "",
                lastName: "",
                invitationCode: "",
                phone: "",
                countryCode: "+1",
                dob: "",
                signedWaiver: true,
                waiverLink: "https://signedwaiver.com",
                notificationConsent: false,
              }}
              validationSchema={validationSchema}
              onSubmit={async (values) => {
                try {
                  const payload = {
                    email: values.email,
                    password: values.password,
                    first_name: values.firstName,
                    last_name: values.lastName,
                    phone: `${values.countryCode}${values.phone.replace(
                      /\D/g,
                      ""
                    )}`,
                    DOB: values.dob || "1920-05-05",
                    signed_waiver: values.signedWaiver ? "True" : "False",
                    signed_waiver_link: values.waiverLink,
                    invitation_code: values.invitationCode,
                    expoPushToken: expoPushToken || null,
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
                    // Get the response data from the server
                    const responseData = await response.json();
                    console.log("Server response:", responseData);

                    // Railway registration successful - now create local auth state with server data
                    try {
                      // Use server response data if available, otherwise fall back to form values
                      const serverUser = responseData?.response;
                      await createLocalAuthState({
                        email: serverUser?.email || values.email,
                        firstName: serverUser?.fname || values.firstName,
                        lastName: serverUser?.lname || values.lastName,
                        dateOfBirth: values.dob || "1920-05-05",
                        phoneNumber: `${
                          values.countryCode
                        }${values.phone.replace(/\D/g, "")}`,
                        // Store additional server data in a way that can be accessed later
                        serverId: serverUser?.user_id?.toString(),
                        eventCodeDocumentId: serverUser?.event_code_document_id,
                        eventScheduleDocumentId:
                          serverUser?.event_schedule_document_id,
                        // Store invitation code locally for future use
                        invitationCode: values.invitationCode,
                        //store the staff toggle.
                        userIsStaff: serverUser?.user_is_staff,
                      });

                      if (values.notificationConsent && expoPushToken) {
                        await updateNotificationSubscription(true, expoPushToken);
                      } else {
                        await updateNotificationSubscription(false);
                      }
                      alert("Registration successful!");
                      // Navigate to welcome page for onboarding
                      // Note: The app will automatically route to welcome since user is authenticated but hasn't completed onboarding
                    } catch (authError) {
                      console.error(
                        "Error setting up local auth state:",
                        authError
                      );
                      // Even if local auth fails, Railway registration succeeded
                      console.log(
                        "⚠️ Registration succeeded but local auth failed"
                      );
                      alert(
                        "Registration successful, but there was an issue setting up your account locally. Please restart the app."
                      );
                    }
                  } else {
                    const errorText = await response.text();
                    console.error(
                      "Registration failed:",
                      response.status,
                      errorText
                    );
                    alert(
                      `Registration failed. Error code: ${response.status}`
                    );
                  }
                } catch (error) {
                  console.error("Registration error:", error);
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
                isSubmitting,
              }) => (
                <>
                  <TextInput
                    label="First Name"
                    value={values.firstName}
                    onChangeText={handleChange("firstName")}
                    onBlur={handleBlur("firstName")}
                    style={styles.input}
                    mode="outlined"
                    autoComplete="given-name"
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                      fonts: {
                        regular: {
                          fontFamily: "Roobert",
                        },
                      },
                    }}
                    error={!!(touched.firstName && errors.firstName)}
                  />
                  <TextInput
                    label="Last Name"
                    value={values.lastName}
                    onChangeText={handleChange("lastName")}
                    onBlur={handleBlur("lastName")}
                    style={styles.input}
                    mode="outlined"
                    autoComplete="family-name"
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                      fonts: {
                        regular: {
                          fontFamily: "Roobert",
                        },
                      },
                    }}
                    error={!!(touched.lastName && errors.lastName)}
                  />
                  <TextInput
                    label="Email"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    style={styles.input}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                      fonts: {
                        regular: {
                          fontFamily: "Roobert",
                        },
                      },
                    }}
                    error={!!(touched.email && errors.email)}
                  />
                  <View style={styles.input}>
                    <Text
                      style={{
                        color: colors.secondaryText,
                        fontSize: 12,
                        marginBottom: 8,
                        fontFamily: "Roobert",
                      }}>
                      Date of Birth
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <TextInput
                          label="Month"
                          value={dobFields.month}
                          onChangeText={(text) => {
                            const updatedFields = handleSeparateDateFieldChange(
                              text,
                              "month",
                              dobFields,
                              setFieldValue,
                              "dob"
                            );
                            setDobFields(updatedFields);
                          }}
                          onBlur={handleBlur("dob")}
                          style={{ height: 48 }}
                          mode="outlined"
                          placeholder="MM"
                          maxLength={2}
                          keyboardType="number-pad"
                          theme={{
                            colors: {
                              primary: colors.tint,
                              background: colors.card,
                              text: colors.text,
                              placeholder: colors.secondaryText,
                            },
                            fonts: {
                              regular: {
                                fontFamily: "Roobert",
                              },
                            },
                          }}
                          error={!!(touched.dob && errors.dob)}
                        />
                      </View>
                      <View style={{ flex: 1, marginHorizontal: 4 }}>
                        <TextInput
                          label="Day"
                          value={dobFields.day}
                          onChangeText={(text) => {
                            const updatedFields = handleSeparateDateFieldChange(
                              text,
                              "day",
                              dobFields,
                              setFieldValue,
                              "dob"
                            );
                            setDobFields(updatedFields);
                          }}
                          onBlur={handleBlur("dob")}
                          style={{ height: 48 }}
                          mode="outlined"
                          placeholder="DD"
                          maxLength={2}
                          keyboardType="number-pad"
                          theme={{
                            colors: {
                              primary: colors.tint,
                              background: colors.card,
                              text: colors.text,
                              placeholder: colors.secondaryText,
                            },
                            fonts: {
                              regular: {
                                fontFamily: "Roobert",
                              },
                            },
                          }}
                          error={!!(touched.dob && errors.dob)}
                        />
                      </View>
                      <View style={{ flex: 1.5, marginLeft: 8 }}>
                        <TextInput
                          label="Year"
                          value={dobFields.year}
                          onChangeText={(text) => {
                            const updatedFields = handleSeparateDateFieldChange(
                              text,
                              "year",
                              dobFields,
                              setFieldValue,
                              "dob"
                            );
                            setDobFields(updatedFields);
                          }}
                          onBlur={handleBlur("dob")}
                          style={{ height: 48 }}
                          mode="outlined"
                          placeholder="YYYY"
                          maxLength={4}
                          keyboardType="number-pad"
                          theme={{
                            colors: {
                              primary: colors.tint,
                              background: colors.card,
                              text: colors.text,
                              placeholder: colors.secondaryText,
                            },
                            fonts: {
                              regular: {
                                fontFamily: "Roobert",
                              },
                            },
                          }}
                          error={!!(touched.dob && errors.dob)}
                        />
                      </View>
                    </View>
                  </View>
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
                              borderColor: colors.secondaryText,
                              borderRadius: 25,
                              backgroundColor: colors.card,
                            }}
                            labelStyle={{ color: colors.text }}
                            contentStyle={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}>
                            {countryCodes.find(
                              (c) => c.value === values.countryCode
                            )?.label || "🇺🇸 +1"}
                          </Button>
                        }
                        contentStyle={{
                          backgroundColor: colors.card,
                          minWidth: 120,
                        }}>
                        {countryCodes.map((c) => (
                          <Menu.Item
                            key={c.value + c.label}
                            onPress={() => {
                              setFieldValue("countryCode", c.value);
                              setFieldValue("phone", ""); // Clear phone when changing country
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
                        const countryData = countryCodes.find(
                          (c) => c.value === values.countryCode
                        );
                        const formatted = formatPhoneNumber(
                          text,
                          values.countryCode
                        );
                        setFieldValue("phone", formatted);
                      }}
                      onBlur={handleBlur("phone")}
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      mode="outlined"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      placeholder={
                        countryCodes.find((c) => c.value === values.countryCode)
                          ?.placeholder || "Phone number"
                      }
                      theme={{
                        colors: {
                          primary: colors.tint,
                          background: colors.card,
                          text: colors.text,
                          placeholder: colors.secondaryText,
                        },
                        fonts: {
                          regular: {
                            fontFamily: "Roobert",
                          },
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
                    autoComplete="new-password"
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                      fonts: {
                        regular: {
                          fontFamily: "Roobert",
                        },
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
                    autoComplete="new-password"
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                      fonts: {
                        regular: {
                          fontFamily: "Roobert",
                        },
                      },
                    }}
                    error={
                      !!(touched.confirmPassword && errors.confirmPassword)
                    }
                  />
                  <TextInput
                    label="Invitation Code"
                    value={values.invitationCode}
                    onChangeText={(text) => {
                      // Clean and format invitation code: uppercase and remove invalid characters
                      const cleaned = text
                        .toUpperCase()
                        .replace(/[^A-Z0-9\-_]/g, "");
                      setFieldValue("invitationCode", cleaned);
                    }}
                    onBlur={handleBlur("invitationCode")}
                    style={styles.input}
                    mode="outlined"
                    autoCapitalize="characters"
                    placeholder="Enter your invitation code"
                    maxLength={20}
                    theme={{
                      colors: {
                        primary: colors.tint,
                        background: colors.card,
                        text: colors.text,
                        placeholder: colors.secondaryText,
                      },
                      fonts: {
                        regular: {
                          fontFamily: "Roobert",
                        },
                      },
                    }}
                    error={!!(touched.invitationCode && errors.invitationCode)}
                  />

                  {/* Guest section removed */}

                  {/*  Notification section removed */}

                  <Button
                    mode="contained"
                    onPress={() => handleSubmit()} // Fix: wrap in arrow function
                    style={styles.button}
                    contentStyle={{ backgroundColor: colors.tint }}
                    labelStyle={{ color: colors.textOnGreen }} // Use a valid color from your Colors object
                    disabled={isSubmitting}
                    loading={isSubmitting}>
                    {isSubmitting ? "Registering..." : "Register"}
                  </Button>
                  {/* Payload Preview */}
                  <View style={{ marginTop: 24 }}>
                    <Text style={{ color: colors.secondaryText, fontFamily: 'Roobert', marginBottom: 4 }}>Payload Preview</Text>
                    <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'Courier' }}>
                      {JSON.stringify({
                        email: values.email,
                        first_name: values.firstName,
                        last_name: values.lastName,
                        phone: `${values.countryCode}${values.phone.replace(/\D/g, "")}`,
                        DOB: values.dob || '1920-05-05',
                        invitation_code: values.invitationCode,
                        expoPushToken: expoPushToken || null,
                      }, null, 2)}
                    </Text>
                  </View>
                </>
              )}
            </Formik>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 100, // Extra padding for keyboard
    flexGrow: 1,
  },
  brand: {
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
  },
  input: {
    marginBottom: 12,
    fontFamily: "Roobert",
  },
  button: {
    marginTop: 20,
    borderRadius: 25,
  },
  section: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    fontFamily: "RoobertSemi",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    fontFamily: "RoobertMedium",
  },
  switchDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Roobert",
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
    fontFamily: "Roobert",
  },
  notificationInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  notificationInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: "RoobertMedium",
  },
  notificationInfoText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    fontFamily: "Roobert",
  },
});
