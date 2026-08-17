import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPushNotifications = async (userToken) => {
  try {
    if (Capacitor.isNativePlatform()) {
      // NATIVE PUSH (Android/iOS)
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') return false;

      await PushNotifications.register();

      // The token listener is set up in App.jsx to ensure it only registers once,
      // but we send the API request there.
      return true;

    } else {
      // WEB PUSH (Existing Logic)
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission !== "granted") return false;

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
        { token: subscription, platform: 'web', endpoint: subscription.endpoint },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      return true;
    }
  } catch (error) {
    console.error("Push registration error:", error);
    return false;
  }
};