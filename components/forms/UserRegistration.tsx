import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
// import * as fs from 'fs';
// import * as path from 'path';

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | undefined>(undefined);
  const [isUserDobPickerVisible, setIsUserDobPickerVisible] = useState(false);
  const [signedWaiver, setSignedWaiver] = useState(true);
  const [waiverLink, setWaiverLink] = useState("https://signedwaiver.com");

  const [guest1FirstName, setGuest1FirstName] = useState("");
  const [guest1LastName, setGuest1LastName] = useState("");
  const [guest1Dob, setGuest1Dob] = useState<Date | undefined>(undefined);
  const [isGuest1DobPickerVisible, setIsGuest1DobPickerVisible] = useState(false);
  const [guest1Phone, setGuest1Phone] = useState("");

  const [guest2FirstName, setGuest2FirstName] = useState("");
  const [guest2LastName, setGuest2LastName] = useState("");
  const [guest2Dob, setGuest2Dob] = useState<Date | undefined>(undefined);
  const [isGuest2DobPickerVisible, setIsGuest2DobPickerVisible] = useState(false);
  const [guest2Phone, setGuest2Phone] = useState("");

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");

  // Example country codes, expand as needed
  const countryCodes = [
    { label: "🇺🇸 +1", value: "+1" },
    { label: "🇨🇦 +1", value: "+1" },
    { label: "🇬🇧 +44", value: "+44" },
    { label: "🇦🇺 +61", value: "+61" },
    { label: "🇮🇳 +91", value: "+91" },
  ];

  const colorScheme = useColorScheme() || "light";
  const colors = Colors[colorScheme];

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 22,
      fontWeight: "600",
      marginBottom: 20,
      color: colors.text,
      textAlign: "center",
    },
    subheading: {
      fontSize: 16,
      fontWeight: "500",
      marginVertical: 10,
      color: colors.secondaryText,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
      fontSize: 16,
      backgroundColor: colors.card,
      marginBottom: 12,
      color: colors.text,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
      backgroundColor: colors.card,
      marginBottom: 12,
      justifyContent: "center",
      color: colors.text,
    },
    pickerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    picker: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginHorizontal: 4,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.tint,
      borderRadius: 25,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3.84,
      elevation: 3,
    },
    buttonText: {
      color: "#000",
      fontWeight: "600",
      fontSize: 16,
    },
    errorText: {
      color: "#FF3B30",
      fontSize: 12,
      marginBottom: 8,
      marginLeft: 4,
    },
    passwordContainer: {
      position: "relative",
      justifyContent: "center",
    },
    eyeIcon: {
      position: "absolute",
      right: 10,
      height: "100%",
      justifyContent: "center",
    },
  });

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filePath = "@/user_data/user_info.json";

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const userDOB = formatDate(dob);
    const guest1DOB = formatDate(guest1Dob);
    const guest2DOB = formatDate(guest2Dob);

    const payload = {
      email: email,
      password: password,
      first_name: firstName,
      last_name: lastName,
      DOB: userDOB,
      signed_waiver: signedWaiver ? "True" : "False",
      signed_waiver_link: waiverLink,
      user_guests: [
        {
          guest_first_name: guest1FirstName,
          guest_last_name: guest1LastName,
          guest_DOB: guest1DOB,
          guest_phone_num: guest1Phone,
        },
        {
          guest_first_name: guest2FirstName,
          guest_last_name: guest2LastName,
          guest_DOB: guest2DOB,
          guest_phone_num: guest2Phone,
        },
      ],
    };

    try {
      console.log("POST /create_user_test_2 payload:", payload);

      const response = await fetch(
        "https://nodejs-production-0e5a.up.railway.app/create_user_test_2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      console.log("Response status:", response.status);

      if (response.status === 200) {
        alert("Registration successful!");
      } else {
        alert(`Registration failed. Error code: ${response.status}`);
      }
    } catch (error) {
      alert("An error occurred during registration.");
      console.error("Registration error:", error);
    }
  };

  const onPasswordChange = (text: string) => {
    setPassword(text);
    setPasswordsMatch(text === confirmPassword);
  };

  const onConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setPasswordsMatch(password === text);
  };

  const renderTextInput = (
    placeholder: string,
    value: string,
    setter: (text: string) => void,
    secure: boolean = false,
    isPasswordField: boolean = false,
    visible: boolean = false,
    toggleVisibility?: () => void,
    fieldKey?: string
  ) => (
    <View style={styles.passwordContainer}>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={setter}
        secureTextEntry={secure && !visible}
        style={[
          styles.input,
          isPasswordField ? { paddingRight: 40 } : null,
          focusedField === fieldKey && { borderColor: colors.tint, borderWidth: 2 },
          { backgroundColor: colors.background, color: colors.text }
        ]}
        placeholderTextColor={colors.secondaryText}
        onFocus={() => setFocusedField(fieldKey || placeholder)}
        onBlur={() => setFocusedField(null)}
      />
      {isPasswordField && toggleVisibility && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={toggleVisibility}
          activeOpacity={0.7}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={24}
            color={colors.secondaryText}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderPhoneInput = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        backgroundColor: colors.card,
        marginBottom: 12,
        height: 48,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.card,
          borderRightWidth: 1,
          borderRightColor: colors.border,
          height: "100%",
        }}
      >
        <Picker
          selectedValue={countryCode}
          style={{
            width: 110, // wider for emoji + code
            color: colors.text,
            backgroundColor: colors.card,
            height: 48,
            paddingHorizontal: 0,
            paddingVertical: 0,
          }}
          dropdownIconColor={colors.text}
          onValueChange={(itemValue) => setCountryCode(itemValue)}
          itemStyle={{ fontSize: 16, height: 48 }}
          mode="dropdown" // dropdown on Android, best effort on iOS
        >
          {countryCodes.map((c) => (
            <Picker.Item key={c.value} label={c.label} value={c.value} />
          ))}
        </Picker>
      </View>
      <TextInput
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        style={{
          flex: 1,
          paddingHorizontal: 14,
          fontSize: 16,
          backgroundColor: colors.card,
          color: colors.text,
          height: 48,
        }}
        placeholderTextColor={colors.secondaryText}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>User Registration</Text>

        {renderTextInput("First Name", firstName, setFirstName, false, false, false, undefined, "firstName")}
        {renderTextInput("Last Name", lastName, setLastName, false, false, false, undefined, "lastName")}
        {renderTextInput("Email", email, setEmail, false, false, false, undefined, "email")}
        {renderPhoneInput()}
        {renderTextInput(
          "Password",
          password,
          onPasswordChange,
          true,
          true,
          passwordVisible,
          () => setPasswordVisible(!passwordVisible),
          "password"
        )}
        {renderTextInput(
          "Confirm Password",
          confirmPassword,
          onConfirmPasswordChange,
          true,
          true,
          confirmPasswordVisible,
          () => setConfirmPasswordVisible(!confirmPasswordVisible),
          "confirmPassword"
        )}
        {!passwordsMatch && (
          <Text style={styles.errorText}>Passwords do not match</Text>
        )}

        <Text style={styles.subheading}>DOB</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setIsUserDobPickerVisible(true)}
        >
          <Text>{dob ? formatDate(dob) : "Select Date"}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isUserDobPickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(date) => {
            setDob(date);
            setIsUserDobPickerVisible(false);
          }}
          onCancel={() => setIsUserDobPickerVisible(false)}
        />

        <Text style={styles.subheading}>Signed Waiver</Text>
        <Switch value={signedWaiver} onValueChange={setSignedWaiver} />

        {renderTextInput("Waiver Link", waiverLink, setWaiverLink)}

        <Text style={styles.subheading}>Guest 1</Text>
        {renderTextInput("First Name", guest1FirstName, setGuest1FirstName, false, false, false, undefined, "guest1FirstName")}
        {renderTextInput("Last Name", guest1LastName, setGuest2LastName, false, false, false, undefined, "guest1LastName")}
        <Text style={styles.subheading}>DOB</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setIsGuest1DobPickerVisible(true)}
        >
          <Text>{guest1Dob ? formatDate(guest1Dob) : "Select Date"}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isGuest1DobPickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(date) => {
            setGuest1Dob(date);
            setIsGuest1DobPickerVisible(false);
          }}
          onCancel={() => setIsGuest1DobPickerVisible(false)}
        />
        {renderTextInput("Phone", guest1Phone, setGuest1Phone, false, false, false, undefined, "guest1Phone")}

        <Text style={styles.subheading}>Guest 2</Text>
        {renderTextInput("First Name", guest2FirstName, setGuest2FirstName, false, false, false, undefined, "guest2FirstName")}
        {renderTextInput("Last Name", guest2LastName, setGuest2LastName, false, false, false, undefined, "guest2LastName")}
        <Text style={styles.subheading}>DOB</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setIsGuest2DobPickerVisible(true)}
        >
          <Text>{guest2Dob ? formatDate(guest2Dob) : "Select Date"}</Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isGuest2DobPickerVisible}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(date) => {
            setGuest2Dob(date);
            setIsGuest2DobPickerVisible(false);
          }}
          onCancel={() => setIsGuest2DobPickerVisible(false)}
        />
        {renderTextInput("Phone", guest2Phone, setGuest2Phone, false, false, false, undefined, "guest2Phone")}

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
