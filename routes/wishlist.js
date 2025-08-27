// routes/wishlist.js - Wishlist System with Persistence Support - FIXED JWT SECRET
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Import auth middleware if it exists, otherwise define here
let authenticateToken;
try {
  const { authenticateToken: importedAuth } = require('../middleware/auth');
  authenticateToken = importedAuth;
} catch (error) {
  // Define middleware here if import fails - FIXED JWT SECRET TO MATCH CART ROUTES
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

// GET WISHLIST - Get user's wishlist
router.get('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's wishlist from persistent storage
    const wishlist = global.wishlistPersistence.getUserWishlist(userId);
    
    // Calculate wishlist stats
    let totalItems = wishlist.length;
    
    res.json({
      success: true,
      data: {
        wishlist: wishlist,
        summary: {
          total_items: totalItems,
          wishlist_count: wishlist.length
        },
        user: {
          id: req.user.id,
          username: req.user.username
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Wishlist fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wishlist',
      message: error.message
    });
  }
});

// ADD TO WISHLIST - Add product to wishlist
router.post('/add', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { domain, product_id, name, price, image_url } = req.body;
    
    // Validation
    if (!domain || !product_id || !name || !price) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Domain, product_id, name, and price are required'
      });
    }
    
    // Get current user wishlist from persistent storage
    const wishlist = global.wishlistPersistence.getUserWishlist(userId);
    
    // Check if item already exists in wishlist
    const existingItemIndex = wishlist.findIndex(
      item => item.domain === domain && item.product_id === parseInt(product_id)
    );
    
    if (existingItemIndex !== -1) {
      return res.status(409).json({
        success: false,
        error: 'Item already in wishlist',
        message: 'This product is already in your wishlist'
      });
    }
    
    // Add new item to wishlist
    const newWishlistItem = {
      id: Date.now(), // Simple ID generation
      domain: domain,
      product_id: parseInt(product_id),
      name: name,
      price: parseFloat(price),
      image_url: image_url || `https://picsum.photos/300/400?random=${domain}${product_id}`,
      added_at: new Date().toISOString()
    };
    
    wishlist.push(newWishlistItem);
    
    // Save updated wishlist to persistent storage
    global.wishlistPersistence.saveUserWishlist(userId, wishlist);
    
    res.status(201).json({
      success: true,
      message: 'Item added to wishlist successfully',
      data: {
        wishlist: wishlist,
        summary: {
          total_items: wishlist.length,
          wishlist_count: wishlist.length
        },
        added_item: newWishlistItem
      }
    });
    
  } catch (error) {
    console.error('❌ Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to wishlist',
      message: error.message
    });
  }
});

// REMOVE FROM WISHLIST - Remove specific item
router.delete('/remove/:item_id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.item_id);
    
    // Get current user wishlist from persistent storage
    const wishlist = global.wishlistPersistence.getUserWishlist(userId);
    
    if (wishlist.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Wishlist not found'
      });
    }
    
    const itemIndex = wishlist.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in wishlist'
      });
    }
    
    // Remove item
    const removedItem = wishlist.splice(itemIndex, 1)[0];
    
    // Save updated wishlist to persistent storage
    global.wishlistPersistence.saveUserWishlist(userId, wishlist);
    
    res.json({
      success: true,
      message: 'Item removed from wishlist successfully',
      data: {
        removed_item: removedItem,
        wishlist: wishlist,
        summary: {
          total_items: wishlist.length,
          wishlist_count: wishlist.length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Wishlist remove error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from wishlist',
      message: error.message
    });
  }
});

// CLEAR WISHLIST - Remove all items
router.delete('/clear', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current wishlist to count items
    const wishlist = global.wishlistPersistence.getUserWishlist(userId);
    const itemCount = wishlist.length;
    
    // Clear user's wishlist using persistent storage
    global.wishlistPersistence.clearUserWishlist(userId);
    
    res.json({
      success: true,
      message: 'Wishlist cleared successfully',
      data: {
        items_removed: itemCount,
        wishlist: []
      }
    });
    
  } catch (error) {
    console.error('❌ Wishlist clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear wishlist',
      message: error.message
    });
  }
});

// GET WISHLIST COUNT - Get number of items in wishlist
router.get('/count', authenticateToken, (req, res) => {
  try {
    // Get user's wishlist from persistent storage
    const wishlist = global.wishlistPersistence.getUserWishlist(req.user.id);
    
    res.json({
      success: true,
      data: {
        count: wishlist.length
      }
    });

  } catch (error) {
    console.error('❌ Get wishlist count error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Failed to get wishlist count'
    });
  }
});

// MOVE TO CART - Move item from wishlist to cart
router.post('/move-to-cart/:item_id', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = parseInt(req.params.item_id);
    const { quantity = 1 } = req.body;
    
    // Get current user wishlist from persistent storage
    const wishlist = global.wishlistPersistence.getUserWishlist(userId);
    
    const itemIndex = wishlist.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in wishlist'
      });
    }
    
    const wishlistItem = wishlist[itemIndex];
    
    // Add item to cart
    const cart = global.cartPersistence.getUserCart(userId);
    
    // Check if item already exists in cart
    const existingCartItemIndex = cart.findIndex(
      item => item.domain === wishlistItem.domain && item.product_id === wishlistItem.product_id
    );
    
    if (existingCartItemIndex !== -1) {
      // Update quantity of existing item in cart
      cart[existingCartItemIndex].quantity += parseInt(quantity);
      cart[existingCartItemIndex].updated_at = new Date().toISOString();
    } else {
      // Add new item to cart
      cart.push({
        id: Date.now() + Math.random(), // Unique ID
        domain: wishlistItem.domain,
        product_id: wishlistItem.product_id,
        name: wishlistItem.name,
        price: wishlistItem.price,
        quantity: parseInt(quantity),
        image_url: wishlistItem.image_url,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // Save updated cart
    global.cartPersistence.saveUserCart(userId, cart);
    
    // Remove item from wishlist
    wishlist.splice(itemIndex, 1);
    global.wishlistPersistence.saveUserWishlist(userId, wishlist);
    
    res.json({
      success: true,
      message: 'Item moved from wishlist to cart successfully',
      data: {
        moved_item: wishlistItem,
        wishlist: wishlist,
        cart_summary: {
          total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          total_price: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Move to cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move item to cart',
      message: error.message
    });
  }
});

// HEALTH CHECK for wishlist system
router.get('/health', authenticateToken, (req, res) => {
  try {
    const wishlist = global.wishlistPersistence.getUserWishlist(req.user.id);
    
    res.json({
      success: true,
      message: 'Wishlist system healthy',
      data: {
        user_id: req.user.id,
        wishlist_items: wishlist.length,
        persistence: 'File-based storage',
        features: [
          'Add to wishlist',
          'Remove from wishlist',
          'Clear wishlist',
          'Move to cart',
          'Persistent storage',
          'Count items'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Wishlist health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Wishlist system error',
      message: error.message
    });
  }
});

console.log('✅ Wishlist routes loaded successfully - JWT SECRET FIXED');

module.exports = router;