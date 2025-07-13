// IN-MEMORY DATABASE UTILITIES FOR RAILWAY - COMPLETE REPLACEMENT
// No SQLite dependencies - pure JavaScript implementation
// Replaces the old SQLite-based utils/database.js

// Import the in-memory database from connection
const { dbConfig: connectionDbConfig } = require('../database/connection');

class DatabaseConfig {
  constructor() {
    this.isInMemory = true;
    console.log('🔧 DatabaseConfig initialized for in-memory operations');
  }

  // Get connection - returns null for in-memory (no actual connection needed)
  getConnection() {
    console.log('📡 Using in-memory database - no connection needed');
    return null; // In-memory doesn't need connection
  }

  // Initialize users table - already done in memory
  initializeUsersTable() {
    try {
      console.log('👥 Users table already initialized in memory');
      return true;
    } catch (error) {
      console.error('❌ Users table initialization failed:', error);
      return false;
    }
  }

  // Create demo users - already done in memory  
  createDemoUsers() {
    try {
      console.log('👤 Demo users already created in memory');
      return true;
    } catch (error) {
      console.error('❌ Demo users creation failed:', error);
      return false;
    }
  }

  // Validate database
  validateDatabase() {
    try {
      return connectionDbConfig.validateDatabase();
    } catch (error) {
      console.error('❌ Database validation failed:', error);
      return {
        isValid: false,
        productCount: 0,
        userCount: 0,
        hasUsers: false,
        tables: {}
      };
    }
  }

  // Execute query - delegate to connectionDbConfig
  executeQuery(query, params = []) {
    try {
      return connectionDbConfig.executeQuery(query, params);
    } catch (error) {
      console.error('❌ Execute query failed:', error);
      return [];
    }
  }

  // Get all records
  async getAll(query, params = []) {
    try {
      return await connectionDbConfig.getAll(query, params);
    } catch (error) {
      console.error('❌ Get all failed:', error);
      return [];
    }
  }

  // Get one record
  async getOne(query, params = []) {
    try {
      return await connectionDbConfig.getOne(query, params);
    } catch (error) {
      console.error('❌ Get one failed:', error);
      return null;
    }
  }

  // Run query
  async run(query, params = []) {
    try {
      return await connectionDbConfig.run(query, params);
    } catch (error) {
      console.error('❌ Run query failed:', error);
      return { changes: 0, lastInsertRowid: null };
    }
  }

  // Close connection
  closeConnection() {
    try {
      return connectionDbConfig.closeConnection();
    } catch (error) {
      console.error('❌ Close connection failed:', error);
      return false;
    }
  }

  // Get database stats
  getDatabaseStats() {
    try {
      const validation = this.validateDatabase();
      return {
        type: 'in-memory',
        isConnected: validation.isValid,
        tables: validation.tables,
        totalProducts: validation.productCount,
        totalUsers: validation.userCount,
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      return {
        type: 'in-memory',
        isConnected: false,
        error: error.message
      };
    }
  }

  // Vacuum database (no-op for in-memory)
  vacuumDatabase() {
    console.log('🧹 In-memory database - no vacuum needed');
    return true;
  }
}

// Create singleton instance
const dbConfigInstance = new DatabaseConfig();

module.exports = {
  DatabaseConfig,
  dbConfig: dbConfigInstance,
  getDatabaseStats: () => dbConfigInstance.getDatabaseStats(),
  vacuumDatabase: () => dbConfigInstance.vacuumDatabase()
};