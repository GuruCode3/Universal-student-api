// Load environment variables FIRST
require('dotenv').config();

// server.js - COMPLETE Universal Student API v2.0 WITH ADVANCED AUTHENTICATION
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PERSISTENCE SYSTEM - Users, Carts, Wishlists
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');
const WISHLISTS_FILE = path.join(DATA_DIR, 'wishlists.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log('📁 Created data directory for persistence');
}

// Load users from file on startup
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(data);
      console.log(`📤 Loaded ${users.length} users from file`);
      return users;
    }
  } catch (error) {
    console.log('⚠️ Error loading users file:', error.message);
  }
  
  // Create default users if file doesn't exist
  const defaultUsers = [
    {
      id: 1,
      username: "demo",
      email: "demo@example.com",
      password: "$2b$10$rKvK1vT5n9P2pL3mE8qQcOyX5Zj4R7W1Q6F2D9mN3hS8tG4vC1aB5", // demo123
      role: "user",
      first_name: "Demo",
      last_name: "User",
      created_at: new Date().toISOString(),
      email_verified: false,
      email_verified_at: null
    },
    {
      id: 2,
      username: "teacher",
      email: "teacher@example.com", 
      password: "$2b$10$rKvK1vT5n9P2pL3mE8qQcOyX5Zj4R7W1Q6F2D9mN3hS8tG4vC1aB5", // demo123
      role: "admin",
      first_name: "Admin",
      last_name: "Teacher",
      created_at: new Date().toISOString(),
      email_verified: true,
      email_verified_at: new Date().toISOString()
    }
  ];
  
  saveUsers(defaultUsers);
  console.log('📝 Created default users (demo/demo123, teacher/demo123)');
  return defaultUsers;
}

// Save users to file
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`💾 Saved ${users.length} users to file`);
    return true;
  } catch (error) {
    console.error('❌ Error saving users:', error.message);
    return false;
  }
}

// Load carts from file  
function loadCarts() {
  try {
    if (fs.existsSync(CARTS_FILE)) {
      const data = fs.readFileSync(CARTS_FILE, 'utf8');
      const carts = JSON.parse(data);
      console.log(`📤 Loaded carts from file`);
      return carts;
    }
  } catch (error) {
    console.log('⚠️ Error loading carts file:', error.message);
  }
  return {};
}

// Save carts to file
function saveCarts(carts) {
  try {
    fs.writeFileSync(CARTS_FILE, JSON.stringify(carts, null, 2));
    console.log(`💾 Saved carts to file`);
    return true;
  } catch (error) {
    console.error('❌ Error saving carts:', error.message);
    return false;
  }
}

// Load wishlists from file
function loadWishlists() {
  try {
    if (fs.existsSync(WISHLISTS_FILE)) {
      const data = fs.readFileSync(WISHLISTS_FILE, 'utf8');
      const wishlists = JSON.parse(data);
      console.log(`📤 Loaded wishlists from file`);
      return wishlists;
    }
  } catch (error) {
    console.log('⚠️ Error loading wishlists file:', error.message);
  }
  return {};
}

// Save wishlists to file
function saveWishlists(wishlists) {
  try {
    fs.writeFileSync(WISHLISTS_FILE, JSON.stringify(wishlists, null, 2));
    console.log(`💾 Saved wishlists to file`);
    return true;
  } catch (error) {
    console.error('❌ Error saving wishlists:', error.message);
    return false;
  }
}

// Initialize persistence data
let persistentUsers = loadUsers();
let persistentCarts = loadCarts();
let persistentWishlists = loadWishlists();

