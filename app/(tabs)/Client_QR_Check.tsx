import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Platform,
} from 'react-native';
 import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession(); // Finalize SSO sessions if neededd

// 👇 Your Google OAuth Web Client ID (from Google Cloud Console)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// 👇 Google's OAuth 2.0 discovery endpoints
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function Client_QR_Check() {
  // 👇 State to hold Google SSO user info
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);

  // 👇 State for manual login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualUser, setManualUser] = useState<any>(null);
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const getParamsFromURL = async () => {
      const url = await Linking.getInitialURL();

      if (url) {
        const queryString = url.split('?')[1];
        const urlParams = new URLSearchParams(queryString);
        const paramObj: Record<string, string> = {};

        for (const [key, value] of urlParams.entries()) {
          paramObj[key] = value;
        }

        setParams(paramObj);
      }
    };

    getParamsFromURL();
  }, []);

  const renderCheck = (value: string) => {
    if (value.toLowerCase() === 'true') return '✅';
    if (value.toLowerCase() === 'false') return '❌';
    return '';
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Scanned URL Parameters</Text>

      {Object.keys(params).length === 0 ? (
        <Text>No parameters found in URL.</Text>
      ) : (
        Object.entries(params).map(([key, value]) => (
          <View key={key} style={styles.paramRow}>
            <Text style={styles.paramKey}>{key}</Text>
            <Text style={styles.paramValue}>
              {value} {renderCheck(value)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'white'
  },
  paramRow: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paramKey: {
    fontWeight: 'bold',
    marginRight: 10,
    minWidth: 100,
    color: 'blue'
  },
  paramValue: {
    fontSize: 16,
    color: 'green'
  },
});
