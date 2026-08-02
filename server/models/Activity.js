const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionType: {
      type: String,
      // 1. Add the two new ranking actions here:
      enum: ['LIKE', 'REVIEW', 'FOLLOW', 'CREATE_RANKING', 'SUBMIT_RANKING'],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // 2. Add the ranking reference field:
    ranking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ranking',
    }
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ targetUser: 1 });
activitySchema.index({ actor: 1 });

module.exports = mongoose.model('Activity', activitySchema);