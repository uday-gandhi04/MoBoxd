const mongoose = require('mongoose');

const rankingSubmissionSchema = new mongoose.Schema(
  {
    rankingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ranking', 
      required: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    rankedItems: [
      {
        // This links back to the specific item _id in the main Ranking list
        itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
        // The integer position (1 = 1st place, 2 = 2nd place, etc.)
        rankPosition: { type: Number, required: true },
        // Optional label for Tier List formats (e.g., 'S', 'A', 'B')
        tierLabel: { type: String }
      }
    ]
  },
  { timestamps: true }
);

// Compound index to ensure a user cannot submit multiple times to the same ranking lobby
rankingSubmissionSchema.index({ rankingId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('RankingSubmission', rankingSubmissionSchema);