const webpush = require("web-push");

const {
  initializeApp,
  cert,
  getApps,
} = require("firebase-admin/app");

const {
  getMessaging,
} = require("firebase-admin/messaging");

const User = require("../models/User");

const fs = require("fs");
const path = require("path");

// ==========================================
// WEB PUSH
// ==========================================

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ==========================================
// FIREBASE ADMIN
// ==========================================

if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    const serviceAccountPath = path.resolve(
      process.cwd(),
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    );

    const serviceAccount = JSON.parse(
      fs.readFileSync(
        serviceAccountPath,
        "utf8"
      )
    );

    if (getApps().length === 0) {
      initializeApp({
        credential: cert(serviceAccount),
      });

      console.log(
        "✅ Firebase Admin initialized successfully."
      );
    }
  } catch (e) {
    console.warn(
      "⚠️ Firebase Admin failed to initialize:",
      e.message
    );
  }
}


// ==========================================
// SEND PUSH NOTIFICATION
// ==========================================

const sendPushNotification = async (
  targetUserId,
  payload
) => {
  try {
    const user = await User.findById(targetUserId);

    if (!user) {
      return;
    }

    // ==========================================
    // A. WEB PUSH
    // ==========================================

    if (
      user.pushSubscriptions &&
      user.pushSubscriptions.length > 0
    ) {
      const pushPayload =
        JSON.stringify(payload);

      const webPromises =
        user.pushSubscriptions.map(
          async (subscription) => {
            try {
              await webpush.sendNotification(
                subscription,
                pushPayload
              );

              console.log(
                "✅ Web push sent:",
                subscription.endpoint
              );

            } catch (error) {
              // Subscription is permanently invalid
              if (
                error.statusCode === 404 ||
                error.statusCode === 410
              ) {
                console.log(
                  "🧹 Removing invalid web subscription"
                );

                // IMPORTANT:
                // Do NOT mutate `user` and call user.save().
                // Use an atomic MongoDB update instead.
                await User.updateOne(
                  { _id: targetUserId },
                  {
                    $pull: {
                      pushSubscriptions: {
                        endpoint:
                          subscription.endpoint,
                      },
                    },
                  }
                );

              } else {
                console.error(
                  "❌ Web Push Error:",
                  error
                );
              }
            }
          }
        );

      await Promise.all(webPromises);
    }


    // ==========================================
    // B. NATIVE PUSH
    // Android / iOS
    // ==========================================

    if (
      user.deviceTokens &&
      user.deviceTokens.length > 0 &&
      getApps().length > 0
    ) {
      const nativePromises =
        user.deviceTokens.map(
          async (device) => {
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
                  priority: "high",

                  notification: {
                    sound: "default",
                    channelId: "default",
                  },
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

              await getMessaging().send(
                message
              );

              console.log(
                `✅ ${device.platform} push sent`
              );

            } catch (error) {
              const invalidToken =
                error.code ===
                  "messaging/invalid-registration-token" ||
                error.code ===
                  "messaging/registration-token-not-registered";

              if (invalidToken) {
                console.log(
                  "🧹 Removing invalid FCM/APNs token"
                );

                // IMPORTANT:
                // Atomic removal — no user.save().
                await User.updateOne(
                  { _id: targetUserId },
                  {
                    $pull: {
                      deviceTokens: {
                        token: device.token,
                      },
                    },
                  }
                );

              } else {
                console.error(
                  "❌ FCM Send Error:",
                  error
                );
              }
            }
          }
        );

      await Promise.all(nativePromises);
    }

  } catch (error) {
    console.error(
      "Error in sendPushNotification helper:",
      error
    );
  }
};

module.exports = {
  sendPushNotification,
};