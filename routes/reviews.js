// routes/reviews.js - Reviews & Ratings System
const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Import auth middleware
let authenticateToken, optionalAuth;
try {
  const authMiddleware = require('../middleware/auth');
  authenticateToken = authMiddleware.authenticateToken;
  optionalAuth = authMiddleware.optionalAuth;
} catch (error) {
  // Define minimal auth middleware if import fails
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';
  
  authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Authentication required'
      });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'Invalid token'
      });
    }
  };
  
  optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
      } catch (error) {
        // Silently continue without user
      }
    }
    next();
  };
}

console.log('📝 Reviews & Ratings System loading...');

// Reviews persistence setup
const DATA_DIR = path.join(__dirname, '../data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load reviews from file
function loadReviews() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf8');
      const reviews = JSON.parse(data);
      console.log(`📤 Loaded ${reviews.length} reviews from file`);
      return reviews;
    }
  } catch (error) {
    console.log('⚠️ Error loading reviews file:', error.message);
  }
  return [];
}

// Save reviews to file
function saveReviews(reviews) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    console.log(`💾 Saved ${reviews.length} reviews to file`);
    return true;
  } catch (error) {
    console.error('❌ Error saving reviews:', error.message);
    return false;
  }
}

// Initialize reviews data
let persistentReviews = loadReviews();

// Helper functions
function generateReviewId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function validateRating(rating) {
  const numRating = Number(rating);
  return numRating >= 1 && numRating <= 5 && Number.isInteger(numRating);
}

function calculateAverageRating(productReviews) {
  if (productReviews.length === 0) return 0;
  
  const sum = productReviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / productReviews.length) * 10) / 10; // Round to 1 decimal
}

// GET /api/v1/{domain}/products/{id}/reviews - Get product reviews
router.get('/:domain/products/:id/reviews', optionalAuth, (req, res) => {
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const sortBy = req.query.sort || 'newest'; // newest, oldest, highest, lowest, helpful
    
    console.log(`📝 Getting reviews for ${domain}/products/${productId}`);
    
    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Invalid product ID'
      });
    }
    
    // Filter reviews for this product
    let productReviews = persistentReviews.filter(
      review => review.domain === domain && review.product_id === productId
    );
    
    // Sort reviews
    switch (sortBy) {
      case 'oldest':
        productReviews.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'highest':
        productReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        productReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'helpful':
        productReviews.sort((a, b) => (b.helpful_votes || 0) - (a.helpful_votes || 0));
        break;
      default: // newest
        productReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    
    // Pagination
    const offset = (page - 1) * limit;
    const paginatedReviews = productReviews.slice(offset, offset + limit);
    
    // Calculate rating distribution
    const ratingDistribution = {
      1: productReviews.filter(r => r.rating === 1).length,
      2: productReviews.filter(r => r.rating === 2).length,
      3: productReviews.filter(r => r.rating === 3).length,
      4: productReviews.filter(r => r.rating === 4).length,
      5: productReviews.filter(r => r.rating === 5).length
    };
    
    const averageRating = calculateAverageRating(productReviews);
    
    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        statistics: {
          total_reviews: productReviews.length,
          average_rating: averageRating,
          rating_distribution: ratingDistribution
        },
        pagination: {
          current_page: page,
          total_pages: Math.ceil(productReviews.length / limit),
          total_reviews: productReviews.length,
          reviews_per_page: limit,
          has_next: page < Math.ceil(productReviews.length / limit),
          has_prev: page > 1
        }
      },
      meta: {
        domain: domain,
        product_id: productId,
        sort_by: sortBy
      }
    });
    
  } catch (error) {
    console.error('❌ Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to fetch reviews'
    });
  }
});

// POST /api/v1/{domain}/products/{id}/reviews - Add product review
router.post('/:domain/products/:id/reviews', authenticateToken, (req, res) => {
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);
    const { rating, comment, title } = req.body;
    
    console.log(`📝 Adding review for ${domain}/products/${productId} by user ${req.user.id}`);
    
    // Validation
    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Invalid product ID'
      });
    }
    
    if (!validateRating(rating)) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Rating must be an integer between 1 and 5'
      });
    }
    
    if (!comment || comment.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Comment must be at least 10 characters long'
      });
    }
    
    if (comment.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Comment must be less than 1000 characters'
      });
    }
    
    // Check if user already reviewed this product
    const existingReview = persistentReviews.find(
      review => review.domain === domain && 
               review.product_id === productId && 
               review.user_id === req.user.id
    );
    
    if (existingReview) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'You have already reviewed this product. Use PUT to update your review.'
      });
    }
    
    // Create new review
    const newReview = {
      id: generateReviewId(),
      domain: domain,
      product_id: productId,
      user_id: req.user.id,
      username: req.user.username,
      user_display_name: req.user.first_name && req.user.last_name 
        ? `${req.user.first_name} ${req.user.last_name}` 
        : req.user.username,
      rating: parseInt(rating),
      title: title ? title.trim() : null,
      comment: comment.trim(),
      helpful_votes: 0,
      verified_purchase: Math.random() > 0.3, // Mock verification - in real app check order history
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add to reviews
    persistentReviews.push(newReview);
    
    // Save to file
    if (saveReviews(persistentReviews)) {
      console.log(`✅ Review added successfully for product ${productId} by ${req.user.username}`);
      
      // Return the created review
      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: {
          review: newReview
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'server_error',
        message: 'Failed to save review'
      });
    }
    
  } catch (error) {
    console.error('❌ Add review error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to add review'
    });
  }
});

