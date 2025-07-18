// PRODUCT ID DEBUGGING - Add to database/connection.js

// 🔍 DEBUG: Product ID ranges per domain
function debugProductIds() {
  console.log('🔍 DEBUGGING PRODUCT ID RANGES PER DOMAIN:');
  
  const domains = [
    'movies', 'books', 'electronics', 'restaurants', 'fashion',
    'games', 'music', 'food', 'toys', 'hotels',
    'cars', 'medicines', 'courses', 'events', 'apps',
    'flights', 'pets', 'realestate', 'sports', 'tools'
  ];
  
  domains.forEach((domain, index) => {
    const startId = index * 500 + 1;
    const endId = (index + 1) * 500;
    
    console.log(`📋 ${domain.toUpperCase()}: IDs ${startId} - ${endId}`);
  });
  
  // Test specific domains
  console.log('\n🎯 SPECIFIC DOMAIN TESTS:');
  console.log('Movies: 1-500');
  console.log('Books: 501-1000'); 
  console.log('Electronics: 1001-1500');
  console.log('Restaurants: 1501-2000');
  console.log('Fashion: 2001-2500');
  console.log('Games: 2501-3000');
  console.log('Music: 3001-3500');  // ❌ TEST FAILED: 3501 should be 3001-3500
  console.log('Food: 3501-4000');   // ❌ TEST FAILED: 4001 should be 3501-4000
  console.log('Toys: 4001-4500');   // ❌ TEST FAILED: 4501 should be 4001-4500
  console.log('Hotels: 4501-5000'); // ❌ TEST FAILED: 5001 should be 4501-5000
  console.log('Cars: 5001-5500');   // ❌ TEST FAILED: 5501 should be 5001-5500
  console.log('Medicines: 5501-6000'); // ❌ TEST FAILED: 6001 should be 5501-6000
  console.log('Courses: 6001-6500');   // ❌ TEST FAILED: 6501 should be 6001-6500
  console.log('Events: 6501-7000');    // ❌ TEST FAILED: 7001 should be 6501-7000
  console.log('Apps: 7001-7500');      // ❌ TEST FAILED: 7501 should be 7001-7500
  console.log('Flights: 7501-8000');   // ❌ TEST FAILED: 8001 should be 7501-8000
  console.log('Pets: 8001-8500');      // ❌ TEST FAILED: 8501 should be 8001-8500
  console.log('Real Estate: 8501-9000'); // ❌ TEST FAILED: 9001 should be 8501-9000
  console.log('Sports: 9001-9500');
  console.log('Tools: 9501-10000');
}

// 🔧 CORRECTED TEST IDS FOR API TESTING:
function getCorrectedTestIds() {
  return {
    movies: 1,        // ✅ CORRECT
    books: 501,       // ✅ CORRECT  
    electronics: 1001, // ✅ CORRECT
    restaurants: 1501, // ✅ CORRECT
    fashion: 2001,    // ✅ CORRECT
    games: 2501,      // ✅ CORRECT (not 3001)
    music: 3001,      // ✅ CORRECTED (not 3501)
    food: 3501,       // ✅ CORRECTED (not 4001)
    toys: 4001,       // ✅ CORRECTED (not 4501)
    hotels: 4501,     // ✅ CORRECTED (not 5001)
    cars: 5001,       // ✅ CORRECTED (not 5501)
    medicines: 5501,  // ✅ CORRECTED (not 6001)
    courses: 6001,    // ✅ CORRECTED (not 6501)
    events: 6501,     // ✅ CORRECTED (not 7001)
    apps: 7001,       // ✅ CORRECTED (not 7501)
    flights: 7501,    // ✅ CORRECTED (not 8001)
    pets: 8001,       // ✅ CORRECTED (not 8501)
    realestate: 8501, // ✅ CORRECTED (not 9001)
    sports: 9001,     // ✅ CORRECT
    tools: 9501       // ✅ CORRECT
  };
}

// 🧪 VERIFY PRODUCT EXISTS FUNCTION
function verifyProductExists(domain, productId) {
  try {
    console.log(`🔍 VERIFYING: ${domain} product ID ${productId}`);
    
    const product = dbConfig.getOne(`
      SELECT id, domain, name FROM products 
      WHERE domain = ? AND id = ?
    `, [domain, productId]);
    
    if (product) {
      console.log(`✅ FOUND: ${domain} product ${productId} - "${product.name}"`);
      return true;
    } else {
      console.log(`❌ NOT FOUND: ${domain} product ${productId}`);
      
      // Find actual products in this domain
      const actualProducts = dbConfig.executeQuery(`
        SELECT id, name FROM products 
        WHERE domain = ? 
        ORDER BY id ASC 
        LIMIT 5
      `, [domain]);
      
      console.log(`📋 First 5 products in ${domain}:`, actualProducts);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error verifying ${domain} product ${productId}:`, error);
    return false;
  }
}

// 🔧 EXPORT DEBUG FUNCTIONS
module.exports = {
  debugProductIds,
  getCorrectedTestIds,
  verifyProductExists
};