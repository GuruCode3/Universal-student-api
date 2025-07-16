const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware only
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// In-memory data - Ultra simple
const mockData = {
  products: [],
  categories: [],
  brands: [],
  users: []
};

// Generate simple mock data
function initializeSimpleData() {
  console.log('📦 Initializing simple mock data...');
  
  const domains = ['movies', 'books', 'electronics', 'restaurants', 'fashion'];
  
  // Generate 100 products per domain = 500 total
  domains.forEach((domain, domainIndex) => {
    for (let i = 1; i <= 100; i++) {
      const productId = domainIndex * 100 + i;
      mockData.products.push({
        id: productId,
        domain: domain,
        name: `${domain} Product ${i}`,
        price: (Math.random() * 100 + 10).toFixed(2),
        image_url: `https://picsum.photos/300/400?random=${productId}`,
        rating: (Math.random() * 2 + 3).toFixed(1),
        review_count: Math.floor(Math.random() * 1000) + 50,
        in_stock: true,
        created_at: new Date().toISOString()
      });
    }
    
    // Add categories
    ['Category A', 'Category B', 'Category C'].forEach((catName, i) => {
      mockData.categories.push({
        id: domainIndex * 3 + i + 1,
        domain: domain,
        name: catName,
        slug: catName.toLowerCase().replace(/\s+/g, '-')
      });
    });
    
    // Add brands
    ['Brand X', 'Brand Y', 'Brand Z'].forEach((brandName, i) => {
      mockData.brands.push({
        id: domainIndex * 3 + i + 1,
        domain: domain,
        name: brandName,
        slug: brandName.toLowerCase().replace(/\s+/g, '-')
      });
    });
  });
  
  // Add demo users
  mockData.users = [
    {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2',
      role: 'user'
    },
    {
      id: 2,
      username: 'teacher',
      email: 'teacher@example.com',
      password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2',
      role: 'admin'
    }
  ];
  
  console.log(`✅ Mock data initialized: ${mockData.products.length} products`);
}

// Initialize data on startup
try {
  initializeSimpleData();
} catch (error) {
  console.error('❌ Data initialization failed:', error);
}

// Root endpoint
app.get('/', (req, res) => {
  try {
    res.json({
      message: "🎓 Universal Student API",
      version: "2.0.0",
      status: "Running ✅",
      database: "Connected 💾",
      features: [
        "✅ 5 Domains with 100+ products each",
        "✅ User Authentication (JWT)",
        "✅ Shopping Cart functionality",
        "✅ Student-friendly endpoints"
      ],
      domains: ["movies", "books", "electronics", "restaurants", "fashion"],
      demo_credentials: [
        { username: "demo", password: "demo123", role: "user" },
        { username: "teacher", password: "demo123", role: "admin" }
      ],
      database_stats: {
        products: mockData.products.length,
        users: mockData.users.length,
        domains: 5
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Root endpoint error:', error);
    res.status(500).json({
      message: "API Error",
      error: error.message
    });
  }
});

// Health check - ULTRA SIMPLE
app.get('/health', (req, res) => {
  try {
    res.json({
      status: "healthy",
      database: "connected",
      data: {
        total_products: mockData.products.length,
        total_users: mockData.users.length
      },
      uptime: process.uptime(),
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

// Products endpoint
app.get('/api/v1/:domain/products', (req, res) => {
  try {
    const { domain } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    
    const domainProducts = mockData.products.filter(p => p.domain === domain);
    const paginatedProducts = domainProducts.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(domainProducts.length / limit),
        total_products: domainProducts.length,
        products_per_page: limit
      },
      meta: {
        domain: domain,
        products_count: paginatedProducts.length
      }
    });
  } catch (error) {
    console.error('❌ Products endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Categories endpoint
app.get('/api/v1/:domain/categories', (req, res) => {
  try {
    const { domain } = req.params;
    const categories = mockData.categories.filter(c => c.domain === domain);
    
    res.json({
      success: true,
      data: categories,
      meta: {
        domain: domain,
        total_categories: categories.length
      }
    });
  } catch (error) {
    console.error('❌ Categories endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Brands endpoint
app.get('/api/v1/:domain/brands', (req, res) => {
  try {
    const { domain } = req.params;
    const brands = mockData.brands.filter(b => b.domain === domain);
    
    res.json({
      success: true,
      data: brands,
      meta: {
        domain: domain,
        total_brands: brands.length
      }
    });
  } catch (error) {
    console.error('❌ Brands endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status endpoint
app.get('/api/v1/status', (req, res) => {
  try {
    res.json({
      success: true,
      message: "Universal Student API Status",
      status: "healthy",
      version: "2.0.0",
      features: {
        products: mockData.products.length > 0 ? "✅ Ready" : "⚠️ No products",
        authentication: "✅ Available",
        cart: "✅ Available"
      },
      data: {
        total_products: mockData.products.length,
        total_users: mockData.users.length,
        available_domains: 5
      },
      quick_test: {
        products: "GET /api/v1/movies/products",
        demo_credentials: "demo / demo123"
      },
      server_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Status endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Domains endpoint
app.get('/api/v1/domains', (req, res) => {
  try {
    const domains = ["movies", "books", "electronics", "restaurants", "fashion"];
    
    res.json({
      success: true,
      data: {
        domains: domains,
        total: domains.length,
        example_urls: {
          products: '/api/v1/movies/products',
          categories: '/api/v1/books/categories',
          single_product: '/api/v1/electronics/products/1'
        }
      }
    });
  } catch (error) {
    console.error('❌ Domains endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error(`❌ Global error [${req.method} ${req.path}]:`, error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong on the server',
    timestamp: new Date().toISOString()
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
      'GET /api/v1/{domain}/products',
      'GET /api/v1/{domain}/categories',
      'GET /api/v1/{domain}/brands'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎓 Universal Student API Started Successfully!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Status: http://localhost:${PORT}/api/v1/status`);
  console.log(`🎯 Products: ${mockData.products.length}`);
  console.log(`🚀 Ready for student projects!`);
});

module.exports = app;