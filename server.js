// server.js - INTEGRATED Universal Student API v2.0 WITH CART (CORS FIXED)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import database and routes
const { initializeDatabase } = require('./database/connection');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart'); // 🛒 ახალი cart routes import

const app = express();
const PORT = process.env.PORT || 3000;

// 🚀 PERFORMANCE MIDDLEWARE
app.use(compression()); // Gzip compression
app.use(morgan('combined')); // Request logging

// 🔒 SECURITY MIDDLEWARE
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// 🌐 CORS CONFIGURATION (FIXED!)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:5500',      // ✅ Live Server default
    'http://127.0.0.1:5500',      // ✅ Live Server alternative
    'http://localhost:8000',
    'http://localhost:8080',
    'https://your-frontend-domain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 📋 BASIC MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🗄️ INITIALIZE DATABASE
let databaseReady = false;

async function startServer() {
  try {
    console.log('🚀 Starting Universal Student API v2.0...');
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'false');
    
    // Initialize database first
    console.log('🗄️ Initializing database...');
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
      databaseReady = true;
      console.log('✅ Database initialized successfully');
    } else {
      console.log('⚠️ Database initialization failed, continuing with limited functionality');
    }
    
    // 🛣️ ROUTES CONFIGURATION
    
    // Root endpoint with comprehensive API info (updated with cart)
    app.get('/', (req, res) => {
      try {
        res.json({
          message: "🎓 Universal Student API v2.0",
          version: "2.0.0",
          status: "Running ✅",
          database: databaseReady ? "Connected 💾" : "Limited Mode ⚠️",
          features: [
            "✅ 20 Domains with 500+ products each",
            "✅ Advanced JWT Authentication", 
            "✅ Role-based Access Control",
            "✅ Shopping Cart System", // 🛒 ახალი!
            "✅ Search & Filtering",
            "✅ Pagination & Performance Optimized",
            "✅ Rate Limiting & Security",
            "✅ Comprehensive API Documentation",
            "✅ CORS Enabled for Frontend Testing" // 🆕 ახალი!
          ],
          domains: [
            "movies", "books", "electronics", "restaurants", "fashion",
            "cars", "hotels", "games", "music", "food", "sports", "toys",
            "tools", "medicines", "courses", "events", "apps", "flights",
            "pets", "realestate"
          ],
          authentication: {
            demo_user: { username: "demo", password: "demo123", role: "user" },
            admin_user: { username: "teacher", password: "demo123", role: "admin" },
            endpoints: [
              "POST /api/v1/auth/register",
              "POST /api/v1/auth/login", 
              "GET /api/v1/auth/profile"
            ]
          },
          api_endpoints: {
            products: [
              "GET /api/v1/{domain}/products",
              "GET /api/v1/{domain}/products/{id}",
              "GET /api/v1/{domain}/products/search?q={query}",
              "GET /api/v1/{domain}/categories",
              "GET /api/v1/{domain}/brands"
            ],
            cart: [ // 🛒 ახალი cart endpoints!
              "GET /api/v1/cart",
              "POST /api/v1/cart/add",
              "PUT /api/v1/cart/update/:item_id",
              "DELETE /api/v1/cart/remove/:item_id",
              "DELETE /api/v1/cart/clear",
              "GET /api/v1/cart/count",
              "POST /api/v1/cart/checkout"
            ],
            utility: [
              "GET /health",
              "GET /api/v1/status", 
              "GET /api/v1/domains"
            ]
          },
          performance: {
            rate_limit: "1000 requests / 15 minutes",
            compression: "Enabled",
            logging: "Enabled",
            caching: "In-memory optimized"
          },
          example_requests: {
            products: "GET /api/v1/movies/products?page=1&limit=20",
            search: "GET /api/v1/books/products/search?q=javascript",
            single_product: "GET /api/v1/electronics/products/1",
            login: "POST /api/v1/auth/login",
            categories: "GET /api/v1/fashion/categories",
            cart: "GET /api/v1/cart", // 🛒 ახალი მაგალითი!
            add_to_cart: "POST /api/v1/cart/add" // 🛒 ახალი მაგალითი!
          },
          cors_enabled: [
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:3000",
            "http://localhost:8000"
          ], // 🆕 CORS info!
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Root endpoint error:', error);
        res.status(500).json({
          message: "API Error",
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
      try {
        const { healthCheck } = require('./utils/database');
        const health = healthCheck();
        
        res.json({
          ...health,
          api_version: "2.0.0",
          server_uptime: process.uptime(),
          memory_usage: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
          },
          environment: {
            node_version: process.version,
            platform: process.platform,
            railway: !!process.env.RAILWAY_ENVIRONMENT
          },
          cors_status: "✅ Enabled for frontend testing" // 🆕 CORS status!
        });
      } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({
          status: "error",
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Status endpoint (updated with cart info)
    app.get('/api/v1/status', (req, res) => {
      try {
        const { getAvailableDomains, healthCheck } = require('./utils/database');
        const health = healthCheck();
        const domains = getAvailableDomains();
        
        res.json({
          success: true,
          message: "Universal Student API v2.0 Status",
          status: health.status,
          version: "2.0.0",
          features: {
            authentication: databaseReady ? "✅ Available" : "⚠️ Limited",
            products: health.tables.products > 0 ? "✅ Ready" : "⚠️ No products",
            cart: "✅ Available", // 🛒 ახალი!
            search: "✅ Available",
            pagination: "✅ Available",
            rate_limiting: "✅ Active",
            cors: "✅ Enabled", // 🆕 CORS feature!
            performance: health.performance.optimization_status || "✅ Optimized"
          },
          data: {
            available_domains: domains.length,
            total_products: health.tables.products || 0,
            total_users: health.tables.users || 0,
            total_categories: health.tables.categories || 0,
            total_brands: health.tables.brands || 0
          },
          quick_tests: {
            products: "GET /api/v1/movies/products",
            search: "GET /api/v1/books/products/search?q=javascript", 
            authentication: "POST /api/v1/auth/login",
            cart: "GET /api/v1/cart", // 🛒 ახალი ტესტი!
            demo_credentials: "demo / demo123"
          },
          performance: health.performance || {},
          server_time: new Date().toISOString()
        });
      } catch (error) {
        console.error('❌ Status endpoint error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Domains endpoint
    app.get('/api/v1/domains', (req, res) => {
      try {
        const { getAvailableDomains } = require('./utils/database');
        const domains = getAvailableDomains();
        
        res.json({
          success: true,
          data: {
            domains: domains,
            total: domains.length,
            example_urls: {
              products: '/api/v1/movies/products',
              search: '/api/v1/books/products/search?q=javascript',
              categories: '/api/v1/electronics/categories',
              brands: '/api/v1/fashion/brands',
              single_product: '/api/v1/games/products/1'
            },
            supported_features: [
              "Products listing with pagination",
              "Advanced search and filtering", 
              "Categories with product counts",
              "Brands with product counts",
              "Single product details",
              "Related products",
              "Shopping cart functionality" // 🛒 ახალი!
            ]
          },
          meta: {
            domains_available: domains.length,
            products_per_domain: "~500",
            total_estimated_products: domains.length * 500
          }
        });
      } catch (error) {
        console.error('❌ Domains endpoint error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // 🔐 AUTHENTICATION ROUTES
    app.use('/api/v1/auth', authRoutes);

    // 🛒 CART ROUTES (ახალი! - authentication-ს შემდეგ უნდა იყოს)
    app.use('/api/v1/cart', cartRoutes);

    // 🛍️ PRODUCT ROUTES (with domain parameter)
    app.use('/api/v1/:domain', productRoutes);

    // 📚 API DOCUMENTATION ENDPOINT (updated with cart)
    app.get('/api/v1/docs', (req, res) => {
      res.json({
        success: true,
        message: "Universal Student API v2.0 Documentation",
        version: "2.0.0",
        base_url: req.protocol + '://' + req.get('host'),
        authentication: {
          type: "JWT Bearer Token",
          header: "Authorization: Bearer <token>",
          login_endpoint: "POST /api/v1/auth/login",
          demo_credentials: {
            username: "demo",
            password: "demo123",
            role: "user"
          },
          admin_credentials: {
            username: "teacher", 
            password: "demo123",
            role: "admin"
          }
        },
        endpoints: {
          authentication: {
            "POST /api/v1/auth/register": {
              description: "Register new user",
              body: {
                username: "string (required)",
                email: "string (required)",
                password: "string (required)",
                first_name: "string (optional)",
                last_name: "string (optional)"
              },
              response: "User object + JWT token"
            },
            "POST /api/v1/auth/login": {
              description: "Login user",
              body: {
                username: "string (username or email)",
                password: "string"
              },
              response: "User object + JWT token"
            },
            "GET /api/v1/auth/profile": {
              description: "Get user profile (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "User profile object"
            }
          },
          cart: { // 🛒 ახალი cart documentation!
            "GET /api/v1/cart": {
              description: "Get user's shopping cart (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Cart items with product details and totals"
            },
            "POST /api/v1/cart/add": {
              description: "Add product to cart (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              body: {
                domain: "string (e.g., 'movies', 'books')",
                product_id: "number",
                name: "string (product name)",
                price: "number (product price)",
                quantity: "number (optional, default: 1)"
              },
              response: "Updated cart summary"
            },
            "PUT /api/v1/cart/update/:item_id": {
              description: "Update cart item quantity (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              body: {
                quantity: "number (0 to remove)"
              },
              response: "Updated cart item"
            },
            "DELETE /api/v1/cart/remove/:item_id": {
              description: "Remove item from cart (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Removed item confirmation"
            },
            "DELETE /api/v1/cart/clear": {
              description: "Clear entire cart (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Clear confirmation"
            },
            "GET /api/v1/cart/count": {
              description: "Get cart items count (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Cart items count"
            },
            "POST /api/v1/cart/checkout": {
              description: "Mock checkout process (requires auth)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Order details and confirmation"
            }
          },
          products: {
            "GET /api/v1/{domain}/products": {
              description: "Get products for domain with pagination",
              parameters: {
                domain: "movies|books|electronics|etc",
                page: "number (default: 1)",
                limit: "number (default: 20, max: 500)"
              },
              response: "Products array + pagination info"
            },
            "GET /api/v1/{domain}/products/{id}": {
              description: "Get single product with related products",
              parameters: {
                domain: "movies|books|electronics|etc",
                id: "number (product ID)"
              },
              response: "Product object + related products"
            },
            "GET /api/v1/{domain}/products/search": {
              description: "Search products with filters",
              parameters: {
                domain: "movies|books|electronics|etc",
                q: "string (search term)",
                category: "string (category slug)",
                brand: "string (brand slug)",
                min_price: "number",
                max_price: "number",
                page: "number",
                limit: "number"
              },
              response: "Filtered products + search metadata"
            },
            "GET /api/v1/{domain}/categories": {
              description: "Get categories for domain",
              parameters: {
                domain: "movies|books|electronics|etc"
              },
              response: "Categories array with product counts"
            },
            "GET /api/v1/{domain}/brands": {
              description: "Get brands for domain",
              parameters: {
                domain: "movies|books|electronics|etc"
              },
              response: "Brands array with product counts"
            }
          },
          utility: {
            "GET /": "API information and status",
            "GET /health": "Detailed health check",
            "GET /api/v1/status": "API status and features",
            "GET /api/v1/domains": "Available domains list",
            "GET /api/v1/docs": "This documentation"
          }
        },
        example_requests: {
          curl_examples: {
            login: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"demo","password":"demo123"}'`,
            products: `curl "${req.protocol}://${req.get('host')}/api/v1/movies/products?page=1&limit=10"`,
            search: `curl "${req.protocol}://${req.get('host')}/api/v1/books/products/search?q=javascript&page=1"`,
            profile: `curl -H "Authorization: Bearer <your-token>" \\
  "${req.protocol}://${req.get('host')}/api/v1/auth/profile"`,
            cart: `curl -H "Authorization: Bearer <your-token>" \\
  "${req.protocol}://${req.get('host')}/api/v1/cart"`, // 🛒 ახალი!
            add_to_cart: `curl -X POST -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"domain":"movies","product_id":1,"name":"Test Movie","price":12.99,"quantity":2}' \\
  "${req.protocol}://${req.get('host')}/api/v1/cart/add"` // 🛒 ახალი!
          }
        },
        supported_domains: [
          "movies", "books", "electronics", "restaurants", "fashion",
          "cars", "hotels", "games", "music", "food", "sports", "toys",
          "tools", "medicines", "courses", "events", "apps", "flights",
          "pets", "realestate"
        ],
        response_format: {
          success_response: {
            success: true,
            data: "response data",
            meta: "additional metadata",
            pagination: "pagination info (when applicable)"
          },
          error_response: {
            success: false,
            error: "error type",
            message: "human readable message"
          }
        }
      });
    });

    // 🚫 404 HANDLER (updated with cart endpoints)
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
        available_endpoints: [
          'GET /',
          'GET /health', 
          'GET /api/v1/status',
          'GET /api/v1/domains',
          'GET /api/v1/docs',
          'POST /api/v1/auth/login',
          'POST /api/v1/auth/register',
          'GET /api/v1/cart', // 🛒 ახალი!
          'POST /api/v1/cart/add', // 🛒 ახალი!
          'GET /api/v1/{domain}/products',
          'GET /api/v1/{domain}/products/{id}',
          'GET /api/v1/{domain}/products/search',
          'GET /api/v1/{domain}/categories',
          'GET /api/v1/{domain}/brands'
        ],
        suggestion: 'Try GET /api/v1/docs for complete API documentation',
        timestamp: new Date().toISOString()
      });
    });

    // 🚨 GLOBAL ERROR HANDLER
    app.use((error, req, res, next) => {
      console.error(`❌ Global error [${req.method} ${req.path}]:`, error);
      
      // Handle specific error types
      if (error.type === 'entity.parse.failed') {
        return res.status(400).json({
          success: false,
          error: 'Invalid JSON',
          message: 'Request body contains invalid JSON',
          timestamp: new Date().toISOString()
        });
      }

      if (error.type === 'entity.too.large') {
        return res.status(413).json({
          success: false,
          error: 'Request too large',
          message: 'Request body exceeds size limit',
          timestamp: new Date().toISOString()
        });
      }
      
      // Generic error response
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Something went wrong on the server',
        timestamp: new Date().toISOString()
      });
    });

    // 🚀 START SERVER
    app.listen(PORT, () => {
      console.log('🎓 Universal Student API v2.0 Started Successfully!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Status: http://localhost:${PORT}/api/v1/status`);
      console.log(`📚 Documentation: http://localhost:${PORT}/api/v1/docs`);
      console.log(`🔐 Demo Login: POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`🛍️ Products Example: http://localhost:${PORT}/api/v1/movies/products`);
      console.log(`🛒 Cart Example: GET http://localhost:${PORT}/api/v1/cart`); // 🛒 ახალი!
      console.log(`🔍 Search Example: http://localhost:${PORT}/api/v1/books/products/search?q=javascript`);
      console.log(`🏥 Database: ${databaseReady ? 'Connected' : 'Limited Mode'}`);
      console.log(`🌐 CORS: Enabled for localhost:5500, 127.0.0.1:5500`); // 🆕 CORS info!
      console.log(`🚀 Ready for student projects!`);
      console.log(`⭐ ${databaseReady ? '10,000+ products across 20 domains + Shopping Cart' : 'Basic functionality available'}`); // 🛒 updated!
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔒 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;