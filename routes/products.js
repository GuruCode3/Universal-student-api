const express = require('express');
const router = express.Router({ mergeParams: true });
const { dbConfig } = require('../utils/database');

// 🛡️ DOMAIN VALIDATION MIDDLEWARE
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

// 🔢 PAGINATION VALIDATION MIDDLEWARE - FIXED FOR LARGE PAGES
function validatePagination(req, res, next) {
  const pageStr = req.query.page;
  const limitStr = req.query.limit;
  
  console.log('🔍 PAGINATION VALIDATION - Raw values:', { page: pageStr, limit: limitStr });
  
  // Page validation
  let page = 1; // default
  if (pageStr !== undefined) {
    // Check if non-numeric
    if (isNaN(pageStr) || pageStr.trim() === '') {
      console.log('❌ PAGINATION: Non-numeric page:', pageStr);
      return res.status(400).json({
        success: false,
        error: 'invalid_page_format',
        message: 'Page must be a number',
        provided: pageStr,
        expected: 'numeric value'
      });
    }
    
    page = parseInt(pageStr);
    
    // Check negative or zero
    if (page < 1) {
      console.log('❌ PAGINATION: Invalid page number:', page);
      return res.status(400).json({
        success: false,
        error: 'invalid_page_number',
        message: 'Page number must be 1 or greater',
        provided: page,
        expected: 'page >= 1'
      });
    }
    
    // 🔧 BUG FIX: Allow extremely large pages but handle gracefully
    // Don't reject large pages - let them through and handle empty results
    if (page > 1000000) {
      console.log('⚠️ PAGINATION: Very large page number:', page);
      // Let it continue but log for monitoring
    }
  }
  
  // Limit validation
  let limit = 20; // default
  if (limitStr !== undefined) {
    // Check if non-numeric
    if (isNaN(limitStr) || limitStr.trim() === '') {
      console.log('❌ PAGINATION: Non-numeric limit:', limitStr);
      return res.status(400).json({
        success: false,
        error: 'invalid_limit_format',
        message: 'Limit must be a number',
        provided: limitStr,
        expected: 'numeric value'
      });
    }
    
    limit = parseInt(limitStr);
    
    // Check negative or zero
    if (limit < 1) {
      console.log('❌ PAGINATION: Invalid limit:', limit);
      return res.status(400).json({
        success: false,
        error: 'invalid_limit',
        message: 'Limit must be 1 or greater',
        provided: limit,
        expected: 'limit >= 1'
      });
    }
    
    // Check extremely large
    if (limit > 500) {
      console.log('❌ PAGINATION: Limit too large:', limit);
      return res.status(400).json({
        success: false,
        error: 'invalid_limit',
        message: 'Limit too large',
        provided: limit,
        max_allowed: 500
      });
    }
  }
  
  console.log('✅ PAGINATION VALIDATION PASSED:', { page, limit });
  
  // Store validated values
  req.validatedPage = page;
  req.validatedLimit = limit;
  
  next();
}

