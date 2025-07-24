const mongoose = require('mongoose');
const Cart = require('../models/cart');
const Product = require('../models/product');

// Get user's cart or create a new one if not exists
async function getUserCart(userId) {
  let cart = await Cart.findOne({ userId }).populate('items.productId');
  
  if (!cart) {
    cart = new Cart({ userId, items: [] });
    await cart.save(); // Create and save a new empty cart if none found
  }
  
  return cart;
}

// Add or update item in the cart
async function addOrUpdateCartItem(userId, productId, quantity) {
  try {
    const cart = await getUserCart(userId);
    const itemIndex = cart.items.findIndex(item => item.productId.equals(productId));

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity; // Update the quantity if item exists
    } else {
      cart.items.push({ productId, quantity }); // Add new item if it doesn't exist
    }

    await cart.save();
    return cart.populate('items.productId'); // Return populated cart with product details
  } catch (error) {
    throw new Error(error.message);
  }
}

// Remove item from cart
async function removeCartItem(userId, productId) {
  try {
    const cart = await getUserCart(userId);
    cart.items = cart.items.filter(item => !item.productId.equals(productId)); // Remove item by productId
    await cart.save();
    return cart.populate('items.productId');
  } catch (error) {
    throw new Error(error.message);
  }
}

// Clear user's cart
async function clearCart(userId) {
  try {
    const cart = await getUserCart(userId);
    cart.items = []; // Clear all items
    await cart.save();
    return cart.populate('items.productId');
  } catch (error) {
    throw new Error(error.message);
  }
}

// Merge local cart with database cart
async function mergeCarts(userId, localCartItems) {
  try {
    const userCart = await getUserCart(userId);

    // Loop through the local cart items and merge them with the user's cart
    for (const localItem of localCartItems) {
      const productId = new mongoose.Types.ObjectId(localItem.productId);
      const existingItem = userCart.items.find(item => item.productId.equals(productId));

      if (existingItem) {
        existingItem.quantity += localItem.quantity; // Merge quantities if item exists
      } else {
        userCart.items.push({ productId, quantity: localItem.quantity }); // Add new item if not exists
      }
    }

    await userCart.save();
    return userCart.populate('items.productId');
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  getUserCart,
  addOrUpdateCartItem,
  removeCartItem,
  clearCart,
  mergeCarts
};
