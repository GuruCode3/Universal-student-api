const { db } = require('../database/connection');

// Complete data templates for all 20 domains
const DOMAINS = {
  movies: {
    names: [
      'Inception', 'The Dark Knight', 'Interstellar', 'Avengers', 'Spider-Man', 'Batman',
      'Superman', 'Wonder Woman', 'Iron Man', 'Captain America', 'Thor', 'Guardians',
      'Doctor Strange', 'Black Panther', 'Ant-Man', 'Deadpool', 'X-Men', 'Wolverine'
    ],
    directors: ['Christopher Nolan', 'Marvel Studios', 'DC Films', 'Warner Bros', 'Sony Pictures'],
    genres: [['Action'], ['Comedy'], ['Drama'], ['Sci-Fi'], ['Horror'], ['Thriller']],
    priceRange: [8.99, 25.99]
  },
  
  books: {
    names: [
      '1984', 'To Kill a Mockingbird', 'The Great Gatsby', 'Harry Potter', 'The Hobbit',
      'Dune', 'Foundation', 'The Martian', 'Ready Player One', 'The Hunger Games'
    ],
    authors: ['George Orwell', 'Harper Lee', 'F. Scott Fitzgerald', 'Jane Austen', 'J.D. Salinger'],
    publishers: ['Penguin Books', 'HarperCollins', 'Random House'],
    priceRange: [5.99, 19.99]
  },

  restaurants: {
    names: [
      'The Golden Spoon', 'Pizza Corner', 'Burger House', 'Sushi Master', 'Taco Bell',
      'McDonald\'s', 'Starbucks', 'Olive Garden', 'Texas Roadhouse', 'Hard Rock Cafe'
    ],
    cuisines: ['Italian', 'Chinese', 'American', 'Mexican', 'Japanese', 'Thai'],
    priceRange: [15.99, 89.99]
  },

  electronics: {
    names: [
      'iPhone 15', 'Samsung Galaxy S24', 'MacBook Pro', 'iPad Air', 'AirPods Pro',
      'Nintendo Switch', 'PlayStation 5', 'Apple Watch', 'Echo Dot', 'Fire TV Stick'
    ],
    brands_list: ['Apple', 'Samsung', 'Sony', 'Microsoft', 'Google', 'Amazon'],
    priceRange: [29.99, 2999.99]
  },

  fashion: {
    names: [
      'Classic White T-Shirt', 'Blue Denim Jeans', 'Black Leather Jacket', 'Sports Sneakers',
      'Designer Handbag', 'Gold Watch', 'Designer Sunglasses', 'Baseball Cap', 'Cotton Socks'
    ],
    materials: ['Cotton', 'Denim', 'Leather', 'Silk', 'Wool'],
    priceRange: [9.99, 299.99]
  },

  music: {
    names: [
      'Abbey Road', 'The Dark Side of the Moon', 'Thriller', 'Back in Black',
      'Hotel California', 'Nevermind', 'Purple Rain', 'The Joshua Tree'
    ],
    artists: ['The Beatles', 'Pink Floyd', 'Michael Jackson', 'AC/DC', 'Eagles', 'Queen'],
    genres: ['Rock', 'Pop', 'Hip-Hop', 'Electronic', 'Jazz', 'Blues'],
    priceRange: [9.99, 24.99]
  },

  games: {
    names: [
      'The Legend of Zelda', 'Super Mario Odyssey', 'God of War', 'Call of Duty',
      'FIFA 24', 'Minecraft', 'Fortnite', 'Among Us', 'Cyberpunk 2077'
    ],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'],
    genres: ['Action', 'Adventure', 'RPG', 'Sports', 'Strategy', 'Racing'],
    priceRange: [4.99, 69.99]
  },

  food: {
    names: [
      'Organic Bananas', 'Fresh Bread', 'Whole Milk', 'Free-Range Eggs',
      'Salmon Fillet', 'Pasta', 'Olive Oil', 'Coffee Beans', 'Green Tea'
    ],
    categories_list: ['Fruits', 'Vegetables', 'Dairy', 'Meat', 'Grains', 'Beverages'],
    priceRange: [0.99, 49.99]
  },

  toys: {
    names: [
      'LEGO Creator Set', 'Barbie Doll', 'Hot Wheels Car', 'Nerf Blaster',
      'Monopoly Board Game', 'Action Figure', 'Teddy Bear', 'Soccer Ball'
    ],
    age_groups: ['0-2 years', '3-5 years', '6-8 years', '9-12 years', '13+ years'],
    priceRange: [4.99, 199.99]
  },

  hotels: {
    names: [
      'Grand Plaza Hotel', 'Sunset Resort', 'City Center Inn', 'Beach Paradise',
      'Downtown Marriott', 'Holiday Inn Express', 'Four Seasons', 'Ritz-Carlton'
    ],
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Parking'],
    star_ratings: [1, 2, 3, 4, 5],
    priceRange: [49.99, 499.99]
  },

  realestate: {
    names: [
      'Downtown Apartment', 'Suburban House', 'City Loft', 'Beach Condo',
      'Modern Townhouse', 'Luxury Penthouse', 'Studio Apartment', 'Family Home'
    ],
    property_types: ['Apartment', 'House', 'Condo', 'Townhouse', 'Villa'],
    priceRange: [150000, 2500000]
  },

  cars: {
    names: [
      'Toyota Camry', 'Honda Civic', 'Ford F-150', 'BMW 3 Series',
      'Tesla Model 3', 'Jeep Wrangler', 'Mercedes C-Class', 'Audi A4'
    ],
    manufacturers: ['Toyota', 'Honda', 'Ford', 'BMW', 'Tesla', 'Mercedes'],
    fuel_types: ['Gasoline', 'Hybrid', 'Electric', 'Diesel'],
    priceRange: [15000, 500000]
  },

  sports: {
    names: [
      'Basketball', 'Soccer Ball', 'Tennis Racket', 'Golf Clubs Set',
      'Running Shoes', 'Yoga Mat', 'Dumbbells', 'Exercise Bike'
    ],
    sports_types: ['Basketball', 'Soccer', 'Tennis', 'Golf', 'Running', 'Swimming'],
    priceRange: [9.99, 999.99]
  },

  medicines: {
    names: [
      'Vitamin C Tablets', 'Multivitamin', 'Omega-3 Fish Oil', 'Probiotics',
      'Pain Relief Gel', 'First Aid Kit', 'Thermometer', 'Hand Sanitizer'
    ],
    categories_list: ['Vitamins', 'Supplements', 'Pain Relief', 'First Aid'],
    priceRange: [3.99, 89.99]
  },

  fitness: {
    names: [
      'Adjustable Dumbbells', 'Resistance Bands', 'Yoga Mat Premium', 'Exercise Ball',
      'Treadmill Pro', 'Protein Powder', 'Fitness Tracker', 'Gym Gloves'
    ],
    workout_types: ['Cardio', 'Strength', 'Yoga', 'HIIT', 'CrossFit'],
    priceRange: [14.99, 2999.99]
  },

  courses: {
    names: [
      'JavaScript Complete Course', 'Python for Beginners', 'React Development',
      'Digital Marketing', 'Graphic Design', 'Photography Basics', 'Excel Advanced'
    ],
    skill_levels: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    priceRange: [19.99, 199.99]
  },

  tools: {
    names: [
      'Cordless Drill', 'Hammer Set', 'Screwdriver Kit', 'Wrench Set',
      'Measuring Tape', 'Safety Glasses', 'Socket Set', 'Circular Saw'
    ],
    tool_types: ['Hand Tools', 'Power Tools', 'Measuring', 'Safety'],
    priceRange: [5.99, 499.99]
  },

  apps: {
    names: [
      'Photo Editor Pro', 'Task Manager Plus', 'Note Taking App', 'Weather Forecast',
      'Fitness Tracker', 'Music Player Premium', 'Password Manager', 'VPN Security'
    ],
    platforms: ['iOS', 'Android', 'Web App', 'Cross-Platform'],
    app_categories: ['Productivity', 'Social', 'Entertainment', 'Utilities'],
    priceRange: [0.99, 99.99]
  },

  events: {
    names: [
      'Rock Concert', 'Jazz Festival', 'Comedy Show', 'Theater Performance',
      'Art Exhibition', 'Technology Conference', 'Sports Game', 'Wine Tasting'
    ],
    event_types: ['Concert', 'Festival', 'Workshop', 'Conference', 'Sports'],
    priceRange: [15.99, 299.99]
  },

  flights: {
    names: [
      'New York to London', 'Los Angeles to Tokyo', 'Paris to Rome', 'Miami to Barcelona',
      'Chicago to Frankfurt', 'Boston to Dublin', 'Seattle to Reykjavik', 'Atlanta to Zurich'
    ],
    airlines: ['American Airlines', 'Delta', 'United', 'Emirates', 'Lufthansa'],
    flight_classes: ['Economy', 'Premium Economy', 'Business', 'First Class'],
    priceRange: [199.99, 4999.99]
  }
};

