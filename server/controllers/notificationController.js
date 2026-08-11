const User = require("../models/User");

// @desc    Save a push notification subscription for the user
// @route   POST /api/notifications/subscribe
// @access  Private
const subscribeUser = async (req, res) => {
  try {
    const subscription = req.body;

    // Find the user and add the new subscription if it doesn't already exist
    const user = await User.findById(req.user._id);
    
    // Check if this exact endpoint already exists so we don't save duplicates
    const exists = user.pushSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      user.pushSubscriptions.push(subscription);
      await user.save();
    }

    res.status(201).json({ message: "Subscription saved successfully." });
  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ message: "Failed to save subscription." });
  }
};

module.exports = { subscribeUser };