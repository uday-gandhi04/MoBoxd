const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Review = require("../models/Review");
const Activity = require("../models/Activity");
const Ranking = require("../models/Ranking");
const { sendPushNotification } = require("../utils/pushNotification");
const { MOMENT_CATEGORIES } = require("../constants/categories");

const parseTags = (tags) => {
  if (!tags) return [];

  try {
    const parsed = typeof tags === "string" ? JSON.parse(tags) : tags;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return [
      ...new Set(
        parsed
          .map((tag) => String(tag).trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 10),
      ),
    ];
  } catch {
    return [];
  }
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const recalculateReviewSummary = async (postId, session) => {
  const reviews = await Review.find({ post: postId }).session(session);
  const totalReviews = reviews.length;
  const totalRatingScore = reviews.reduce(
    (total, review) => total + review.rating,
    0,
  );
  const communityAverageRating = totalReviews
    ? totalRatingScore / totalReviews
    : 0;

  const post = await Post.findByIdAndUpdate(
    postId,
    {
      totalReviews,
      communityAverageRating,
    },
    { new: true, runValidators: true, session },
  );

  if (!post) {
    throw new Error("Post not found");
  }

  return { post, reviews };
};

const getPostWithReviews = async (postId) => {
  const post = await Post.findById(postId).populate(
    "author",
    "username profilePicture",
  );

  if (!post) {
    throw new Error("Post not found");
  }

  const reviews = await Review.find({ post: postId })
    .populate("user", "username profilePicture")
    .sort({ createdAt: -1 });

  const postObject = post.toObject();
  postObject.reviews = reviews;
  return postObject;
};

// @desc    Get all posts for the home feed
// @route   GET /api/posts
// @access  Public (for now)
const getFeedPosts = async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};

    if (req.user) {
      const currentUser = await User.findById(req.user._id);

      query.$or = [
        { visibility: "PUBLIC" },

        { author: req.user._id },

        {
          visibility: "FOLLOWERS",
          author: { $in: currentUser.following },
        },
      ];
    } else {
      query.visibility = "PUBLIC";
    }

    if (category) {
      query.category = new RegExp(`^${category}$`, "i");
    }

    const posts = await Post.find(query)
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch posts",
      error: error.message,
    });
  }
};

