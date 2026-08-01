const Post = require("../models/Post");
const User = require("../models/User");
const Review = require("../models/Review");
const Activity = require("../models/Activity"); // 1. IMPORT THE ACTIVITY MODEL

// @desc    Get all posts for the home feed
// @route   GET /api/posts
// @access  Public (for now)
const getFeedPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch posts", error: error.message });
  }
};

const createPost = async (req, res) => {
  try {
    const { caption, category, authorRating } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "An image is required" });
    }

    const newPost = await Post.create({
      author: req.user._id,
      imageUrl: req.file.path,
      caption,
      category,
      authorRating: Number(authorRating), 
      communityAverageRating: 0,
      totalReviews: 0,
    });

    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "username profilePicture",
    );

    res.status(201).json(populatedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res
      .status(500)
      .json({ message: "Failed to create post", error: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username profilePicture",
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const reviews = await Review.find({ post: post._id })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 }); 

    const postObject = post.toObject();
    postObject.reviews = reviews;

    res.status(200).json(postObject);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add a review to a post
// @route   POST /api/posts/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyReviewed = await Review.findOne({
      post: postId,
      user: req.user._id,
    });

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You already reviewed this moment" });
    }

    const review = await Review.create({
      post: postId,
      user: req.user._id,
      rating: Number(rating),
      comment,
    });

    const allReviews = await Review.find({ post: postId });
    post.totalReviews = allReviews.length;

    const totalRatingScore = allReviews.reduce(
      (acc, item) => item.rating + acc,
      0,
    );
    post.communityAverageRating = totalRatingScore / allReviews.length;

    await post.save();

    // 2. ACTIVITY TRIGGER: Log the review
    await Activity.create({
      actor: req.user._id,
      actionType: 'REVIEW',
      post: postId
    });

    const updatedPost = await Post.findById(postId).populate(
      "author",
      "username profilePicture",
    );

    const reviews = await Review.find({ post: postId })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    const postObject = updatedPost.toObject();
    postObject.reviews = reviews;

    res.status(201).json(postObject);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add review", error: error.message });
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
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isLiked = post.likes.includes(req.user.id);

    if (isLiked) {
      post.likes = post.likes.filter(
        (userId) => userId.toString() !== req.user.id,
      );
      
      // 4. ACTIVITY TRIGGER: Remove the like activity from the feed if they unlike it
      await Activity.findOneAndDelete({
        actor: req.user.id,
        actionType: 'LIKE',
        post: req.params.id
      });

    } else {
      post.likes.push(req.user.id);
      
      // 5. ACTIVITY TRIGGER: Log the like activity
      await Activity.create({
        actor: req.user.id,
        actionType: 'LIKE',
        post: req.params.id
      });
    }

    await post.save();

    res.status(200).json(post.likes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to toggle like", error: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { caption, category, authorRating } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to edit this post" });
    }

    post.caption = caption || post.caption;
    post.category = category || post.category;
    if (authorRating) post.authorRating = Number(authorRating);

    const updatedPost = await post.save();

    await updatedPost.populate("author", "username profilePicture");

    res.status(200).json(updatedPost);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update post", error: error.message });
  }
};

const getPersonalFeed = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    const posts = await Post.find({ author: { $in: currentUser.following } })
      .populate("author", "username profilePicture")
      .sort({ createdAt: -1 }); 

    res.status(200).json(posts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch personal feed", error: error.message });
  }
};

module.exports = {
  getFeedPosts,
  createPost,
  getPostById,
  addReview,
  deletePost,
  toggleLike,
  updatePost,
  getPersonalFeed,
};