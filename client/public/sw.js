// public/sw.js

// 1. Listen for the incoming push message from your backend
self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    // Parse the JSON payload sent from your Node.js backend
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/pwa-192x192.png", // Ensure this matches an actual icon in your public folder!
      badge: "/pwa-192x192.png", // Small monochrome icon for the Android status bar (optional)
      vibrate: [200, 100, 200], // Vibration pattern
      data: {
        url: data.url || "/", // The URL to open when the notification is clicked
      },
    };

    // Show the native notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (err) {
    console.error("Error parsing push payload", err);
  }
});

// 2. Handle what happens when the user taps the notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Instantly close the notification banner

  const targetUrl = event.notification.data.url;

  // This opens the app to the specific URL (e.g., the Activity page)
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open in a tab, just focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a fresh window/app instance
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});