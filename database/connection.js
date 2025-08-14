// database/connection.js - Production In-Memory Database (No external dependencies)
const bcrypt = require('bcryptjs');

console.log('🗄️ Initializing Universal Student API In-Memory Database...');

// In-memory data storage
const data = {
  users: [],
  products: [],
  categories: [],
  brands: []
};

// Performance indexes
const indexes = {
  usersByUsername: new Map(),
  usersByEmail: new Map(),
  productsByDomain: new Map(),
  categoriesByDomain: new Map(),
  brandsByDomain: new Map()
};

// Initialize demo data
function initializeData() {
  console.log('📋 Initializing in-memory data...');
  
  // Create demo users
  const hashedPassword = bcrypt.hashSync('demo123', 10);
  
  const demoUsers = [
    {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      password_hash: hashedPassword,
      first_name: 'Demo',
      last_name: 'User',
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'teacher',
      email: 'teacher@example.com',
      password_hash: hashedPassword,
      first_name: 'Teacher',
      last_name: 'Admin',
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  data.users = demoUsers;
  
  // Build user indexes
  demoUsers.forEach(user => {
    indexes.usersByUsername.set(user.username, user);
    indexes.usersByEmail.set(user.email, user);
  });
  
  // Generate sample data for each domain
  generateSampleData();
  
  console.log('✅ In-memory data initialized');
  console.log(`📊 Stats: ${data.users.length} users, ${data.products.length} products, ${data.categories.length} categories, ${data.brands.length} brands`);
}

// Generate sample products, categories, and brands
function generateSampleData() {
  const domains = [
    'movies', 'books', 'electronics', 'restaurants', 'fashion',
    'music', 'games', 'food', 'toys', 'hotels',
    'realestate', 'cars', 'sports', 'medicines', 'courses',
    'events', 'apps', 'flights', 'pets', 'tools'
  ];
  
  let productId = 1;
  let categoryId = 1;
  let brandId = 1;
  
  domains.forEach(domain => {
    // Create categories for domain
    const domainCategories = [
      { id: categoryId++, domain, name: `${domain} Category 1`, slug: `${domain}-cat-1` },
      { id: categoryId++, domain, name: `${domain} Category 2`, slug: `${domain}-cat-2` },
      { id: categoryId++, domain, name: `${domain} Category 3`, slug: `${domain}-cat-3` },
      { id: categoryId++, domain, name: `${domain} Category 4`, slug: `${domain}-cat-4` }
    ];
    
    // Create brands for domain
    const domainBrands = [
      { id: brandId++, domain, name: `${domain} Brand A`, slug: `${domain}-brand-a` },
      { id: brandId++, domain, name: `${domain} Brand B`, slug: `${domain}-brand-b` },
      { id: brandId++, domain, name: `${domain} Brand C`, slug: `${domain}-brand-c` }
    ];
    
    data.categories.push(...domainCategories);
    data.brands.push(...domainBrands);
    
    // Index categories and brands
    if (!indexes.categoriesByDomain.has(domain)) {
      indexes.categoriesByDomain.set(domain, []);
    }
    if (!indexes.brandsByDomain.has(domain)) {
      indexes.brandsByDomain.set(domain, []);
    }
    indexes.categoriesByDomain.get(domain).push(...domainCategories);
    indexes.brandsByDomain.get(domain).push(...domainBrands);
    
    // Generate 500 products per domain
    const domainProducts = [];
    for (let i = 1; i <= 500; i++) {
      const product = {
        id: productId++,
        domain,
        name: `${domain} Product ${i}`,
        price: (Math.random() * 200 + 10).toFixed(2),
        image_url: `https://picsum.photos/300/400?random=${domain}${i}`,
        attributes: JSON.stringify({
          description: `Sample ${domain} product`,
          featured: Math.random() > 0.8,
          new_arrival: Math.random() > 0.9
        }),
        category_id: domainCategories[Math.floor(Math.random() * domainCategories.length)].id,
        brand_id: domainBrands[Math.floor(Math.random() * domainBrands.length)].id,
        rating: (Math.random() * 2 + 3).toFixed(1),
        review_count: Math.floor(Math.random() * 1000) + 10,
        in_stock: Math.random() > 0.1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      domainProducts.push(product);
    }
    
    data.products.push(...domainProducts);
    
    // Index products by domain
    indexes.productsByDomain.set(domain, domainProducts);
  });
}

// Database simulation functions
const dbConfig = {
  // Execute query simulation
  executeQuery: (query, params = []) => {
    try {
      // Simple query parsing for common patterns
      if (query.includes('SELECT * FROM users')) {
        return data.users;
      }
      
      if (query.includes('SELECT * FROM users WHERE username = ? OR email = ?')) {
        const [usernameOrEmail] = params;
        return data.users.filter(user => 
          user.username === usernameOrEmail || user.email === usernameOrEmail
        );
      }
      
      if (query.includes('SELECT * FROM users WHERE id = ?')) {
        const [id] = params;
        return data.users.filter(user => user.id === parseInt(id));
      }
      
      if (query.includes('SELECT DISTINCT domain FROM products')) {
        const domains = [...new Set(data.products.map(p => p.domain))];
        return domains.map(domain => ({ domain }));
      }
      
      if (query.includes('FROM products p') && query.includes('WHERE p.domain = ?')) {
        const [domain] = params;
        const domainProducts = indexes.productsByDomain.get(domain) || [];
        
        // Handle LIMIT and OFFSET
        if (query.includes('LIMIT ? OFFSET ?')) {
          const limit = parseInt(params[1]);
          const offset = parseInt(params[2]);
          return domainProducts.slice(offset, offset + limit).map(product => ({
            ...product,
            category_name: data.categories.find(c => c.id === product.category_id)?.name,
            brand_name: data.brands.find(b => b.id === product.brand_id)?.name
          }));
        }
        
        return domainProducts.map(product => ({
          ...product,
          category_name: data.categories.find(c => c.id === product.category_id)?.name,
          brand_name: data.brands.find(b => b.id === product.brand_id)?.name
        }));
      }
      
      if (query.includes('SELECT COUNT(*) as count FROM products WHERE domain = ?')) {
        const [domain] = params;
        const domainProducts = indexes.productsByDomain.get(domain) || [];
        return [{ count: domainProducts.length }];
      }
      
      if (query.includes('FROM categories c') && query.includes('WHERE c.domain = ?')) {
        const [domain] = params;
        return indexes.categoriesByDomain.get(domain) || [];
      }
      
      if (query.includes('FROM brands b') && query.includes('WHERE b.domain = ?')) {
        const [domain] = params;
        return indexes.brandsByDomain.get(domain) || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ executeQuery failed:', error);
      return [];
    }
  },
  
  // Get all rows
  getAll: function(query, params) {
    return this.executeQuery(query, params);
  },
  
  // Get single row
  getOne: function(query, params) {
    const results = this.executeQuery(query, params);
    return results.length > 0 ? results[0] : null;
  },
  
  // Run query (INSERT, UPDATE, DELETE)
  run: (query, params = []) => {
    try {
      if (query.includes('INSERT INTO users')) {
        const [username, email, password_hash, first_name, last_name, role] = params;
        const newUser = {
          id: data.users.length + 1,
          username,
          email,
          password_hash,
          first_name,
          last_name,
          role: role || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        data.users.push(newUser);
        indexes.usersByUsername.set(username, newUser);
        indexes.usersByEmail.set(email, newUser);
        
        return { changes: 1, lastInsertRowid: newUser.id };
      }
      
      if (query.includes('UPDATE users')) {
        const [first_name, last_name, email, id] = params;
        const userIndex = data.users.findIndex(u => u.id === parseInt(id));
        
        if (userIndex !== -1) {
          data.users[userIndex] = {
            ...data.users[userIndex],
            first_name,
            last_name,
            email,
            updated_at: new Date().toISOString()
          };
          return { changes: 1 };
        }
      }
      
      return { changes: 0, lastInsertRowid: null };
    } catch (error) {
      console.error('❌ run failed:', error);
      return { changes: 0, lastInsertRowid: null };
    }
  },
  
  // Database validation
  validateDatabase: () => {
    return {
      isValid: true,
      tables: {
        products: data.products.length,
        categories: data.categories.length,
        brands: data.brands.length,
        users: data.users.length
      },
      performance: {
        optimization_status: 'In-Memory Optimized',
        connection_type: 'Native JavaScript Objects',
        indexes_enabled: true
      }
    };
  },
  
  // Initialize users table
  initializeUsersTable: () => {
    // Already initialized in initializeData()
    return true;
  },
  
  // Create demo users
  createDemoUsers: () => {
    // Already created in initializeData()
    return true;
  },
  
  // Close connection (no-op for in-memory)
  closeConnection: () => {
    return true;
  }
};

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing In-Memory Database...');
    initializeData();
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Export database configuration
module.exports = {
  dbConfig,
  initializeDatabase
};

console.log('✅ In-Memory Database connection module loaded successfully');