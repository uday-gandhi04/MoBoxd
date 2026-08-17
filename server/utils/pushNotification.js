const webpush = require("web-push");
const admin = require("firebase-admin");
const User = require("../models/User");

// 1. Configure Web Push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 2. Configure Firebase Admin (for Android & iOS)
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)),
    });
  } catch (e) {
    console.warn("Firebase Admin already initialized or invalid config:", e.message);
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
    if (user.deviceTokens && user.deviceTokens.length > 0 && admin.apps.length > 0) {
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
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          };

          await admin.messaging().send(message);
        } catch (error) {
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            user.deviceTokens = user.deviceTokens.filter(
              (d) => d.token !== device.token
            );
            userModified = true;
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