import axios from "axios";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

// ==========================================
// WEB PUSH HELPER
// ==========================================

export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

// ==========================================
// NATIVE PUSH STATE
// ==========================================

// Store the latest logged-in user's JWT.
// The registration listener reads from this variable.
let currentUserToken = null;

// Ensures listeners are only created once.
let nativeListenersInitialized = false;

// Prevents two registrations from happening simultaneously.
let nativeRegistrationInProgress = false;

// ==========================================
// INITIALIZE NATIVE PUSH LISTENERS
// ==========================================

const initializeNativePushListeners = async () => {
  // Do not create duplicate listeners
  if (nativeListenersInitialized) {
    return;
  }

  nativeListenersInitialized = true;

  // ------------------------------------------
  // FCM TOKEN RECEIVED
  // ------------------------------------------

  await PushNotifications.addListener("registration", async (token) => {
    // Safety check
    if (!currentUserToken) {
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
        {
          token: token.value,
          platform: Capacitor.getPlatform(),
        },
        {
          headers: {
            Authorization: `Bearer ${currentUserToken}`,
          },
        },
      );
    } catch (error) {
      console.error(
        "❌ Failed to save Android device token:",
        error.response?.data || error,
      );
    }
  });

  // ------------------------------------------
  // FCM REGISTRATION ERROR
  // ------------------------------------------

  await PushNotifications.addListener("registrationError", (error) => {
    console.error("❌ FCM REGISTRATION ERROR:", error);
  });
};

// ==========================================
// MAIN SUBSCRIPTION FUNCTION
// ==========================================

export const subscribeToPushNotifications = async (userToken) => {
  try {
    // ==========================================
    // NATIVE PUSH
    // ==========================================

    if (Capacitor.isNativePlatform()) {
      // Always update the current JWT
      currentUserToken = userToken;

      // Prevent simultaneous registrations
      if (nativeRegistrationInProgress) {
        return true;
      }

      nativeRegistrationInProgress = true;

      try {
        // Check permission
        let permStatus = await PushNotifications.checkPermissions();

        // Ask permission if required
        if (permStatus.receive === "prompt") {
          permStatus = await PushNotifications.requestPermissions();
        }

        // Stop if permission denied
        if (permStatus.receive !== "granted") {
          console.error("❌ Notification permission not granted");

          return false;
        }

        // Create listeners ONLY ONCE
        await initializeNativePushListeners();

        // Trigger FCM registration
        await PushNotifications.register();

        return true;
      } finally {
        // Allow future registrations after this finishes
        nativeRegistrationInProgress = false;
      }
    }

    // ==========================================
    // WEB PUSH
    // ==========================================

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.error("❌ Push notifications not supported");

      return false;
    }

    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.error("❌ Notification permission not granted");

      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY,
        ),
      });
    }

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
      {
        token: subscription,
        platform: "web",
        endpoint: subscription.endpoint,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      },
    );

    return true;
  } catch (error) {
    console.error("❌ Push registration error:", error.response?.data || error);

    return false;
  }
};
