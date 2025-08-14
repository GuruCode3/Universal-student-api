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

// 🔢 PAGINATION VALIDATION MIDDLEWARE - FIXED VERSION
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
    
    // Check extremely large
    if (page > 10000) {
      console.log('❌ PAGINATION: Page too large:', page);
      return res.status(400).json({
        success: false,
        error: 'invalid_page_number',
        message: 'Page number too large',
        provided: page,
        max_allowed: 10000
      });
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

// GET /api/v1/:domain/products - WITH STRICT VALIDATION
router.get('/products', validateDomain, validatePagination, async (req, res) => {
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
    
    // Check if page number is too high
    if (page > totalPages && total > 0) {
      return res.status(400).json({
        success: false,
        error: 'page_out_of_range',
        message: `Page ${page} does not exist`,
        total_pages: totalPages,
        provided_page: page,
        suggestion: `Use page 1-${totalPages}`
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

// GET /api/v1/:domain/products/search - WITH VALIDATION
router.get('/products/search', validateDomain, validatePagination, async (req, res) => {
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

// GET /api/v1/:domain/products/:id - EXISTING CODE UNCHANGED
router.get('/products/:id', validateDomain, async (req, res) => {
  try {
    const { domain, id } = req.params;
    const productId = parseInt(id);

    if (!productId || productId < 1) {
      return res.status(400).json({
        success: false,
        error: 'invalid_product_id',
        message: 'Product ID must be a positive number'
      });
    }

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

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'product_not_found',
        message: `Product with ID ${productId} not found in ${domain} domain`
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

console.log('✅ Products routes loaded with COMPLETE VALIDATION - All bugs fixed!');

module.exports = router;