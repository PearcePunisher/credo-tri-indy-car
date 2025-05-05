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
//import CookieManager from '@react-native-cookies/cookies';

WebBrowser.maybeCompleteAuthSession();

const COOKIE_NAME = 'session_token';
const COOKIE_DOMAIN = 'example.com'; // ← Change to your domain when using backend
const COOKIE_EXPIRATION_HOURS = 72;

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

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

  // Google OAuth Flow
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

  // Load session cookie on mount
  useEffect(() => {
    (async () => {
      const cookies = await CookieManager.get(COOKIE_DOMAIN);
      const cookie = cookies[COOKIE_NAME];
      if (cookie?.value) {
        setManualUser({ name: 'Session User', email: 'session@stored.com' });
        setSessionToken(cookie.value);
      }
    })();
  }, []);

  // Manual Login → Set Cookie
  const handleManualLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (email === 'test@example.com' && password === 'password123') {
      const fakeToken = 'abc123-session-token';

      // Set cookie with expiration (72 hours from now)
      const expirationDate = new Date(Date.now() + COOKIE_EXPIRATION_HOURS * 60 * 60 * 1000).toISOString();

      await CookieManager.set(COOKIE_DOMAIN, {
        name: COOKIE_NAME,
        value: fakeToken,
        domain: COOKIE_DOMAIN,
        path: '/',
        expires: expirationDate,
        secure: true,
        httpOnly: true,
      });

      setManualUser({ name: 'Test User', email });
      setSessionToken(fakeToken);
    } else {
      Alert.alert('Login Failed', 'Invalid email or password');
    }
  };

  // Logout → Clear Cookie
  const handleLogout = async () => {
    setGoogleUserInfo(null);
    setManualUser(null);
    setSessionToken(null);
    setEmail('');
    setPassword('');
    await CookieManager.clearByName(COOKIE_NAME);
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
