// routes/cart.js - Updated with Cart Persistence Support
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import auth middleware if it exists, otherwise define here
let authenticateToken;
try {
  const { authenticateToken: importedAuth } = require('../middleware/auth');
  authenticateToken = importedAuth;
} catch (error) {
  // Define middleware here if import fails
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';
  
  authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is not valid'
      });
    }
  };
}

// Helper function to get product details (mock data)
function getProductDetails(domain, productId) {
  // In a real app, this would fetch from database
  // For demo purposes, return mock data
  return {
    id: productId,
    domain: domain,
    name: `Sample ${domain} Product #${productId}`,
    price: 19.99,
    image_url: `https://via.placeholder.com/150?text=${domain}+${productId}`
  };
}

// 🛒 GET CART - Get user's shopping cart
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's cart from persistent storage
    const cart = global.cartPersistence.getUserCart(userId);
    
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
          total_price: parseFloat(totalPrice.toFixed(2)),
          cart_count: cart.length
        },
        user: {
          id: req.user.id,
          username: req.user.username
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Cart fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart',
      message: error.message
    });
  }
});

// ➕ ADD TO CART - Add product to cart
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
    
    // Get current user cart from persistent storage
    const cart = global.cartPersistence.getUserCart(userId);
    
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
    
    // Save updated cart to persistent storage
    global.cartPersistence.saveUserCart(userId, cart);
    
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
          total_price: parseFloat(totalPrice.toFixed(2)),
          cart_count: cart.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Add to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
      message: error.message
    });
  }
});

// ✏️ UPDATE CART ITEM - Update item quantity
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
    
    // Get current user cart from persistent storage
    const cart = global.cartPersistence.getUserCart(userId);
    
    if (cart.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
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
    
    // Save updated cart to persistent storage
    global.cartPersistence.saveUserCart(userId, cart);
    
    res.json({
      success: true,
      message: quantity === 0 ? 'Item removed from cart' : 'Cart updated successfully',
      data: {
        cart: cart,
        updated_item: quantity === 0 ? null : cart[itemIndex]
      }
    });
    
  } catch (error) {
    console.error('❌ Cart update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart',
      message: error.message
    });
  }
});

// 🗑️ REMOVE FROM CART - Remove specific item
router.delete('/remove/:item_id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.item_id);
    
    // Get current user cart from persistent storage
    const cart = global.cartPersistence.getUserCart(userId);
    
    if (cart.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    
    // Remove item
    const removedItem = cart.splice(itemIndex, 1)[0];
    
    // Save updated cart to persistent storage
    global.cartPersistence.saveUserCart(userId, cart);
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      data: {
        removed_item: removedItem,
        cart: cart
      }
    });
    
  } catch (error) {
    console.error('❌ Cart remove error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart',
      message: error.message
    });
  }
});

// 🧹 CLEAR CART - Remove all items
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current cart to count items
    const cart = global.cartPersistence.getUserCart(userId);
    const itemCount = cart.length;
    
    // Clear user's cart using persistent storage
    global.cartPersistence.clearUserCart(userId);
    
    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        items_removed: itemCount,
        cart: []
      }
    });
    
  } catch (error) {
    console.error('❌ Cart clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      message: error.message
    });
  }
});

// 🔢 GET CART COUNT - Get number of items in cart
router.get('/count', authenticateToken, (req, res) => {
  try {
    // Get user's cart from persistent storage
    const cart = global.cartPersistence.getUserCart(req.user.id);
    
    // Calculate total items
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        count: totalItems
      }
    });

  } catch (error) {
    console.error('❌ Get cart count error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to get cart count'
    });
  }
});

// 💳 CHECKOUT - Mock checkout process
router.post('/checkout', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { payment_method = 'credit_card', shipping_address } = req.body;
    
    // Get current user cart from persistent storage
    const cart = global.cartPersistence.getUserCart(userId);
    
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
    
    // Create order object
    const order = {
      id: orderId,
      user_id: userId,
      items: [...cart], // Copy cart items
      total_items: totalItems,
      total_price: parseFloat(totalPrice.toFixed(2)),
      payment_method,
      shipping_address: shipping_address || 'Not provided',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Clear cart after successful checkout using persistent storage
    global.cartPersistence.clearUserCart(userId);
    
    res.json({
      success: true,
      message: 'Checkout completed successfully',
      data: {
        order
      }
    });
    
  } catch (error) {
    console.error('❌ Checkout error:', error);
    res.status(500).json({
      success: false,
      error: 'Checkout failed',
      message: error.message
    });
  }
});

// 🧪 HEALTH CHECK for cart system
router.get('/health', authenticateToken, (req, res) => {
  try {
    const cart = global.cartPersistence.getUserCart(req.user.id);
    
    res.json({
      success: true,
      message: 'Cart system healthy',
      data: {
        user_id: req.user.id,
        cart_items: cart.length,
        persistence: 'File-based storage',
        features: [
          'Add to cart',
          'Update quantities',
          'Remove items',
          'Clear cart',
          'Checkout process',
          'Persistent storage'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Cart health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Cart system error',
      message: error.message
    });
  }
});

module.exports = router;