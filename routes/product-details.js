// routes/product-details.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // Important for :domain parameter
const Database = require('better-sqlite3');
const path = require('path');

// Database connection - Fixed path to match existing setup
const dbPath = path.resolve(__dirname, '../database/universal_api.db');

function getDB() {
  try {
    console.log('Trying to connect to database at:', dbPath);
    return new Database(dbPath);
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Database connection failed: ' + error.message);
  }
}

// Get Single Product Details
router.get('/:id', (req, res) => {
  let db;
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);
    
    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID',
        message: 'Product ID must be a positive number'
      });
    }
    
    db = getDB();
    
    // Get single product with category and brand info
    const product = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ? AND p.id = ?
    `).get(domain, productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `Product with ID ${productId} not found in ${domain} domain`
      });
    }
    
    // Parse JSON attributes
    if (product.attributes) {
      try {
        product.attributes = JSON.parse(product.attributes);
      } catch (e) {
        product.attributes = {};
      }
    }
    
    res.json({
      success: true,
      data: {
        product: product
      }
    });
    
  } catch (error) {
    console.error('Product details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product details',
      message: error.message
    });
  } finally {
    if (db) db.close();
  }
});

// Get Related Products (same category)
router.get('/:id/related', (req, res) => {
  let db;
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);
    const limit = parseInt(req.query.limit) || 5;
    
    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }
    
    db = getDB();
    
    // First get the product's category
    const mainProduct = db.prepare(`
      SELECT category_id FROM products WHERE domain = ? AND id = ?
    `).get(domain, productId);
    
    if (!mainProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Get related products from same category (excluding the current product)
    const relatedProducts = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ? 
        AND p.category_id = ? 
        AND p.id != ?
      ORDER BY RANDOM()
      LIMIT ?
    `).all(domain, mainProduct.category_id, productId, limit);
    
    // Parse JSON attributes for each product
    relatedProducts.forEach(product => {
      if (product.attributes) {
        try {
          product.attributes = JSON.parse(product.attributes);
        } catch (e) {
          product.attributes = {};
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        related_products: relatedProducts,
        total: relatedProducts.length
      }
    });
    
  } catch (error) {
    console.error('Related products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch related products',
      message: error.message
    });
  } finally {
    if (db) db.close();
  }
});

// Get Product Reviews (Mock data for learning)
router.get('/:id/reviews', (req, res) => {
  let db;
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }
    
    db = getDB();
    
    // Check if product exists
    const product = db.prepare(`
      SELECT id, name FROM products WHERE domain = ? AND id = ?
    `).get(domain, productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Generate mock reviews (for educational purposes)
    const reviewTemplates = [
      { rating: 5, comment: "Excellent product! Highly recommend.", author: "John D." },
      { rating: 4, comment: "Very good quality, fast delivery.", author: "Sarah M." },
      { rating: 5, comment: "Perfect! Exactly what I was looking for.", author: "Mike R." },
      { rating: 3, comment: "Good product but could be better.", author: "Anna K." },
      { rating: 4, comment: "Nice quality for the price.", author: "David L." },
      { rating: 5, comment: "Amazing! Will buy again.", author: "Lisa P." },
      { rating: 4, comment: "Good experience overall.", author: "Tom W." },
      { rating: 2, comment: "Not what I expected.", author: "Jane S." },
      { rating: 5, comment: "Outstanding quality and service!", author: "Chris B." },
      { rating: 4, comment: "Satisfied with my purchase.", author: "Emma F." }
    ];
    
    // Select reviews for this page
    const totalReviews = 25; // Mock total
    const selectedReviews = reviewTemplates
      .slice(offset, offset + limit)
      .map((review, index) => ({
        id: offset + index + 1,
        product_id: productId,
        rating: review.rating,
        comment: review.comment,
        author: review.author,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        verified_purchase: Math.random() > 0.3
      }));
    
    res.json({
      success: true,
      data: {
        reviews: selectedReviews,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(totalReviews / limit),
          total_reviews: totalReviews,
          reviews_per_page: limit,
          has_next: page < Math.ceil(totalReviews / limit),
          has_prev: page > 1
        },
        product: {
          id: product.id,
          name: product.name
        }
      }
    });
    
  } catch (error) {
    console.error('Product reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product reviews',
      message: error.message
    });
  } finally {
    if (db) db.close();
  }
});

// Add Product Review (Protected Route - requires auth)
router.post('/:id/reviews', (req, res) => {
  // For educational purposes, we'll just return a success message
  // In a real app, this would save to database
  
  const { domain, id } = req.params;
  const { rating, comment } = req.body;
  
  if (!rating || !comment) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Rating and comment are required'
    });
  }
  
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      error: 'Invalid rating',
      message: 'Rating must be between 1 and 5'
    });
  }
  
  // Mock successful review submission
  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: {
      review: {
        id: Math.floor(Math.random() * 1000) + 100,
        product_id: parseInt(id),
        rating: parseInt(rating),
        comment: comment,
        author: 'Current User',
        created_at: new Date().toISOString(),
        verified_purchase: false
      }
    }
  });
});

module.exports = router;