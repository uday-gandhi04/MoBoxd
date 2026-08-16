// src/sw.js
import { precacheAndRoute } from 'workbox-precaching';

// 1. This magic line injects all your Vite assets for offline caching (making it a PWA)
precacheAndRoute(self.__WB_MANIFEST);

// 2. Your existing push notification logic stays exactly the same!
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/pwa-192x192.png", 
      badge: "/pwa-192x192.png", 
      vibrate: [200, 100, 200], 
      data: { url: data.url || "/" },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (err) {
    console.error("Error parsing push payload", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); 
  const targetUrl = new URL(event.notification.data.url, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});