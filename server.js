const express = require('express');
const { initializeDatabase, testConnection } = require('./database/connection');
const { dbConfig } = require('./utils/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Manual CORS headers (instead of cors package)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Universal Student API...');
    
    // Step 1: Initialize main database (products, categories, brands)
    const dbInitialized = await initializeDatabase();
    const dbConnected = await testConnection();
    
    if (!dbInitialized || !dbConnected) {
      console.log('❌ Main database setup failed!');
      process.exit(1);
    }
    
    console.log('💾 Main database ready!');
    
    // Step 2: Initialize users system
    await setupUsersSystem();
    
    // Step 3: Setup routes
    setupRoutes();
    
    // Step 4: Setup error handlers
    setupErrorHandlers();
    
    // Start server
    app.listen(PORT, () => {
      console.log('🎓 Universal Student API Started Successfully!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`📊 API Status: http://localhost:${PORT}/api/v1/status`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth/*`);
      console.log(`🛒 Cart endpoints: http://localhost:${PORT}/api/v1/cart/*`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`👥 Demo credentials: demo/demo123, teacher/demo123`);
      console.log(`🚀 Ready for student projects!`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Setup users system
async function setupUsersSystem() {
  try {
    console.log('👥 Setting up users system...');
    
    // Initialize users tables
    const usersInitialized = dbConfig.initializeUsersTable();
    if (!usersInitialized) {
      console.log('⚠️ Users table initialization failed, but continuing...');
    }
    
    // Create demo users
    const demoUsersCreated = dbConfig.createDemoUsers();
    if (!demoUsersCreated) {
      console.log('⚠️ Demo users creation failed, but continuing...');
    }
    
    // Validate database
    const validation = dbConfig.validateDatabase();
    console.log('📊 Database validation:', {
      products: validation.productCount,
      users: validation.userCount,
      tables: validation.tables
    });
    
    console.log('✅ Users system setup complete!');
    
  } catch (error) {
    console.log('⚠️ Users setup error:', error.message);
    console.log('🔄 Continuing with main API functionality...');
  }
}

// Setup all routes
function setupRoutes() {
  // Root endpoint with comprehensive API info
  app.get('/', (req, res) => {
    try {
      const validation = dbConfig.validateDatabase();
      
      res.json({
        message: "🎓 Universal Student API",
        version: "2.0.0",
        status: "Running ✅",
        database: "Connected 💾",
        features: [
          "✅ 20 Domains with 500+ products each",
          "✅ User Authentication (JWT)",
          "✅ Protected Routes",
          "✅ Shopping Cart functionality",
          "✅ Student-friendly endpoints",
          "✅ Rate limiting & Security"
        ],
        domains: [
          "movies", "books", "electronics", "restaurants", "fashion",
          "cars", "hotels", "games", "music", "food", "sports", "toys",
          "tools", "medicines", "courses", "events", "apps", "flights",
          "pets", "realestate"
        ],
        auth_endpoints: [
          "POST /api/v1/auth/register - Create new user",
          "POST /api/v1/auth/login - User login",
          "GET /api/v1/auth/profile - Get user profile (protected)",
          "PUT /api/v1/auth/profile - Update profile (protected)",
          "POST /api/v1/auth/logout - Logout user",
          "GET /api/v1/auth/test - Test auth system",
          "GET /api/v1/auth/users - List all users (admin only)"
        ],
        shopping_cart: [
          "GET /api/v1/cart - Get user's cart (protected)",
          "POST /api/v1/cart/add - Add item to cart (protected)",
          "PUT /api/v1/cart/update/:id - Update quantity (protected)",
          "DELETE /api/v1/cart/remove/:id - Remove item (protected)",
          "DELETE /api/v1/cart/clear - Clear cart (protected)",
          "POST /api/v1/cart/checkout - Mock checkout (protected)"
        ],
        demo_credentials: [
          { username: "demo", password: "demo123", role: "user" },
          { username: "student1", password: "demo123", role: "user" },
          { username: "teacher", password: "demo123", role: "admin" }
        ],
        database_stats: {
          products: validation.productCount || 0,
          users: validation.userCount || 0,
          domains: 20
        },
        api_docs: "/api/v1",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        message: "🎓 Universal Student API",
        status: "Running ✅ (Database stats unavailable)",
        error: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    try {
      const validation = dbConfig.validateDatabase();
      
      res.json({
        status: validation.isValid ? "healthy" : "degraded",
        database: validation.isValid ? "connected" : "error",
        data: {
          total_products: validation.productCount || 0,
          total_users: validation.userCount || 0,
          tables: validation.tables || {}
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        database: "connection_failed",
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Import route modules
  const authRoutes = require('./routes/auth');
  const cartRoutes = require('./routes/cart');
  const productsRoutes = require('./routes/products'); // This now handles all domain routes

  // Mount auth and cart routes first
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/cart', cartRoutes);

  // API Status endpoint
  app.get('/api/v1/status', (req, res) => {
    try {
      const validation = dbConfig.validateDatabase();
      
      res.json({
        success: true,
        message: "Universal Student API Status",
        status: "healthy",
        database: validation.isValid ? "connected" : "error",
        features: {
          authentication: validation.hasUsers ? "✅ Available" : "⚠️ Setup needed",
          products: validation.productCount > 0 ? "✅ Ready" : "⚠️ No products",
          cart: "✅ Available",
          security: "✅ Headers & Rate limiting"
        },
        data: {
          total_products: validation.productCount || 0,
          total_users: validation.userCount || 0,
          available_domains: 20
        },
        quick_test: {
          products: "GET /api/v1/movies/products",
          login: "POST /api/v1/auth/login",
          demo_credentials: "demo / demo123"
        },
        server_time: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Status check failed',
        message: error.message
      });
    }
  });

  // Domains list endpoint
  app.get('/api/v1/domains', (req, res) => {
    try {
      const domains = dbConfig.executeQuery('SELECT DISTINCT domain FROM products ORDER BY domain');
      const domainsList = domains.map(row => row.domain);
      
      res.json({
        success: true,
        data: {
          domains: domainsList,
          total: domainsList.length,
          example_urls: {
            products: '/api/v1/movies/products',
            categories: '/api/v1/books/categories',
            single_product: '/api/v1/electronics/products/1',
            search: '/api/v1/movies/products/search?q=batman'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Mount domain-specific routes - ONE ROUTE FILE HANDLES ALL!
  app.use('/api/v1/:domain', productsRoutes);

  console.log('✅ All routes mounted successfully');
}

// Setup error handlers
function setupErrorHandlers() {
  // Global error handler
  app.use((error, req, res, next) => {
    console.error('Global error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Something went wrong on the server',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  });

  // 404 handler
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
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'GET /api/v1/auth/profile',
        'GET /api/v1/cart',
        'GET /api/v1/{domain}/products',
        'GET /api/v1/{domain}/products/search?q=term',
        'GET /api/v1/{domain}/categories',
        'GET /api/v1/{domain}/brands'
      ]
    });
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Graceful shutdown initiated...');
  
  try {
    dbConfig.closeConnection();
    console.log('✅ Database connections closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
  
  console.log('✅ Server shutdown complete');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;