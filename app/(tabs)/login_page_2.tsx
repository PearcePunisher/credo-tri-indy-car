import React, { useEffect, useState } from 'react';
import { Button, Text, View, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Use your own client ID from Google Cloud Consoled
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function LoginScreen() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({
      useProxy: true, // good for PWA and development
    }),
    scopes: ['profile', 'email'],
    responseType: AuthSession.ResponseType.Token,
  }, discovery);

  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;

      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      })
        .then(res => res.json())
        .then(data => setUserInfo(data));
    }
  }, [response]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {userInfo ? (
        <>
          <Image source={{ uri: userInfo.picture }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          <Text style={{ fontSize: 20, marginVertical: 10 }}>Welcome, {userInfo.name}!</Text>
          <Text>{userInfo.email}</Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 24, marginBottom: 20 }}>Login with Google</Text>
          <Button
            disabled={!request}
            title="Sign In"
            onPress={() => promptAsync()}
          />
        </>
      )}
    </View>
  );
}