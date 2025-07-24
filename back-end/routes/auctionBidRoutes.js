const express = require("express");
const {
  getBidsByProductId,
  createBid,
  getBidsByUser,
  updateBid,
  getHighestBid,
} = require("../controllers/auctionBidsController");
const { authenticateToken } = require("../middlewares/authMiddleware");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// Validation middleware for creating bid
const createBidValidation = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid Product ID format"),
  body("bidAmount")
    .notEmpty()
    .withMessage("Bid amount is required")
    .isNumeric()
    .withMessage("Bid amount must be a number")
    .custom((value) => {
      if (value <= 0) {
        throw new Error("Bid amount must be greater than 0");
      }
      return true;
    }),
];

// Validation result middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Validation errors:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Routes
// Get bids by product ID (public)
router.get("/", getBidsByProductId);

// Create new bid (requires authentication)
router.post("/", authenticateToken, createBidValidation, validate, createBid);

// Get user's bid history (requires authentication)
router.get("/user", authenticateToken, getBidsByUser);

// Update bid status (requires authentication)
router.patch("/:id", authenticateToken, updateBid);

// Get highest bid for a product (public)
router.get("/highest/:productId", getHighestBid);

module.exports = router;

