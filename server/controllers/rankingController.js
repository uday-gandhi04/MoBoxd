const Ranking = require("../models/Ranking");
const RankingSubmission = require("../models/RankingSubmission");
const Activity = require("../models/Activity");

// @desc    Create a new ranking lobby
// @route   POST /api/rankings
// @access  Private
// ... existing imports ...

const createRanking = async (req, res) => {
  try {
    const { title, description, category, visibility, items } = req.body;
    if (!items || items.length < 2)
      return res.status(400).json({ message: "Minimum 2 items required." });

    const formattedItems = items.map((name) => ({ name }));
    const ranking = await Ranking.create({
      title,
      description,
      category,
      visibility,
      creator: req.user._id,
      items: formattedItems,
    });

    // ACTIVITY TRIGGER: Log the lobby creation
    await Activity.create({
      actor: req.user._id,
      actionType: "CREATE_RANKING",
      ranking: ranking._id,
    });

    res.status(201).json(ranking);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create ranking", error: error.message });
  }
};

const submitRanking = async (req, res) => {
  try {
    const rankingId = req.params.id;
    const { rankedItems } = req.body;
    const ranking = await Ranking.findById(rankingId);

    if (!ranking)
      return res.status(404).json({ message: "Ranking lobby not found" });
    const totalItems = ranking.items.length;

    if (!rankedItems || rankedItems.length !== totalItems) {
      return res
        .status(400)
        .json({ message: `You must rank all ${totalItems} items.` });
    }

    const positions = rankedItems
      .map((item) => item.rankPosition)
      .sort((a, b) => a - b);
    for (let i = 0; i < totalItems; i++) {
      if (positions[i] !== i + 1)
        return res.status(400).json({ message: "No ties allowed." });
    }

    await RankingSubmission.findOneAndUpdate(
      { rankingId, userId: req.user._id },
      { rankedItems },
      { new: true, upsert: true },
    );

    // ACTIVITY TRIGGER: Log the submission (only if it doesn't already exist to prevent spam)
    const existingActivity = await Activity.findOne({
      actor: req.user._id,
      actionType: "SUBMIT_RANKING",
      ranking: rankingId,
    });
    if (!existingActivity) {
      await Activity.create({
        actor: req.user._id,
        actionType: "SUBMIT_RANKING",
        ranking: rankingId,
      });
    }

    const allSubmissions = await RankingSubmission.find({ rankingId });
    const scoreMap = {};
    ranking.items.forEach((item) => {
      scoreMap[item._id.toString()] = {
        itemId: item._id,
        name: item.name,
        points: 0,
      };
    });

    allSubmissions.forEach((sub) => {
      sub.rankedItems.forEach((item) => {
        const pointsAwarded = totalItems - item.rankPosition + 1;
        if (scoreMap[item.itemId.toString()])
          scoreMap[item.itemId.toString()].points += pointsAwarded;
      });
    });

    const newConsensus = Object.values(scoreMap)
      .sort((a, b) => b.points - a.points)
      .map((item, index) => ({
        itemId: item.itemId,
        name: item.name,
        rankPosition: index + 1,
        totalPoints: item.points,
      }));

    ranking.aggregatedStats.participantCount = allSubmissions.length;
    ranking.aggregatedStats.consensus = newConsensus;
    await ranking.save();

    res
      .status(200)
      .json({ message: "Ranking submitted", consensus: newConsensus });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to submit ranking", error: error.message });
  }
};

// ================= NEW DELETION CONTROLLERS ================= //

// @desc    Delete an entire ranking lobby (Creator only)
// @route   DELETE /api/rankings/:id
const deleteRankingLobby = async (req, res) => {
  try {
    const ranking = await Ranking.findById(req.params.id);
    if (!ranking) return res.status(404).json({ message: "Not found" });

    if (ranking.creator.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to delete this lobby" });
    }

    // Cascade delete submissions and activities
    await RankingSubmission.deleteMany({ rankingId: req.params.id });
    await Activity.deleteMany({ ranking: req.params.id });
    await ranking.deleteOne();

    res.status(200).json({ message: "Lobby deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a user's individual submission
// @route   DELETE /api/rankings/:id/my-submission
const deleteMySubmission = async (req, res) => {
  try {
    const rankingId = req.params.id;
    const ranking = await Ranking.findById(rankingId);
    if (!ranking) return res.status(404).json({ message: "Not found" });

    // 1. Delete the submission and activity
    await RankingSubmission.findOneAndDelete({
      rankingId,
      userId: req.user._id,
    });
    await Activity.findOneAndDelete({
      actor: req.user._id,
      actionType: "SUBMIT_RANKING",
      ranking: rankingId,
    });

    // 2. Recalculate Borda Count with the remaining submissions
    const allSubmissions = await RankingSubmission.find({ rankingId });
    const scoreMap = {};
    const totalItems = ranking.items.length;

    ranking.items.forEach((item) => {
      scoreMap[item._id.toString()] = {
        itemId: item._id,
        name: item.name,
        points: 0,
      };
    });

    allSubmissions.forEach((sub) => {
      sub.rankedItems.forEach((item) => {
        const pointsAwarded = totalItems - item.rankPosition + 1;
        if (scoreMap[item.itemId.toString()])
          scoreMap[item.itemId.toString()].points += pointsAwarded;
      });
    });

    const newConsensus = Object.values(scoreMap)
      .sort((a, b) => b.points - a.points)
      .map((item, index) => ({
        itemId: item.itemId,
        name: item.name,
        rankPosition: index + 1,
        totalPoints: item.points,
      }));

    ranking.aggregatedStats.participantCount = allSubmissions.length;
    ranking.aggregatedStats.consensus = newConsensus;
    await ranking.save();

    res.status(200).json({ message: "Submission deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get public rankings for the feed
// @route   GET /api/rankings/feed
// @access  Public (or Private depending on your preference)
const getRankingsFeed = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { visibility: 'PUBLIC' };
    
    if (category) {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    const rankings = await Ranking.find(query)
      .populate('creator', 'username profilePicture displayName')
      .sort({ createdAt: -1 });

    res.status(200).json(rankings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rankings feed', error: error.message });
  }
};

// @desc    Get a single ranking lobby by ID
// @route   GET /api/rankings/:id
// @access  Private
const getRankingById = async (req, res) => {
  try {
    const ranking = await Ranking.findById(req.params.id).populate(
      "creator",
      "username profilePicture displayName",
    );

    if (!ranking) {
      return res.status(404).json({ message: "Ranking not found" });
    }

    res.status(200).json(ranking);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch ranking", error: error.message });
  }
};

// @desc    Get the current user's submission for a specific ranking
// @route   GET /api/rankings/:id/my-submission
// @access  Private
const getUserSubmission = async (req, res) => {
  try {
    const submission = await RankingSubmission.findOne({
      rankingId: req.params.id,
      userId: req.user._id,
    });

    if (!submission) {
      return res.status(200).json(null); // User hasn't submitted yet
    }

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your submission",
      error: error.message,
    });
  }
};

module.exports = {
  createRanking,
  submitRanking,
  getRankingsFeed,
  getRankingById,
  getUserSubmission,
  deleteRankingLobby,
  deleteMySubmission,
};
