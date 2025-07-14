// ===========================================
// 🔧 HEALTH ENDPOINT FIX - Add to server.js
// ===========================================

// Replace your existing health endpoint in server.js with this:

app.get('/health', (req, res) => {
  try {
    const shouldPopulate = req.query.populate === 'true';
    
    // Get current validation before population
    const validation = dbConfig.validateDatabase ? dbConfig.validateDatabase() : { 
      isValid: true, 
      productCount: 0, 
      userCount: 2, 
      tables: {} 
    };
    
    // If populate=true is requested, force populate data
    if (shouldPopulate) {
      console.log('🚀 HEALTH CHECK POPULATE TRIGGERED');
      console.log('💾 Current products before populate:', validation.productCount);
      
      // Force populate with comprehensive data
      populateInMemoryDatabase();
      
      console.log('✅ Health populate complete');
    }
    
    // Get updated validation after population
    const updatedValidation = dbConfig.validateDatabase ? dbConfig.validateDatabase() : validation;
    
    res.json({
      status: updatedValidation.isValid ? "healthy" : "degraded",
      database: updatedValidation.isValid ? "connected" : "error",
      populated: shouldPopulate,
      data: {
        total_products: updatedValidation.productCount || 0,
        total_users: updatedValidation.userCount || 0,
        tables: updatedValidation.tables || {}
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: "error",
      database: "connection_failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ===========================================
// 🔧 POPULATE FUNCTION - Add to server.js
// ===========================================

function populateInMemoryDatabase() {
  try {
    console.log('📦 FORCE POPULATING IN-MEMORY DATABASE...');
    
    // Access the global in-memory database from connection.js
    const { dbConfig } = require('./utils/database');
    
    // Generate comprehensive data for all domains
    const domains = ['movies', 'books', 'electronics', 'restaurants', 'fashion', 'games', 'music', 'food', 'toys', 'hotels'];
    
    let totalProducts = 0;
    const allProducts = [];
    
    // Generate products for each domain
    domains.forEach((domain, domainIndex) => {
      console.log(`📦 Generating ${domain} products...`);
      
      for (let i = 1; i <= 50; i++) { // 50 products per domain = 500 total
        const product = generateDomainProduct(domain, domainIndex * 100 + i);
        if (product) {
          allProducts.push(product);
          totalProducts++;
        }
      }
    });
    
    // Force update the global in-memory database
    if (global.inMemoryData) {
      global.inMemoryData.products = allProducts;
    } else {
      global.inMemoryData = {
        products: allProducts,
        categories: generateCategories(),
        brands: generateBrands(),
        users: generateUsers()
      };
    }
    
    console.log(`✅ IN-MEMORY DATABASE POPULATED!`);
    console.log(`📊 Total products: ${totalProducts}`);
    console.log(`📊 Total domains: ${domains.length}`);
    
    return { success: true, totalProducts, domains: domains.length };
    
  } catch (error) {
    console.error('❌ Populate error:', error);
    return { success: false, error: error.message };
  }
}

// ===========================================
// 🔧 GENERATE DOMAIN PRODUCT - Add to server.js
// ===========================================

function generateDomainProduct(domain, id) {
  const templates = {
    movies: {
      names: ['Avengers', 'Batman', 'Spider-Man', 'Superman', 'Wonder Woman', 'Iron Man', 'Thor', 'Captain America'],
      attributes: { director: 'Marvel Studios', year: 2023, genre: 'Action', duration: 120 }
    },
    books: {
      names: ['JavaScript Guide', 'Python Basics', 'React Handbook', 'Node.js Essentials', 'Web Development'],
      attributes: { author: 'Tech Author', pages: 300, language: 'English', isbn: '978-1234567890' }
    },
    electronics: {
      names: ['iPhone 15', 'MacBook Pro', 'iPad Air', 'Samsung Galaxy', 'Dell Laptop', 'HP Printer'],
      attributes: { brand: 'Apple', model: 'Latest', warranty: '2 years', color: 'Black' }
    },
    restaurants: {
      names: ['Pizza Palace', 'Burger House', 'Sushi Master', 'Taco Bell', 'Pasta Corner'],
      attributes: { cuisine: 'Italian', location: 'Downtown', phone: '+995-555-1234', delivery: true }
    },
    fashion: {
      names: ['Designer Shirt', 'Casual Jeans', 'Leather Jacket', 'Running Shoes', 'Baseball Cap'],
      attributes: { size: 'M', color: 'Blue', material: 'Cotton', brand: 'Fashion Co' }
    },
    games: {
      names: ['FIFA 24', 'Call of Duty', 'Minecraft', 'Fortnite', 'Among Us', 'Valorant'],
      attributes: { platform: 'PC', genre: 'Action', rating: 'T', multiplayer: true }
    },
    music: {
      names: ['Top Hits 2024', 'Rock Classics', 'Jazz Collection', 'Pop Songs', 'Country Music'],
      attributes: { artist: 'Various Artists', genre: 'Pop', year: 2024, duration: '45:30' }
    },
    food: {
      names: ['Organic Apples', 'Fresh Bread', 'Whole Milk', 'Free Range Eggs', 'Olive Oil'],
      attributes: { category: 'Fruits', organic: true, weight: '1 kg', expiry: '2024-12-31' }
    },
    toys: {
      names: ['LEGO Set', 'Barbie Doll', 'Hot Wheels', 'Teddy Bear', 'Board Game', 'Action Figure'],
      attributes: { age_group: '6-12 years', educational: true, safety_certified: true }
    },
    hotels: {
      names: ['Grand Hotel', 'City Center Inn', 'Beach Resort', 'Downtown Marriott', 'Holiday Inn'],
      attributes: { star_rating: 4, amenities: ['WiFi', 'Pool', 'Gym'], location: 'City Center' }
    }
  };
  
  const template = templates[domain];
  if (!template) return null;
  
  const nameIndex = (id - 1) % template.names.length;
  const name = template.names[nameIndex];
  const price = (Math.random() * 100 + 10).toFixed(2);
  const rating = (Math.random() * 2 + 3).toFixed(1);
  
  return {
    id: id,
    domain: domain,
    name: `${name} #${id}`,
    price: parseFloat(price),
    image_url: `https://picsum.photos/300/400?random=${id}`,
    attributes: template.attributes,
    category_id: Math.floor(Math.random() * 5) + 1,
    brand_id: Math.floor(Math.random() * 5) + 1,
    rating: parseFloat(rating),
    review_count: Math.floor(Math.random() * 500) + 50,
    in_stock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

// ===========================================
// 🔧 GENERATE HELPER DATA - Add to server.js
// ===========================================

function generateCategories() {
  const categories = [];
  const domains = ['movies', 'books', 'electronics', 'restaurants', 'fashion', 'games', 'music', 'food', 'toys', 'hotels'];
  
  domains.forEach((domain, domainIndex) => {
    for (let i = 1; i <= 5; i++) {
      categories.push({
        id: domainIndex * 5 + i,
        domain: domain,
        name: `${domain} Category ${i}`,
        description: `${domain} category description`,
        slug: `${domain}-category-${i}`
      });
    }
  });
  
  return categories;
}

function generateBrands() {
  const brands = [];
  const domains = ['movies', 'books', 'electronics', 'restaurants', 'fashion', 'games', 'music', 'food', 'toys', 'hotels'];
  
  domains.forEach((domain, domainIndex) => {
    for (let i = 1; i <= 5; i++) {
      brands.push({
        id: domainIndex * 5 + i,
        domain: domain,
        name: `${domain} Brand ${i}`,
        description: `${domain} brand description`,
        slug: `${domain}-brand-${i}`
      });
    }
  });
  
  return brands;
}

function generateUsers() {
  return [
    {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2',
      first_name: 'Demo',
      last_name: 'User',
      role: 'user',
      is_active: true
    },
    {
      id: 2,
      username: 'teacher',
      email: 'teacher@example.com',
      password_hash: '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2',
      first_name: 'Teacher',
      last_name: 'Demo',
      role: 'admin',
      is_active: true
    }
  ];
}

// ===========================================
// 🚀 USAGE INSTRUCTIONS
// ===========================================

/*
1. Add all the above functions to your server.js file
2. Git commit and push to trigger Railway redeploy
3. Test with: GET /health?populate=true
4. Verify with: GET /api/v1/movies/products
5. Expected: 50 products in movies domain, 500 total products
*/