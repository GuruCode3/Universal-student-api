// database-check.js - COMPLETE FIXED VERSION
const Database = require('better-sqlite3');

console.log('🔍 DATABASE ANALYSIS\n');
console.log('==========================================');

// Try different possible database paths
const possiblePaths = [
  './universal-api.db',
  './universal_api.db',  // underscore version
  './database/universal-api.db', 
  './database/universal_api.db',
  'universal-api.db',
  'universal_api.db'
];

let dbPath = null;
let db = null;

// Find working database
for (const path of possiblePaths) {
  try {
    console.log(`🔍 Trying: ${path}`);
    const testDb = new Database(path);
    const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    if (tables.length > 0) {
      dbPath = path;
      testDb.close();
      console.log(`✅ Found working database at: ${dbPath}\n`);
      break;
    }
    testDb.close();
    console.log(`   ❌ Empty database`);
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

if (!dbPath) {
  console.log('\n❌ No working database found at any of these paths!');
  console.log('\n🛠️ POSSIBLE SOLUTIONS:');
  console.log('  1. Check if database file exists');
  console.log('  2. Run database initialization script');
  console.log('  3. Check file permissions');
  process.exit(1);
}

// Connect to working database
db = new Database(dbPath);

try {
  console.log('==========================================');

  // 1. Check what tables exist
  console.log('📋 EXISTING TABLES:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  tables.forEach(table => console.log(`  ✅ ${table.name}`));

  console.log('\n==========================================');

  // 2. Check products count by domain
  if (tables.some(t => t.name === 'products')) {
    console.log('📊 PRODUCTS COUNT BY DOMAIN:');
    const domains = db.prepare("SELECT domain, COUNT(*) as count FROM products GROUP BY domain ORDER BY count DESC").all();
    domains.forEach(domain => console.log(`  🎯 ${domain.domain}: ${domain.count} products`));

    console.log('\n==========================================');

    // Check first 5 products in movies
    console.log('🎬 FIRST 5 MOVIES (with IDs):');
    const firstMovies = db.prepare("SELECT id, name, price FROM products WHERE domain = 'movies' LIMIT 5").all();
    if (firstMovies.length > 0) {
      firstMovies.forEach(movie => console.log(`  🎥 ID: ${movie.id}, Name: "${movie.name}", Price: $${movie.price}`));
    } else {
      console.log('  ❌ No movies found');
    }
  } else {
    console.log('❌ No products table found');
  }

  console.log('\n==========================================');

  // 3. Check users for login credentials
  if (tables.some(t => t.name === 'users')) {
    console.log('👥 USERS (for login testing):');
    const users = db.prepare("SELECT id, username, email FROM users").all();
    if (users.length > 0) {
      users.forEach(user => console.log(`  👤 ID: ${user.id}, Username: "${user.username}", Email: ${user.email}`));
      
      console.log('\n🔑 SUGGESTED LOGIN CREDENTIALS:');
      console.log('  Username: "demo" / Password: "demo123" (try this first)');
      console.log('  Username: "student1" / Password: "student123"');
      console.log('  Username: "teacher" / Password: "teacher123"');
    } else {
      console.log('  ❌ No users found');
    }
  } else {
    console.log('❌ No users table found');
  }

  console.log('\n==========================================');

  // 4. Check categories if table exists
  if (tables.some(t => t.name === 'categories')) {
    console.log('📋 CATEGORIES BY DOMAIN:');
    const categoriesCount = db.prepare("SELECT domain, COUNT(*) as count FROM categories GROUP BY domain").all();
    if (categoriesCount.length > 0) {
      categoriesCount.forEach(cat => console.log(`  📱 ${cat.domain}: ${cat.count} categories`));
    } else {
      console.log('  ❌ No categories found');
    }
  }

  console.log('\n==========================================');

  // 5. Check brands if table exists
  if (tables.some(t => t.name === 'brands')) {
    console.log('🏷️ BRANDS BY DOMAIN:');
    const brandsCount = db.prepare("SELECT domain, COUNT(*) as count FROM brands GROUP BY domain").all();
    if (brandsCount.length > 0) {
      brandsCount.forEach(brand => console.log(`  🎬 ${brand.domain}: ${brand.count} brands`));
    } else {
      console.log('  ❌ No brands found');
    }
  }

  console.log('\n==========================================');

  // 6. Total statistics
  console.log('📊 TOTAL STATISTICS:');
  
  if (tables.some(t => t.name === 'products')) {
    const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get();
    console.log(`  📦 Total Products: ${totalProducts.count}`);
  }
  
  if (tables.some(t => t.name === 'categories')) {
    const totalCategories = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    console.log(`  📋 Total Categories: ${totalCategories.count}`);
  }
  
  if (tables.some(t => t.name === 'brands')) {
    const totalBrands = db.prepare("SELECT COUNT(*) as count FROM brands").get();
    console.log(`  🏷️ Total Brands: ${totalBrands.count}`);
  }
  
  if (tables.some(t => t.name === 'users')) {
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
    console.log(`  👥 Total Users: ${totalUsers.count}`);
  }

  console.log('\n🎯 DATABASE CHECK COMPLETE!');
  console.log('\n✅ READY FOR API TESTING WITH CORRECT CREDENTIALS!');

} catch (error) {
  console.log('❌ CRITICAL DATABASE ERROR:', error.message);
} finally {
  if (db) {
    db.close();
  }
}