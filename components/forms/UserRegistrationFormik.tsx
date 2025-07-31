import React, { useState } from "react";
import { View, ScrollView, StyleSheet, Platform, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView } from "react-native";
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
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "../BrandLogo";
import { pushTokenService } from "@/services/PushTokenService";

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
    .matches(/^[A-Za-z0-9\-_]+$/, "Invitation code can only contain letters, numbers, hyphens, and underscores"),
  phone: Yup.string()
    .required("Phone Number Required")
    .min(7, "Phone number too short")
    .max(15, "Phone number too long"),
  dob: Yup.string()
    .required("Date of birth required")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .test('valid-date', 'Please enter a valid date', function(value) {
      if (!value) return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime()) && value === date.toISOString().split('T')[0];
    }),
  bringingGuests: Yup.boolean(),
  numberOfGuests: Yup.number().when("bringingGuests", {
    is: true,
    then: (schema) =>
      schema
        .min(1, "At least 1 guest required")
        .max(2, "Maximum 2 guests allowed")
        .required("Number of guests required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest1FirstName: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 1,
    then: (schema) => schema.required("Guest 1 first name required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest1LastName: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 1,
    then: (schema) => schema.required("Guest 1 last name required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest1Dob: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 1,
    then: (schema) => schema
      .required("Guest 1 date of birth required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .test('valid-date', 'Please enter a valid date', function(value) {
        if (!value) return false;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime()) && value === date.toISOString().split('T')[0];
      }),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest1Phone: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 1,
    then: (schema) => schema
      .required("Guest 1 phone number required")
      .min(7, "Phone number too short")
      .max(15, "Phone number too long"),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest2FirstName: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 2,
    then: (schema) => schema.required("Guest 2 first name required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest2LastName: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 2,
    then: (schema) => schema.required("Guest 2 last name required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest2Dob: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 2,
    then: (schema) => schema
      .required("Guest 2 date of birth required")
      .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .test('valid-date', 'Please enter a valid date', function(value) {
        if (!value) return false;
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime()) && value === date.toISOString().split('T')[0];
      }),
    otherwise: (schema) => schema.notRequired(),
  }),
  guest2Phone: Yup.string().when("numberOfGuests", {
    is: (val: number) => val >= 2,
    then: (schema) => schema
      .required("Guest 2 phone number required")
      .min(7, "Phone number too short")
      .max(15, "Phone number too long"),
    otherwise: (schema) => schema.notRequired(),
  }),
  notificationConsent: Yup.boolean()
    .oneOf([true], "You must agree to receive notifications to register")
    .required("Notification consent is required"),
});

