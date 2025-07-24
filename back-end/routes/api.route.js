const express = require("express");
const db = require("../models");
const auctionBidsController = require("../controllers/auctionBidsController");
const { auth } = require("../middlewares/authMiddleware");

const ApiRouter = express.Router();

// Route login
ApiRouter.get("/user", async (req, res) => {
  try {
    // Tìm user và populate orders và addresses
    const user = await db.User.find();
    // Format response giống với database.json
    // const response = {
    //   id: user._id,
    //   name: user.name,
    //   email: user.email,
    //   password: user.password,
    //   role: user.role,
    //   orderIds: user.orders.map(order => order._id),
    //   addresses: user.addresses.map(addr => ({
    //     id: addr._id,
    //     street: addr.street,
    //     city: addr.city,
    //     state: addr.state,
    //     zipCode: addr.zipCode,
    //     country: addr.country
    //   })),
    //   actions: user.role === "admin" ? ["admin"] : ["locked"]
    // };

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

ApiRouter.get("/products", async (req, res) => {
  try {
    if (req.query.id) {
      const product = await db.Product.findById(req.query.id).populate(
        "categoryId"
      );
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      // Đảm bảo có trường url
      const obj = product.toObject();
      obj.url = Array.isArray(obj.images) && obj.images.length > 0 ? obj.images[0] : "";
      obj.id = obj._id?.toString();
      return res.status(200).send([obj]);
    }

    let products = await db.Product.find().populate("categoryId");
    // Đảm bảo mỗi product có trường url và id
    products = products.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        url: Array.isArray(obj.images) && obj.images.length > 0 ? obj.images[0] : "",
        id: obj._id?.toString()
      };
    });
    res.status(200).send(products);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

ApiRouter.get("/product/category/name/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const category = await db.Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const products = await db.Product.find({
      categoryId: category._id,
    }).populate("categoryId");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
ApiRouter.get("/categories", async (req, res) => {
  try {
    const categories = await db.Category.find();
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

ApiRouter.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await db.Product.findById(id).populate("categoryId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

ApiRouter.get("/product/category/:categoryId", async (req, res) => {
  const { categoryId } = req.params;
  try {
    const products = await db.Product.find({ categoryId }).populate(
      "categoryId"
    );
    res.status(200).json(products);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// Auction Bid Routes
// Get bids by product ID
ApiRouter.get("/auctionBids", auctionBidsController.getBidsByProductId);

// Create new bid (requires authentication)
ApiRouter.post("/auctionBids", auth, auctionBidsController.createBid);

// Get user's bid history (requires authentication)
ApiRouter.get("/user/bids", auth, auctionBidsController.getBidsByUser);

// Update bid status (requires authentication)
ApiRouter.patch("/auctionBids/:id", auth, auctionBidsController.updateBid);

// Get highest bid for a product
ApiRouter.get("/auctionBids/highest/:productId", auctionBidsController.getHighestBid);

module.exports = ApiRouter;
