const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    // ==========================================================
    // AUTHOR
    // ==========================================================
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ==========================================================
    // CONTENT
    // ==========================================================
    imageUrl: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 120,
    },

    caption: {
      type: String,
      trim: true,
      maxLength: 2200,
    },

    // ==========================================================
    // CATEGORY
    // ==========================================================
    category: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================================
    // SEARCH TAGS
    // ==========================================================
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxLength: 40,
      },
    ],

    // ==========================================================
    // RELATED ITEM
    // ==========================================================
    relatedItem: {
      type: {
        type: String,
        enum: [
          "PLACE",
          "MUSIC",
          "MOVIE_TV",
          "BOOK",
          "GAME",
          "PRODUCT",
          "ARTICLE",
          "OTHER",
        ],
      },

      url: {
        type: String,
        trim: true,
      },
    },

    // ==========================================================
    // RATINGS
    // ==========================================================
    authorRating: {
      type: Number,
      min: 0.5,
      max: 5.0,
      required: true,
    },

    communityAverageRating: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0,
    },

    // ==========================================================
    // LIKES
    // ==========================================================
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ==========================================================
    // VISIBILITY
    // ==========================================================
    visibility: {
      type: String,
      enum: [
        "PUBLIC",
        "FOLLOWERS",
        "PRIVATE",
      ],
      default: "PUBLIC",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Post",
  PostSchema
);