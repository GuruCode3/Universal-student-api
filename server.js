// server.js - COMPLETE Universal Student API v2.0 WITH WISHLIST SYSTEM
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

// Import database and routes
const { initializeDatabase } = require('./database/connection');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist'); // NEW: Wishlist routes

const app = express();
const PORT = process.env.PORT || 3000;

// PERSISTENCE SYSTEM - Users, Carts & Wishlists
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CARTS_FILE = path.join(DATA_DIR, 'carts.json');
const WISHLISTS_FILE = path.join(DATA_DIR, 'wishlists.json'); // NEW: Wishlists file

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
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: "teacher",
      email: "teacher@example.com", 
      password: "$2b$10$rKvK1vT5n9P2pL3mE8qQcOyX5Zj4R7W1Q6F2D9mN3hS8tG4vC1aB5", // demo123
      role: "admin",
      first_name: "Admin",
      last_name: "Teacher",
      created_at: new Date().toISOString()
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

// NEW: Load wishlists from file
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

// NEW: Save wishlists to file
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
let persistentWishlists = loadWishlists(); // NEW: Load wishlists

// Make persistence functions available globally (for routes)
global.userPersistence = {
  getUsers: () => persistentUsers,
  saveUser: (user) => {
    // Add new user
    const maxId = persistentUsers.length > 0 ? Math.max(...persistentUsers.map(u => u.id)) : 0;
    user.id = maxId + 1;
    user.created_at = new Date().toISOString();
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

// NEW: Wishlist persistence functions
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

console.log('✅ User, Cart & Wishlist persistence system initialized!');

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
    'https://your-frontend-domain.com'
  ],
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
    const dbInitialized = await initializeDatabase();
    
    if (dbInitialized) {
      databaseReady = true;
      console.log('✅ Database initialized successfully');
    } else {
      console.log('⚠️ Database initialization failed, continuing with limited functionality');
    }
    
    // ROUTES CONFIGURATION
    
    // Root endpoint with comprehensive API info
    app.get('/', (req, res) => {
      try {
        res.json({
          message: "🎓 Universal Student API v2.0",
          version: "2.0.0",
          status: "Running ✅",
          database: databaseReady ? "Connected 💾" : "Limited Mode ⚠️",
          persistence: "✅ File-based User, Cart & Wishlist Persistence",
          features: [
            "✅ 20 Domains with 500+ products each",
            "✅ Advanced JWT Authentication", 
            "✅ Role-based Access Control",
            "✅ Persistent User Accounts",
            "✅ Shopping Cart System with Persistence",
            "✅ Wishlist System with Persistence", // NEW
            "✅ Search & Filtering",
            "✅ Pagination & Performance Optimized",
            "✅ Rate Limiting & Security",
            "✅ Comprehensive API Documentation",
            "✅ CORS Enabled for Frontend Testing"
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
            persistence: "✅ Users persist across server restarts",
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
            cart: [
              "GET /api/v1/cart",
              "POST /api/v1/cart/add",
              "PUT /api/v1/cart/update/:item_id",
              "DELETE /api/v1/cart/remove/:item_id",
              "DELETE /api/v1/cart/clear",
              "GET /api/v1/cart/count",
              "POST /api/v1/cart/checkout"
            ],
            wishlist: [ // NEW
              "GET /api/v1/wishlist",
              "POST /api/v1/wishlist/add",
              "DELETE /api/v1/wishlist/remove/:item_id",
              "DELETE /api/v1/wishlist/clear",
              "GET /api/v1/wishlist/count",
              "POST /api/v1/wishlist/move-to-cart/:item_id"
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
            caching: "In-memory optimized",
            persistence: "File-based storage"
          },
          example_requests: {
            products: "GET /api/v1/movies/products?page=1&limit=20",
            search: "GET /api/v1/books/products/search?q=javascript",
            single_product: "GET /api/v1/electronics/products/1",
            login: "POST /api/v1/auth/login",
            categories: "GET /api/v1/fashion/categories",
            cart: "GET /api/v1/cart",
            add_to_cart: "POST /api/v1/cart/add",
            wishlist: "GET /api/v1/wishlist", // NEW
            add_to_wishlist: "POST /api/v1/wishlist/add" // NEW
          },
          cors_enabled: [
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:3000",
            "http://localhost:8000"
          ],
          persistence_info: {
            users_loaded: persistentUsers.length,
            data_directory: DATA_DIR,
            files: {
              users: USERS_FILE,
              carts: CARTS_FILE,
              wishlists: WISHLISTS_FILE // NEW
            },
            status: "✅ All user accounts, carts and wishlists persist across restarts"
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
          persistence: {
            users_file_exists: fs.existsSync(USERS_FILE),
            carts_file_exists: fs.existsSync(CARTS_FILE),
            wishlists_file_exists: fs.existsSync(WISHLISTS_FILE), // NEW
            users_count: persistentUsers.length,
            data_directory: fs.existsSync(DATA_DIR) ? "✅ Exists" : "❌ Missing"
          },
          cors_status: "✅ Enabled for frontend testing"
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
            user_persistence: "✅ File-based storage",
            products: health.tables.products > 0 ? "✅ Ready" : "⚠️ No products",
            cart: "✅ Available with Persistence",
            wishlist: "✅ Available with Persistence", // NEW
            search: "✅ Available",
            pagination: "✅ Available",
            rate_limiting: "✅ Active",
            cors: "✅ Enabled",
            performance: health.performance.optimization_status || "✅ Optimized"
          },
          data: {
            available_domains: domains.length,
            total_products: health.tables.products || 0,
            total_users: health.tables.users || 0,
            persistent_users: persistentUsers.length,
            total_categories: health.tables.categories || 0,
            total_brands: health.tables.brands || 0
          },
          quick_tests: {
            products: "GET /api/v1/movies/products",
            search: "GET /api/v1/books/products/search?q=javascript", 
            authentication: "POST /api/v1/auth/login",
            cart: "GET /api/v1/cart",
            wishlist: "GET /api/v1/wishlist", // NEW
            demo_credentials: "demo / demo123"
          },
          persistence_status: {
            users_file: fs.existsSync(USERS_FILE) ? "✅ Exists" : "❌ Missing",
            carts_file: fs.existsSync(CARTS_FILE) ? "✅ Exists" : "❌ Missing",
            wishlists_file: fs.existsSync(WISHLISTS_FILE) ? "✅ Exists" : "❌ Missing", // NEW
            loaded_users: persistentUsers.length,
            last_save_time: fs.existsSync(USERS_FILE) 
              ? fs.statSync(USERS_FILE).mtime.toISOString()
              : "Never"
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
              "Shopping cart functionality with persistence",
              "Wishlist functionality with persistence" // NEW
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

    // AUTHENTICATION ROUTES
    app.use('/api/v1/auth', authRoutes);

    // CART ROUTES
    app.use('/api/v1/cart', cartRoutes);

    // NEW: WISHLIST ROUTES
    app.use('/api/v1/wishlist', wishlistRoutes);

    // PRODUCT ROUTES (with domain parameter)
    app.use('/api/v1/:domain', productRoutes);

    // API DOCUMENTATION ENDPOINT
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
            "POST /api/v1/auth/register": {
              description: "Register new user (persisted to file)",
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
              description: "Login user (loads from persistent storage)",
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
          cart: {
            "GET /api/v1/cart": {
              description: "Get user's shopping cart (persistent storage)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Cart items with product details and totals"
            },
            "POST /api/v1/cart/add": {
              description: "Add product to cart (auto-saved to file)",
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
              description: "Update cart item quantity (auto-saved)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              body: {
                quantity: "number (0 to remove)"
              },
              response: "Updated cart item"
            },
            "DELETE /api/v1/cart/remove/:item_id": {
              description: "Remove item from cart (auto-saved)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Removed item confirmation"
            },
            "DELETE /api/v1/cart/clear": {
              description: "Clear entire cart (auto-saved)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Clear confirmation"
            },
            "GET /api/v1/cart/count": {
              description: "Get cart items count",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Cart items count"
            },
            "POST /api/v1/cart/checkout": {
              description: "Mock checkout process",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Order details and confirmation"
            }
          },
          wishlist: { // NEW SECTION
            "GET /api/v1/wishlist": {
              description: "Get user's wishlist (persistent storage)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Wishlist items with product details"
            },
            "POST /api/v1/wishlist/add": {
              description: "Add product to wishlist (auto-saved to file)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              body: {
                domain: "string (e.g., 'movies', 'books')",
                product_id: "number",
                name: "string (product name)",
                price: "number (product price)",
                image_url: "string (optional)"
              },
              response: "Updated wishlist summary"
            },
            "DELETE /api/v1/wishlist/remove/:item_id": {
              description: "Remove item from wishlist (auto-saved)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Removed item confirmation"
            },
            "DELETE /api/v1/wishlist/clear": {
              description: "Clear entire wishlist (auto-saved)",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Clear confirmation"
            },
            "GET /api/v1/wishlist/count": {
              description: "Get wishlist items count",
              headers: {
                "Authorization": "Bearer <token>"
              },
              response: "Wishlist items count"
            },
            "POST /api/v1/wishlist/move-to-cart/:item_id": {
              description: "Move item from wishlist to cart",
              headers: {
                "Authorization": "Bearer <token>"
              },
              body: {
                quantity: "number (optional, default: 1)"
              },
              response: "Move confirmation and updated cart"
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
            register: `curl -X POST ${req.protocol}://${req.get('host')}/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"username":"newuser","email":"user@test.com","password":"password123"}'`,
            products: `curl "${req.protocol}://${req.get('host')}/api/v1/movies/products?page=1&limit=10"`,
            search: `curl "${req.protocol}://${req.get('host')}/api/v1/books/products/search?q=javascript&page=1"`,
            profile: `curl -H "Authorization: Bearer <your-token>" \\
  "${req.protocol}://${req.get('host')}/api/v1/auth/profile"`,
            cart: `curl -H "Authorization: Bearer <your-token>" \\
  "${req.protocol}://${req.get('host')}/api/v1/cart"`,
            add_to_cart: `curl -X POST -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"domain":"movies","product_id":1,"name":"Test Movie","price":12.99,"quantity":2}' \\
  "${req.protocol}://${req.get('host')}/api/v1/cart/add"`,
            wishlist: `curl -H "Authorization: Bearer <your-token>" \\
  "${req.protocol}://${req.get('host')}/api/v1/wishlist"`,
            add_to_wishlist: `curl -X POST -H "Authorization: Bearer <your-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"domain":"books","product_id":5,"name":"JavaScript Guide","price":29.99}' \\
  "${req.protocol}://${req.get('host')}/api/v1/wishlist/add"`
          }
        },
        supported_domains: [
          "movies", "books", "electronics", "restaurants", "fashion",
          "cars", "hotels", "games", "music", "food", "sports", "toys",
          "tools", "medicines", "courses", "events", "apps", "flights",
          "pets", "realestate"
        ],
        persistence_info: {
          description: "All user accounts, shopping carts and wishlists persist across server restarts",
          storage_type: "File-based JSON storage",
          auto_save: "All changes are automatically saved to disk",
          demo_accounts: "Pre-loaded: demo/demo123 and teacher/demo123",
          data_location: DATA_DIR
        },
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
          'GET /api/v1/domains',
          'GET /api/v1/docs',
          'POST /api/v1/auth/login',
          'POST /api/v1/auth/register',
          'GET /api/v1/cart',
          'POST /api/v1/cart/add',
          'GET /api/v1/wishlist',
          'POST /api/v1/wishlist/add',
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
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Status: http://localhost:${PORT}/api/v1/status`);
      console.log(`📚 Documentation: http://localhost:${PORT}/api/v1/docs`);
      console.log(`🔐 Demo Login: POST http://localhost:${PORT}/api/v1/auth/login`);
      console.log(`🛍️ Products Example: http://localhost:${PORT}/api/v1/movies/products`);
      console.log(`🛒 Cart Example: GET http://localhost:${PORT}/api/v1/cart`);
      console.log(`💝 Wishlist Example: GET http://localhost:${PORT}/api/v1/wishlist`);
      console.log(`🔍 Search Example: http://localhost:${PORT}/api/v1/books/products/search?q=javascript`);
      console.log(`🏥 Database: ${databaseReady ? 'Connected' : 'Limited Mode'}`);
      console.log(`📁 User Persistence: ${persistentUsers.length} users loaded from file`);
      console.log(`💾 Data Directory: ${DATA_DIR}`);
      console.log(`🌐 CORS: Enabled for localhost:5500, 127.0.0.1:5500`);
      console.log(`🚀 Ready for student projects!`);
      console.log(`⭐ ${databaseReady ? '10,000+ products across 20 domains + Cart + Wishlist' : 'Basic functionality available'}`);
      console.log(`✅ NEW: Wishlist System with Persistence Added!`);
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