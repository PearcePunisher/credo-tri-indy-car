import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store'; // 🔐 Secure token storage

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// SecureStore key
const SESSION_KEY = 'user_session_token';

export default function LoginPage() {
  const [googleUserInfo, setGoogleUserInfo] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [manualUser, setManualUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      scopes: ['profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
    },
    discovery
  );

  // Google OAuth flow
  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
        .then(res => res.json())
        .then(data => setGoogleUserInfo(data))
        .catch(err => console.error(err));
    }
  }, [response]);

  // Load session token on mount
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(SESSION_KEY);
      if (token) {
        // Normally you'd fetch user info with this token
        setManualUser({ name: 'Session User', email: 'session@stored.com' });
        setSessionToken(token);
      }
    })();
  }, []);

  // Manual login (simulate getting a session token from API)
  const handleManualLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (email === 'test@example.com' && password === 'password123') {
      const fakeToken = 'abc123-session-token'; // ✅ This would come from your backend
      await SecureStore.setItemAsync(SESSION_KEY, fakeToken); // 🔐 Save securely
      setManualUser({ name: 'Test User', email });
      setSessionToken(fakeToken);
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  // Logout clears session
  const handleLogout = async () => {
    setGoogleUserInfo(null);
    setManualUser(null);
    setSessionToken(null);
    setEmail('');
    setPassword('');
    await SecureStore.deleteItemAsync(SESSION_KEY); // ❌ Clear stored token
  };

  const isLoggedIn = googleUserInfo || manualUser;

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
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
          {sessionToken && (
            <Text style={{ fontSize: 12, color: '#888' }}>
              Session Token: {sessionToken}
            </Text>
          )}
          <Button title="Logout" onPress={handleLogout} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>Login</Text>

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

// 🎨 Styling
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
