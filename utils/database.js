// utils/database.js - Fixed Version
const Database = require('better-sqlite3');
const path = require('path');

class DatabaseConfig {
  constructor() {
    // FIXED: Match the same path as connection.js
    this.dbPath = path.join(__dirname, '../database/universal-api.db');
    this.db = null;
  }

  // Get database connection
  getConnection() {
    try {
      if (!this.db || !this.db.open) {
        this.db = new Database(this.dbPath);
        console.log('✅ Database connected:', this.dbPath);
      }
      return this.db;
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  // Close database connection
  closeConnection() {
    if (this.db && this.db.open) {
      this.db.close();
      console.log('🔒 Database connection closed');
    }
  }

  // Execute query with automatic connection management
  executeQuery(query, params = []) {
    const db = this.getConnection();
    try {
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        // For SELECT queries, return all results
        const stmt = db.prepare(query);
        return params.length > 0 ? stmt.all(...params) : stmt.all();
      } else {
        // For INSERT, UPDATE, DELETE queries
        const stmt = db.prepare(query);
        return params.length > 0 ? stmt.run(...params) : stmt.run();
      }
    } catch (error) {
      console.error('❌ Query execution error:', error);
      throw error;
    }
  }

  // Get single row
  getOne(query, params = []) {
    const db = this.getConnection();
    try {
      const stmt = db.prepare(query);
      return params.length > 0 ? stmt.get(...params) : stmt.get();
    } catch (error) {
      console.error('❌ Query execution error:', error);
      throw error;
    }
  }

  // Check if database exists and has tables
  validateDatabase() {
    try {
      const db = this.getConnection();
      
      // Check if products table exists
      const productsTable = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='products'
      `).get();
      
      // Check if users table exists
      const usersTable = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `).get();
      
      // Get row counts
      const productCount = productsTable ? db.prepare('SELECT COUNT(*) as count FROM products').get().count : 0;
      const userCount = usersTable ? db.prepare('SELECT COUNT(*) as count FROM users').get().count : 0;
      
      return {
        isValid: !!productsTable,
        hasUsers: !!usersTable,
        productCount,
        userCount,
        tables: {
          products: !!productsTable,
          users: !!usersTable
        }
      };
    } catch (error) {
      console.error('❌ Database validation error:', error);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  // Initialize users table if not exists
  initializeUsersTable() {
    try {
      const db = this.getConnection();
      
      // Create users table
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

      console.log('✅ Users tables initialized');
      return true;
    } catch (error) {
      console.error('❌ Users table initialization error:', error);
      return false;
    }
  }

  // Create demo users
  createDemoUsers() {
    try {
      const db = this.getConnection();
      
      // Check if users already exist
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
      if (userCount > 0) {
        console.log('👥 Demo users already exist');
        return true;
      }

      // Pre-hashed password for "demo123"
      const demoPasswordHash = '$2b$10$rH8q6tKZmZrJhZvXhf8VUOmX3Qj4u9dL7ZKxTgQnPxvWc2Y6s1Mau';
      
      const insertUser = db.prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Create demo users
      insertUser.run('demo', 'demo@test.com', demoPasswordHash, 'Demo', 'User', 'user');
      insertUser.run('student1', 'student1@university.edu', demoPasswordHash, 'გიორგი', 'მამულაშვილი', 'user');
      insertUser.run('teacher', 'teacher@university.edu', demoPasswordHash, 'ლექსო', 'პედაგოგი', 'admin');
      insertUser.run('testuser', 'test@example.com', demoPasswordHash, 'Test', 'User', 'user');
      
      console.log('✅ Demo users created successfully');
      return true;
    } catch (error) {
      console.error('❌ Demo users creation error:', error);
      return false;
    }
  }
}

// Create singleton instance
const dbConfig = new DatabaseConfig();

module.exports = {
  DatabaseConfig,
  dbConfig
};