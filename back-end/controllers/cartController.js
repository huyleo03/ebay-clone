const Cart = require('../models/cart');
const Product = require('../models/product');
const mongoose = require('mongoose');

// Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    console.log('Getting cart for userId:', userId);

    // Find cart by userId and populate product details
    const cart = await Cart.findOne({ userId })
                          .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      cart: cart || { items: [] }
    });
  } catch (error) {
    console.error('Error getting cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    console.log('Adding to cart for userId:', userId, 'productId:', productId, 'quantity:', quantity);
    
    if (!productId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and quantity are required'
      });
    }

    // Find product to ensure it exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    // Find or create cart with proper userId
    let cart = await Cart.findOne({ userId });
    
    // If cart doesn't exist, create a new one with userId and empty items array
    if (!cart) {
      console.log('Creating new cart for userId:', userId);
      cart = new Cart({
        userId,
        items: []
      });
    }
    
    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId && item.productId.toString() === productId
    );
    
    if (existingItemIndex >= 0) {
      // Update quantity of existing product
      cart.items[existingItemIndex].quantity += Number(quantity);
      console.log('Updated existing product quantity');
    } else {
      // Add new product to cart
      cart.items.push({
        productId: productId, 
        quantity: Number(quantity)
      });
      console.log('Added new product to cart');
    }
    
    // Save cart
    await cart.save();
    console.log('Cart saved successfully');
    
    // Return populated cart
    const populatedCart = await Cart.findById(cart._id)
                                   .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: populatedCart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    console.log('Removing from cart for userId:', userId, 'productId:', productId);
    
    // Find cart by userId
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Check if product exists in cart before trying to remove it
    const initialItemsCount = cart.items.length;
    
    // Filter out the product to remove - ensure we're checking both string and ObjectId formats
    cart.items = cart.items.filter(item => {
      // Handle case where productId might be null or undefined
      if (!item.productId) return true;
      
      const itemProductIdStr = item.productId.toString();
      return itemProductIdStr !== productId;
    });
    
    // Check if any item was actually removed
    if (cart.items.length === initialItemsCount) {
      console.log('Product not found in cart:', productId);
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }
    
    console.log('Product removed from cart, remaining items:', cart.items.length);
    await cart.save();
    
    // Return populated cart
    const populatedCart = await Cart.findById(cart._id)
                                  .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart: populatedCart
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    console.log('Clearing cart for userId:', userId);
    
    // Find cart by userId
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Clear items array
    cart.items = [];
    await cart.save();
    
    return res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

// Merge carts after login
const mergeCarts = async (req, res) => {
  try {
    const userId = req.userId;
    const { localCart } = req.body;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    // Support different formats the frontend might send
    console.log('Received localCart:', localCart);
    
    // Handle different possible structures
    let localItems = [];
    if (localCart.items && Array.isArray(localCart.items)) {
      localItems = localCart.items;
    } else if (localCart.products && Array.isArray(localCart.products)) {
      localItems = localCart.products;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid local cart format'
      });
    }
    
    console.log('Merging carts for userId:', userId, 'local items:', localItems.length);
    
    // Find or create server cart with userId
    let serverCart = await Cart.findOne({ userId });
    
    if (!serverCart) {
      serverCart = new Cart({
        userId,
        items: []
      });
    }
    
    // Process each item from local cart
    for (const localItem of localItems) {
      // Support both naming conventions
      const itemProductId = localItem.productId || localItem.idProduct;
      const itemQuantity = localItem.quantity || 1;
      
      if (!itemProductId) {
        console.log('Skipping item without product ID');
        continue;
      }
      
      try {
        // Find if product already exists in server cart
        const existingItemIndex = serverCart.items.findIndex(
          item => item.productId && item.productId.toString() === itemProductId.toString()
        );
        
        if (existingItemIndex >= 0) {
          // Update quantity if product exists
          serverCart.items[existingItemIndex].quantity += Number(itemQuantity);
          console.log('Updated existing product in cart');
        } else {
          // Add new product to cart
          serverCart.items.push({
            productId: itemProductId,
            quantity: Number(itemQuantity)
          });
          console.log('Added new product to cart');
        }
      } catch (err) {
        console.error('Error processing cart item:', err);
      }
    }
    
    // Save merged cart
    await serverCart.save();
    console.log('Cart saved after merge');
    
    // Return populated cart
    const populatedCart = await Cart.findById(serverCart._id)
                                  .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      message: 'Carts merged successfully',
      cart: populatedCart
    });
  } catch (error) {
    console.error('Error merging carts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to merge carts',
      error: error.message
    });
  }
};
// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'User not authenticated' 
      });
    }
    
    console.log('Updating cart item for userId:', userId, 'productId:', productId, 'quantity:', quantity);
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }
    
    // Find cart by userId
    const cart = await Cart.findOne({ userId });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Find the product in the cart
    const itemIndex = cart.items.findIndex(
      item => item.productId && item.productId.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in cart'
      });
    }
    
    // Update the quantity
    cart.items[itemIndex].quantity = Number(quantity);
    console.log('Updated product quantity to:', quantity);
    
    await cart.save();
    
    // Return populated cart
    const populatedCart = await Cart.findById(cart._id)
                                  .populate('items.productId');
    
    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      cart: populatedCart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCarts
};