const createPost = async (req, res) => {
  try {
    const {
      title,
      caption,
      category,
      tags,
      relatedLink,
      linkType,
      authorRating,
      visibility,
    } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!req.file) {
      return res.status(400).json({
        message: "An image is required",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "A title is required",
      });
    }

    if (!category || !category.trim()) {
      return res.status(400).json({
        message: "A category is required",
      });
    }

    if (!MOMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        message: "Invalid moment category",
      });
    }

    // ==========================================
    // PARSE TAGS
    // ==========================================

    const parsedTags = parseTags(tags);

    // ==========================================
    // RELATED ITEM
    // ==========================================

    let relatedItem;

    if (relatedLink && relatedLink.trim()) {
      if (!linkType) {
        return res.status(400).json({
          message: "Related link type is required",
        });
      }

      try {
        new URL(relatedLink.trim());
      } catch {
        return res.status(400).json({
          message: "Invalid related link URL",
        });
      }

      relatedItem = {
        type: linkType,
        url: relatedLink.trim(),
      };
    }

    // ==========================================
    // CREATE POST
    // ==========================================

    const newPost = await Post.create({
      author: req.user._id,
      imageUrl: req.file.path,

      title: title.trim(),
      caption: caption?.trim() || "",

      category: category.trim(),

      tags: parsedTags,

      relatedItem,

      visibility: visibility || "PUBLIC",

      authorRating: Number(authorRating),

      communityAverageRating: 0,
      totalReviews: 0,
    });

    // ==========================================
    // PUSH:
    // NOTIFY FOLLOWERS ABOUT NEW POST
    // ==========================================

    if (visibility === "PUBLIC" || visibility === "FOLLOWERS") {
      const creator = await User.findById(req.user._id).select(
        "username followers",
      );

      if (creator && creator.followers && creator.followers.length > 0) {
        creator.followers.forEach((followerId) => {
          sendPushNotification(followerId, {
            title: "New Post",
            body: `${creator.username} posted something new.`,
            url: `/posts/${newPost._id}`,
          });
        });
      }
    }

    // ==========================================
    // RETURN POPULATED POST
    // ==========================================

    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "username profilePicture",
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error creating post:", error);

    res.status(500).json({
      message: "Failed to create post",
      error: error.message,
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username profilePicture followers",
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ================= PUBLIC =================

    if (post.visibility === "PUBLIC") {
      // Everyone can view
    }

    // ================= FOLLOWERS =================
    else if (post.visibility === "FOLLOWERS") {
      if (!req.user) {
        return res.status(401).json({
          message: "Please login.",
        });
      }

      const isCreator = post.author._id.toString() === req.user._id.toString();

      const isFollower = post.author.followers.some(
        (id) => id.toString() === req.user._id.toString(),
      );

      if (!isCreator && !isFollower) {
        return res.status(403).json({
          message: "Followers only.",
        });
      }
    }

    // ================= PRIVATE =================
    else if (post.visibility === "PRIVATE") {
      if (!req.user) {
        return res.status(401).json({
          message: "Please login.",
        });
      }

      // Logged in users with the link may view.
      // Creator is obviously also allowed.
    }

    const reviews = await Review.find({ post: post._id })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    const postObject = post.toObject();
    postObject.reviews = reviews;

    res.status(200).json(postObject);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// @desc    Add a review to a post
// @route   POST /api/posts/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { rating, comment } = req.body;
    const postId = req.params.id;
    const numericRating = Number(rating);

    if (!Number.isFinite(numericRating) || numericRating < 0.5 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 0.5 and 5" });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }

    const post = await Post.findById(postId).session(session);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    session.startTransaction();

    try {
      const alreadyReviewed = await Review.findOne({
        post: postId,
        user: req.user._id,
      }).session(session);

      if (alreadyReviewed) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "You already reviewed this moment" });
      }

      await Review.create(
        [{
          post: postId,
          user: req.user._id,
          rating: numericRating,
          comment: comment.trim(),
        }],
        { session },
      );

      await recalculateReviewSummary(postId, session);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();

      if (error.code === 11000) {
        return res
          .status(400)
          .json({ message: "You already reviewed this moment" });
      }

      throw error;
    }

    // 2. ACTIVITY TRIGGER: Log the review
    try {
      await Activity.create({
        actor: req.user._id,
        actionType: "REVIEW",
        post: postId,
      });
    } catch (error) {
      console.error("Failed to log review activity:", error);
    }

    // --- ADD NOTIFICATION HERE ---
    if (post.author.toString() !== req.user._id.toString()) {
      sendPushNotification(post.author, {
        title: "New Review!",
        body: `${req.user.username} left a ${numericRating}-star review on your moment.`,
        url: `/posts/${post._id}`,
      });
    }
    // -----------------------------

    res.status(201).json(await getPostWithReviews(postId));
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add review", error: error.message });
  } finally {
    await session.endSession();
  }
};

// @desc    Delete a review
// @route   DELETE /api/posts/:id/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const postId = req.params.id;
    const reviewId = req.params.reviewId;

    session.startTransaction();

    const review = await Review.findOne({
      _id: reviewId,
      post: postId,
    }).session(session);

    if (!review) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res
        .status(401)
        .json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne({ session });
    await recalculateReviewSummary(postId, session);
    await session.commitTransaction();

    try {
      await Activity.findOneAndDelete({
        actor: req.user._id,
        actionType: "REVIEW",
        post: postId,
      });
    } catch (error) {
      console.error("Failed to remove review activity:", error);
    }

    res.status(200).json(await getPostWithReviews(postId));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    res
      .status(500)
      .json({ message: "Failed to delete review", error: error.message });
  } finally {
    await session.endSession();
  }
};