// Make persistence functions available globally (for routes)
global.userPersistence = {
  getUsers: () => persistentUsers,
  saveUser: (user) => {
    // Add new user
    const maxId = persistentUsers.length > 0 ? Math.max(...persistentUsers.map(u => u.id)) : 0;
    user.id = maxId + 1;
    user.created_at = new Date().toISOString();
    user.email_verified = false;
    user.email_verified_at = null;
    persistentUsers.push(user);
    saveUsers(persistentUsers);
    return user;
  },
  updateUser: (userId, updates) => {
    const userIndex = persistentUsers.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      persistentUsers[userIndex] = { ...persistentUsers[userIndex], ...updates };
      saveUsers(persistentUsers);
      return persistentUsers[userIndex];
    }
    return null;
  },
  findUserByUsername: (username) => {
    return persistentUsers.find(u => u.username === username || u.email === username);
  },
  findUserById: (id) => {
    return persistentUsers.find(u => u.id === id);
  }
};

global.cartPersistence = {
  getCarts: () => persistentCarts,
  getUserCart: (userId) => {
    return persistentCarts[userId] || [];
  },
  saveUserCart: (userId, cart) => {
    persistentCarts[userId] = cart;
    saveCarts(persistentCarts);
    return true;
  },
  clearUserCart: (userId) => {
    persistentCarts[userId] = [];
    saveCarts(persistentCarts);
    return true;
  }
};

global.wishlistPersistence = {
  getWishlists: () => persistentWishlists,
  getUserWishlist: (userId) => {
    return persistentWishlists[userId] || [];
  },
  saveUserWishlist: (userId, wishlist) => {
    persistentWishlists[userId] = wishlist;
    saveWishlists(persistentWishlists);
    return true;
  },
  clearUserWishlist: (userId) => {
    persistentWishlists[userId] = [];
    saveWishlists(persistentWishlists);
    return true;
  }
};

console.log('✅ User, Cart, Wishlist persistence system initialized!');

// PERFORMANCE MIDDLEWARE
app.use(compression());
app.use(morgan('combined'));

// SECURITY MIDDLEWARE
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
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

// CORS CONFIGURATION
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8000',
    'http://localhost:8080',
    'https://your-frontend-domain.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// BASIC MIDDLEWARE
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// INITIALIZE DATABASE
let databaseReady = false;

