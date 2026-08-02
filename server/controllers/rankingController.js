const Ranking = require("../models/Ranking");
const RankingSubmission = require("../models/RankingSubmission");

// @desc    Create a new ranking lobby
// @route   POST /api/rankings
// @access  Private
const createRanking = async (req, res) => {
  try {
    const { title, description, category, visibility, items } = req.body;

    // Ensure they provided items
    if (!items || items.length < 2) {
      return res
        .status(400)
        .json({ message: "A ranking must have at least 2 items." });
    }

    // Format items for MongoDB
    const formattedItems = items.map((name) => ({ name }));

    const ranking = await Ranking.create({
      title,
      description,
      category,
      visibility,
      creator: req.user._id,
      items: formattedItems,
    });

    res.status(201).json(ranking);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create ranking", error: error.message });
  }
};

// @desc    Submit a user's ranking (and update consensus)
// @route   POST /api/rankings/:id/submit
// @access  Private
const submitRanking = async (req, res) => {
  try {
    const rankingId = req.params.id;
    const { rankedItems } = req.body;
    // rankedItems should look like: [{ itemId: '...', rankPosition: 1 }, { itemId: '...', rankPosition: 2 }]

    const ranking = await Ranking.findById(rankingId);
    if (!ranking) {
      return res.status(404).json({ message: "Ranking lobby not found" });
    }

    const totalItems = ranking.items.length;

    // 1. VALIDATION: Ensure every single item is ranked
    if (!rankedItems || rankedItems.length !== totalItems) {
      return res
        .status(400)
        .json({ message: `You must rank all ${totalItems} items.` });
    }

    // 2. VALIDATION: Ensure there are no ties (rankPositions must be exactly 1 through N)
    const positions = rankedItems
      .map((item) => item.rankPosition)
      .sort((a, b) => a - b);
    for (let i = 0; i < totalItems; i++) {
      if (positions[i] !== i + 1) {
        return res
          .status(400)
          .json({
            message:
              "Invalid ranking positions. No ties allowed and all positions must be filled.",
          });
      }
    }

    // 3. Save or Update the User's Submission
    // We use findOneAndUpdate with upsert to allow users to edit their ranking later
    await RankingSubmission.findOneAndUpdate(
      { rankingId, userId: req.user._id },
      { rankedItems },
      { new: true, upsert: true },
    );

    // 4. AGGREGATION: Recalculate the Community Consensus (Borda Count)
    const allSubmissions = await RankingSubmission.find({ rankingId });

    // Create an object to store points for each item
    const scoreMap = {};
    ranking.items.forEach((item) => {
      scoreMap[item._id.toString()] = {
        itemId: item._id,
        name: item.name,
        points: 0,
      };
    });

    // Award points: 1st place gets N points, 2nd gets N-1, etc.
    allSubmissions.forEach((sub) => {
      sub.rankedItems.forEach((item) => {
        const pointsAwarded = totalItems - item.rankPosition + 1;
        if (scoreMap[item.itemId.toString()]) {
          scoreMap[item.itemId.toString()].points += pointsAwarded;
        }
      });
    });

    // Sort items by highest points to determine the new consensus
    const newConsensus = Object.values(scoreMap)
      .sort((a, b) => b.points - a.points)
      .map((item, index) => ({
        itemId: item.itemId,
        name: item.name,
        rankPosition: index + 1,
        totalPoints: item.points,
      }));

    // 5. Update the main Ranking lobby with the new stats
    ranking.aggregatedStats.participantCount = allSubmissions.length;
    ranking.aggregatedStats.consensus = newConsensus;
    await ranking.save();

    res.status(200).json({
      message: "Ranking submitted successfully",
      consensus: newConsensus,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to submit ranking", error: error.message });
  }
};

// @desc    Get public rankings for the feed
// @route   GET /api/rankings/feed
// @access  Public (or Private depending on your preference)
const getRankingsFeed = async (req, res) => {
  try {
    // Fetch all public rankings, sorted by newest
    const rankings = await Ranking.find({ visibility: "PUBLIC" })
      .populate("creator", "username profilePicture displayName")
      .sort({ createdAt: -1 });

    res.status(200).json(rankings);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch rankings feed", error: error.message });
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
    res
      .status(500)
      .json({
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
};
