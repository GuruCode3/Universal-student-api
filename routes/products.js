const express = require('express');
const router = express.Router({ mergeParams: true });
const { dbConfig } = require('../utils/database');

// 🛡️ DOMAIN VALIDATION MIDDLEWARE - FIX FOR 404 BUG
const VALID_DOMAINS = [
  'movies', 'books', 'electronics', 'restaurants', 'fashion',
  'cars', 'hotels', 'games', 'music', 'food', 'sports',
  'toys', 'tools', 'medicines', 'courses', 'events',
  'apps', 'flights', 'pets', 'realestate'
];

function validateDomain(req, res, next) {
  const domain = req.params.domain;
  
  console.log('🔍 DOMAIN VALIDATION CHECK:', domain);
  
  if (!domain) {
    return res.status(400).json({
      success: false,
      error: 'bad_request',
      message: 'Domain parameter is required'
    });
  }
  
  if (!VALID_DOMAINS.includes(domain.toLowerCase())) {
    console.log('❌ DOMAIN VALIDATION FAILED:', domain);
    return res.status(404).json({
      success: false,
      error: 'domain_not_found',
      message: `Domain '${domain}' not found`,
      available_domains: VALID_DOMAINS,
      suggestion: 'Use one of the available domains listed above',
      timestamp: new Date().toISOString()
    });
  }
  
  console.log('✅ DOMAIN VALIDATION PASSED:', domain);
  next();
}

// GET /api/v1/:domain/categories
router.get('/categories', validateDomain, async (req, res) => {
  try {
    const { domain } = req.params;
    
    console.log(`🔍 CATEGORIES REQUEST: ${domain}`);
    
    const categories = dbConfig.executeQuery(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.domain = c.domain
      WHERE c.domain = ?
      GROUP BY c.id
      ORDER BY c.name
    `, [domain]);
    
    console.log(`📋 Categories found: ${categories.length}`);
    
    res.json({
      success: true,
      data: categories,
      meta: {
        domain: domain,
        total_categories: categories.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Categories error for ${req.params.domain}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/v1/:domain/brands
router.get('/brands', validateDomain, async (req, res) => {
  try {
    const { domain } = req.params;
    
    console.log(`🏷️ BRANDS REQUEST: ${domain}`);
    
    const brands = dbConfig.executeQuery(`
      SELECT 
        b.*,
        COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.domain = b.domain
      WHERE b.domain = ?
      GROUP BY b.id
      ORDER BY b.name
    `, [domain]);
    
    console.log(`🏷️ Brands found: ${brands.length}`);
    
    res.json({
      success: true,
      data: brands,
      meta: {
        domain: domain,
        total_brands: brands.length
      }
    });
    
  } catch (error) {
    console.error(`❌ Brands error for ${req.params.domain}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      message: error.message
    });
  }
});

