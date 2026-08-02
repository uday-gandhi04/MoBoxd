const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  createRanking, 
  submitRanking, 
  getRankingsFeed, 
  getRankingById, 
  getUserSubmission 
} = require('../controllers/rankingController');

// Global Feed (Can be public or protected, using protect here so only logged-in users see it)
router.get('/feed', protect, getRankingsFeed);

// Create a new lobby
router.post('/', protect, createRanking);

// Get specific lobby data
router.get('/:id', protect, getRankingById);

// Submit or edit a ranking
router.post('/:id/submit', protect, submitRanking);

// Check if the current user already ranked this lobby
router.get('/:id/my-submission', protect, getUserSubmission);

module.exports = router;