// PUT /api/v1/reviews/{reviewId} - Update user's review
router.put('/reviews/:reviewId', authenticateToken, (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, title } = req.body;
    
    console.log(`📝 Updating review ${reviewId} by user ${req.user.id}`);
    
    // Find review
    const reviewIndex = persistentReviews.findIndex(
      review => review.id === reviewId && review.user_id === req.user.id
    );
    
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'Review not found or you do not have permission to edit it'
      });
    }
    
    // Validation
    if (rating !== undefined && !validateRating(rating)) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Rating must be an integer between 1 and 5'
      });
    }
    
    if (comment !== undefined && (comment.trim().length < 10 || comment.length > 1000)) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Comment must be between 10 and 1000 characters'
      });
    }
    
    // Update review
    const review = persistentReviews[reviewIndex];
    if (rating !== undefined) review.rating = parseInt(rating);
    if (comment !== undefined) review.comment = comment.trim();
    if (title !== undefined) review.title = title ? title.trim() : null;
    review.updated_at = new Date().toISOString();
    
    // Save to file
    if (saveReviews(persistentReviews)) {
      console.log(`✅ Review updated successfully: ${reviewId}`);
      
      res.json({
        success: true,
        message: 'Review updated successfully',
        data: {
          review: review
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'server_error',
        message: 'Failed to save review update'
      });
    }
    
  } catch (error) {
    console.error('❌ Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to update review'
    });
  }
});

// DELETE /api/v1/reviews/{reviewId} - Delete user's review
router.delete('/reviews/:reviewId', authenticateToken, (req, res) => {
  try {
    const { reviewId } = req.params;
    
    console.log(`📝 Deleting review ${reviewId} by user ${req.user.id}`);
    
    // Find review
    const reviewIndex = persistentReviews.findIndex(
      review => review.id === reviewId && 
               (review.user_id === req.user.id || req.user.role === 'admin')
    );
    
    if (reviewIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'Review not found or you do not have permission to delete it'
      });
    }
    
    // Remove review
    const deletedReview = persistentReviews.splice(reviewIndex, 1)[0];
    
    // Save to file
    if (saveReviews(persistentReviews)) {
      console.log(`✅ Review deleted successfully: ${reviewId}`);
      
      res.json({
        success: true,
        message: 'Review deleted successfully',
        data: {
          deleted_review_id: reviewId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'server_error',
        message: 'Failed to save review deletion'
      });
    }
    
  } catch (error) {
    console.error('❌ Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to delete review'
    });
  }
});

// POST /api/v1/reviews/{reviewId}/helpful - Mark review as helpful
router.post('/reviews/:reviewId/helpful', authenticateToken, (req, res) => {
  try {
    const { reviewId } = req.params;
    
    console.log(`📝 Marking review ${reviewId} as helpful by user ${req.user.id}`);
    
    // Find review
    const review = persistentReviews.find(r => r.id === reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'Review not found'
      });
    }
    
    // Cannot vote on own review
    if (review.user_id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'You cannot vote on your own review'
      });
    }
    
    // Initialize helpful votes if not exists
    if (!review.helpful_votes) review.helpful_votes = 0;
    if (!review.helpful_voters) review.helpful_voters = [];
    
    // Check if user already voted
    if (review.helpful_voters.includes(req.user.id)) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'You have already voted on this review'
      });
    }
    
    // Add helpful vote
    review.helpful_votes += 1;
    review.helpful_voters.push(req.user.id);
    review.updated_at = new Date().toISOString();
    
    // Save to file
    if (saveReviews(persistentReviews)) {
      console.log(`✅ Helpful vote added to review ${reviewId}`);
      
      res.json({
        success: true,
        message: 'Thank you for your feedback',
        data: {
          review_id: reviewId,
          helpful_votes: review.helpful_votes
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'server_error',
        message: 'Failed to save helpful vote'
      });
    }
    
  } catch (error) {
    console.error('❌ Helpful vote error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to add helpful vote'
    });
  }
});

