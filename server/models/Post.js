const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  caption: { type: String, maxLength: 2200 },
  category: { type: String, required: true },
  authorRating: { type: Number, min: 0.5, max: 5.0, required: true },
  communityAverageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);