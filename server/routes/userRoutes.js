const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  searchUsers,
  toggleFollow // <-- Import the new controller
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // <-- Import auth middleware

router.post('/register', registerUser);
router.post('/login', loginUser);

// Search must be above /:username
router.get('/search', searchUsers); 

// Protected follow route
router.put('/:id/follow', protect, toggleFollow); // <-- Add this route

router.get('/:username', getUserProfile);

module.exports = router;