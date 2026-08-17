const User = require("../models/User");

// @desc    Save a push notification subscription for the user
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribeUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Case A: Native Mobile Token (Android / iOS)
    if (req.body.platform && (req.body.platform === "android" || req.body.platform === "ios")) {
      const { platform, token } = req.body;

      const exists = user.deviceTokens.some(
        (dev) => dev.platform === platform && dev.token === token
      );

      if (!exists) {
        user.deviceTokens.push({ platform, token });
        await user.save();
      }

      return res.status(201).json({ message: "Native device token saved." });
    }

    // Case B: Web Push Subscription (Browser) - EXACT existing behavior
    const subscription = req.body;
    if (subscription && subscription.endpoint) {
      const exists = user.pushSubscriptions.some(
        (sub) => sub.endpoint === subscription.endpoint
      );

      if (!exists) {
        user.pushSubscriptions.push(subscription);
        await user.save();
      }

      return res.status(201).json({ message: "Web subscription saved." });
    }

    res.status(400).json({ message: "Invalid subscription payload." });
  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ message: "Failed to save subscription." });
  }
};

module.exports = { subscribeUser };