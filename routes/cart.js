// routes/cart.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory cart for educational purposes (in production, use database)
let userCarts = {};

// Get User's Cart
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const cart = userCarts[userId] || [];
    
    // Calculate cart totals
    let totalItems = 0;
    let totalPrice = 0;
    
    cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;
    });
    
    res.json({
      success: true,
      data: {
        cart: cart,
        summary: {
          total_items: totalItems,
          total_price: totalPrice.toFixed(2),
          cart_count: cart.length
        },
        user: {
          id: req.user.id,
          username: req.user.username
        }
      }
    });
    
  } catch (error) {
    console.error('Cart fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
      message: error.message
    });
  }
});

// Add Item to Cart
router.post('/add', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { domain, product_id, name, price, quantity = 1, image_url } = req.body;
    
    // Validation
    if (!domain || !product_id || !name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Domain, product_id, name, and price are required'
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be at least 1'
      });
    }
    
    // Initialize user cart if doesn't exist
    if (!userCarts[userId]) {
      userCarts[userId] = [];
    }
    
    const cart = userCarts[userId];
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(
      item => item.domain === domain && item.product_id === parseInt(product_id)
    );
    
    if (existingItemIndex !== -1) {
      // Update quantity of existing item
      cart[existingItemIndex].quantity += parseInt(quantity);
      cart[existingItemIndex].updated_at = new Date().toISOString();
    } else {
      // Add new item to cart
      cart.push({
        id: Date.now(), // Simple ID generation
        domain: domain,
        product_id: parseInt(product_id),
        name: name,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        image_url: image_url || `https://picsum.photos/300/400?random=${domain}${product_id}`,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Calculate updated totals
    let totalItems = 0;
    let totalPrice = 0;
    
    cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;
    });
    
    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cart: cart,
        summary: {
          total_items: totalItems,
          total_price: totalPrice.toFixed(2),
          cart_count: cart.length
        }
      }
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
      message: error.message
    });
  }
});

// Update Cart Item Quantity
router.put('/update/:item_id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.item_id);
    const { quantity } = req.body;
    
    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be a positive number'
      });
    }
    
    if (!userCarts[userId]) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    const cart = userCarts[userId];
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    
    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.splice(itemIndex, 1);
    } else {
      // Update quantity
      cart[itemIndex].quantity = parseInt(quantity);
      cart[itemIndex].updated_at = new Date().toISOString();
    }
    
    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
      data: {
        cart: cart
      }
    });
    
  } catch (error) {
    console.error('Cart update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart',
      message: error.message
    });
  }
});

// Remove Item from Cart
router.delete('/remove/:item_id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.item_id);
    
    if (!userCarts[userId]) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    const cart = userCarts[userId];
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    
    // Remove item
    const removedItem = cart.splice(itemIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        removed_item: removedItem,
        cart: cart
      }
    });
    
  } catch (error) {
    console.error('Cart remove error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
      message: error.message
    });
  }
});

// Clear Cart
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    const itemCount = userCarts[userId] ? userCarts[userId].length : 0;
    userCarts[userId] = [];
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items_removed: itemCount,
        cart: []
      }
    });
    
  } catch (error) {
    console.error('Cart clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      message: error.message
    });
  }
});

// Mock Checkout (Educational)
router.post('/checkout', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const cart = userCarts[userId] || [];
    
    if (cart.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty',
        message: 'Cannot checkout with empty cart'
      });
    }
    
    // Calculate totals
    let totalItems = 0;
    let totalPrice = 0;
    
    cart.forEach(item => {
      totalItems += item.quantity;
      totalPrice += item.price * item.quantity;
    });
    
    // Mock order creation
    const orderId = 'ORDER_' + Date.now();
    
    // Clear cart after checkout
    userCarts[userId] = [];
    
    res.json({
      success: true,
      message: 'Checkout completed successfully',
      data: {
        order: {
          id: orderId,
          total_items: totalItems,
          total_price: totalPrice.toFixed(2),
          status: 'pending',
          created_at: new Date().toISOString(),
          estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        items: cart
      }
    });
    
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Checkout failed',
      message: error.message
    });
  }
});

module.exports = router;