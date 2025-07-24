const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');
try {
  
  console.log('Cart controller functions:', Object.keys(cartController));
  
  // Define routes with auth middleware
  router.get('/', auth, cartController.getCart);
  router.post('/items', auth, cartController.addToCart);
  router.put('/items/:productId', auth, cartController.updateCartItem);
  router.delete('/items/:productId', auth, cartController.removeFromCart);
  router.delete('/', auth, cartController.clearCart);
  router.post('/merge', auth, cartController.mergeCarts);
  
} catch (error) {
  console.error('Failed to load cart controller:', error);
  // Define placeholder routes
  router.get('/', (req, res) => {
    res.status(500).json({ error: 'Cart controller not available' });
  });
  
  router.all('*', (req, res) => {
    res.status(500).json({ error: 'Cart controller not available' });
  });
}

module.exports = router;