async function startServer() {
  try {
    console.log('🚀 Starting Universal Student API v2.0...');
    console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT || 'false');
    
    // Initialize database first
    console.log('🗄️ Initializing database...');
    try {
      const { initializeDatabase } = require('./database/connection');
      const dbInitialized = await initializeDatabase();
      
      if (dbInitialized) {
        databaseReady = true;
        console.log('✅ Database initialized successfully');
      } else {
        console.log('⚠️ Database initialization failed, continuing with limited functionality');
      }
    } catch (dbError) {
      console.log('⚠️ Database module not found or error:', dbError.message);
      console.log('⚠️ Continuing without database functionality');
    }
    
    // Import and configure routes
    try {
      // Import basic routes
      const authRoutes = require('./routes/auth');
      const cartRoutes = require('./routes/cart');
      const wishlistRoutes = require('./routes/wishlist');
      
      // Import advanced authentication routes
      const advancedAuthRoutes = require('./routes/advanced-auth');
      
      // Optional routes (only if files exist)
      let productRoutes = null;
      
      try {
        productRoutes = require('./routes/products');
      } catch (e) {
        console.log('⚠️ Products routes not found, skipping');
      }

      // AUTHENTICATION ROUTES (Basic + Advanced)
      app.use('/api/v1/auth', authRoutes);
      app.use('/api/v1/auth', advancedAuthRoutes);

      // CART ROUTES
      app.use('/api/v1/cart', cartRoutes);

      // WISHLIST ROUTES
      app.use('/api/v1/wishlist', wishlistRoutes);

      // PRODUCT ROUTES (with domain parameter, if available)
      if (productRoutes) {
        app.use('/api/v1/:domain', productRoutes);
      }

      console.log('✅ All available routes configured successfully');
      
    } catch (routeError) {
      console.error('❌ Route configuration error:', routeError);
      console.log('⚠️ Continuing with basic functionality');
    }
    
    // Root endpoint with comprehensive API info
    app.get('/', (req, res) => {
      try {
        res.json({
          message: "🎓 Universal Student API v2.0 - Advanced Authentication Enabled",
          version: "2.0.0",
          status: "Running ✅",
          database: databaseReady ? "Connected 💾" : "Limited Mode ⚠️",
          persistence: "✅ File-based User, Cart, Wishlist Persistence",
          email_service: process.env.GMAIL_USER ? "✅ Email Service Configured" : "⚠️ Email Not Configured",
          advanced_auth: "✅ Password Reset, Email Verification Ready",
          features: [
            "✅ Advanced JWT Authentication", 
            "✅ Role-based Access Control",
            "✅ Persistent User Accounts",
            "✅ Shopping Cart System with Persistence",
            "✅ Wishlist System with Persistence",
            "✅ Password Reset via Email",
            "✅ Email Verification System",
            "✅ Advanced Security Features",
            "✅ Rate Limiting & Security",
            "✅ Comprehensive API Documentation",
            "✅ CORS Enabled for Frontend Testing"
          ],
          authentication: {
            demo_user: { username: "demo", password: "demo123", role: "user" },
            admin_user: { username: "teacher", password: "demo123", role: "admin" },
            persistence: "✅ Users persist across server restarts",
            endpoints: [
              "POST /api/v1/auth/register",
              "POST /api/v1/auth/login", 
              "GET /api/v1/auth/profile",
              "POST /api/v1/auth/forgot-password",
              "POST /api/v1/auth/reset-password",
              "POST /api/v1/auth/send-verification",
              "GET /api/v1/auth/verify-email"
            ]
          },
          advanced_authentication_features: {
            password_reset: "✅ Email-based password reset",
            email_verification: "✅ Account email verification", 
            security_dashboard: "🔄 Coming Soon",
            two_factor_auth: "🔄 Coming Soon"
          },
          email_configuration: {
            service: process.env.EMAIL_SERVICE || 'Not configured',
            status: process.env.GMAIL_USER ? 'Configured' : 'Not configured',
            test_endpoint: "GET /api/v1/auth/test-email?to=your-email@gmail.com"
          },
          persistence_info: {
            users_loaded: persistentUsers.length,
            data_directory: DATA_DIR,
            files: {
              users: USERS_FILE,
              carts: CARTS_FILE,
              wishlists: WISHLISTS_FILE
            },
            status: "✅ All user data, carts, wishlists persist across restarts"
          },
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
        res.json({
          status: 'healthy',
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
          persistence: {
            users_file_exists: fs.existsSync(USERS_FILE),
            carts_file_exists: fs.existsSync(CARTS_FILE),
            wishlists_file_exists: fs.existsSync(WISHLISTS_FILE),
            users_count: persistentUsers.length,
            data_directory: fs.existsSync(DATA_DIR) ? "✅ Exists" : "❌ Missing"
          },
          email_service: {
            configured: !!process.env.GMAIL_USER,
            service_type: process.env.EMAIL_SERVICE || 'Not set'
          },
          cors_status: "✅ Enabled for frontend testing",
          advanced_auth_status: "✅ Enabled",
          timestamp: new Date().toISOString()
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

    // Status endpoint
    app.get('/api/v1/status', (req, res) => {
      try {
        res.json({
          success: true,
          message: "Universal Student API v2.0 Status - Advanced Authentication Enabled",
          status: "healthy",
          version: "2.0.0",
          features: {
            authentication: "✅ Available",
            advanced_auth: "✅ Password Reset, Email Verification",
            user_persistence: "✅ File-based storage",
            cart: "✅ Available with Persistence",
            wishlist: "✅ Available with Persistence",
            rate_limiting: "✅ Active",
            cors: "✅ Enabled",
            email_service: process.env.GMAIL_USER ? "✅ Configured" : "⚠️ Not configured"
          },
          data: {
            persistent_users: persistentUsers.length
          },
          quick_tests: {
            authentication: "POST /api/v1/auth/login",
            password_reset: "POST /api/v1/auth/forgot-password",
            email_verification: "POST /api/v1/auth/send-verification",
            cart: "GET /api/v1/cart",
            wishlist: "GET /api/v1/wishlist",
            demo_credentials: "demo / demo123"
          },
          persistence_status: {
            users_file: fs.existsSync(USERS_FILE) ? "✅ Exists" : "❌ Missing",
            carts_file: fs.existsSync(CARTS_FILE) ? "✅ Exists" : "❌ Missing",
            wishlists_file: fs.existsSync(WISHLISTS_FILE) ? "✅ Exists" : "❌ Missing",
            loaded_users: persistentUsers.length,
            last_save_time: fs.existsSync(USERS_FILE) 
              ? fs.statSync(USERS_FILE).mtime.toISOString()
              : "Never"
          },
          advanced_authentication: {
            password_reset: "✅ Available",
            email_verification: "✅ Available",
            email_service_status: process.env.GMAIL_USER ? "Configured" : "Not configured",
            test_endpoint: "/api/v1/auth/test-email?to=your-email@gmail.com"
          },
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

    // API DOCUMENTATION ENDPOINT
    app.get('/api/v1/docs', (req, res) => {
      res.json({
        success: true,
        message: "Universal Student API v2.0 Documentation - Advanced Authentication Enabled",
        version: "2.0.0",
        base_url: req.protocol + '://' + req.get('host'),
        authentication: {
          type: "JWT Bearer Token",
          header: "Authorization: Bearer <token>",
          login_endpoint: "POST /api/v1/auth/login",
          persistence: "✅ User accounts persist across server restarts",
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
            "POST /api/v1/auth/register": "Register new user",
            "POST /api/v1/auth/login": "Login user",
            "GET /api/v1/auth/profile": "Get user profile (requires auth)"
          },
          advanced_authentication: {
            "POST /api/v1/auth/forgot-password": "Request password reset",
            "POST /api/v1/auth/reset-password": "Reset password with token",
            "GET /api/v1/auth/reset-password-form": "HTML form for password reset",
            "POST /api/v1/auth/send-verification": "Send email verification",
            "GET /api/v1/auth/verify-email": "Verify email with token",
            "GET /api/v1/auth/test-email": "Test email service",
            "GET /api/v1/auth/advanced-status": "Advanced auth module status"
          },
          cart: {
            "GET /api/v1/cart": "Get user's cart",
            "POST /api/v1/cart/add": "Add product to cart",
            "PUT /api/v1/cart/update/:item_id": "Update cart item",
            "DELETE /api/v1/cart/remove/:item_id": "Remove from cart",
            "DELETE /api/v1/cart/clear": "Clear entire cart",
            "GET /api/v1/cart/count": "Get cart items count",
            "POST /api/v1/cart/checkout": "Mock checkout process"
          },
          wishlist: {
            "GET /api/v1/wishlist": "Get user's wishlist",
            "POST /api/v1/wishlist/add": "Add product to wishlist",
            "DELETE /api/v1/wishlist/remove/:item_id": "Remove from wishlist",
            "DELETE /api/v1/wishlist/clear": "Clear entire wishlist",
            "GET /api/v1/wishlist/count": "Get wishlist items count",
            "POST /api/v1/wishlist/move-to-cart/:item_id": "Move item to cart"
          },
          utility: {
            "GET /": "API information and status",
            "GET /health": "Detailed health check",
            "GET /api/v1/status": "API status and features",
            "GET /api/v1/docs": "This documentation"
          }
        },
        example_requests: {
          curl_examples: {
            login: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"demo","password":"demo123"}'`,
            forgot_password: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/auth/forgot-password \\
  -H "Content-Type: application/json" \\
  -d '{"email":"demo@example.com"}'`,
            test_email: `curl "${req.protocol}://${req.get('host')}/api/v1/auth/test-email?to=your-email@gmail.com"`
          }
        },
        persistence_info: {
          description: "All user accounts, shopping carts, wishlists persist across server restarts",
          storage_type: "File-based JSON storage",
          auto_save: "All changes are automatically saved to disk",
          demo_accounts: "Pre-loaded: demo/demo123 and teacher/demo123",
          data_location: DATA_DIR
        },
        advanced_features: {
          password_reset: "Email-based password reset system",
          email_verification: "Account email verification",
          email_service: process.env.EMAIL_SERVICE || "Not configured",
          email_status: process.env.GMAIL_USER ? "Configured" : "Not configured"
        }
      });
    });

    // 404 HANDLER
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
        available_endpoints: [
          'GET /',
          'GET /health', 
          'GET /api/v1/status',
          'GET /api/v1/docs',
          'POST /api/v1/auth/login',
          'POST /api/v1/auth/register',
          'POST /api/v1/auth/forgot-password',
          'POST /api/v1/auth/reset-password',
          'GET /api/v1/cart',
          'POST /api/v1/cart/add',
          'GET /api/v1/wishlist',
          'POST /api/v1/wishlist/add'
        ],
        suggestion: 'Try GET /api/v1/docs for complete API documentation',
        timestamp: new Date().toISOString()
      });
    });

    // GLOBAL ERROR HANDLER
    app.use((error, req, res, next) => {
      console.error(`❌ Global error [${req.method} ${req.path}]:`, error);
      
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
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Something went wrong on the server',
        timestamp: new Date().toISOString()
      });
    });

    // START SERVER
    app.listen(PORT, () => {
      console.log('🎓 Universal Student API v2.0 Started Successfully!');
      console.log('🔐 ADVANCED AUTHENTICATION ENABLED!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Status: http://localhost:${PORT}/api/v1/status`);
      console.log(`📚 Documentation: http://localhost:${PORT}/api/v1/docs`);
      console.log(`🔐 Demo Login: POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`🔄 Password Reset: POST http://localhost:${PORT}/api/v1/auth/forgot-password`);
      console.log(`📧 Email Verification: POST http://localhost:${PORT}/api/v1/auth/send-verification`);
      console.log(`✉️ Email Test: GET http://localhost:${PORT}/api/v1/auth/test-email?to=your-email@gmail.com`);
      console.log(`🛒 Cart Example: GET http://localhost:${PORT}/api/v1/cart`);
      console.log(`💝 Wishlist Example: GET http://localhost:${PORT}/api/v1/wishlist`);
      console.log(`🏥 Database: ${databaseReady ? 'Connected' : 'Limited Mode'}`);
      console.log(`📁 User Persistence: ${persistentUsers.length} users loaded from file`);
      console.log(`💾 Data Directory: ${DATA_DIR}`);
      console.log(`📧 Email Service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
      console.log(`🌐 CORS: Enabled for localhost development`);
      console.log(`🚀 Ready for student projects!`);
      console.log(`⭐ Advanced Authentication Features: Password Reset, Email Verification`);
      console.log(`✅ File-based persistence: Users, Carts, Wishlists`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  try {
    saveUsers(persistentUsers);
    saveCarts(persistentCarts);
    saveWishlists(persistentWishlists);
    console.log('💾 Emergency save completed');
  } catch (saveError) {
    console.error('❌ Emergency save failed:', saveError);
  }
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  try {
    saveUsers(persistentUsers);
    saveCarts(persistentCarts);
    saveWishlists(persistentWishlists);
    console.log('💾 Emergency save completed');
  } catch (saveError) {
    console.error('❌ Emergency save failed:', saveError);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔒 SIGTERM received, shutting down gracefully');
  try {
    saveUsers(persistentUsers);
    saveCarts(persistentCarts);
    saveWishlists(persistentWishlists);
    console.log('💾 Final save completed');
  } catch (saveError) {
    console.error('❌ Final save failed:', saveError);
  }
  process.exit(0);
});

// Auto-save every 5 minutes (backup safety)
setInterval(() => {
  try {
    saveUsers(persistentUsers);
    saveCarts(persistentCarts);
    saveWishlists(persistentWishlists);
    console.log('🔄 Auto-save completed (users, carts, wishlists)');
  } catch (error) {
    console.error('❌ Auto-save failed:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

// Start the server
startServer();

module.exports = app;