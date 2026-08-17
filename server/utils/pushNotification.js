const webpush = require("web-push");
// FIX: Use modern modular Firebase Admin imports
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// 1. Configure Web Push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 2. Configure Firebase Admin (for Android & iOS)
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    // FIX: Check getApps().length and use cert() directly
    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("✅ Firebase Admin initialized successfully.");
    }
  } catch (e) {
    console.warn("⚠️ Firebase Admin failed to initialize:", e.message);
  }
}

const sendPushNotification = async (targetUserId, payload) => {
  try {
    const user = await User.findById(targetUserId);
    if (!user) return;

    let userModified = false;

    // --- A. SEND TO WEB BROWSERS ---
    if (user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const pushPayload = JSON.stringify(payload);
      
      const webPromises = user.pushSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub, pushPayload);
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            user.pushSubscriptions = user.pushSubscriptions.filter(
              (s) => s.endpoint !== sub.endpoint
            );
            userModified = true;
          }
        }
      });
      await Promise.all(webPromises);
    }

    // --- B. SEND TO NATIVE MOBILE (FCM / APNs) ---
    // FIX: Check getApps().length instead of admin.apps.length
    if (user.deviceTokens && user.deviceTokens.length > 0 && getApps().length > 0) {
      const nativePromises = user.deviceTokens.map(async (device) => {
        try {
          const message = {
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data: {
              url: payload.url || "/",
            },
            token: device.token,
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
                channelId: 'default' 
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          };

          // FIX: Use getMessaging().send() instead of admin.messaging()
          await getMessaging().send(message);
        } catch (error) {
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            user.deviceTokens = user.deviceTokens.filter(
              (d) => d.token !== device.token
            );
            userModified = true;
          } else {
            console.error("FCM Send Error:", error);
          }
        }
      });
      await Promise.all(nativePromises);
    }

    if (userModified) {
      await user.save();
    }
  } catch (error) {
    console.error("Error in sendPushNotification helper:", error);
  }
};

module.exports = { sendPushNotification };