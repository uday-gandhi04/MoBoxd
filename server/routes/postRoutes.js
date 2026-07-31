const express = require("express");
const router = express.Router();
const {
  getFeedPosts,
  getPersonalFeed,
  createPost,
  getPostById,
  addReview,
  deletePost,
  toggleLike,
  updatePost,
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

// Base routes (/api/posts)
router.route("/")
  .get(getFeedPosts)
  .post(protect, upload.single("image"), createPost);

router.route("/feed")
  .get(protect, getPersonalFeed);

// Single post routes (/api/posts/:id)
// Grouped all single-ID operations into one block
router.route("/:id")
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Like route (/api/posts/:id/like)
router.route("/:id/like")
  .put(protect, toggleLike);

// Review routes (/api/posts/:id/reviews)
router.route("/:id/reviews")
  .post(protect, addReview);

module.exports = router;