import axios from 'axios';

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

export const subscribeToPushNotifications = async (userToken, silent = false) => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;

  try {
    let permission = Notification.permission;
    
    // Only ask for permission if they haven't decided yet
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    // If they denied it, exit
    if (permission !== "granted") return false;

    const registration = await navigator.serviceWorker.ready;
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    
    // Check if they already have an active subscription in the browser
    let subscription = await registration.pushManager.getSubscription();
    
    // If not, create a new one
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
    }

    // Always send the subscription to the backend to ensure the DB is up to date
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
      subscription,
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    return true;
  } catch (error) {
    console.error("Error managing push subscription:", error);
    return false;
  }
};