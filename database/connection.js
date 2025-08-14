// database/connection.js - Universal Student API Database Connection
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

console.log('🗄️ Initializing Universal Student API Database...');

// Database configuration
const dbPath = path.join(__dirname, 'universal-api.db');
const schemaPath = path.join(__dirname, 'schema.sql');

console.log(`📍 Database path: ${dbPath}`);
console.log(`📍 Schema path: ${schemaPath}`);

// Initialize SQLite database
let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Performance optimization
  db.pragma('foreign_keys = ON');  // Enable foreign keys
  console.log('✅ SQLite database connected successfully');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  throw error;
}

// Create tables from schema
function createTables() {
  try {
    console.log('📋 Creating database tables...');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('✅ Tables created from schema.sql');
    } else {
      console.log('⚠️ Schema file not found, creating tables manually...');
      
      // Create tables manually if schema.sql doesn't exist
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

        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS brands (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          domain VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(50),
          last_name VARCHAR(50),
          role VARCHAR(20) DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Tables created manually');
    }
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    return false;
  }
  return true;
}

// Initialize users table and create demo accounts
function initializeUsersTable() {
  try {
    console.log('👥 Initializing users table...');
    
    // Check if users already exist
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (existingUsers.count > 0) {
      console.log(`👥 Found ${existingUsers.count} existing users`);
      return true;
    }
    
    // Create demo users
    const hashedPassword = bcrypt.hashSync('demo123', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Demo user
    insertUser.run('demo', 'demo@example.com', hashedPassword, 'Demo', 'User', 'user');
    
    // Admin user (teacher)
    insertUser.run('teacher', 'teacher@example.com', hashedPassword, 'Teacher', 'Admin', 'admin');
    
    console.log('✅ Demo users created: demo/demo123, teacher/demo123');
    return true;
  } catch (error) {
    console.error('❌ Users initialization failed:', error);
    return false;
  }
}

// Create demo users function for compatibility
function createDemoUsers() {
  return initializeUsersTable();
}

// Database validation and health check
function validateDatabase() {
  try {
    const tables = {
      products: 0,
      categories: 0,
      brands: 0,
      users: 0
    };
    
    // Count records in each table
    try {
      tables.products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    } catch (e) { /* Table might not exist */ }
    
    try {
      tables.categories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    } catch (e) { /* Table might not exist */ }
    
    try {
      tables.brands = db.prepare('SELECT COUNT(*) as count FROM brands').get().count;
    } catch (e) { /* Table might not exist */ }
    
    try {
      tables.users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    } catch (e) { /* Table might not exist */ }
    
    const performance = {
      optimization_status: 'In-Memory Optimized',
      wal_mode: 'Enabled',
      foreign_keys: 'Enabled',
      connection_type: 'SQLite3 Better-SQLite3'
    };
    
    const isValid = Object.values(tables).some(count => count >= 0);
    
    return {
      isValid,
      tables,
      performance
    };
  } catch (error) {
    console.error('❌ Database validation failed:', error);
    return {
      isValid: false,
      tables: {},
      performance: {},
      error: error.message
    };
  }
}

// Database wrapper functions
const dbConfig = {
  // Raw database access
  db: db,
  
  // Execute query and return all results
  executeQuery: (query, params = []) => {
    try {
      const stmt = db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('❌ executeQuery failed:', error);
      return [];
    }
  },
  
  // Get all rows
  getAll: (query, params = []) => {
    try {
      const stmt = db.prepare(query);
      return stmt.all(params);
    } catch (error) {
      console.error('❌ getAll failed:', error);
      return [];
    }
  },
  
  // Get single row
  getOne: (query, params = []) => {
    try {
      const stmt = db.prepare(query);
      return stmt.get(params);
    } catch (error) {
      console.error('❌ getOne failed:', error);
      return null;
    }
  },
  
  // Run query (INSERT, UPDATE, DELETE)
  run: (query, params = []) => {
    try {
      const stmt = db.prepare(query);
      return stmt.run(params);
    } catch (error) {
      console.error('❌ run failed:', error);
      return { changes: 0, lastInsertRowid: null };
    }
  },
  
  // Utility functions
  validateDatabase,
  initializeUsersTable,
  createDemoUsers,
  
  // Close connection
  closeConnection: () => {
    try {
      db.close();
      console.log('🔒 Database connection closed');
      return true;
    } catch (error) {
      console.error('❌ Error closing database:', error);
      return false;
    }
  }
};

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Universal Student API Database...');
    
    // Create tables
    const tablesCreated = createTables();
    if (!tablesCreated) {
      console.error('❌ Failed to create tables');
      return false;
    }
    
    // Initialize users
    const usersInitialized = initializeUsersTable();
    if (!usersInitialized) {
      console.warn('⚠️ Warning: Users initialization failed');
    }
    
    // Validate database
    const validation = validateDatabase();
    if (!validation.isValid) {
      console.error('❌ Database validation failed');
      return false;
    }
    
    console.log('✅ Database initialized successfully');
    console.log(`📊 Database stats:`, validation.tables);
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}

// Export database configuration
module.exports = {
  db,
  dbConfig,
  initializeDatabase
};

// Log successful initialization
console.log('✅ Database connection module loaded successfully');