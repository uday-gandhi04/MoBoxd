// backend/utils/pushNotification.js
const webpush = require("web-push");
const User = require("../models/User");

// 1. Configure web-push with your keys from .env
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// 2. The reusable notification function
const sendPushNotification = async (targetUserId, payload) => {
  try {
    const user = await User.findById(targetUserId);
    
    // If user doesn't exist or has no subscriptions, just exit quietly
    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return;
    }

    const pushPayload = JSON.stringify(payload);
    let subscriptionsChanged = false;

    // 3. Send the notification to EVERY device the user is logged into
    const promises = user.pushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, pushPayload);
      } catch (error) {
        // 4. Auto-cleanup: If the browser rejected it (410 or 404), the subscription is dead.
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log("Removing expired push subscription");
          user.pushSubscriptions = user.pushSubscriptions.filter(
            (s) => s.endpoint !== sub.endpoint
          );
          subscriptionsChanged = true;
        } else {
          console.error("Push notification failed:", error);
        }
      }
    });

    await Promise.all(promises);

    // Save the user document if we had to delete any dead subscriptions
    if (subscriptionsChanged) {
      await user.save();
    }
    
  } catch (error) {
    console.error("Error in sendPushNotification helper:", error);
  }
};

module.exports = { sendPushNotification };