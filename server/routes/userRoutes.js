const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  searchUsers,
  toggleFollow,
  updateProfile,
  googleAuth
} = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware'); // <-- Import auth middleware
const upload = require('../middleware/upload'); // Your Multer configuration

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);

router.put('/:id', protect, upload.single('profilePicture'), updateProfile);

// Search must be above /:username
router.get('/search', searchUsers); 

// Protected follow route
router.put('/:id/follow', protect, toggleFollow); // <-- Add this route

router.get('/:username', getUserProfile);

module.exports = router;