// GET /api/v1/:domain/products - FIXED PAGINATION COUNT + DOMAIN VALIDATION
router.get('/products', validateDomain, async (req, res) => {
  try {
    const { domain } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 500); // Max 500 per page (all products)
    const offset = (page - 1) * limit;
    
    console.log(`🛍️ PRODUCTS REQUEST: ${domain}, page: ${page}, limit: ${limit}`);
    
    // FIXED: Get total count manually
    const allDomainProducts = await dbConfig.getAll(`
      SELECT id FROM products WHERE domain = ?
    `, [domain]);
    const total = allDomainProducts.length;
    
    console.log(`📊 TOTAL PRODUCTS COUNT for '${domain}': ${total}`);
    
    // Get products with category and brand info
    const products = dbConfig.executeQuery(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `, [domain, limit, offset]);

    // Parse JSON attributes for each product
    products.forEach(product => {
      if (product.attributes) {
        try {
          product.attributes = JSON.parse(product.attributes);
        } catch (e) {
          product.attributes = {};
        }
      }
    });

    // FIXED: Pagination info with correct total
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    console.log(`📄 PAGINATION INFO: total=${total}, pages=${totalPages}, current=${page}`);

    res.json({
      success: true,
      data: products,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_products: total, // FIXED: Real count
        products_per_page: limit,
        has_next: hasNext,
        has_prev: hasPrev,
        next_page: hasNext ? page + 1 : null,
        prev_page: hasPrev ? page - 1 : null
      },
      meta: {
        domain: domain,
        products_count: products.length,
        request_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Products error for ${req.params.domain}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: error.message,
      domain: req.params.domain
    });
  }
});

// GET /api/v1/:domain/products/search - FIXED PAGINATION COUNT + DOMAIN VALIDATION
router.get('/products/search', validateDomain, async (req, res) => {
  try {
    const { domain } = req.params;
    const { q, category, brand, min_price, max_price } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 500);
    const offset = (page - 1) * limit;

    if (!q && !category && !brand) {
      return res.status(400).json({
        success: false,
        error: 'Search query required',
        message: 'Please provide search term (q), category, or brand parameter'
      });
    }

    console.log(`🔍 SEARCH REQUEST: ${domain}, query: "${q}", page: ${page}`);

    // Build search query
    let searchQuery = `
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ?
    `;

    // FIXED: Manual count for search results
    let countQuery = `
      SELECT p.id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ?
    `;

    const params = [domain];
    const countParams = [domain];

    // Add search conditions
    if (q) {
      searchQuery += ` AND (p.name LIKE ? OR p.attributes LIKE ?)`;
      countQuery += ` AND (p.name LIKE ? OR p.attributes LIKE ?)`;
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm);
    }

    if (category) {
      searchQuery += ` AND c.slug = ?`;
      countQuery += ` AND c.slug = ?`;
      params.push(category);
      countParams.push(category);
    }

    if (brand) {
      searchQuery += ` AND b.slug = ?`;
      countQuery += ` AND b.slug = ?`;
      params.push(brand);
      countParams.push(brand);
    }

    if (min_price) {
      searchQuery += ` AND p.price >= ?`;
      countQuery += ` AND p.price >= ?`;
      params.push(parseFloat(min_price));
      countParams.push(parseFloat(min_price));
    }

    if (max_price) {
      searchQuery += ` AND p.price <= ?`;
      countQuery += ` AND p.price <= ?`;
      params.push(parseFloat(max_price));
      countParams.push(parseFloat(max_price));
    }

    // Add ordering and pagination
    searchQuery += ` ORDER BY p.rating DESC, p.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // FIXED: Execute count query manually
    const countResults = dbConfig.executeQuery(countQuery, countParams);
    const total = countResults.length;

    // Execute search query
    const products = dbConfig.executeQuery(searchQuery, params);

    console.log(`🔍 SEARCH RESULTS: ${products.length} products, total: ${total}`);

    // Parse JSON attributes
    products.forEach(product => {
      if (product.attributes) {
        try {
          product.attributes = JSON.parse(product.attributes);
        } catch (e) {
          product.attributes = {};
        }
      }
    });

    // FIXED: Pagination info with correct total
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: products,
      search: {
        query: q || null,
        category: category || null,
        brand: brand || null,
        min_price: min_price ? parseFloat(min_price) : null,
        max_price: max_price ? parseFloat(max_price) : null,
        results_found: total // FIXED: Real search count
      },
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_results: total, // FIXED: Real count
        results_per_page: limit,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      meta: {
        domain: domain,
        results_count: products.length,
        search_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Search error for ${req.params.domain}:`, error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error.message,
      domain: req.params.domain
    });
  }
});

// GET /api/v1/:domain/products/:id
router.get('/products/:id', validateDomain, async (req, res) => {
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

    console.log(`🎯 SINGLE PRODUCT REQUEST: ${domain}, ID: ${productId}`);

    // Get single product with full details
    const product = await dbConfig.getOne(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug,
        b.name as brand_name,
        b.slug as brand_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ? AND p.id = ?
    `, [domain, productId]);

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

    // Get related products (same category, different product)
    const relatedProducts = dbConfig.executeQuery(`
      SELECT 
        p.id, p.name, p.price, p.image_url, p.rating, p.review_count,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ? 
        AND p.category_id = ? 
        AND p.id != ?
      ORDER BY RANDOM()
      LIMIT 4
    `, [domain, product.category_id, productId]);

    res.json({
      success: true,
      data: {
        product: product,
        related_products: relatedProducts
      },
      meta: {
        domain: domain,
        product_id: productId,
        related_count: relatedProducts.length
      }
    });

  } catch (error) {
    console.error(`❌ Single product error:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product details',
      message: error.message
    });
  }
});

// GET /api/v1/:domain/products/:id/reviews (Mock reviews for educational purposes)
router.get('/products/:id/reviews', validateDomain, async (req, res) => {
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product ID'
      });
    }

    // Check if product exists
    const product = await dbConfig.getOne(
      'SELECT id, name FROM products WHERE domain = ? AND id = ?',
      [domain, productId]
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Generate mock reviews
    const reviewTemplates = [
      { rating: 5, comment: "Excellent product! Highly recommend.", author: "ნინო მ." },
      { rating: 4, comment: "Very good quality, fast delivery.", author: "გიორგი კ." },
      { rating: 5, comment: "Perfect! Exactly what I was looking for.", author: "მარიამ ლ." },
      { rating: 3, comment: "Good product but could be better.", author: "დავით ს." },
      { rating: 4, comment: "Nice quality for the price.", author: "ელენე პ." },
      { rating: 5, comment: "Amazing! Will buy again.", author: "ლევან ბ." },
      { rating: 4, comment: "Good experience overall.", author: "თამარ ღ." },
      { rating: 2, comment: "Not what I expected.", author: "ნიკა რ." },
      { rating: 5, comment: "Outstanding quality and service!", author: "ანა ჩ." },
      { rating: 4, comment: "Satisfied with my purchase.", author: "ზურაბ მ." }
    ];

    const totalReviews = 25; // Mock total
    const offset = (page - 1) * limit;
    
    const selectedReviews = reviewTemplates
      .slice(0, limit)
      .map((review, index) => ({
        id: offset + index + 1,
        product_id: productId,
        rating: review.rating,
        comment: review.comment,
        author: review.author,
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        verified_purchase: Math.random() > 0.3,
        helpful_count: Math.floor(Math.random() * 20)
      }));

    res.json({
      success: true,
      data: {
        reviews: selectedReviews,
        product: {
          id: product.id,
          name: product.name,
          domain: domain
        }
      },
      pagination: {
        current_page: page,
        total_pages: Math.ceil(totalReviews / limit),
        total_reviews: totalReviews,
        reviews_per_page: limit,
        has_next: page < Math.ceil(totalReviews / limit),
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product reviews',
      message: error.message
    });
  }
});

console.log('✅ Products routes loaded with DOMAIN VALIDATION - 404 bug fixed!');

module.exports = router;