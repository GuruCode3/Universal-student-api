// utils/database.js - FIXED VERSION - NO CIRCULAR DEPENDENCY
// Direct import from connection file instead of re-importing

// Import connection functions directly 
const { dbConfig } = require('../database/connection');

// Validate dbConfig is available
if (!dbConfig) {
  console.error('❌ CRITICAL: dbConfig is undefined in utils/database.js');
  throw new Error('Database configuration not available');
}

console.log('✅ Database utilities loaded successfully');

// Re-export all database functions for compatibility
module.exports = {
  // Direct access to database functions - FIXED
  getAll: (query, params) => {
    if (!dbConfig || !dbConfig.getAll) {
      console.error('❌ dbConfig.getAll not available');
      return [];
    }
    return dbConfig.getAll(query, params);
  },
  
  getOne: (query, params) => {
    if (!dbConfig || !dbConfig.getOne) {
      console.error('❌ dbConfig.getOne not available');
      return null;
    }
    return dbConfig.getOne(query, params);
  },
  
  run: (query, params) => {
    if (!dbConfig || !dbConfig.run) {
      console.error('❌ dbConfig.run not available');
      return { changes: 0, lastInsertRowid: null };
    }
    return dbConfig.run(query, params);
  },
  
  executeQuery: (query, params) => {
    if (!dbConfig || !dbConfig.executeQuery) {
      console.error('❌ dbConfig.executeQuery not available');
      return [];
    }
    return dbConfig.executeQuery(query, params);
  },
  
  // Validation and health check functions - FIXED
  validateDatabase: () => {
    if (!dbConfig || !dbConfig.validateDatabase) {
      console.error('❌ dbConfig.validateDatabase not available');
      return {
        isValid: false,
        tables: {},
        performance: {}
      };
    }
    return dbConfig.validateDatabase();
  },
  
  initializeUsersTable: () => {
    if (!dbConfig || !dbConfig.initializeUsersTable) {
      console.error('❌ dbConfig.initializeUsersTable not available');
      return false;
    }
    return dbConfig.initializeUsersTable();
  },
  
  createDemoUsers: () => {
    if (!dbConfig || !dbConfig.createDemoUsers) {
      console.error('❌ dbConfig.createDemoUsers not available');
      return false;
    }
    return dbConfig.createDemoUsers();
  },
  
  closeConnection: () => {
    if (!dbConfig || !dbConfig.closeConnection) {
      console.error('❌ dbConfig.closeConnection not available');
      return false;
    }
    return dbConfig.closeConnection();
  },
  
  // Additional utility functions - SAFE VERSIONS
  getAllUsers: () => {
    try {
      console.log('👥 Getting all users...');
      if (!dbConfig || !dbConfig.executeQuery) {
        console.error('❌ executeQuery not available');
        return [];
      }
      const users = dbConfig.executeQuery('SELECT * FROM users');
      console.log(`👥 Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error('❌ getAllUsers failed:', error);
      return [];
    }
  },
  
  // Get user by username or email - SAFE VERSION
  getUserByCredentials: (usernameOrEmail) => {
    try {
      console.log(`🔍 Looking for user: ${usernameOrEmail}`);
      if (!dbConfig || !dbConfig.getOne) {
        console.error('❌ getOne not available');
        return null;
      }
      const user = dbConfig.getOne(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [usernameOrEmail, usernameOrEmail]
      );
      console.log(`👤 User found: ${user ? user.username : 'Not found'}`);
      return user;
    } catch (error) {
      console.error('❌ getUserByCredentials failed:', error);
      return null;
    }
  },
  
  // Get user by ID - SAFE VERSION
  getUserById: (id) => {
    try {
      console.log(`🔍 Looking for user ID: ${id}`);
      if (!dbConfig || !dbConfig.getOne) {
        console.error('❌ getOne not available');
        return null;
      }
      const user = dbConfig.getOne('SELECT * FROM users WHERE id = ?', [id]);
      console.log(`👤 User found: ${user ? user.username : 'Not found'}`);
      return user;
    } catch (error) {
      console.error('❌ getUserById failed:', error);
      return null;
    }
  },
  
  // Create new user - SAFE VERSION
  createUser: (userData) => {
    try {
      console.log(`👤 Creating user: ${userData.username}`);
      if (!dbConfig || !dbConfig.run) {
        console.error('❌ run function not available');
        return { success: false, error: 'Database not available' };
      }
      
      const result = dbConfig.run(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        userData.username,
        userData.email,
        userData.password_hash,
        userData.first_name || null,
        userData.last_name || null,
        userData.role || 'user'
      ]);
      
      if (result.changes > 0) {
        console.log(`✅ User created successfully with ID: ${result.lastInsertRowid}`);
        return {
          success: true,
          userId: result.lastInsertRowid,
          changes: result.changes
        };
      } else {
        console.log('⚠️ User creation failed - no changes');
        return { success: false, error: 'No changes made' };
      }
    } catch (error) {
      console.error('❌ createUser failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Update user - SAFE VERSION
  updateUser: (userId, updates) => {
    try {
      console.log(`👤 Updating user ID: ${userId}`);
      if (!dbConfig || !dbConfig.run) {
        console.error('❌ run function not available');
        return { success: false, error: 'Database not available' };
      }
      
      const result = dbConfig.run(`
        UPDATE users 
        SET first_name = ?, last_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        updates.first_name,
        updates.last_name, 
        updates.email,
        userId
      ]);
      
      if (result.changes > 0) {
        console.log(`✅ User updated successfully`);
        return { success: true, changes: result.changes };
      } else {
        console.log('⚠️ User update failed - no changes');
        return { success: false, error: 'No changes made' };
      }
    } catch (error) {
      console.error('❌ updateUser failed:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get products for domain with pagination - SAFE VERSION
  getProductsByDomain: (domain, page = 1, limit = 20) => {
    try {
      console.log(`🛍️ Getting products for domain: ${domain}, page: ${page}, limit: ${limit}`);
      if (!dbConfig || !dbConfig.executeQuery) {
        console.error('❌ executeQuery not available');
        return [];
      }
      
      const offset = (page - 1) * limit;
      
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
      
      console.log(`📦 Found ${products.length} products for ${domain}`);
      return products;
    } catch (error) {
      console.error('❌ getProductsByDomain failed:', error);
      return [];
    }
  },
  
  // Get total products count for domain - SAFE VERSION
  getProductsCountByDomain: (domain) => {
    try {
      console.log(`📊 Counting products for domain: ${domain}`);
      if (!dbConfig || !dbConfig.getOne) {
        console.error('❌ getOne not available');
        return 0;
      }
      
      const result = dbConfig.getOne('SELECT COUNT(*) as total FROM products WHERE domain = ?', [domain]);
      const count = result ? result.total : 0;
      console.log(`📊 Total products in ${domain}: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ getProductsCountByDomain failed:', error);
      return 0;
    }
  },
  
  // Get single product by ID and domain - SAFE VERSION
  getProductById: (domain, productId) => {
    try {
      console.log(`🎯 Getting product: ${domain}/${productId}`);
      if (!dbConfig || !dbConfig.getOne) {
        console.error('❌ getOne not available');
        return null;
      }
      
      const product = dbConfig.getOne(`
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
      
      if (product) {
        console.log(`🎯 Product found: ${product.name}`);
        // Parse JSON attributes
        if (product.attributes && typeof product.attributes === 'string') {
          try {
            product.attributes = JSON.parse(product.attributes);
          } catch (e) {
            console.warn('⚠️ Failed to parse product attributes JSON');
            product.attributes = {};
          }
        }
      } else {
        console.log(`⚠️ Product not found: ${domain}/${productId}`);
      }
      
      return product;
    } catch (error) {
      console.error('❌ getProductById failed:', error);
      return null;
    }
  },
  
  // Get categories for domain - SAFE VERSION
  getCategoriesByDomain: (domain) => {
    try {
      console.log(`📋 Getting categories for domain: ${domain}`);
      if (!dbConfig || !dbConfig.executeQuery) {
        console.error('❌ executeQuery not available');
        return [];
      }
      
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
      
      console.log(`📋 Found ${categories.length} categories for ${domain}`);
      return categories;
    } catch (error) {
      console.error('❌ getCategoriesByDomain failed:', error);
      return [];
    }
  },
  
  // Get brands for domain - SAFE VERSION
  getBrandsByDomain: (domain) => {
    try {
      console.log(`🏷️ Getting brands for domain: ${domain}`);
      if (!dbConfig || !dbConfig.executeQuery) {
        console.error('❌ executeQuery not available');
        return [];
      }
      
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
      
      console.log(`🏷️ Found ${brands.length} brands for ${domain}`);
      return brands;
    } catch (error) {
      console.error('❌ getBrandsByDomain failed:', error);
      return [];
    }
  },
  
  // Search products - SAFE VERSION
  searchProducts: (domain, searchTerm, filters = {}) => {
    try {
      console.log(`🔍 Searching products in ${domain}: "${searchTerm}"`);
      if (!dbConfig || !dbConfig.executeQuery) {
        console.error('❌ executeQuery not available');
        return [];
      }
      
      let query = `
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
      
      const params = [domain];
      
      if (searchTerm) {
        query += ` AND (p.name LIKE ? OR p.attributes LIKE ?)`;
        const searchPattern = `%${searchTerm}%`;
        params.push(searchPattern, searchPattern);
      }
      
      if (filters.category) {
        query += ` AND c.slug = ?`;
        params.push(filters.category);
      }
      
      if (filters.brand) {
        query += ` AND b.slug = ?`;
        params.push(filters.brand);
      }
      
      if (filters.min_price) {
        query += ` AND p.price >= ?`;
        params.push(parseFloat(filters.min_price));
      }
      
      if (filters.max_price) {
        query += ` AND p.price <= ?`;
        params.push(parseFloat(filters.max_price));
      }
      
      query += ` ORDER BY p.rating DESC, p.id DESC`;
      
      if (filters.limit) {
        query += ` LIMIT ?`;
        params.push(parseInt(filters.limit));
        
        if (filters.offset) {
          query += ` OFFSET ?`;
          params.push(parseInt(filters.offset));
        }
      }
      
      const products = dbConfig.executeQuery(query, params);
      console.log(`🔍 Search results: ${products.length} products found`);
      return products;
    } catch (error) {
      console.error('❌ searchProducts failed:', error);
      return [];
    }
  },
  
  // Get available domains - SAFE VERSION
  getAvailableDomains: () => {
    try {
      console.log('🌐 Getting available domains...');
      if (!dbConfig || !dbConfig.executeQuery) {
        console.error('❌ executeQuery not available');
        return [];
      }
      
      const domains = dbConfig.executeQuery('SELECT DISTINCT domain FROM products ORDER BY domain');
      const domainNames = domains.map(d => d.domain);
      console.log(`🌐 Available domains: ${domainNames.join(', ')}`);
      return domainNames;
    } catch (error) {
      console.error('❌ getAvailableDomains failed:', error);
      return [];
    }
  },
  
  // Health check - SAFE VERSION
  healthCheck: () => {
    try {
      if (!dbConfig || !dbConfig.validateDatabase) {
        return {
          status: 'error',
          database: 'disconnected',
          error: 'Database configuration not available',
          timestamp: new Date().toISOString()
        };
      }
      
      const validation = dbConfig.validateDatabase();
      const health = {
        status: validation.isValid ? 'healthy' : 'unhealthy',
        database: validation.isValid ? 'connected' : 'disconnected',
        tables: validation.tables || {},
        performance: validation.performance || {},
        timestamp: new Date().toISOString()
      };
      
      console.log('🏥 Database health check:', health.status);
      return health;
    } catch (error) {
      console.error('❌ healthCheck failed:', error);
      return {
        status: 'error',
        database: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  },
  
  // Direct access to dbConfig for backward compatibility
  dbConfig: dbConfig
};