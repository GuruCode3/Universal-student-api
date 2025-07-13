const { db } = require('./connection');

// Insert sample categories
function seedCategories() {
  const categories = [
    // Movies categories
    { domain: 'movies', name: 'Action', slug: 'action' },
    { domain: 'movies', name: 'Comedy', slug: 'comedy' },
    { domain: 'movies', name: 'Drama', slug: 'drama' },
    { domain: 'movies', name: 'Sci-Fi', slug: 'sci-fi' },
    
    // Books categories  
    { domain: 'books', name: 'Fiction', slug: 'fiction' },
    { domain: 'books', name: 'Non-Fiction', slug: 'non-fiction' },
    { domain: 'books', name: 'Mystery', slug: 'mystery' },
    { domain: 'books', name: 'Romance', slug: 'romance' }
  ];
  
  const stmt = db.prepare('INSERT INTO categories (domain, name, slug) VALUES (?, ?, ?)');
  
  categories.forEach(cat => {
    stmt.run(cat.domain, cat.name, cat.slug);
  });
  
  console.log('✅ Categories seeded');
}

// Insert sample brands
function seedBrands() {
  const brands = [
    // Movie studios
    { domain: 'movies', name: 'Warner Bros', slug: 'warner-bros' },
    { domain: 'movies', name: 'Disney', slug: 'disney' },
    { domain: 'movies', name: 'Marvel Studios', slug: 'marvel-studios' },
    
    // Book publishers
    { domain: 'books', name: 'Penguin Books', slug: 'penguin-books' },
    { domain: 'books', name: 'HarperCollins', slug: 'harpercollins' },
    { domain: 'books', name: 'Random House', slug: 'random-house' }
  ];
  
  const stmt = db.prepare('INSERT INTO brands (domain, name, slug) VALUES (?, ?, ?)');
  
  brands.forEach(brand => {
    stmt.run(brand.domain, brand.name, brand.slug);
  });
  
  console.log('✅ Brands seeded');
}

// Run seeding
function runSeeding() {
  try {
    console.log('🌱 Starting data seeding...');
    
    seedCategories();
    seedBrands();
    
    console.log('🎉 Data seeding completed!');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return false;
  }
}

module.exports = { runSeeding };