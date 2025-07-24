const AuctionBid = require("../models/auctionBid.js");
const Product = require("../models/product.js");

exports.getBidsByProductId = async (req, res) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const bids = await AuctionBid.find({ productId })
      .select('bidAmount bidDate status isWinning') // Chỉ lấy giá, ngày, status - không lấy thông tin user
      .sort({ bidDate: -1 })
      .lean();

    res.json(bids);
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.createBid = async (req, res) => {
  try {
    const { productId, bidAmount } = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Kiểm tra product có tồn tại và là auction không
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isAuction) {
      return res.status(400).json({ message: "Product is not an auction item" });
    }

    // Kiểm tra bid amount có hợp lệ không
    const currentHighestBid = await AuctionBid.findOne({ productId })
      .sort({ bidAmount: -1 });

    const minimumBid = currentHighestBid ? currentHighestBid.bidAmount : product.startingPrice || 0;

    if (bidAmount <= minimumBid) {
      return res.status(400).json({ 
        message: `Bid must be higher than current highest bid: ${minimumBid}` 
      });
    }

    // Tạo bid mới
    const newBid = new AuctionBid({
      productId,
      userId: currentUserId,
      bidAmount
    });

    await newBid.save();

    // Cập nhật status của các bid khác
    await AuctionBid.updateMany(
      { productId, _id: { $ne: newBid._id } },
      { status: 'outbid', isWinning: false }
    );

    // Set bid mới là winning
    newBid.status = 'winning';
    newBid.isWinning = true;
    await newBid.save();

    // Cập nhật current bid của product
    product.currentBid = bidAmount;
    product.highestBidder = currentUserId;
    await product.save();

    res.status(201).json({ 
      message: 'Bid placed successfully', 
      bid: newBid 
    });
  } catch (error) {
    console.error('Error creating bid:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getBidsByUser = async (req, res) => {
  try {
    const currentUserId = req.userId;
    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const bids = await AuctionBid.find({ userId: currentUserId })
      .populate('productId', 'title images currentBid')
      .sort({ bidDate: -1 })
      .lean();

    res.json(bids);
  } catch (error) {
    console.error('Error fetching user bids:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update bid status
exports.updateBid = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const currentUserId = req.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const bid = await AuctionBid.findById(id);
    if (!bid) {
      return res.status(404).json({ message: "Bid not found" });
    }

    // Chỉ cho phép user cập nhật bid của chính mình hoặc admin
    if (bid.userId.toString() !== currentUserId && req.user?.role !== 'admin') {
      return res.status(403).json({ message: "Unauthorized to update this bid" });
    }

    const updatedBid = await AuctionBid.findByIdAndUpdate(id, updateData, { new: true });
    
    res.json({ 
      message: 'Bid updated successfully', 
      bid: updatedBid 
    });
  } catch (error) {
    console.error('Error updating bid:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get highest bid for a product
exports.getHighestBid = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const highestBid = await AuctionBid.findOne({ productId })
      .populate('userId', 'username email')
      .sort({ bidAmount: -1 })
      .lean();

    if (!highestBid) {
      return res.status(404).json({ message: "No bids found for this product" });
    }

    res.json(highestBid);
  } catch (error) {
    console.error('Error fetching highest bid:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

