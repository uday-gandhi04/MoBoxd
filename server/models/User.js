const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      // Default will be handled in the controller or frontend
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    // ADD THE BIO FIELD HERE:
    bio: {
      type: String,
      default: '',
      maxLength: 150, // Keeps bios short and snappy, optional but recommended!
    },
    // Add these two arrays:
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);