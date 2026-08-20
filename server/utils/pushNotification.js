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

// ============================================================
// WEB PUSH CONFIGURATION
// ============================================================

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ============================================================
// FIREBASE ADMIN INITIALIZATION
// ============================================================

const initializeFirebase = () => {
  // Already initialized
  if (getApps().length > 0) {
    return true;
  }

  try {
    const serviceAccountJson =
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      console.error(
        "❌ FIREBASE_SERVICE_ACCOUNT_JSON is missing"
      );
      return false;
    }

    const serviceAccount =
      JSON.parse(serviceAccountJson);

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log(
      "✅ Firebase Admin initialized successfully"
    );

    return true;
  } catch (error) {
    console.error(
      "❌ Firebase Admin initialization failed:",
      error.message
    );

    return false;
  }
};

// Initialize once when this module is loaded.
initializeFirebase();

// ============================================================
// SEND PUSH NOTIFICATION
// ============================================================

const sendPushNotification = async (
  targetUserId,
  payload
) => {
  try {
    const user = await User.findById(targetUserId);

    if (!user) {
      console.warn(
        "⚠️ Push target user not found:",
        targetUserId
      );

      return;
    }

    // ========================================================
    // A. WEB PUSH
    // ========================================================

    if (
      user.pushSubscriptions &&
      user.pushSubscriptions.length > 0
    ) {
      console.log(
        `🌐 Sending to ${user.pushSubscriptions.length} web subscription(s)`
      );

      const webPromises =
        user.pushSubscriptions.map(
          async (subscription) => {
            // ------------------------------------------------
            // Validate subscription
            // ------------------------------------------------

            const isValidSubscription =
              subscription &&
              subscription.endpoint &&
              subscription.keys &&
              subscription.keys.auth &&
              subscription.keys.p256dh;

            if (!isValidSubscription) {
              console.warn(
                "🧹 Removing malformed web subscription:",
                subscription?.endpoint ||
                  "(missing endpoint)"
              );

              try {
                await User.updateOne(
                  { _id: targetUserId },
                  {
                    $pull: {
                      pushSubscriptions: {
                        _id: subscription?._id,
                      },
                    },
                  }
                );
              } catch (cleanupError) {
                console.error(
                  "❌ Failed to remove malformed web subscription:",
                  cleanupError.message
                );
              }

              return;
            }

            // ------------------------------------------------
            // Send Web Push
            // ------------------------------------------------

            try {
              await webpush.sendNotification(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    auth: subscription.keys.auth,
                    p256dh:
                      subscription.keys.p256dh,
                  },
                },
                JSON.stringify(payload)
              );

              console.log(
                "✅ Web push sent:",
                subscription.endpoint
              );
            } catch (error) {
              console.error(
                "❌ Web Push Error:",
                {
                  statusCode:
                    error.statusCode,
                  message: error.message,
                  endpoint:
                    subscription.endpoint,
                }
              );

              // 404/410 means the subscription
              // is no longer valid.
              if (
                error.statusCode === 404 ||
                error.statusCode === 410
              ) {
                console.log(
                  "🧹 Removing expired web subscription"
                );

                try {
                  await User.updateOne(
                    { _id: targetUserId },
                    {
                      $pull: {
                        pushSubscriptions: {
                          _id: subscription._id,
                        },
                      },
                    }
                  );
                } catch (cleanupError) {
                  console.error(
                    "❌ Failed to remove expired web subscription:",
                    cleanupError.message
                  );
                }
              }
            }
          }
        );

      await Promise.all(webPromises);
    }

    // ========================================================
    // B. NATIVE PUSH
    // Android / iOS
    // ========================================================

    if (
      user.deviceTokens &&
      user.deviceTokens.length > 0
    ) {
      console.log(
        `📱 Sending to ${user.deviceTokens.length} native device token(s)`
      );

      const firebaseReady =
        initializeFirebase();

      if (!firebaseReady) {
        console.error(
          "❌ Firebase Admin is not initialized. Cannot send native push."
        );

        return;
      }

      const nativePromises =
        user.deviceTokens.map(
          async (device) => {
            if (
              !device ||
              !device.token
            ) {
              console.warn(
                "⚠️ Skipping invalid native device entry"
              );

              return;
            }

            const platform =
              device.platform || "unknown";

            try {
              // ------------------------------------------------
              // FCM message
              // ------------------------------------------------

              const message = {
                token: device.token,

                notification: {
                  title:
                    payload.title ||
                    "MoBoxd",
                  body:
                    payload.body ||
                    "",
                },

                // All FCM data values must be strings.
                data: {
                  url: String(
                    payload.url || "/"
                  ),
                  route: String(
                    payload.route || ""
                  ),
                },

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

              // ------------------------------------------------
              // Send through Firebase
              // ------------------------------------------------

              const messageId =
                await getMessaging().send(
                  message
                );

              console.log(
                `✅ ${platform} push sent:`,
                {
                  token:
                    device.token.length >
                    20
                      ? `${device.token.slice(
                          0,
                          20
                        )}...`
                      : device.token,
                  messageId,
                }
              );
            } catch (error) {
              console.error(
                `❌ ${platform} push failed:`,
                {
                  code: error.code,
                  message:
                    error.message,
                  token:
                    device.token.length >
                    20
                      ? `${device.token.slice(
                          0,
                          20
                        )}...`
                      : device.token,
                }
              );

              // ------------------------------------------------
              // Remove invalid FCM/APNs token
              // ------------------------------------------------

              const invalidToken =
                error.code ===
                  "messaging/invalid-registration-token" ||
                error.code ===
                  "messaging/registration-token-not-registered";

              if (invalidToken) {
                console.log(
                  `🧹 Removing invalid ${platform} token`
                );

                try {
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

                  console.log(
                    "✅ Invalid native token removed"
                  );
                } catch (cleanupError) {
                  console.error(
                    "❌ Failed to remove invalid native token:",
                    cleanupError.message
                  );
                }
              }
            }
          }
        );

      await Promise.all(nativePromises);
    }
  } catch (error) {
    console.error(
      "❌ Error in sendPushNotification helper:",
      error
    );
  }
};

module.exports = {
  sendPushNotification,
};