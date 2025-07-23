const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    images: [{ type: String }],
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAuction: { type: Boolean, default: false },
    auctionEndTime: { type: Date },
    quantity: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Check if the model exists before creating a new one
const Product = mongoose.models.Product || mongoose.model("Product", productSchema, "products");

module.exports = Product;