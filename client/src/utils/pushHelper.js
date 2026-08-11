import axios from 'axios';

export const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const subscribeToPushNotifications = async (userToken, silent = false) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    if (!silent) alert("Push notifications are not supported by your browser.");
    return false;
  }

  try {
    // 1. Ask for permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      if (!silent) alert("You need to allow notifications in your browser site settings to receive updates.");
      return false;
    }

    // 2. Get the active Service Worker Registration
    const registration = await navigator.serviceWorker.ready;
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    // 3. Subscribe the user
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    // 4. Send to backend
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
      subscription,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    if (!silent) alert("Notifications enabled successfully!");
    return true; // Return true so our UI knows it worked
    
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
    if (!silent) alert("Failed to enable notifications.");
    return false;
  }
};