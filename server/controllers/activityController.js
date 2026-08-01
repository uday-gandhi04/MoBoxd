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

module.exports = { getActivityFeed };