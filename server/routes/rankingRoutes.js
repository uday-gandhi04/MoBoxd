const express = require("express");
const router = express.Router();

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

const {
  createRanking,
  submitRanking,
  getRankingsFeed,
  getRankingById,
  getUserSubmission,
  deleteRankingLobby,
  deleteMySubmission,
  getLobbySubmissions,
} = require("../controllers/rankingController");

router.get("/feed", protect, getRankingsFeed);

router.post("/", protect, createRanking);

router.get("/:id", optionalProtect, getRankingById);

router.post("/:id/submit", protect, submitRanking);

router.get("/:id/my-submission", protect, getUserSubmission);

router.get("/:id/submissions", protect, getLobbySubmissions);

router.delete("/:id", protect, deleteRankingLobby);

router.delete("/:id/my-submission", protect, deleteMySubmission);

module.exports = router;