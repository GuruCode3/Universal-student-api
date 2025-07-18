// routes/index.js - Main Route Aggregator for Universal Student API v2.0
const express = require('express');
const router = express.Router();

// Import individual route modules
const authRoutes = require('./auth');
const productRoutes = require('./products');
const { dbConfig } = require('../utils/database');

// Root API information endpoint
router.get('/', (req, res) => {
  try {
    const validation = dbConfig.validateDatabase();
    
    res.json({
      message: "🎓 Universal Student API v2.0 - Main Routes",
      version: "2.0.0",
      status: "Running ✅",
      database: validation.isValid ? "Connected 💾" : "Limited Mode ⚠️",
      
      // Route organization
      routes: {
        authentication: {
          base_path: "/api/v1/auth",
          endpoints: [
            "POST /api/v1/auth/register - Register new user",
            "POST /api/v1/auth/login - Login user",
            "GET /api/v1/auth/profile - Get user profile (protected)",
            "PUT /api/v1/auth/profile - Update user profile (protected)",
            "POST /api/v1/auth/logout - Logout user (protected)",
            "GET /api/v1/auth/users - Get all users (admin only)",
            "GET /api/v1/auth/test - Test auth system"
          ]
        },
        
        products: {
          base_path: "/api/v1/{domain}",
          endpoints: [
            "GET /api/v1/{domain}/products - Get products with pagination",
            "GET /api/v1/{domain}/products/{id} - Get single product",
            "GET /api/v1/{domain}/products/search - Search products",
            "GET /api/v1/{domain}/categories - Get categories",
            "GET /api/v1/{domain}/brands - Get brands",
            "GET /api/v1/{domain}/products/{id}/reviews - Get product reviews"
          ]
        },
        
        utility: {
          base_path: "/api/v1",
          endpoints: [
            "GET / - API root information",
            "GET /health - Health check",
            "GET /api/v1/status - API status",
            "GET /api/v1/domains - Available domains",
            "GET /api/v1/docs - API documentation"
          ]
        }
      },
      
      // Available domains
      supported_domains: [
        "movies", "books", "electronics", "restaurants", "fashion",
        "cars", "hotels", "games", "music", "food", "sports", "toys",
        "tools", "medicines", "courses", "events", "apps", "flights",
        "pets", "realestate"
      ],
      
      // Quick examples
      examples: {
        authentication: {
          register: "POST /api/v1/auth/register",
          login: "POST /api/v1/auth/login",
          profile: "GET /api/v1/auth/profile"
        },
        products: {
          list: "GET /api/v1/movies/products?page=1&limit=20",
          search: "GET /api/v1/books/products/search?q=javascript",
          single: "GET /api/v1/electronics/products/1",
          categories: "GET /api/v1/fashion/categories",
          brands: "GET /api/v1/games/brands"
        },
        demo_credentials: {
          user: { username: "demo", password: "demo123" },
          admin: { username: "teacher", password: "demo123" }
        }
      },
      
      // API features
      features: [
        "✅ JWT Authentication System",
        "✅ Role-based Access Control", 
        "✅ 20 Product Domains",
        "✅ Advanced Search & Filtering",
        "✅ Pagination Support",
        "✅ Rate Limiting",
        "✅ In-Memory Database (Optimized)",
        "✅ Performance Indexes",
        "✅ Error Handling",
        "✅ CORS Support",
        "✅ Request Logging",
        "✅ Gzip Compression"
      ],
      
      // Database stats
      data_stats: {
        total_products: validation.tables?.products || 0,
        total_users: validation.tables?.users || 0,
        total_categories: validation.tables?.categories || 0,
        total_brands: validation.tables?.brands || 0,
        performance_status: validation.performance?.optimization_status || "Unknown"
      },
      
      // Documentation links
      documentation: {
        api_docs: "/api/v1/docs",
        health_check: "/health",
        status_check: "/api/v1/status",
        domain_list: "/api/v1/domains"
      },
      
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Routes index error:', error);
    res.status(500).json({
      message: "Routes index error",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API version info
router.get('/version', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        api_name: "Universal Student API",
        version: "2.0.0",
        environment: process.env.NODE_ENV || 'development',
        node_version: process.version,
        uptime: process.uptime(),
        memory_usage: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        }
      }
    });
  } catch (error) {
    console.error('❌ Version endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Statistics endpoint
router.get('/stats', (req, res) => {
  try {
    const validation = dbConfig.validateDatabase();
    const domains = dbConfig.executeQuery('SELECT DISTINCT domain FROM products');
    
    const stats = {
      success: true,
      data: {
        database: {
          status: validation.isValid ? 'healthy' : 'limited',
          products: validation.tables?.products || 0,
          users: validation.tables?.users || 0,
          categories: validation.tables?.categories || 0,
          brands: validation.tables?.brands || 0
        },
        domains: {
          total: domains.length,
          list: domains.map(d => d.domain),
          estimated_products_per_domain: Math.round((validation.tables?.products || 0) / domains.length)
        },
        performance: validation.performance || {},
        server: {
          uptime: process.uptime(),
          memory_usage: process.memoryUsage(),
          node_version: process.version,
          environment: process.env.NODE_ENV || 'development'
        }
      }
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API health check specific to routes
router.get('/health', (req, res) => {
  try {
    const validation = dbConfig.validateDatabase();
    
    res.json({
      success: true,
      message: "Routes are healthy",
      data: {
        routes_status: "operational",
        auth_routes: "loaded",
        product_routes: "loaded",
        database: validation.isValid ? "connected" : "limited",
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Routes health check error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test all routes connectivity
router.get('/test', (req, res) => {
  try {
    const validation = dbConfig.validateDatabase();
    const domains = dbConfig.executeQuery('SELECT DISTINCT domain FROM products LIMIT 5');
    
    res.json({
      success: true,
      message: "Route connectivity test",
      data: {
        routes_loaded: {
          auth: "✅ Available",
          products: "✅ Available",
          main: "✅ Available"
        },
        database: validation.isValid ? "✅ Connected" : "⚠️ Limited",
        sample_domains: domains.map(d => d.domain),
        test_endpoints: {
          auth: "/api/v1/auth/test",
          products: `/api/v1/${domains[0]?.domain || 'movies'}/products`,
          documentation: "/api/v1/docs"
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Routes test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export the router
module.exports = router;