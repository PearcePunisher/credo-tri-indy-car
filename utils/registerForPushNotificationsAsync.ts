import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Verbose / instrumented push registration for debugging Android token acquisition.
 * NOTE: Remove or gate logs once resolved to reduce noise.
 */
export async function registerForPushNotificationsAsync() {
  const start = Date.now();
  console.log("[PushReg] ▶️ Starting registration flow (platform=", Platform.OS, ")");

  if (!Device.isDevice) {
    console.log("[PushReg] ❌ Not a physical device (emulator without Google Play or web) - aborting");
    throw new Error("Must use physical device for push notifications");
  }

  // ANDROID: ensure channel
  if (Platform.OS === "android") {
    try {
      console.log("[PushReg] ⚙️ Setting Android notification channel 'default'");
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
      console.log("[PushReg] ✅ Channel set");
    } catch (channelErr) {
      console.log("[PushReg] ⚠️ Channel setup failed:", channelErr);
    }
  }

  // Permissions
  console.log("[PushReg] 🔐 Checking existing notification permissions...");
  let permissions = await Notifications.getPermissionsAsync();
  console.log("[PushReg] 🔐 Existing permissions status=", permissions.status, " canAskAgain=", permissions.canAskAgain);

  if (permissions.status !== "granted") {
    console.log("[PushReg] 🔐 Requesting notification permissions...");
    permissions = await Notifications.requestPermissionsAsync();
    console.log("[PushReg] 🔐 After request status=", permissions.status, " canAskAgain=", permissions.canAskAgain);
  }

  if (permissions.status !== "granted") {
    console.log("[PushReg] ❌ Permission denied - cannot fetch push token");
    throw new Error("Permission not granted to get push token");
  }

  // Project ID resolution (required for Android / EAS builds)
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
  console.log("[PushReg] 🏷 Resolved projectId=", projectId);
  if (!projectId) {
    console.log("[PushReg] ❌ Missing EAS projectId in app.json extra.eas.projectId");
    throw new Error("Project ID not found");
  }

  // Attempt token retrieval with simple retries
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[PushReg] 🎯 Fetching Expo push token (attempt ${attempt}/${MAX_ATTEMPTS})`);
      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenResponse.data;
      console.log("[PushReg] ✅ Received token:", token);
      console.log("[PushReg] ⏱ Total time:", Date.now() - start, "ms");
      return token;
    } catch (err) {
      console.log(`[PushReg] ⚠️ Token fetch failed on attempt ${attempt}:`, err);
      if (attempt < MAX_ATTEMPTS) {
        const backoff = 300 * attempt;
        console.log(`[PushReg] ⏳ Retrying in ${backoff}ms...`);
        await new Promise((r) => setTimeout(r, backoff));
      } else {
        console.log("[PushReg] ❌ Exhausted token fetch retries");
        throw new Error(`Failed to obtain Expo push token: ${err}`);
      }
    }
  }
  // Should not reach here
  throw new Error("Unexpected push registration flow termination");
}
