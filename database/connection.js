const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  // Use Railway's PostgreSQL URL or fallback to SQLite locally
  connectionString: process.env.DATABASE_URL || process.env.PGDATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

let db;
let isPostgreSQL = false;

// Initialize database based on environment
async function initializeDatabase() {
  try {
    console.log('🗄️ Initializing database...');
    
    // Check if we have PostgreSQL connection string (Railway)
    if (process.env.DATABASE_URL || process.env.PGDATABASE_URL) {
      console.log('🐘 Using PostgreSQL database (Railway)');
      isPostgreSQL = true;
      
      // PostgreSQL connection
      db = new Client(dbConfig);
      await db.connect();
      console.log('✅ PostgreSQL connected successfully');
      
      // Create tables if they don't exist
      await createPostgreSQLTables();
      
    } else {
      console.log('📁 Using SQLite database (Local development)');
      isPostgreSQL = false;
      
      // SQLite fallback for local development
      const Database = require('better-sqlite3');
      const dbPath = path.join(__dirname, 'universal-api.db');
      console.log('📍 Database path:', dbPath);
      
      db = new Database(dbPath, { verbose: console.log });
      console.log('✅ SQLite database connection established');
      
      // Load schema for SQLite
      await loadSQLiteSchema();
    }
    
    console.log('✅ Database initialization complete');
    return db;
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Create PostgreSQL tables
async function createPostgreSQLTables() {
  try {
    console.log('🔧 Creating PostgreSQL tables...');
    
    // Products table
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        image_url VARCHAR(500),
        images JSONB,
        attributes JSONB,
        category_id INTEGER,
        brand_id INTEGER,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        in_stock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Categories table
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Brands table
    await db.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        logo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar_url VARCHAR(500),
        role VARCHAR(20) DEFAULT 'user',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ PostgreSQL tables created successfully');
    
    // Check if we need to seed data
    const productCount = await db.query('SELECT COUNT(*) as count FROM products');
    if (productCount.rows[0].count === '0') {
      console.log('🌱 Database is empty, seeding with sample data...');
      await seedPostgreSQLData();
    }
    
  } catch (error) {
    console.error('❌ PostgreSQL table creation failed:', error);
    throw error;
  }
}

// Load SQLite schema (for local development)
async function loadSQLiteSchema() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schema);
      console.log('✅ SQLite schema loaded');
    }
  } catch (error) {
    console.error('❌ SQLite schema loading failed:', error);
  }
}

// Seed PostgreSQL with sample data
async function seedPostgreSQLData() {
  try {
    console.log('🌱 Seeding PostgreSQL with sample data...');
    
    // Sample categories
    const categories = [
      { domain: 'movies', name: 'Action', description: 'Action movies' },
      { domain: 'movies', name: 'Comedy', description: 'Comedy movies' },
      { domain: 'movies', name: 'Drama', description: 'Drama movies' },
      { domain: 'books', name: 'Fiction', description: 'Fiction books' },
      { domain: 'books', name: 'Non-Fiction', description: 'Non-fiction books' },
      { domain: 'electronics', name: 'Laptops', description: 'Laptop computers' },
      { domain: 'electronics', name: 'Phones', description: 'Mobile phones' }
    ];
    
    for (const category of categories) {
      await db.query(
        'INSERT INTO categories (domain, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [category.domain, category.name, category.description]
      );
    }
    
    // Sample brands
    const brands = [
      { domain: 'movies', name: 'Marvel Studios', description: 'Marvel movie studio' },
      { domain: 'movies', name: 'Warner Bros', description: 'Warner Brothers studio' },
      { domain: 'electronics', name: 'Apple', description: 'Apple Inc.' },
      { domain: 'electronics', name: 'Samsung', description: 'Samsung Electronics' }
    ];
    
    for (const brand of brands) {
      await db.query(
        'INSERT INTO brands (domain, name, description) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [brand.domain, brand.name, brand.description]
      );
    }
    
    // Sample products
    const products = [
      {
        domain: 'movies',
        name: 'Avengers: Endgame',
        price: 19.99,
        image_url: 'https://picsum.photos/300/400?random=1',
        attributes: JSON.stringify({ director: 'Russo Brothers', year: 2019, genre: 'Action' }),
        category_id: 1,
        brand_id: 1,
        rating: 4.8
      },
      {
        domain: 'movies',
        name: 'The Dark Knight',
        price: 15.99,
        image_url: 'https://picsum.photos/300/400?random=2',
        attributes: JSON.stringify({ director: 'Christopher Nolan', year: 2008, genre: 'Action' }),
        category_id: 1,
        brand_id: 2,
        rating: 4.9
      },
      {
        domain: 'electronics',
        name: 'iPhone 15 Pro',
        price: 999.99,
        image_url: 'https://picsum.photos/300/400?random=3',
        attributes: JSON.stringify({ storage: '256GB', color: 'Space Black', brand: 'Apple' }),
        category_id: 7,
        brand_id: 3,
        rating: 4.7
      }
    ];
    
    for (const product of products) {
      await db.query(
        `INSERT INTO products (domain, name, price, image_url, attributes, category_id, brand_id, rating) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
        [product.domain, product.name, product.price, product.image_url, 
         product.attributes, product.category_id, product.brand_id, product.rating]
      );
    }
    
    console.log('✅ PostgreSQL data seeding complete');
    
  } catch (error) {
    console.error('❌ PostgreSQL seeding failed:', error);
  }
}

// Database query wrapper
const dbQuery = {
  // Get all records
  getAll: async (query, params = []) => {
    if (isPostgreSQL) {
      const result = await db.query(query, params);
      return result.rows;
    } else {
      return db.prepare(query).all(...params);
    }
  },
  
  // Get one record
  getOne: async (query, params = []) => {
    if (isPostgreSQL) {
      const result = await db.query(query, params);
      return result.rows[0] || null;
    } else {
      return db.prepare(query).get(...params) || null;
    }
  },
  
  // Run query (INSERT, UPDATE, DELETE)
  run: async (query, params = []) => {
    if (isPostgreSQL) {
      const result = await db.query(query, params);
      return { 
        changes: result.rowCount,
        lastInsertRowid: result.rows[0]?.id || null
      };
    } else {
      return db.prepare(query).run(...params);
    }
  }
};

module.exports = {
  initializeDatabase,
  dbConfig: dbQuery,
  getDb: () => db,
  isPostgreSQL: () => isPostgreSQL
};