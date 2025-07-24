const mongoose = require('mongoose');

const auctionBidSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  bidDate: {
    type: Date,
    default: Date.now
  },
  isWinning: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'outbid', 'winning', 'lost'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index để tối ưu query
auctionBidSchema.index({ productId: 1, bidDate: -1 });
auctionBidSchema.index({ userId: 1, bidDate: -1 });
auctionBidSchema.index({ productId: 1, bidAmount: -1 });

module.exports = mongoose.model('AuctionBid', auctionBidSchema, "auctionBid");
