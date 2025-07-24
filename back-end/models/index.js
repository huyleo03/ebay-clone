const mongoose = require("mongoose");
const Product = require("./product");
const Category = require("./category");
const orderItem = require("./orderitem");
const Order = require("./order");
const User = require("./user");
const ReturnRequest = require("./returnrequest");
const Address = require("./address");
const AuctionBid = require("./auctionBid");

const Coupon = require("./coupon");
const db = {};

// Define schema
db.Product = Product;
db.Category = Category;
db.OrderItem = orderItem;
db.Order = Order;
db.User = User;
db.ReturnRequest = ReturnRequest;
db.Address = Address;
db.AuctionBid = AuctionBid;

db.Coupon = Coupon;
module.exports = db;