// GET /api/v1/users/{userId}/reviews - Get user's reviews
router.get('/users/:userId/reviews', optionalAuth, (req, res) => {
  try {
    const { userId } = req.params;
    const requestedUserId = parseInt(userId);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    console.log(`📝 Getting reviews for user ${requestedUserId}`);
    
    // Privacy check - only show user's own reviews or make them public
    const isOwnReviews = req.user && req.user.id === requestedUserId;
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Filter user's reviews
    let userReviews = persistentReviews.filter(
      review => review.user_id === requestedUserId
    );
    
    // Sort by newest first
    userReviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Pagination
    const offset = (page - 1) * limit;
    const paginatedReviews = userReviews.slice(offset, offset + limit);
    
    // Hide sensitive info if not own reviews (unless admin)
    if (!isOwnReviews && !isAdmin) {
      paginatedReviews.forEach(review => {
        delete review.helpful_voters;
      });
    }
    
    res.json({
      success: true,
      data: {
        reviews: paginatedReviews,
        statistics: {
          total_reviews: userReviews.length,
          average_rating: calculateAverageRating(userReviews)
        },
        pagination: {
          current_page: page,
          total_pages: Math.ceil(userReviews.length / limit),
          total_reviews: userReviews.length,
          reviews_per_page: limit,
          has_next: page < Math.ceil(userReviews.length / limit),
          has_prev: page > 1
        }
      },
      meta: {
        user_id: requestedUserId,
        is_own_reviews: isOwnReviews
      }
    });
    
  } catch (error) {
    console.error('❌ Get user reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to fetch user reviews'
    });
  }
});

// GET /api/v1/reviews/statistics - Get overall review statistics
router.get('/reviews/statistics', (req, res) => {
  try {
    const domain = req.query.domain;
    
    let reviewsToAnalyze = persistentReviews;
    if (domain) {
      reviewsToAnalyze = persistentReviews.filter(r => r.domain === domain);
    }
    
    const totalReviews = reviewsToAnalyze.length;
    const averageRating = calculateAverageRating(reviewsToAnalyze);
    
    const ratingDistribution = {
      1: reviewsToAnalyze.filter(r => r.rating === 1).length,
      2: reviewsToAnalyze.filter(r => r.rating === 2).length,
      3: reviewsToAnalyze.filter(r => r.rating === 3).length,
      4: reviewsToAnalyze.filter(r => r.rating === 4).length,
      5: reviewsToAnalyze.filter(r => r.rating === 5).length
    };
    
    // Most active reviewers
    const reviewerCounts = {};
    reviewsToAnalyze.forEach(review => {
      reviewerCounts[review.user_id] = (reviewerCounts[review.user_id] || 0) + 1;
    });
    
    const topReviewers = Object.entries(reviewerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => {
        const sampleReview = reviewsToAnalyze.find(r => r.user_id === parseInt(userId));
        return {
          user_id: parseInt(userId),
          username: sampleReview?.user_display_name || 'Anonymous',
          review_count: count
        };
      });
    
    // Recent activity
    const recentReviews = reviewsToAnalyze
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(review => ({
        id: review.id,
        domain: review.domain,
        product_id: review.product_id,
        rating: review.rating,
        created_at: review.created_at,
        username: review.user_display_name
      }));
    
    res.json({
      success: true,
      data: {
        total_reviews: totalReviews,
        average_rating: averageRating,
        rating_distribution: ratingDistribution,
        top_reviewers: topReviewers,
        recent_reviews: recentReviews,
        verified_purchases: reviewsToAnalyze.filter(r => r.verified_purchase).length
      },
      meta: {
        domain: domain || 'all',
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Get statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to fetch review statistics'
    });
  }
});

// Health check for reviews system
router.get('/reviews/health', (req, res) => {
  try {
    const totalReviews = persistentReviews.length;
    const averageRating = calculateAverageRating(persistentReviews);
    
    res.json({
      success: true,
      message: 'Reviews system healthy',
      data: {
        total_reviews: totalReviews,
        average_rating: averageRating,
        persistence: 'File-based storage',
        file_path: REVIEWS_FILE,
        features: [
          'Add/Edit/Delete reviews',
          'Star ratings (1-5)',
          'Helpful votes',
          'Review statistics',
          'User review history',
          'Verified purchase indicators',
          'Persistent storage'
        ]
      }
    });
  } catch (error) {
    console.error('❌ Reviews health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Reviews system error',
      message: error.message
    });
  }
});

console.log('✅ Reviews & Ratings System routes loaded successfully');

module.exports = router;