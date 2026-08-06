const Activity = require('../models/Activity');
const User = require('../models/User');

// @desc    Get user's incoming activity feed (from people they follow)
// @route   GET /api/activity
// @access  Private
const getActivityFeed = async (req, res) => {
  try {
    // 1. Get the current user to see who they follow
    const currentUser = await User.findById(req.user._id);

    // 2. Fetch activities where the actor is someone the user follows, OR the target is the user
    const activities = await Activity.find({
      $or: [
        { actor: { $in: currentUser.following } },
        { targetUser: req.user._id }
      ]
    })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50) // Keep the feed fast
      .populate('actor', 'username displayName profilePicture')
      .populate('targetUser', 'username displayName')
      .populate('post', 'imageUrl category authorRating');

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Server error fetching activity' });
  }
};

const getUnreadActivityCount = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const lastChecked = currentUser.lastActivityCheck || new Date(0);

    // Count activities created after the user's last check (excluding their own actions)
    const count = await Activity.countDocuments({
      createdAt: { $gt: lastChecked },
      actor: { $ne: req.user._id } 
    });

    res.status(200).json({ hasUnread: count > 0, count });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unread activity", error: error.message });
  }
};

// @desc    Mark activity as read (Update last checked timestamp)
// @route   PUT /api/activity/mark-read
// @access  Private
const markActivityAsRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      lastActivityCheck: Date.now()
    });
    res.status(200).json({ message: "Activity marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update activity status", error: error.message });
  }
};

module.exports = { getActivityFeed,
  getUnreadActivityCount, 
  markActivityAsRead };
