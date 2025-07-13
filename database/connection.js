const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path - FIXED to match actual filename
const DB_PATH = path.join(__dirname, 'universal-api.db');

let db = null;

// Initialize database connection
function initializeDatabase() {
  try {
    console.log('🗄️ Initializing database...');
    console.log('📍 Database path:', DB_PATH);

    // Create database connection
    db = new Database(DB_PATH);
    console.log('✅ Database connection established');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('✅ Database schema loaded');
    } else {
      console.log('⚠️ Schema file not found, creating tables manually...');
      createTablesManually();
    }

    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Set WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    
    console.log('✅ Database initialization complete');
    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Create tables manually if schema.sql not found
function createTablesManually() {
  try {
    console.log('🔧 Creating tables manually...');

    // Products table
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        image_url VARCHAR(500),
        attributes JSON,
        category_id INTEGER,
        brand_id INTEGER,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        in_stock BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Categories table
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Brands table
    db.exec(`
      CREATE TABLE IF NOT EXISTS brands (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        avatar_url VARCHAR(500),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User cart table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        domain VARCHAR(50) NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_domain ON products(domain);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
      CREATE INDEX IF NOT EXISTS idx_categories_domain ON categories(domain);
      CREATE INDEX IF NOT EXISTS idx_brands_domain ON brands(domain);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    console.log('✅ Tables created manually');

  } catch (error) {
    console.error('❌ Manual table creation failed:', error);
    throw error;
  }
}

// Test database connection
function testConnection() {
  try {
    if (!db) {
      console.log('❌ Database not initialized');
      return false;
    }

    // Simple test query
    const result = db.prepare('SELECT 1 as test').get();
    
    if (result && result.test === 1) {
      console.log('✅ Database connection test passed');
      
      // Log table counts
      const tables = ['products', 'categories', 'brands', 'users'];
      tables.forEach(table => {
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
          console.log(`📊 ${table}: ${count.count} records`);
        } catch (error) {
          console.log(`📊 ${table}: table not found or empty`);
        }
      });
      
      return true;
    }

    return false;

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return false;
  }
}

// Get database instance
function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Close database connection
function closeDatabase() {
  if (db) {
    try {
      db.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
  }
}

// Database backup function
function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(__dirname, `backup-${timestamp}.db`);
    
    if (db) {
      db.backup(backupPath);
      console.log(`✅ Database backed up to: ${backupPath}`);
      return backupPath;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    return null;
  }
}

// Get database statistics
function getDatabaseStats() {
  try {
    if (!db) {
      return { error: 'Database not initialized' };
    }

    const stats = {};
    
    // Get table counts
    const tables = ['products', 'categories', 'brands', 'users'];
    tables.forEach(table => {
      try {
        const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        stats[table] = result.count;
      } catch (error) {
        stats[table] = 0;
      }
    });

    // Get domain counts
    try {
      const domains = db.prepare(`
        SELECT domain, COUNT(*) as count 
        FROM products 
        GROUP BY domain 
        ORDER BY count DESC
      `).all();
      stats.domains = domains;
    } catch (error) {
      stats.domains = [];
    }

    // Database size
    try {
      const dbStats = fs.statSync(DB_PATH);
      stats.database_size = `${(dbStats.size / 1024 / 1024).toFixed(2)} MB`;
    } catch (error) {
      stats.database_size = 'Unknown';
    }

    return stats;

  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return { error: error.message };
  }
}

// Vacuum database to optimize
function vacuumDatabase() {
  try {
    if (!db) {
      console.log('❌ Database not initialized');
      return false;
    }

    console.log('🧹 Running database vacuum...');
    db.exec('VACUUM');
    console.log('✅ Database vacuum completed');
    return true;

  } catch (error) {
    console.error('❌ Database vacuum failed:', error);
    return false;
  }
}

// Export database instance and functions
module.exports = {
  initializeDatabase,
  testConnection,
  getDatabase,
  closeDatabase,
  backupDatabase,
  getDatabaseStats,
  vacuumDatabase,
  get db() {
    return db;
  }
};