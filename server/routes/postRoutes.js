const express = require("express");
const router = express.Router();
const {
  getFeedPosts,
  getPersonalFeed,
  createPost,
  getPostById,
  addReview,
  deleteReview,
  deletePost,
  toggleLike,
  updatePost,
  getCategories
} = require("../controllers/postController");
const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

// Base routes (/api/posts)
router.route("/")
  .get(optionalProtect, getFeedPosts)
  .post(protect, upload.single("image"), createPost);

router.route("/feed")
  .get(protect, getPersonalFeed);

router.get('/categories', getCategories);

// Single post routes (/api/posts/:id)
// Grouped all single-ID operations into one block
router.route("/:id")
  .get(optionalProtect, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

// Like route (/api/posts/:id/like)
router.route("/:id/like")
  .put(protect, toggleLike);

// Review routes (/api/posts/:id/reviews)
router.route("/:id/reviews")
  .post(protect, addReview);

router.delete("/:id/reviews/:reviewId", protect, deleteReview);



module.exports = router;