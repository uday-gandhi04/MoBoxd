const mongoose = require('mongoose');

const rankingSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String 
    },
    category: { 
      type: String, 
      required: true 
    },
    creator: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    visibility: { 
      type: String, 
      enum: ['PUBLIC', 'FOLLOWERS', 'PRIVATE'], 
      default: 'PUBLIC' 
    },
    format: { 
      type: String, 
      enum: ['ORDINAL', 'TIER_LIST'], 
      default: 'ORDINAL' 
    },
    // The items to be ranked. MongoDB automatically assigns an _id to each object in this array.
    items: [
      {
        name: { type: String, required: true }
      }
    ],
    // Cached analytics to keep the feed incredibly fast
    aggregatedStats: {
      participantCount: { type: Number, default: 0 },
      consensus: { type: Array, default: [] } 
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ranking', rankingSchema);