export function RegisterScreenFormik() {
  console.log('🔧 RegisterScreenFormik component starting...');
  
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Debug logging for color scheme
  console.log('🎨 Registration Form Color Debug:', {
    colorScheme,
    textColor: colors.text,
    backgroundColor: colors.background,
    isLight: colorScheme === 'light',
    isDark: colorScheme === 'dark'
  });
  const [menuVisible, setMenuVisible] = useState(false);
  const [guest1MenuVisible, setGuest1MenuVisible] = useState(false);
  const [guest2MenuVisible, setGuest2MenuVisible] = useState(false);
  
  console.log('📱 RegisterScreenFormik state initialized...');
  
  // Date picker states
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isGuest1DatePickerVisible, setGuest1DatePickerVisible] = useState(false);
  const [isGuest2DatePickerVisible, setGuest2DatePickerVisible] = useState(false);

  console.log('📅 RegisterScreenFormik date picker states initialized...');
  
  const { createLocalAuthState, updateNotificationSubscription } = useAuth();
  
  console.log('✅ RegisterScreenFormik hooks initialized successfully');

  // Helper function to format date to YYYY-MM-DD
  function formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Helper function to parse date string to Date object
  function parseStringToDate(dateString: string): Date | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Month is 0-indexed
    const day = parseInt(parts[2]);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day);
  }

  // Helper function to format phone numbers based on country
  function formatPhoneNumber(value: string, countryCode: string) {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");
    
    if (countryCode === "+1") {
      // US/Canada format: (555) 123-4567
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (countryCode === "+52") {
      // Mexico format: 55 1234 5678
      if (digits.length <= 2) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
      return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)}`;
    } else if (countryCode === "+44") {
      // UK format: 7700 123456
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
    } else if (countryCode === "+61") {
      // Australia format: 412 345 678
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    } else if (countryCode === "+49") {
      // Germany format: 30 12345678
      if (digits.length <= 2) return digits;
      return `${digits.slice(0, 2)} ${digits.slice(2, 10)}`;
    } else if (countryCode === "+33") {
      // France format: 1 23 45 67 89
      if (digits.length <= 1) return digits;
      if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`;
      if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`;
      if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
      return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
    } else if (countryCode === "+91") {
      // India format: 98765 43210
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    } else {
      // Default international format: simple space separation
      return digits.replace(/(\d{3})/g, '$1 ').trim();
    }
  }

  return (
    <PaperProvider 
      theme={{
        colors: {
          primary: colors.tint,
          onPrimary: '#FFFFFF',
          primaryContainer: colors.tint + '20',
          onPrimaryContainer: colors.text,
          secondary: colors.tint,
          onSecondary: '#FFFFFF', 
          secondaryContainer: colors.tint + '20',
          onSecondaryContainer: colors.text,
          tertiary: colors.tint,
          onTertiary: '#FFFFFF',
          tertiaryContainer: colors.tint + '20',
          onTertiaryContainer: colors.text,
          error: colors.error || '#BA1A1A',
          onError: '#FFFFFF',
          errorContainer: '#FFDAD6',
          onErrorContainer: '#410002',
          background: colors.background,
          onBackground: colors.text,
          surface: colors.card,
          onSurface: colors.text,
          surfaceVariant: colors.card,
          onSurfaceVariant: colors.secondaryText,
          outline: colors.secondaryText,
          outlineVariant: colors.secondaryText + '50',
          shadow: '#000000',
          scrim: '#000000',
          inverseSurface: colorScheme === 'light' ? '#313033' : '#E6E1E5',
          inverseOnSurface: colorScheme === 'light' ? '#F4EFF4' : '#313033',
          inversePrimary: colors.tint,
          elevation: {
            level0: 'transparent',
            level1: colors.card,
            level2: colors.card,
            level3: colors.card,
            level4: colors.card,
            level5: colors.card,
          },
          surfaceDisabled: colors.secondaryText + '12',
          onSurfaceDisabled: colors.secondaryText + '38',
          backdrop: colors.background + 'CC',
        },
      }}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { backgroundColor: colors.background },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <BrandLogo />
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
              bringingGuests: false,
              numberOfGuests: 0,
              guest1FirstName: "",
              guest1LastName: "",
              guest1Dob: "",
              guest1Phone: "",
              guest1CountryCode: "+1",
              guest2FirstName: "",
              guest2LastName: "",
              guest2Dob: "",
              guest2Phone: "",
              guest2CountryCode: "+1",
              notificationConsent: false,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              try {
                // TESTING MODE: Skip Railway registration and proceed directly to local auth
                console.log('🧪 TESTING MODE: Skipping Railway registration, creating local auth state only');
                
                // Build guest data based on user input (for future use)
                const userGuests = [];

                if (values.bringingGuests && values.numberOfGuests >= 1) {
                  userGuests.push({
                    guest_first_name: values.guest1FirstName,
                    guest_last_name: values.guest1LastName,
                    guest_DOB: values.guest1Dob,
                    guest_phone_num: `${values.guest1CountryCode}${values.guest1Phone.replace(/\D/g, '')}`,
                  });
                }

                if (values.bringingGuests && values.numberOfGuests >= 2) {
                  userGuests.push({
                    guest_first_name: values.guest2FirstName,
                    guest_last_name: values.guest2LastName,
                    guest_DOB: values.guest2Dob,
                    guest_phone_num: `${values.guest2CountryCode}${values.guest2Phone.replace(/\D/g, '')}`,
                  });
                }

                // TODO: REMOVE THIS WHEN READY TO RE-ENABLE RAILWAY
                // Skip Railway call for testing - create local auth state directly
                try {
                  // Create mock server user data for testing
                  const mockServerUser = {
                    email: values.email,
                    fname: values.firstName,
                    lname: values.lastName,
                    user_id: Math.floor(Math.random() * 10000), // Generate random test ID
                    event_code_document_id: 'test_event_doc_id',
                    event_schedule_document_id: 'test_schedule_doc_id',
                    user_is_staff: false,
                  };

                  await createLocalAuthState({
                    email: mockServerUser.email,
                    firstName: mockServerUser.fname,
                    lastName: mockServerUser.lname,
                    dateOfBirth: values.dob || "1920-05-05",
                    phoneNumber: `${values.countryCode}${values.phone.replace(/\D/g, '')}`,
                    // Store mock server data
                    serverId: mockServerUser.user_id.toString(),
                    eventCodeDocumentId: mockServerUser.event_code_document_id,
                    eventScheduleDocumentId: mockServerUser.event_schedule_document_id,
                    // Store invitation code locally for future use
                    invitationCode: values.invitationCode,
                    //store the staff toggle. 
                    userIsStaff: mockServerUser.user_is_staff,
                  });
                  
                  // Handle push token registration if user consented
                  if (values.notificationConsent) {
                    console.log('📱 User consented to notifications, registering push token...');
                    try {
                      const userId = mockServerUser.user_id.toString();
                      const tokenResult = await pushTokenService.registerPushToken(userId);
                      
                      if (tokenResult.success) {
                        console.log('✅ Push token registered successfully');
                        // Update user's notification subscription status
                        await updateNotificationSubscription(true, tokenResult.token);
                      } else if (tokenResult.requiresPermission) {
                        // Show permission explanation to user
                        Alert.alert(
                          'Notification Permissions',
                          'To receive race updates and experience reminders, please enable notifications in your device settings.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Enable Notifications', onPress: async () => {
                              const retryResult = await pushTokenService.registerPushToken(userId);
                              if (retryResult.success) {
                                await updateNotificationSubscription(true, retryResult.token);
                                Alert.alert('Success', 'Notifications enabled successfully!');
                              }
                            }}
                          ]
                        );
                      } else {
                        console.warn('⚠️ Push token registration failed:', tokenResult.error);
                        // Still allow registration to proceed
                        await updateNotificationSubscription(false);
                      }
                    } catch (pushTokenError) {
                      console.error('❌ Error during push token registration:', pushTokenError);
                      // Don't block registration if push token fails
                      await updateNotificationSubscription(false);
                    }
                  } else {
                    console.log('📵 User declined notifications');
                    await updateNotificationSubscription(false);
                  }
                  
                  console.log('✅ TESTING MODE: Local auth state created successfully');
                  alert("Registration successful! (Testing mode - no Railway call made)");
                  // Navigate to welcome page for onboarding
                  // Note: The app will automatically route to welcome since user is authenticated but hasn't completed onboarding
                } catch (authError) {
                  console.error('Error setting up local auth state in testing mode:', authError);
                  alert("Registration failed during local auth setup. Please try again.");
                }

                /* TODO: UNCOMMENT THIS BLOCK TO RE-ENABLE RAILWAY REGISTRATION
                const payload = {
                  email: values.email,
                  password: values.password,
                  first_name: values.firstName,
                  last_name: values.lastName,
                  phone: `${values.countryCode}${values.phone.replace(/\D/g, '')}`,
                  DOB: values.dob || "1920-05-05",
                  signed_waiver: values.signedWaiver ? "True" : "False",
                  signed_waiver_link: values.waiverLink,
                  invitation_code: values.invitationCode,
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
                  // Get the response data from the server
                  const responseData = await response.json();
                  console.log('Server response:', responseData);
                  
                  // Railway registration successful - now create local auth state with server data
                  try {
                    // Use server response data if available, otherwise fall back to form values
                    const serverUser = responseData?.response;
                    await createLocalAuthState({
                      email: serverUser?.email || values.email,
                      firstName: serverUser?.fname || values.firstName,
                      lastName: serverUser?.lname || values.lastName,
                      dateOfBirth: values.dob || "1920-05-05",
                      phoneNumber: `${values.countryCode}${values.phone.replace(/\D/g, '')}`,
                      // Store additional server data in a way that can be accessed later
                      serverId: serverUser?.user_id?.toString(),
                      eventCodeDocumentId: serverUser?.event_code_document_id,
                      eventScheduleDocumentId: serverUser?.event_schedule_document_id,
                      // Store invitation code locally for future use
                      invitationCode: values.invitationCode,
                      //store the staff toggle. 
                      userIsStaff: serverUser?.user_is_staff,
                    });
                    
                    // Handle push token registration if user consented
                    if (values.notificationConsent) {
                      console.log('📱 User consented to notifications, registering push token...');
                      try {
                        const userId = serverUser?.user_id?.toString() || 'local_user';
                        const tokenResult = await pushTokenService.registerPushToken(userId);
                        
                        if (tokenResult.success) {
                          console.log('✅ Push token registered successfully');
                          // Update user's notification subscription status
                          await updateNotificationSubscription(true, tokenResult.token);
                        } else if (tokenResult.requiresPermission) {
                          // Show permission explanation to user
                          Alert.alert(
                            'Notification Permissions',
                            'To receive race updates and experience reminders, please enable notifications in your device settings.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Enable Notifications', onPress: async () => {
                                const retryResult = await pushTokenService.registerPushToken(userId);
                                if (retryResult.success) {
                                  await updateNotificationSubscription(true, retryResult.token);
                                  Alert.alert('Success', 'Notifications enabled successfully!');
                                }
                              }}
                            ]
                          );
                        } else {
                          console.warn('⚠️ Push token registration failed:', tokenResult.error);
                          // Still allow registration to proceed
                          await updateNotificationSubscription(false);
                        }
                      } catch (pushTokenError) {
                        console.error('❌ Error during push token registration:', pushTokenError);
                        // Don't block registration if push token fails
                        await updateNotificationSubscription(false);
                      }
                    } else {
                      console.log('📵 User declined notifications');
                      await updateNotificationSubscription(false);
                    }
                    
                    console.log('✅ Registration successful! Local auth state created');
                    alert("Registration successful!");
                    // Navigate to welcome page for onboarding
                    // Note: The app will automatically route to welcome since user is authenticated but hasn't completed onboarding
                  } catch (authError) {
                    console.error('Error setting up local auth state:', authError);
                    // Even if local auth fails, Railway registration succeeded
                    console.log('⚠️ Registration succeeded but local auth failed');
                    alert("Registration successful, but there was an issue setting up your account locally. Please restart the app.");
                  }
                } else {
                  const errorText = await response.text();
                  console.error('Registration failed:', response.status, errorText);
                  alert(`Registration failed. Error code: ${response.status}`);
                }
                */
              } catch (error) {
                console.error('Registration error:', error);
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
                {Platform.OS === 'web' ? (
                  <TextInput
                    label="Date of Birth"
                    value={values.dob}                  onChangeText={(text) => {
                    // Allow progressive typing and validate complete dates
                    const cleanText = text.replace(/[^\d-]/g, ''); // Only allow digits and hyphens
                    if (cleanText.length <= 10) {
                      setFieldValue("dob", cleanText);
                    }
                  }}
                    onBlur={handleBlur("dob")}
                    style={styles.input}
                    mode="outlined"
                    placeholder="YYYY-MM-DD (e.g., 1990-12-25)"
                    maxLength={10}
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
                ) : (
                  <View style={styles.input}>
                    <Text style={{ 
                      color: colors.secondaryText, 
                      fontSize: 12, 
                      marginBottom: 4,
                      fontFamily: "Roobert" 
                    }}>
                      Date of Birth
                    </Text>
                    <TouchableOpacity
                      onPress={() => setDatePickerVisible(true)}
                      style={{
                        borderColor: touched.dob && errors.dob ? colors.error : colors.secondaryText,
                        backgroundColor: colors.card,
                        borderRadius: 4,
                        borderWidth: 0.5,
                        height: 48,
                        paddingHorizontal: 12,
                        justifyContent: "center",
                      }}>
                      <Text style={{
                        color: values.dob ? colors.text : colors.secondaryText,
                        fontSize: 16,
                        fontFamily: "Roobert",
                      }}>
                        {values.dob || "Select Date of Birth"}
                      </Text>
                    </TouchableOpacity>
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="date"
                      onConfirm={(date) => {
                        setFieldValue("dob", formatDateToString(date));
                        setDatePickerVisible(false);
                      }}
                      onCancel={() => setDatePickerVisible(false)}
                      minimumDate={new Date(1900, 0, 1)} // Allow dates from 1900
                      maximumDate={new Date()}
                      date={parseStringToDate(values.dob) || new Date(2000, 0, 1)}
                      isDarkModeEnabled={colorScheme === "dark"}
                      pickerContainerStyleIOS={{
                        backgroundColor: colors.card,
                      }}
                      confirmTextIOS="Select"
                      cancelTextIOS="Cancel"
                    />
                  </View>
                )}
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
                          {
                            countryCodes.find(
                              (c) => c.value === values.countryCode
                            )?.label || "🇺🇸 +1"
                          }
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
                      const countryData = countryCodes.find(c => c.value === values.countryCode);
                      const formatted = formatPhoneNumber(text, values.countryCode);
                      setFieldValue("phone", formatted);
                    }}
                    onBlur={handleBlur("phone")}
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    mode="outlined"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    placeholder={countryCodes.find(c => c.value === values.countryCode)?.placeholder || "Phone number"}
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
                  error={!!(touched.confirmPassword && errors.confirmPassword)}
                />
                <TextInput
                  label="Invitation Code"
                  value={values.invitationCode}
                  onChangeText={(text) => {
                    // Clean and format invitation code: uppercase and remove invalid characters
                    const cleaned = text.toUpperCase().replace(/[^A-Z0-9\-_]/g, '');
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

                {/* Guest Section */}
                <View
                  style={{
                    marginTop: 24,
                    marginBottom: 16,
                    padding: 16,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                  }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: colors.tint,
                      marginBottom: 12,
                      fontFamily: "Roobert",
                    }}>
                    Guest Information
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 16,
                    }}>
                    <Text
                      style={{
                        color: colors.text,
                        marginRight: 12,
                        fontFamily: "Roobert",
                      }}>
                      Will you be bringing guests?
                    </Text>
                    <Switch
                      value={values.bringingGuests}
                      onValueChange={(value) => {
                        setFieldValue("bringingGuests", value);
                        if (!value) {
                          setFieldValue("numberOfGuests", 0);
                          setFieldValue("guest1FirstName", "");
                          setFieldValue("guest1LastName", "");
                          setFieldValue("guest1Dob", "");
                          setFieldValue("guest1Phone", "");
                          setFieldValue("guest1CountryCode", "+1");
                          setFieldValue("guest2FirstName", "");
                          setFieldValue("guest2LastName", "");
                          setFieldValue("guest2Dob", "");
                          setFieldValue("guest2Phone", "");
                          setFieldValue("guest2CountryCode", "+1");
                          // Close any open date pickers
                          setGuest1DatePickerVisible(false);
                          setGuest2DatePickerVisible(false);
                        }
                      }}
                      thumbColor={
                        values.bringingGuests ? colors.tint : colors.border
                      }
                      trackColor={{
                        false: colors.border,
                        true: colors.tint + "50",
                      }}
                    />
                  </View>

                  {values.bringingGuests && (
                    <>
                      <View style={{ marginBottom: 16 }}>
                        <Text
                          style={{
                            color: colors.text,
                            marginBottom: 8,
                            fontFamily: "Roobert",
                          }}>
                          How many guests? (Maximum 2)
                        </Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <Button
                            mode={
                              values.numberOfGuests === 1
                                ? "contained"
                                : "outlined"
                            }
                            onPress={() => {
                              setFieldValue("numberOfGuests", 1);
                              // Clear guest 2 fields when selecting 1 guest
                              setFieldValue("guest2FirstName", "");
                              setFieldValue("guest2LastName", "");
                              setFieldValue("guest2Dob", "");
                              setFieldValue("guest2Phone", "");
                              setFieldValue("guest2CountryCode", "+1");
                              // Close guest 2 date picker
                              setGuest2DatePickerVisible(false);
                            }}
                            style={{ flex: 1, borderColor: colors.border }}
                            contentStyle={{
                              backgroundColor:
                                values.numberOfGuests === 1
                                  ? colors.tint
                                  : colors.card,
                            }}
                            labelStyle={{
                              color:
                                values.numberOfGuests === 1
                                  ? colors.textOnOrange
                                  : colors.text,
                            }}>
                            1 Guest
                          </Button>
                          <Button
                            mode={
                              values.numberOfGuests === 2
                                ? "contained"
                                : "outlined"
                            }
                            onPress={() => setFieldValue("numberOfGuests", 2)}
                            style={{ flex: 1, borderColor: colors.border }}
                            contentStyle={{
                              backgroundColor:
                                values.numberOfGuests === 2
                                  ? colors.tint
                                  : colors.card,
                            }}
                            labelStyle={{
                              color:
                                values.numberOfGuests === 2
                                  ? colors.textOnOrange
                                  : colors.text,
                            }}>
                            2 Guests
                          </Button>
                        </View>
                      </View>

                      {/* Guest 1 Fields */}
                      {values.numberOfGuests >= 1 && (
                        <View style={{ marginBottom: 16 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: colors.tint,
                              marginBottom: 12,
                              fontFamily: "Roobert",
                            }}>
                            Guest 1 Information
                          </Text>
                          <TextInput
                            label="Guest 1 First Name"
                            value={values.guest1FirstName}
                            onChangeText={handleChange("guest1FirstName")}
                            onBlur={handleBlur("guest1FirstName")}
                            style={styles.input}
                            mode="outlined"
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
                              !!(
                                touched.guest1FirstName &&
                                errors.guest1FirstName
                              )
                            }
                          />
                          <TextInput
                            label="Guest 1 Last Name"
                            value={values.guest1LastName}
                            onChangeText={handleChange("guest1LastName")}
                            onBlur={handleBlur("guest1LastName")}
                            style={styles.input}
                            mode="outlined"
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
                              !!(
                                touched.guest1LastName && errors.guest1LastName
                              )
                            }
                          />
                          {Platform.OS === 'web' ? (
                            <TextInput
                              label="Guest 1 Date of Birth"
                              value={values.guest1Dob}
                              onChangeText={(text) => {
                                // Allow progressive typing and validate complete dates
                                const cleanText = text.replace(/[^\d-]/g, ''); // Only allow digits and hyphens
                                if (cleanText.length <= 10) {
                                  setFieldValue("guest1Dob", cleanText);
                                }
                              }}
                              onBlur={handleBlur("guest1Dob")}
                              style={styles.input}
                              mode="outlined"
                              placeholder="YYYY-MM-DD"
                              maxLength={10}
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
                              error={!!(touched.guest1Dob && errors.guest1Dob)}
                            />
                          ) : (
                            <View style={styles.input}>
                              <Text style={{ 
                                color: colors.secondaryText, 
                                fontSize: 12, 
                                marginBottom: 4,
                                fontFamily: "Roobert" 
                              }}>
                                Guest 1 Date of Birth
                              </Text>
                              <TouchableOpacity
                                onPress={() => setGuest1DatePickerVisible(true)}
                                style={{
                                  borderColor: touched.guest1Dob && errors.guest1Dob ? colors.error : colors.secondaryText,
                                  backgroundColor: colors.card,
                                  borderRadius: 4,
                                  borderWidth: 0.5,
                                  height: 48,
                                  paddingHorizontal: 12,
                                  justifyContent: "center",
                                }}>
                                <Text style={{
                                  color: values.guest1Dob ? colors.text : colors.secondaryText,
                                  fontSize: 16,
                                  fontFamily: "Roobert",
                                }}>
                                  {values.guest1Dob || "Select Guest 1 Date of Birth"}
                                </Text>
                              </TouchableOpacity>
                              <DateTimePickerModal
                                isVisible={isGuest1DatePickerVisible}
                                mode="date"
                                onConfirm={(date) => {
                                  setFieldValue("guest1Dob", formatDateToString(date));
                                  setGuest1DatePickerVisible(false);
                                }}
                                onCancel={() => setGuest1DatePickerVisible(false)}
                                minimumDate={new Date(1900, 0, 1)} // Allow dates from 1900
                                maximumDate={new Date()}
                                date={parseStringToDate(values.guest1Dob) || new Date(2000, 0, 1)}
                                isDarkModeEnabled={colorScheme === "dark"}
                                pickerContainerStyleIOS={{
                                  backgroundColor: colors.card,
                                }}
                                confirmTextIOS="Select"
                                cancelTextIOS="Cancel"
                              />
                            </View>
                          )}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 12,
                            }}>
                            <View style={{ alignSelf: "center", zIndex: 10 }}>
                              <Menu
                                visible={guest1MenuVisible}
                                onDismiss={() => setGuest1MenuVisible(false)}
                                anchor={
                                  <Button
                                    mode="outlined"
                                    onPress={() => setGuest1MenuVisible(true)}
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
                                    {
                                      countryCodes.find(
                                        (c) => c.value === values.guest1CountryCode
                                      )?.label || "🇺🇸 +1"
                                    }
                                  </Button>
                                }
                                contentStyle={{
                                  backgroundColor: colors.card,
                                  minWidth: 120,
                                }}>
                                {countryCodes.map((c) => (
                                  <Menu.Item
                                    key={c.value + c.label + "guest1"}
                                    onPress={() => {
                                      setFieldValue("guest1CountryCode", c.value);
                                      setFieldValue("guest1Phone", ""); // Clear phone when changing country
                                      setGuest1MenuVisible(false);
                                    }}
                                    title={c.label}
                                    titleStyle={{ color: colors.text }}
                                  />
                                ))}
                              </Menu>
                            </View>
                            <TextInput
                              label="Guest 1 Phone Number"
                              value={values.guest1Phone}
                              onChangeText={(text) => {
                                const formatted = formatPhoneNumber(text, values.guest1CountryCode);
                                setFieldValue("guest1Phone", formatted);
                              }}
                              onBlur={handleBlur("guest1Phone")}
                              style={[styles.input, { flex: 1, marginBottom: 0 }]}
                              mode="outlined"
                              keyboardType="phone-pad"
                              placeholder={countryCodes.find(c => c.value === values.guest1CountryCode)?.placeholder || "Phone number"}
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
                              error={!!(touched.guest1Phone && errors.guest1Phone)}
                            />
                          </View>
                        </View>
                      )}

                      {/* Guest 2 Fields */}
                      {values.numberOfGuests >= 2 && (
                        <View style={{ marginBottom: 16 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: colors.tint,
                              marginBottom: 12,
                              fontFamily: "Roobert",
                            }}>
                            Guest 2 Information
                          </Text>
                          <TextInput
                            label="Guest 2 First Name"
                            value={values.guest2FirstName}
                            onChangeText={handleChange("guest2FirstName")}
                            onBlur={handleBlur("guest2FirstName")}
                            style={styles.input}
                            mode="outlined"
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
                              !!(
                                touched.guest2FirstName &&
                                errors.guest2FirstName
                              )
                            }
                          />
                          <TextInput
                            label="Guest 2 Last Name"
                            value={values.guest2LastName}
                            onChangeText={handleChange("guest2LastName")}
                            onBlur={handleBlur("guest2LastName")}
                            style={styles.input}
                            mode="outlined"
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
                              !!(
                                touched.guest2LastName && errors.guest2LastName
                              )
                            }
                          />
                          {Platform.OS === 'web' ? (
                            <TextInput
                              label="Guest 2 Date of Birth"
                              value={values.guest2Dob}
                              onChangeText={(text) => {
                                // Allow progressive typing and validate complete dates
                                const cleanText = text.replace(/[^\d-]/g, ''); // Only allow digits and hyphens
                                if (cleanText.length <= 10) {
                                  setFieldValue("guest2Dob", cleanText);
                                }
                              }}
                              onBlur={handleBlur("guest2Dob")}
                              style={styles.input}
                              mode="outlined"
                              placeholder="YYYY-MM-DD"
                              maxLength={10}
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
                              error={!!(touched.guest2Dob && errors.guest2Dob)}
                            />
                          ) : (
                            <View style={styles.input}>
                              <Text style={{ 
                                color: colors.secondaryText, 
                                fontSize: 12, 
                                marginBottom: 4,
                                fontFamily: "Roobert" 
                              }}>
                                Guest 2 Date of Birth
                              </Text>
                              <TouchableOpacity
                                onPress={() => setGuest2DatePickerVisible(true)}
                                style={{
                                  borderColor: touched.guest2Dob && errors.guest2Dob ? colors.error : colors.secondaryText,
                                  backgroundColor: colors.card,
                                  borderRadius: 4,
                                  borderWidth: 0.5,
                                  height: 48,
                                  paddingHorizontal: 12,
                                  justifyContent: "center",
                                }}>
                                <Text style={{
                                  color: values.guest2Dob ? colors.text : colors.secondaryText,
                                  fontSize: 16,
                                  fontFamily: "Roobert",
                                }}>
                                  {values.guest2Dob || "Select Guest 2 Date of Birth"}
                                </Text>
                              </TouchableOpacity>
                              <DateTimePickerModal
                                isVisible={isGuest2DatePickerVisible}
                                mode="date"
                                onConfirm={(date) => {
                                  setFieldValue("guest2Dob", formatDateToString(date));
                                  setGuest2DatePickerVisible(false);
                                }}
                                onCancel={() => setGuest2DatePickerVisible(false)}
                                minimumDate={new Date(1900, 0, 1)} // Allow dates from 1900
                                maximumDate={new Date()}
                                date={parseStringToDate(values.guest2Dob) || new Date(2000, 0, 1)}
                                isDarkModeEnabled={colorScheme === "dark"}
                                pickerContainerStyleIOS={{
                                  backgroundColor: colors.card,
                                }}
                                confirmTextIOS="Select"
                                cancelTextIOS="Cancel"
                              />
                            </View>
                          )}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 12,
                            }}>
                            <View style={{ alignSelf: "center", zIndex: 10 }}>
                              <Menu
                                visible={guest2MenuVisible}
                                onDismiss={() => setGuest2MenuVisible(false)}
                                anchor={
                                  <Button
                                    mode="outlined"
                                    onPress={() => setGuest2MenuVisible(true)}
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
                                    {
                                      countryCodes.find(
                                        (c) => c.value === values.guest2CountryCode
                                      )?.label || "🇺🇸 +1"
                                    }
                                  </Button>
                                }
                                contentStyle={{
                                  backgroundColor: colors.card,
                                  minWidth: 120,
                                }}>
                                {countryCodes.map((c) => (
                                  <Menu.Item
                                    key={c.value + c.label + "guest2"}
                                    onPress={() => {
                                      setFieldValue("guest2CountryCode", c.value);
                                      setFieldValue("guest2Phone", ""); // Clear phone when changing country
                                      setGuest2MenuVisible(false);
                                    }}
                                    title={c.label}
                                    titleStyle={{ color: colors.text }}
                                  />
                                ))}
                              </Menu>
                            </View>
                            <TextInput
                              label="Guest 2 Phone Number"
                              value={values.guest2Phone}
                              onChangeText={(text) => {
                                const formatted = formatPhoneNumber(text, values.guest2CountryCode);
                                setFieldValue("guest2Phone", formatted);
                              }}
                              onBlur={handleBlur("guest2Phone")}
                              style={[styles.input, { flex: 1, marginBottom: 0 }]}
                              mode="outlined"
                              keyboardType="phone-pad"
                              placeholder={countryCodes.find(c => c.value === values.guest2CountryCode)?.placeholder || "Phone number"}
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
                              error={!!(touched.guest2Phone && errors.guest2Phone)}
                            />
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>

                {/* Notification Consent Section */}
                <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📱 Notifications
                  </Text>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchContent}>
                      <Text style={[styles.switchLabel, { color: colors.text }]}>
                        Enable Notifications
                      </Text>
                      <Text style={[styles.switchDescription, { color: colors.secondaryText }]}>
                        Receive race updates, experience reminders, and important announcements. You can change this anytime in settings.
                      </Text>
                    </View>
                    <Switch
                      value={values.notificationConsent}
                      onValueChange={(value) => {
                        setFieldValue('notificationConsent', value);
                      }}
                      color={colors.tint}
                    />
                  </View>
                  {touched.notificationConsent && errors.notificationConsent && (
                    <Text style={[styles.errorText, { color: colors.error || '#ff6b6b' }]}>
                      {errors.notificationConsent}
                    </Text>
                  )}
                  {values.notificationConsent && (
                    <View style={[styles.notificationInfo, { backgroundColor: colors.background, borderColor: colors.tint }]}>
                      <Text style={[styles.notificationInfoTitle, { color: colors.tint }]}>
                        🔔 You'll receive:
                      </Text>
                      <Text style={[styles.notificationInfoText, { color: colors.text }]}>
                        • Experience reminders (1 hour, 20 minutes, and at start time)
                      </Text>
                      <Text style={[styles.notificationInfoText, { color: colors.text }]}>
                        • Race updates and live information
                      </Text>
                      <Text style={[styles.notificationInfoText, { color: colors.text }]}>
                        • Important announcements and schedule changes
                      </Text>
                    </View>
                  )}
                </View>

                <Button
                  mode="contained"
                  onPress={() => handleSubmit()} // Fix: wrap in arrow function
                  style={styles.button}
                  contentStyle={{ backgroundColor: colors.tint }}
                  labelStyle={{ color: colors.textOnOrange }} // Use a valid color from your Colors object
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register'}
                </Button>
                {/* Payload Preview section removed to prevent Hermes compilation issues */}
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
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: "RoobertSemi",
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  switchContent: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
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
