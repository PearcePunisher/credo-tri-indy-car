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
} from "react-native";
import { Picker } from "@react-native-picker/picker";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [signedWaiver, setSignedWaiver] = useState(true);
  const [waiverLink, setWaiverLink] = useState("https://signedwaiver.com");

  const [guest1FirstName, setGuest1FirstName] = useState("");
  const [guest1LastName, setGuest1LastName] = useState("");
  const [guest1DobYear, setGuest1DobYear] = useState("");
  const [guest1DobMonth, setGuest1DobMonth] = useState("");
  const [guest1DobDay, setGuest1DobDay] = useState("");
  const [guest1Phone, setGuest1Phone] = useState("");

  const [guest2FirstName, setGuest2FirstName] = useState("");
  const [guest2LastName, setGuest2LastName] = useState("");
  const [guest2DobYear, setGuest2DobYear] = useState("");
  const [guest2DobMonth, setGuest2DobMonth] = useState("");
  const [guest2DobDay, setGuest2DobDay] = useState("");
  const [guest2Phone, setGuest2Phone] = useState("");

  const years: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1900; y--) {
    years.push(y.toString());
  }
  const months: string[] = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days: string[] = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  const formatDate = (year: string, month: string, day: string) => {
    if (!year || !month || !day) return "";
    const mm = month.padStart(2, "0");
    const dd = day.padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const userDOB = formatDate(dobYear, dobMonth, dobDay);
    const guest1DOB = formatDate(guest1DobYear, guest1DobMonth, guest1DobDay);
    const guest2DOB = formatDate(guest2DobYear, guest2DobMonth, guest2DobDay);

    const payload = {
      email: email,
      password: password,
      first_name: firstName,
      last_name: lastName,
      DOB: userDOB,
      signed_waiver: signedWaiver.toString(),
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
      const response = await fetch(
        "https://themetesting.kinsta.cloud/wp-json/wicked-api/v1/app_registration",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();
      console.log("Server response:", text);

      const cleaned = text.trim().replace(/[%]+$/, "");
      const data = JSON.parse(cleaned);
      console.log("Parsed JSON:", data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const renderTextInput = (
    placeholder: string,
    value: string,
    setter: (text: string) => void,
    secure: boolean = false
  ) => (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={setter}
      secureTextEntry={secure}
      style={styles.input}
      placeholderTextColor="#999"
    />
  );

  const renderDOBPicker = (
    year: string,
    setYear: (val: string) => void,
    month: string,
    setMonth: (val: string) => void,
    day: string,
    setDay: (val: string) => void
  ) => (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={year}
        style={styles.picker}
        onValueChange={(itemValue: string) => setYear(itemValue)}
      >
        <Picker.Item label="Year" value="" />
        {years.map((y) => (
          <Picker.Item key={y} label={y} value={y} />
        ))}
      </Picker>
      <Picker
        selectedValue={month}
        style={styles.picker}
        onValueChange={(itemValue: string) => setMonth(itemValue)}
      >
        <Picker.Item label="Month" value="" />
        {months.map((m) => (
          <Picker.Item key={m} label={m} value={m} />
        ))}
      </Picker>
      <Picker
        selectedValue={day}
        style={styles.picker}
        onValueChange={(itemValue: string) => setDay(itemValue)}
      >
        <Picker.Item label="Day" value="" />
        {days.map((d) => (
          <Picker.Item key={d} label={d} value={d} />
        ))}
      </Picker>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>User Registration</Text>

      {renderTextInput("First Name", firstName, setFirstName)}
      {renderTextInput("Last Name", lastName, setLastName)}
      {renderTextInput("Email", email, setEmail)}
      {renderTextInput("Password", password, setPassword, true)}
      {renderTextInput("Confirm Password", confirmPassword, setConfirmPassword, true)}

      <Text style={styles.subheading}>DOB</Text>
      {renderDOBPicker(dobYear, setDobYear, dobMonth, setDobMonth, dobDay, setDobDay)}

      <Text style={styles.subheading}>Signed Waiver</Text>
      <Switch value={signedWaiver} onValueChange={setSignedWaiver} />

      {renderTextInput("Waiver Link", waiverLink, setWaiverLink)}

      <Text style={styles.subheading}>Guest 1</Text>
      {renderTextInput("First Name", guest1FirstName, setGuest1FirstName)}
      {renderTextInput("Last Name", guest1LastName, setGuest1LastName)}
      <Text style={styles.subheading}>DOB</Text>
      {renderDOBPicker(guest1DobYear, setGuest1DobYear, guest1DobMonth, setGuest1DobMonth, guest1DobDay, setGuest1DobDay)}
      {renderTextInput("Phone", guest1Phone, setGuest1Phone)}

      <Text style={styles.subheading}>Guest 2</Text>
      {renderTextInput("First Name", guest2FirstName, setGuest2FirstName)}
      {renderTextInput("Last Name", guest2LastName, setGuest2LastName)}
      <Text style={styles.subheading}>DOB</Text>
      {renderDOBPicker(guest2DobYear, setGuest2DobYear, guest2DobMonth, setGuest2DobMonth, guest2DobDay, setGuest2DobDay)}
      {renderTextInput("Phone", guest2Phone, setGuest2Phone)}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  subheading: {
    fontSize: 16,
    fontWeight: "500",
    marginVertical: 10,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  pickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  picker: {
    flex: 1,
    height: 50,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: "#FF3B30",
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
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