const updateReview = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);
    const postId = req.params.id;
    const reviewId = req.params.reviewId;

    if (!Number.isFinite(numericRating) || numericRating < 0.5 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 0.5 and 5" });
    }

    if (!comment?.trim()) {
      return res.status(400).json({ message: "Review comment is required" });
    }

    session.startTransaction();

    const review = await Review.findOne({
      _id: reviewId,
      post: postId,
    }).session(session);

    if (!review) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.user.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res
        .status(401)
        .json({ message: "Not authorized to update this review" });
    }

    review.rating = numericRating;
    review.comment = comment.trim();
    await review.save({ session });
    await recalculateReviewSummary(postId, session);
    await session.commitTransaction();

    res.status(200).json(await getPostWithReviews(postId));
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    res
      .status(500)
      .json({ message: "Failed to update review", error: error.message });
  } finally {
    await session.endSession();
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "User not authorized to delete this post" });
    }

    await Review.deleteMany({ post: req.params.id });

    // 3. ACTIVITY TRIGGER: Clean up all activities related to this deleted post
    await Activity.deleteMany({ post: req.params.id });

    await post.deleteOne();

    res
      .status(200)
      .json({ id: req.params.id, message: "Post deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete post", error: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id.toString();

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // Safely compare ObjectIds as strings
    const isLiked = (post.likes || []).some((id) => id.toString() === userId);

    // ==========================================================
    // UNLIKE
    // ==========================================================

    if (isLiked) {
      const updatedPost = await Post.findOneAndUpdate(
        { _id: postId },
        {
          $pull: {
            likes: req.user.id,
          },
        },
        {
          new: true,
        },
      );

      await Activity.findOneAndDelete({
        actor: req.user.id,
        actionType: "LIKE",
        post: postId,
      });

      return res.status(200).json(updatedPost.likes);
    }

    // ==========================================================
    // LIKE
    // ==========================================================

    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId },
      {
        $addToSet: {
          likes: req.user.id,
        },
      },
      {
        new: true,
      },
    );

    // Activity
    await Activity.create({
      actor: req.user.id,
      actionType: "LIKE",
      post: postId,
    });

    // ==========================================================
    // PUSH NOTIFICATION
    // Only notify the owner of the post.
    // ==========================================================

    if (post.author.toString() !== userId) {
      const actingUser = await User.findById(userId).select("username");

      if (actingUser) {
        sendPushNotification(post.author, {
          title: "New Like!",
          body: `${actingUser.username} liked your moment.`,
          url: `/posts/${postId}`,
        });
      }
    }

    return res.status(200).json(updatedPost.likes);
  } catch (error) {
    console.error("Error toggling like:", error);

    return res.status(500).json({
      message: "Failed to toggle like",
      error: error.message,
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const {
      title,
      caption,
      category,
      tags,
      relatedLink,
      linkType,
      authorRating,
      visibility,
    } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // ==========================================
    // AUTHORIZATION
    // ==========================================

    if (post.author.toString() !== req.user.id.toString()) {
      return res.status(401).json({
        message: "Not authorized to edit this post",
      });
    }

    // ==========================================
    // TITLE
    // ==========================================

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          message: "Title cannot be empty",
        });
      }

      post.title = title.trim();
    }

    // ==========================================
    // CAPTION
    // ==========================================

    if (caption !== undefined) {
      post.caption = caption.trim();
    }

    // ==========================================
    // CATEGORY
    // ==========================================

    if (category !== undefined) {
      if (!category.trim()) {
        return res.status(400).json({
          message: "Category cannot be empty",
        });
      }

      post.category = category.trim();
    }

    // ==========================================
    // TAGS
    // ==========================================

    if (tags !== undefined) {
      post.tags = parseTags(tags);
    }

    // ==========================================
    // RELATED ITEM
    // ==========================================

    if (relatedLink !== undefined || linkType !== undefined) {
      // Remove related item
      if (!relatedLink || !relatedLink.trim()) {
        post.relatedItem = undefined;
      } else {
        if (!linkType) {
          return res.status(400).json({
            message: "Related link type is required",
          });
        }

        try {
          new URL(relatedLink.trim());
        } catch {
          return res.status(400).json({
            message: "Invalid related link URL",
          });
        }

        post.relatedItem = {
          type: linkType,
          url: relatedLink.trim(),
        };
      }
    }

    // ==========================================
    // VISIBILITY
    // ==========================================

    if (visibility) {
      if (!["PUBLIC", "FOLLOWERS", "PRIVATE"].includes(visibility)) {
        return res.status(400).json({
          message: "Invalid visibility option",
        });
      }

      post.visibility = visibility;
    }

    // ==========================================
    // RATING
    // ==========================================

    if (authorRating !== undefined) {
      const numericRating = Number(authorRating);

      if (numericRating < 0.5 || numericRating > 5) {
        return res.status(400).json({
          message: "Rating must be between 0.5 and 5",
        });
      }

      post.authorRating = numericRating;
    }

    // ==========================================
    // SAVE
    // ==========================================

    const updatedPost = await post.save();

    await updatedPost.populate("author", "username profilePicture");

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);

    res.status(500).json({
      message: "Failed to update post",
      error: error.message,
    });
  }
};

const getPersonalFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const posts = await Post.find({
      author: { $in: currentUser.following },
      visibility: {
        $in: ["PUBLIC", "FOLLOWERS"],
      },
    })
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch personal feed", error: error.message });
  }
};

// @desc    Search moments
// @route   GET /api/posts/search
// @access  Public
const searchPosts = async (req, res) => {
  try {
    const { q = "", category = "" } = req.query;

    const search = q.trim();
    const query = {};

    // ==========================================================
    // VISIBILITY
    // ==========================================================

    if (req.user) {
      const currentUser = await User.findById(req.user._id).select("following");

      query.$or = [
        { visibility: "PUBLIC" },

        { author: req.user._id },

        {
          visibility: "FOLLOWERS",
          author: {
            $in: currentUser.following || [],
          },
        },
      ];
    } else {
      query.visibility = "PUBLIC";
    }

    // ==========================================================
    // CATEGORY FILTER
    // ==========================================================

    if (category && category.trim() && category !== "All") {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    // ==========================================================
    // TEXT SEARCH
    //
    // Search:
    // title
    // caption
    // tags
    // author username
    // ==========================================================

    if (search) {
      const escapedSearch = escapeRegex(search);

      const textConditions = [
        {
          title: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          caption: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
        {
          tags: {
            $regex: escapedSearch,
            $options: "i",
          },
        },
      ];

      const matchingAuthors = await User.find({
        username: {
          $regex: escapedSearch,
          $options: "i",
        },
      }).select("_id");

      if (matchingAuthors.length > 0) {
        textConditions.push({
          author: {
            $in: matchingAuthors.map((author) => author._id),
          },
        });
      }

      query.$and = [
        {
          $or: textConditions,
        },
      ];
    }

    // ==========================================================
    // FETCH
    // ==========================================================

    const posts = await Post.find(query)
      .populate("author", "username profilePicture")
      .sort({
        createdAt: -1,
      })
      .limit(50);

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error searching posts:", error);

    res.status(500).json({
      message: "Failed to search moments",
      error: error.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const postCategories = await Post.distinct("category");
    const rankingCategories = await Ranking.distinct("category");

    // Combine, deduplicate, and remove any empty/null categories
    const allCategories = [
      ...new Set([...postCategories, ...rankingCategories]),
    ]
      .filter(Boolean)
      .sort(); // Alphabetical order

    res.status(200).json(allCategories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch categories", error: error.message });
  }
};

const getPostCategories = async (req, res) => {
  try {
    res.status(200).json(MOMENT_CATEGORIES);
  } catch (error) {
    console.error("Failed to fetch moment categories:", error);

    res.status(500).json({
      message: "Failed to fetch moment categories",
    });
  }
};

module.exports = {
  getFeedPosts,
  createPost,
  getPostById,
  addReview,
  updateReview,
  deleteReview,
  deletePost,
  toggleLike,
  updatePost,
  getPersonalFeed,
  getCategories,
  getPostCategories,
  searchPosts,
};
