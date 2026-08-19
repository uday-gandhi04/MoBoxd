const User = require("../models/User");

// @desc    Save a push notification subscription for the user
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribeUser = async (req, res) => {
  try {
    const userId = req.user._id;

    // ==========================================
    // CASE A: Native Mobile Token
    // Android / iOS
    // ==========================================
    if (
      req.body.platform &&
      (req.body.platform === "android" || req.body.platform === "ios")
    ) {
      const { platform, token } = req.body;

      if (!token) {
        return res.status(400).json({
          message: "Device token is required.",
        });
      }

      // Atomic update:
      // Only add the token if the SAME platform + token
      // combination does not already exist.
      const result = await User.updateOne(
        {
          _id: userId,
          deviceTokens: {
            $not: {
              $elemMatch: {
                platform,
                token,
              },
            },
          },
        },
        {
          $push: {
            deviceTokens: {
              platform,
              token,
            },
          },
        }
      );

      // User not found
      if (result.matchedCount === 0) {
        const userExists = await User.exists({ _id: userId });

        if (!userExists) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        // Token already exists
        return res.status(200).json({
          message: "Native device token already exists.",
        });
      }

      return res.status(201).json({
        message: "Native device token saved.",
      });
    }

    // ==========================================
    // CASE B: Web Push Subscription
    // ==========================================
    const subscription = req.body;

    if (subscription && subscription.endpoint) {
      const result = await User.updateOne(
        {
          _id: userId,
          pushSubscriptions: {
            $not: {
              $elemMatch: {
                endpoint: subscription.endpoint,
              },
            },
          },
        },
        {
          $push: {
            pushSubscriptions: subscription,
          },
        }
      );

      if (result.matchedCount === 0) {
        const userExists = await User.exists({ _id: userId });

        if (!userExists) {
          return res.status(404).json({
            message: "User not found",
          });
        }

        return res.status(200).json({
          message: "Web subscription already exists.",
        });
      }

      return res.status(201).json({
        message: "Web subscription saved.",
      });
    }

    return res.status(400).json({
      message: "Invalid subscription payload.",
    });

  } catch (error) {
    console.error("Subscription Error:", error);

    return res.status(500).json({
      message: "Failed to save subscription.",
    });
  }
};

const unsubscribeUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { platform } = req.body;

    // Native Android / iOS
    if (
      platform &&
      (platform === "android" || platform === "ios")
    ) {
      const result = await User.updateOne(
        { _id: userId },
        {
          $pull: {
            deviceTokens: {
              platform,
            },
          },
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      return res.status(200).json({
        message: `Notifications disabled for ${platform}.`,
      });
    }

    // Web push
    // We intentionally do not remove the web subscription here
    // because the browser controls permission separately.
    return res.status(400).json({
      message: "Invalid unsubscribe platform.",
    });

  } catch (error) {
    console.error("Unsubscribe Error:", error);

    return res.status(500).json({
      message: "Failed to disable notifications.",
    });
  }
};

module.exports = {
  subscribeUser,
  unsubscribeUser,
};
