// 🔧 CRITICAL BUG FIXES FOR UNIVERSAL STUDENT API

// ============================================================================
// 1. SEARCH ROUTE WITH COMPREHENSIVE VALIDATION AND FIXES
// ============================================================================

// GET /api/v1/:domain/products/search - FIXED ALL SEARCH BUGS
router.get('/products/search', validateDomain, async (req, res) => {
  try {
    const { domain } = req.params;
    const { q, category, brand, min_price, max_price } = req.query;
    
    // 🔧 BUG FIX 1: Validate query parameters first
    const validationErrors = [];
    
    // Check if at least one search parameter is provided
    if (!q && !category && !brand && !min_price && !max_price) {
      return res.status(400).json({
        success: false,
        error: 'search_query_required',
        message: 'Please provide at least one search parameter (q, category, brand, min_price, or max_price)'
      });
    }
    
    // 🔧 BUG FIX 2: Very long search query validation
    if (q && q.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'query_too_long',
        message: 'Search query too long. Maximum 100 characters allowed.',
        provided_length: q.length,
        max_length: 100
      });
    }
    
    // 🔧 BUG FIX 3: XSS Prevention - Check for malicious patterns
    const dangerousPatterns = [
      /<script/i,
      /<\/script>/i,
      /javascript:/i,
      /on\w+=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /document\./i,
      /window\./i,
      /alert\(/i
    ];
    
    if (q) {
      const decodedQuery = decodeURIComponent(q);
      for (const pattern of dangerousPatterns) {
        if (pattern.test(decodedQuery)) {
          console.log('🚨 XSS ATTEMPT BLOCKED:', decodedQuery);
          return res.status(400).json({
            success: false,
            error: 'security_violation',
            message: 'Potentially malicious content detected in search query',
            security_details: 'Script tags and JavaScript code are not allowed',
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // 🔧 BUG FIX 4: Price validation - Check for valid numbers
    let minPrice = null;
    let maxPrice = null;
    
    if (min_price !== undefined) {
      if (isNaN(min_price) || min_price.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'invalid_min_price',
          message: 'min_price must be a valid number',
          provided: min_price,
          expected: 'numeric value'
        });
      }
      
      minPrice = parseFloat(min_price);
      
      // Check for negative prices
      if (minPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'invalid_min_price',
          message: 'min_price cannot be negative',
          provided: minPrice,
          expected: 'price >= 0'
        });
      }
    }
    
    if (max_price !== undefined) {
      if (isNaN(max_price) || max_price.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'invalid_max_price',
          message: 'max_price must be a valid number',
          provided: max_price,
          expected: 'numeric value'
        });
      }
      
      maxPrice = parseFloat(max_price);
      
      // Check for negative prices
      if (maxPrice < 0) {
        return res.status(400).json({
          success: false,
          error: 'invalid_max_price',
          message: 'max_price cannot be negative',
          provided: maxPrice,
          expected: 'price >= 0'
        });
      }
    }
    
    // 🔧 BUG FIX 5: Price range validation (min > max)
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        error: 'invalid_price_range',
        message: 'min_price cannot be greater than max_price',
        provided: {
          min_price: minPrice,
          max_price: maxPrice
        },
        suggestion: 'Ensure min_price <= max_price'
      });
    }
    
    // Continue with existing search logic...
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

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

    if (minPrice !== null) {
      searchQuery += ` AND p.price >= ?`;
      countQuery += ` AND p.price >= ?`;
      params.push(minPrice);
      countParams.push(minPrice);
    }

    if (maxPrice !== null) {
      searchQuery += ` AND p.price <= ?`;
      countQuery += ` AND p.price <= ?`;
      params.push(maxPrice);
      countParams.push(maxPrice);
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
        min_price: minPrice,
        max_price: maxPrice,
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

// ============================================================================
// 2. SINGLE PRODUCT ROUTE - FIXED 404 HANDLING
// ============================================================================

// GET /api/v1/:domain/products/:id - FIXED NON-EXISTENT PRODUCT BUG
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

    // 🔧 BUG FIX: CRITICAL - Proper 404 handling for non-existent products
    if (!product) {
      console.log(`❌ PRODUCT NOT FOUND: domain=${domain}, id=${productId}`);
      return res.status(404).json({
        success: false,
        error: 'product_not_found',
        message: `Product with ID ${productId} not found in ${domain} domain`,
        domain: domain,
        product_id: productId,
        suggestion: 'Check if the product ID exists or try browsing products list',
        timestamp: new Date().toISOString()
      });
    }

    // Rest of the existing logic for found products...
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

// ============================================================================
// 3. HTTP METHODS RESTRICTION - FIXED 405 RESPONSES
// ============================================================================

// 🔧 BUG FIX: Proper HTTP Method restrictions
// These should be added to the main app.js or server.js file

// Block all non-GET methods on products endpoints
router.delete('/products/:id', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'method_not_allowed',
    message: 'DELETE method is not allowed on this endpoint',
    allowed_methods: ['GET'],
    endpoint: req.path,
    security_note: 'This is a read-only educational API'
  });
});

router.put('/products/:id', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'method_not_allowed',
    message: 'PUT method is not allowed on this endpoint',
    allowed_methods: ['GET'],
    endpoint: req.path,
    security_note: 'This is a read-only educational API'
  });
});

router.post('/products', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'method_not_allowed',
    message: 'POST method is not allowed on this endpoint',
    allowed_methods: ['GET'],
    endpoint: req.path,
    security_note: 'This is a read-only educational API'
  });
});

router.patch('/products/:id', (req, res) => {
  res.status(405).json({
    success: false,
    error: 'method_not_allowed',
    message: 'PATCH method is not allowed on this endpoint',
    allowed_methods: ['GET'],
    endpoint: req.path,
    security_note: 'This is a read-only educational API'
  });
});

// ============================================================================
// 4. MIDDLEWARE ADDITIONS FOR BETTER ERROR HANDLING
// ============================================================================

// General 404 handler for any unmatched routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'endpoint_not_found',
    message: 'The requested endpoint was not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check the API documentation for available endpoints',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('🚨 ROUTE ERROR:', error);
  
  res.status(500).json({
    success: false,
    error: 'internal_server_error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

console.log('🔧 ✅ ALL CRITICAL BUGS FIXED:');
console.log('   1. Product 404 handling - Now returns proper 404 for non-existent products');
console.log('   2. XSS prevention in search - Blocks malicious scripts');
console.log('   3. Price validation - Rejects negative prices and invalid ranges');
console.log('   4. Query length limits - Prevents very long search queries');
console.log('   5. HTTP method restrictions - Returns 405 for non-allowed methods');
console.log('   6. Comprehensive input validation and sanitization');

module.exports = router;