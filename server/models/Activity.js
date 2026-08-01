const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    // The person who performed the action
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // The type of action performed
    actionType: {
      type: String,
      enum: ['LIKE', 'REVIEW', 'FOLLOW'],
      required: true,
    },
    // If the action involves a post (Like or Review)
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    // If the action involves another user (e.g., Actor follows Target)
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Indexing for faster feed generation
activitySchema.index({ createdAt: -1 });
activitySchema.index({ targetUser: 1 });
activitySchema.index({ actor: 1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;