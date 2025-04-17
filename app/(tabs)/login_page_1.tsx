import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Image, StyleSheet, Platform } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

WebBrowser.maybeCompleteAuthSession(); // Finalize SSO sessions if needed

// 👇 Your Google OAuth Web Client ID (from Google Cloud Console)
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// 👇 Google's OAuth 2.0 discovery endpoints
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginPage() {
  // 👇 State to hold Google SSO user info
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);

  // 👇 State for manual login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualUser, setManualUser] = useState<any>(null);

  // 👇 AuthSession Hook for Google login
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: AuthSession.makeRedirectUri({
        useProxy: true, // Needed for Expo Go & Web support
      }),
      scopes: ['profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  // 👇 Handles Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;

      // 👇 Use the access token to fetch user profile
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
        .then((res) => res.json())
        .then((data) => setGoogleUserInfo(data))
        .catch((err) => console.error(err));
    }
  }, [response]);

  // 👇 Fake manual login handler (replace with real API call)
  const handleManualLogin = () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Simulate success for demo; hook to real backend in production
    if (email === 'test@example.com' && password === 'password123') {
      setManualUser({
        name: 'Test User',
        email,
      });
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  // 👇 Clear state on logout
  const handleLogout = () => {
    setGoogleUserInfo(null);
    setManualUser(null);
    setEmail('');
    setPassword('');
  };

  // 👇 Determine if user is logged in
  const isLoggedIn = googleUserInfo || manualUser;

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        // 👇 Show user profile if logged in
        <View style={styles.profileContainer}>
          {googleUserInfo?.picture && (
            <Image
              source={{ uri: googleUserInfo.picture }}
              style={styles.avatar}
            />
          )}
          <Text style={styles.title}>
            Welcome, {googleUserInfo?.name || manualUser?.name}!
          </Text>
          <Text>{googleUserInfo?.email || manualUser?.email}</Text>
          <Button title="Logout" onPress={handleLogout} />
        </View>
      ) : (
        // 👇 Show login form otherwise
        <>
          <Text style={styles.title}>Login</Text>

          {/* Manual Email/Password Login */}
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <Button title="Login with Email" onPress={handleManualLogin} />

          <View style={styles.divider} />

          {/* Google SSO Login */}
          <Button
            disabled={!request}
            title="Login with Google"
            onPress={() => promptAsync()}
          />
        </>
      )}
    </View>
  );
}

// 👇 Styling for the screen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginVertical: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 24,
  },
  profileContainer: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
});
