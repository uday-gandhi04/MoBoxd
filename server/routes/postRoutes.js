const express = require('express');
const router = express.Router();
const { 
  getFeedPosts, 
  createPost, 
  getPostById, 
  addReview,
  deletePost,
  toggleLike
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

// Base routes (/api/posts)
router.route('/')
  .get(getFeedPosts)
  .post(protect, upload.single('image'), createPost);


// Delete post route (/api/posts/:id)
router.route('/:id')
  .get(getPostById)
  .delete(protect, deletePost);

// Like route (/api/posts/:id/like)
router.route('/:id/like')
  .put(protect, toggleLike); // <-- Add this route

// Single post routes (/api/posts/:id)
router.route('/:id')
  .get(getPostById);

// Review routes (/api/posts/:id/reviews)
router.route('/:id/reviews')
  .post(protect, addReview);



module.exports = router;