// 🛡️ SECURITY MIDDLEWARE - Parameter Sanitization
function validateAndSanitizeParameters(req, res, next) {
  const allowedParams = ['page', 'limit', 'q', 'category', 'brand', 'min_price', 'max_price'];
  const dangerousPatterns = [
    /<script/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+=/i,  // onload=, onclick=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
    /alert\(/i
  ];

  console.log('🔍 SECURITY: Parameter validation started');
  console.log('🔍 Query parameters:', req.query);

  // Check for suspicious parameters
  const suspiciousParams = [];
  const invalidParams = [];

  for (const [key, value] of Object.entries(req.query)) {
    // Check for unexpected parameters
    if (!allowedParams.includes(key)) {
      invalidParams.push(key);
    }

    // Check for dangerous patterns in values
    if (typeof value === 'string') {
      const decodedValue = decodeURIComponent(value);
      for (const pattern of dangerousPatterns) {
        if (pattern.test(decodedValue)) {
          suspiciousParams.push({
            param: key,
            value: value,
            decoded: decodedValue,
            threat: 'Potential XSS/Script injection'
          });
        }
      }
    }
  }

  // Handle invalid parameters
  if (invalidParams.length > 0) {
    console.log('❌ SECURITY: Invalid parameters detected:', invalidParams);
    return res.status(400).json({
      success: false,
      error: 'invalid_parameters',
      message: 'Invalid query parameters detected',
      invalid_parameters: invalidParams,
      allowed_parameters: allowedParams,
      suggestion: 'Remove invalid parameters and try again'
    });
  }

  // Handle suspicious content
  if (suspiciousParams.length > 0) {
    console.log('🚨 SECURITY THREAT: Suspicious parameters detected:', suspiciousParams);
    return res.status(400).json({
      success: false,
      error: 'security_violation',
      message: 'Potentially malicious content detected in parameters',
      security_details: 'Script tags and JavaScript code are not allowed',
      timestamp: new Date().toISOString(),
      blocked_reason: 'XSS prevention'
    });
  }

  console.log('✅ SECURITY: Parameter validation passed');
  next();
}

// Test endpoint to verify security
router.get('/security-test', (req, res) => {
  res.json({
    success: true,
    message: 'Security middleware active',
    allowed_parameters: ['page', 'limit', 'q', 'category', 'brand', 'min_price', 'max_price'],
    security_features: [
      'XSS prevention',
      'Script injection blocking',
      'Parameter whitelisting',
      'Content sanitization'
    ],
    test_examples: {
      valid: '/api/v1/movies/products?page=1&limit=10',
      invalid_param: '/api/v1/movies/products?page=1&malicious=hack',
      xss_attempt: '/api/v1/movies/products?page=1&q=<script>alert("xss")</script>'
    }
  });
});

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

// GET /api/v1/:domain/products - WITH FIXED LARGE PAGE HANDLING
router.get('/products', validateDomain, validateAndSanitizeParameters, validatePagination, async (req, res) => {
  try {
    const { domain } = req.params;
    const page = req.validatedPage;
    const limit = req.validatedLimit;
    const offset = (page - 1) * limit;
    
    console.log(`🛍️ PRODUCTS REQUEST: ${domain}, page: ${page}, limit: ${limit}`);
    
    // Get total count
    const allDomainProducts = await dbConfig.getAll(`
      SELECT id FROM products WHERE domain = ?
    `, [domain]);
    const total = allDomainProducts.length;
    
    console.log(`📊 TOTAL PRODUCTS COUNT for '${domain}': ${total}`);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    
    // 🔧 BUG FIX: For extremely large page numbers, return empty results with 200 OK
    // Don't return 400 error - just empty results
    if (page > totalPages && total > 0) {
      console.log(`📄 LARGE PAGE: Page ${page} > totalPages ${totalPages}, returning empty results`);
      return res.json({
        success: true,
        data: [], // Empty results for large page numbers
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_products: total,
          products_per_page: limit,
          has_next: false,
          has_prev: true,
          next_page: null,
          prev_page: totalPages > 0 ? totalPages : null
        },
        meta: {
          domain: domain,
          products_count: 0,
          request_time: new Date().toISOString(),
          note: `Page ${page} exceeds available pages (${totalPages}). Showing empty results.`
        }
      });
    }
    
    // Get products
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

    // FIXED: Correct pagination calculations
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    console.log(`📄 PAGINATION INFO: total=${total}, pages=${totalPages}, current=${page}`);

    res.json({
      success: true,
      data: products,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_products: total,
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

// GET /api/v1/:domain/products/search - WITH VALIDATION AND SECURITY
router.get('/products/search', validateDomain, validateAndSanitizeParameters, validatePagination, async (req, res) => {
  try {
    const { domain } = req.params;
    const { q, category, brand, min_price, max_price } = req.query;
    const page = req.validatedPage;
    const limit = req.validatedLimit;
    const offset = (page - 1) * limit;

    if (!q && !category && !brand) {
      return res.status(400).json({
        success: false,
        error: 'search_query_required',
        message: 'Please provide search term (q), category, or brand parameter'
      });
    }

    console.log(`🔍 SEARCH REQUEST: ${domain}, query: "${q}", page: ${page}`);

    // Build search query with same logic as before...
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

    let countQuery = `
      SELECT p.id
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id AND c.domain = p.domain
      LEFT JOIN brands b ON p.brand_id = b.id AND b.domain = p.domain
      WHERE p.domain = ?
    `;

    const params = [domain];
    const countParams = [domain];

    // Add search conditions (same as before)
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

    searchQuery += ` ORDER BY p.rating DESC, p.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const countResults = dbConfig.executeQuery(countQuery, countParams);
    const total = countResults.length;
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
        results_found: total
      },
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_results: total,
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

// 🔧 BUG FIX: Product ID validation middleware
function validateProductId(req, res, next) {
  const { id } = req.params;
  
  console.log('🔍 PRODUCT ID VALIDATION:', id);
  
  // Check for float numbers (like 1.5)
  if (id.includes('.')) {
    console.log('❌ PRODUCT ID: Float number detected:', id);
    return res.status(400).json({
      success: false,
      error: 'invalid_product_id_format',
      message: 'Product ID must be a whole number (integer)',
      provided: id,
      expected: 'integer value (e.g., 1, 2, 3)'
    });
  }
  
  const productId = parseInt(id);
  
  // Check if it's a valid number
  if (isNaN(productId) || productId !== parseFloat(id)) {
    console.log('❌ PRODUCT ID: Invalid number:', id);
    return res.status(400).json({
      success: false,
      error: 'invalid_product_id',
      message: 'Product ID must be a valid number',
      provided: id,
      expected: 'positive integer'
    });
  }
  
  // Check if it's positive
  if (productId < 1) {
    console.log('❌ PRODUCT ID: Non-positive number:', productId);
    return res.status(400).json({
      success: false,
      error: 'invalid_product_id',
      message: 'Product ID must be a positive number',
      provided: productId,
      expected: 'number >= 1'
    });
  }
  
  console.log('✅ PRODUCT ID VALIDATION PASSED:', productId);
  req.validatedProductId = productId;
  next();
}

// GET /api/v1/:domain/products/:id - WITH PROPER ID VALIDATION AND 404 HANDLING
router.get('/products/:id', validateDomain, validateProductId, async (req, res) => {
  try {
    const { domain } = req.params;
    const productId = req.validatedProductId;

    console.log(`🎯 SINGLE PRODUCT REQUEST: ${domain}, ID: ${productId}`);

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

    // 🔧 BUG FIX: Proper 404 handling for non-existent products
    if (!product) {
      console.log(`❌ PRODUCT NOT FOUND: domain=${domain}, id=${productId}`);
      return res.status(404).json({
        success: false,
        error: 'product_not_found',
        message: `Product with ID ${productId} not found in ${domain} domain`,
        domain: domain,
        product_id: productId,
        suggestion: 'Check if the product ID exists or try browsing products list'
      });
    }

    if (product.attributes) {
      try {
        product.attributes = JSON.parse(product.attributes);
      } catch (e) {
        product.attributes = {};
      }
    }

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

    console.log(`✅ PRODUCT FOUND: ${product.name} (ID: ${productId})`);

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

// GET /api/v1/:domain/products/:id/reviews - WITH PROPER ID VALIDATION
router.get('/products/:id/reviews', validateDomain, validateProductId, async (req, res) => {
  try {
    const { domain } = req.params;
    const productId = req.validatedProductId;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    console.log(`💬 REVIEWS REQUEST: ${domain}, product ID: ${productId}`);

    // Check if product exists
    const product = await dbConfig.getOne(
      'SELECT id, name FROM products WHERE domain = ? AND id = ?',
      [domain, productId]
    );

    if (!product) {
      console.log(`❌ PRODUCT NOT FOUND FOR REVIEWS: domain=${domain}, id=${productId}`);
      return res.status(404).json({
        success: false,
        error: 'product_not_found',
        message: `Product with ID ${productId} not found in ${domain} domain`,
        domain: domain,
        product_id: productId
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

console.log('✅ Products routes loaded with ALL BUGS FIXED!');
console.log('🔧 Fixed bugs:');
console.log('   1. Large page numbers now return 200 OK with empty results');
console.log('   2. Non-existent product IDs now return proper 404 Not Found');
console.log('   3. Float product IDs now return 400 Bad Request');

module.exports = router;