require("dotenv").config();
const mongoose = require("mongoose");
const Post = require("../models/Post");

const migratePosts = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not configured. Add it to server/.env.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ Connected to MongoDB");

    // ==========================================================
    // RESET TITLES ON ALL EXISTING POSTS
    //
    // The previous migration incorrectly generated titles from
    // captions. Since no new posts were created afterward,
    // this safely clears those generated titles.
    //
    // No other fields are modified.
    // ==========================================================

    const result = await Post.updateMany(
      {},
      {
        $set: {
          title: "",
        },
      }
    );

    console.log(
      `✅ Titles cleared from ${result.modifiedCount} post(s)`
    );

    // ==========================================================
    // VERIFY
    // ==========================================================

    const postsWithNonEmptyTitles =
      await Post.countDocuments({
        title: {
          $exists: true,
          $nin: ["", null],
        },
      });

    console.log(
      `🔎 Posts still containing a title: ${postsWithNonEmptyTitles}`
    );

    if (postsWithNonEmptyTitles === 0) {
      console.log(
        "🎉 Existing post titles successfully reset."
      );
    } else {
      console.warn(
        "⚠️ Some posts still contain titles."
      );
    }

  } catch (error) {
    console.error(
      "❌ Title reset failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

migratePosts();