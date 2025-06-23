import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

export default function QRCodePage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userId, setUserId] = useState('');
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  const generateUrl = () => {
    if (!email || !firstName || !lastName || !userId) {
      Alert.alert('Missing Fields', 'Please fill out all fields');
      return;
    }

    const baseUrl = 'https://themetesting.com';
    const params = new URLSearchParams({
      email,
      firstName,
      lastName,
      userId,
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    setQrUrl(fullUrl);
  };

  const handleAddToWallet = () => {
    if (!qrUrl) {
      Alert.alert('Generate QR First', 'Please generate the QR code first.');
      return;
    }

    // Replace this logic with real passkit / Google Wallet integration
    Alert.alert(
      'Add to Wallet',
      Platform.OS === 'ios'
        ? 'This would initiate adding to Apple Wallet.'
        : 'This would initiate adding to Google Wallet.'
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Event QR Code</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      <TextInput
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
        style={styles.input}
      />

      <Button title="Generate QR Code" onPress={generateUrl} />

      {qrUrl && (
        <View style={styles.qrContainer}>
          <Text style={styles.subtitle}>Your QR Code:</Text>
          <QRCode value={qrUrl} size={200} />
          <Text style={styles.url}>{qrUrl}</Text>
          <View style={{ marginTop: 20 }}>
            <Button title="Add to Wallet" onPress={handleAddToWallet} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    marginVertical: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginVertical: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  qrContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  url: {
    fontSize: 12,
    color: '#555',
    marginTop: 10,
    textAlign: 'center',
  },
});
