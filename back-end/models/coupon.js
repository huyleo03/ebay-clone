const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    maxUsage: {
      type: Number,
      required: true,
      min: 1
    },
    productId: {
      type: String,
      required: false // Optional - can be used for product-specific coupons
    }
  },
  { timestamps: true }
);

const Coupon = mongoose.model("Coupon", couponSchema, "coupons");

module.exports = Coupon; 