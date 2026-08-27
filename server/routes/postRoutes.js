const express = require("express");
const router = express.Router();
const {
  getFeedPosts,
  getPersonalFeed,
  createPost,
  getPostById,
  addReview,
  updateReview,
  deleteReview,
  deletePost,
  toggleLike,
  updatePost,
  getCategories,
  searchPosts,
} = require("../controllers/postController");

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

router.route("/")
  .get(optionalProtect, getFeedPosts)
  .post(protect, upload.single("image"), createPost);

router.route("/feed")
  .get(protect, getPersonalFeed);

router.get('/categories', getCategories);

router.get("/search", searchPosts);

router.route("/:id")
  .get(optionalProtect, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route("/:id/like")
  .put(protect, toggleLike);

router.route("/:id/reviews")
  .post(protect, addReview);

router.put("/:id/reviews/:reviewId", protect, updateReview);
router.delete("/:id/reviews/:reviewId", protect, deleteReview);



module.exports = router;