// Get dynamic IDs from database
function getDomainIds(domain) {
  try {
    const categories = db.prepare('SELECT id FROM categories WHERE domain = ? ORDER BY id').all(domain);
    const brands = db.prepare('SELECT id FROM brands WHERE domain = ? ORDER BY id').all(domain);
    
    return {
      categories: categories.map(row => row.id),
      brands: brands.map(row => row.id)
    };
  } catch (error) {
    console.error(`❌ Error getting IDs for ${domain}:`, error.message);
    return { categories: [], brands: [] };
  }
}

// Generate random product for any domain
function generateProduct(domain, index) {
  const template = DOMAINS[domain];
  if (!template) {
    console.error(`❌ No template found for domain: ${domain}`);
    return null;
  }

  // Get dynamic IDs for this domain
  const domainIds = getDomainIds(domain);
  if (domainIds.categories.length === 0 || domainIds.brands.length === 0) {
    console.error(`❌ No categories or brands found for domain: ${domain}`);
    return null;
  }

  const name = template.names[Math.floor(Math.random() * template.names.length)];
  const price = (Math.random() * (template.priceRange[1] - template.priceRange[0]) + template.priceRange[0]).toFixed(2);
  const category_id = domainIds.categories[Math.floor(Math.random() * domainIds.categories.length)];
  const brand_id = domainIds.brands[Math.floor(Math.random() * domainIds.brands.length)];
  const rating = (Math.random() * 2 + 3).toFixed(1);
  const review_count = Math.floor(Math.random() * 2000) + 50;
  
  // Domain-specific attributes
  let attributes = {};
  
  switch(domain) {
    case 'movies':
      attributes = {
        director: template.directors[Math.floor(Math.random() * template.directors.length)],
        year: 2010 + Math.floor(Math.random() * 14),
        genre: template.genres[Math.floor(Math.random() * template.genres.length)],
        duration: 90 + Math.floor(Math.random() * 90),
        imdb_rating: (Math.random() * 3 + 6).toFixed(1)
      };
      break;
      
    case 'books':
      attributes = {
        author: template.authors[Math.floor(Math.random() * template.authors.length)],
        isbn: `978-${Math.floor(Math.random() * 9)}-${Math.floor(Math.random() * 999)}-${Math.floor(Math.random() * 99999)}-${Math.floor(Math.random() * 9)}`,
        pages: 200 + Math.floor(Math.random() * 400),
        publisher: template.publishers[Math.floor(Math.random() * template.publishers.length)],
        publication_year: 1950 + Math.floor(Math.random() * 74),
        language: 'English'
      };
      break;
      
    case 'restaurants':
      attributes = {
        cuisine: template.cuisines[Math.floor(Math.random() * template.cuisines.length)],
        address: `${100 + Math.floor(Math.random() * 9900)} Main Street, City`,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        delivery: Math.random() > 0.5,
        takeout: Math.random() > 0.3
      };
      break;
      
    case 'electronics':
      attributes = {
        brand: template.brands_list[Math.floor(Math.random() * template.brands_list.length)],
        model: `Model-${Math.floor(Math.random() * 1000)}`,
        warranty: `${1 + Math.floor(Math.random() * 3)} years`,
        color: ['Black', 'White', 'Silver', 'Gold', 'Blue'][Math.floor(Math.random() * 5)],
        storage: ['32GB', '64GB', '128GB', '256GB', '512GB'][Math.floor(Math.random() * 5)]
      };
      break;
      
    case 'fashion':
      attributes = {
        material: template.materials[Math.floor(Math.random() * template.materials.length)],
        size: ['XS', 'S', 'M', 'L', 'XL'][Math.floor(Math.random() * 5)],
        color: ['Black', 'White', 'Red', 'Blue', 'Green'][Math.floor(Math.random() * 5)],
        season: ['Spring', 'Summer', 'Fall', 'Winter'][Math.floor(Math.random() * 4)],
        gender: ['Unisex', 'Men', 'Women'][Math.floor(Math.random() * 3)]
      };
      break;

    case 'music':
      attributes = {
        artist: template.artists[Math.floor(Math.random() * template.artists.length)],
        genre: template.genres[Math.floor(Math.random() * template.genres.length)],
        year: 1960 + Math.floor(Math.random() * 64),
        duration: `${Math.floor(Math.random() * 40) + 20}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        tracks: Math.floor(Math.random() * 15) + 8
      };
      break;

    case 'games':
      attributes = {
        platform: template.platforms[Math.floor(Math.random() * template.platforms.length)],
        genre: template.genres[Math.floor(Math.random() * template.genres.length)],
        rating: ['E', 'E10+', 'T', 'M'][Math.floor(Math.random() * 4)],
        multiplayer: Math.random() > 0.5,
        release_year: 2010 + Math.floor(Math.random() * 14)
      };
      break;

    case 'food':
      attributes = {
        category: template.categories_list[Math.floor(Math.random() * template.categories_list.length)],
        organic: Math.random() > 0.7,
        gluten_free: Math.random() > 0.8,
        vegan: Math.random() > 0.85,
        weight: `${(Math.random() * 2 + 0.1).toFixed(1)} lbs`
      };
      break;

    case 'toys':
      attributes = {
        age_group: template.age_groups[Math.floor(Math.random() * template.age_groups.length)],
        educational: Math.random() > 0.6,
        safety_certified: Math.random() > 0.1,
        battery_required: Math.random() > 0.5,
        material: ['Plastic', 'Wood', 'Metal', 'Fabric'][Math.floor(Math.random() * 4)]
      };
      break;

    case 'hotels':
      attributes = {
        star_rating: template.star_ratings[Math.floor(Math.random() * template.star_ratings.length)],
        amenities: template.amenities.slice(0, Math.floor(Math.random() * 4) + 2),
        location: ['Downtown', 'Airport', 'Beach', 'Mountain'][Math.floor(Math.random() * 4)],
        rooms_available: Math.floor(Math.random() * 200) + 20,
        check_in: '3:00 PM',
        check_out: '11:00 AM'
      };
      break;

    case 'realestate':
      attributes = {
        property_type: template.property_types[Math.floor(Math.random() * template.property_types.length)],
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        square_feet: Math.floor(Math.random() * 3000) + 500,
        year_built: 1950 + Math.floor(Math.random() * 74),
        garage: Math.random() > 0.3
      };
      break;

    case 'cars':
      attributes = {
        manufacturer: template.manufacturers[Math.floor(Math.random() * template.manufacturers.length)],
        year: 2015 + Math.floor(Math.random() * 10),
        fuel_type: template.fuel_types[Math.floor(Math.random() * template.fuel_types.length)],
        mileage: Math.floor(Math.random() * 100000),
        transmission: ['Manual', 'Automatic'][Math.floor(Math.random() * 2)],
        condition: ['New', 'Used'][Math.floor(Math.random() * 2)]
      };
      break;

    case 'sports':
      attributes = {
        sport_type: template.sports_types[Math.floor(Math.random() * template.sports_types.length)],
        brand: ['Nike', 'Adidas', 'Under Armour'][Math.floor(Math.random() * 3)],
        size: ['S', 'M', 'L', 'XL'][Math.floor(Math.random() * 4)],
        professional_grade: Math.random() > 0.7
      };
      break;

    case 'medicines':
      attributes = {
        category: template.categories_list[Math.floor(Math.random() * template.categories_list.length)],
        dosage: `${Math.floor(Math.random() * 500) + 50}mg`,
        prescription_required: Math.random() > 0.8,
        expiry_date: `2025-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`
      };
      break;

    case 'fitness':
      attributes = {
        workout_type: template.workout_types[Math.floor(Math.random() * template.workout_types.length)],
        weight: `${Math.floor(Math.random() * 50) + 5} lbs`,
        adjustable: Math.random() > 0.5,
        assembly_required: Math.random() > 0.3
      };
      break;

    case 'courses':
      attributes = {
        skill_level: template.skill_levels[Math.floor(Math.random() * template.skill_levels.length)],
        duration: `${Math.floor(Math.random() * 20) + 5} hours`,
        instructor: `Dr. ${['Smith', 'Johnson', 'Williams'][Math.floor(Math.random() * 3)]}`,
        certificate: Math.random() > 0.3
      };
      break;

    case 'tools':
      attributes = {
        tool_type: template.tool_types[Math.floor(Math.random() * template.tool_types.length)],
        power_source: ['Manual', 'Battery', 'Corded'][Math.floor(Math.random() * 3)],
        material: ['Steel', 'Aluminum', 'Plastic'][Math.floor(Math.random() * 3)],
        professional_grade: Math.random() > 0.6
      };
      break;

    case 'apps':
      attributes = {
        platform: template.platforms[Math.floor(Math.random() * template.platforms.length)],
        app_category: template.app_categories[Math.floor(Math.random() * template.app_categories.length)],
        size: `${Math.floor(Math.random() * 500) + 10} MB`,
        in_app_purchases: Math.random() > 0.5
      };
      break;

    case 'events':
      attributes = {
        event_type: template.event_types[Math.floor(Math.random() * template.event_types.length)],
        duration: `${Math.floor(Math.random() * 8) + 1} hours`,
        venue: ['Stadium', 'Theater', 'Center', 'Park'][Math.floor(Math.random() * 4)],
        capacity: Math.floor(Math.random() * 5000) + 100
      };
      break;

    case 'flights':
      attributes = {
        airline: template.airlines[Math.floor(Math.random() * template.airlines.length)],
        flight_class: template.flight_classes[Math.floor(Math.random() * template.flight_classes.length)],
        duration: `${Math.floor(Math.random() * 15) + 1}h ${Math.floor(Math.random() * 60)}m`,
        stops: Math.floor(Math.random() * 3)
      };
      break;

    default:
      attributes = { domain_specific: true };
  }
  
  return {
    domain,
    name: `${name} ${index > 30 ? '#' + index : ''}`,
    price: parseFloat(price),
    image_url: `https://picsum.photos/300/400?random=${domain}${index}`,
    attributes: JSON.stringify(attributes),
    category_id,
    brand_id,
    rating: parseFloat(rating),
    review_count,
    in_stock: Math.random() > 0.1 ? 1 : 0
  };
}

// Main generation function for all 20 domains
function generateAllData() {
  console.log('🎬 Starting data generation for ALL 20 DOMAINS with DYNAMIC ID MAPPING...');
  console.log('📊 Target: 500 products per domain × 20 domains = 10,000 total products');
  
  const domains = [
    'movies', 'books', 'restaurants', 'electronics', 'fashion',
    'music', 'games', 'food', 'toys', 'hotels',
    'realestate', 'cars', 'sports', 'medicines', 'fitness',
    'courses', 'tools', 'apps', 'events', 'flights'
  ];
  
  const productsPerDomain = 500;
  
  // Clear existing products
  const clearChoice = process.argv.includes('--clear');
  if (clearChoice) {
    console.log('🗑️ Clearing existing products...');
    db.prepare('DELETE FROM products').run();
    console.log('✅ Existing products cleared');
  }
  
  const stmt = db.prepare(`
    INSERT INTO products (
      domain, name, price, image_url, attributes,
      category_id, brand_id, rating, review_count, in_stock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  let totalGenerated = 0;
  
  domains.forEach(domain => {
    console.log(`\n📦 Generating ${productsPerDomain} products for ${domain} domain...`);
    
    // Check if domain exists in database
    const domainIds = getDomainIds(domain);
    if (domainIds.categories.length === 0 || domainIds.brands.length === 0) {
      console.log(`⚠️ Skipping ${domain} - no categories or brands found in database`);
      return;
    }
    
    for (let i = 1; i <= productsPerDomain; i++) {
      const product = generateProduct(domain, i);
      if (product) {
        stmt.run(
          product.domain, product.name, product.price, product.image_url,
          product.attributes, product.category_id, product.brand_id,
          product.rating, product.review_count, product.in_stock
        );
        totalGenerated++;
      }
      
      if (i % 100 === 0) {
        console.log(`  ✅ ${i}/${productsPerDomain} ${domain} products generated`);
      }
    }
    
    console.log(`🎉 ${domain} domain completed: ${productsPerDomain} products`);
  });
  
  // Final verification
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  console.log(`\n🎯 DATA GENERATION COMPLETED!`);
  console.log(`📊 Total products in database: ${totalCount.count}`);
  console.log(`📊 Products generated this run: ${totalGenerated}`);
  
  domains.forEach(domain => {
    const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE domain = ?').get(domain);
    if (count.count > 0) {
      console.log(`   ${domain}: ${count.count} products`);
    }
  });

  return { totalProducts: totalCount.count, domains: domains.length };
}

// Run if called directly
if (require.main === module) {
  try {
    generateAllData();
    console.log('\n🎊 SUCCESS! Universal Educational API with dynamic ID mapping completed!');
  } catch (error) {
    console.error('\n❌ Generation failed:', error);
    process.exit(1);
  }
}

module.exports = { generateAllData };