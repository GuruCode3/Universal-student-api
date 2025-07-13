const { db } = require('../database/connection');

// Categories and Brands for all domains
const DOMAIN_DATA = {
  movies: {
    categories: [
      { name: 'Action', slug: 'action' },
      { name: 'Comedy', slug: 'comedy' },
      { name: 'Drama', slug: 'drama' },
      { name: 'Sci-Fi', slug: 'sci-fi' }
    ],
    brands: [
      { name: 'Warner Bros', slug: 'warner-bros' },
      { name: 'Disney', slug: 'disney' },
      { name: 'Marvel Studios', slug: 'marvel-studios' }
    ]
  },

  books: {
    categories: [
      { name: 'Fiction', slug: 'fiction' },
      { name: 'Non-Fiction', slug: 'non-fiction' },
      { name: 'Mystery', slug: 'mystery' },
      { name: 'Romance', slug: 'romance' }
    ],
    brands: [
      { name: 'Penguin Books', slug: 'penguin-books' },
      { name: 'HarperCollins', slug: 'harpercollins' },
      { name: 'Random House', slug: 'random-house' }
    ]
  },

  restaurants: {
    categories: [
      { name: 'Fast Food', slug: 'fast-food' },
      { name: 'Fine Dining', slug: 'fine-dining' },
      { name: 'Casual Dining', slug: 'casual-dining' },
      { name: 'Takeout', slug: 'takeout' }
    ],
    brands: [
      { name: 'McDonald\'s', slug: 'mcdonalds' },
      { name: 'Starbucks', slug: 'starbucks' },
      { name: 'Subway', slug: 'subway' }
    ]
  },

  electronics: {
    categories: [
      { name: 'Smartphones', slug: 'smartphones' },
      { name: 'Laptops', slug: 'laptops' },
      { name: 'Audio', slug: 'audio' },
      { name: 'Gaming', slug: 'gaming' }
    ],
    brands: [
      { name: 'Apple', slug: 'apple' },
      { name: 'Samsung', slug: 'samsung' },
      { name: 'Sony', slug: 'sony' }
    ]
  },

  fashion: {
    categories: [
      { name: 'Clothing', slug: 'clothing' },
      { name: 'Shoes', slug: 'shoes' },
      { name: 'Accessories', slug: 'accessories' },
      { name: 'Jewelry', slug: 'jewelry' }
    ],
    brands: [
      { name: 'Nike', slug: 'nike' },
      { name: 'Adidas', slug: 'adidas' },
      { name: 'Zara', slug: 'zara' }
    ]
  }
};

function generateCategoriesAndBrands() {
  console.log('🏷️ Starting Categories & Brands generation...');
  
  // Clear existing categories and brands (optional)
  const clearChoice = process.argv.includes('--clear');
  if (clearChoice) {
    console.log('🗑️ Clearing existing categories and brands...');
    db.prepare('DELETE FROM categories').run();
    db.prepare('DELETE FROM brands').run();
    console.log('✅ Existing categories and brands cleared');
  }

  const categoryStmt = db.prepare('INSERT INTO categories (domain, name, slug) VALUES (?, ?, ?)');
  const brandStmt = db.prepare('INSERT INTO brands (domain, name, slug) VALUES (?, ?, ?)');

  let totalCategories = 0;
  let totalBrands = 0;

  Object.keys(DOMAIN_DATA).forEach(domain => {
    console.log(`\n📂 Processing ${domain} domain...`);
    
    const domainData = DOMAIN_DATA[domain];
    
    // Insert categories
    console.log(`  📋 Adding ${domainData.categories.length} categories...`);
    domainData.categories.forEach(category => {
      categoryStmt.run(domain, category.name, category.slug);
      totalCategories++;
    });
    
    // Insert brands
    console.log(`  🏷️ Adding ${domainData.brands.length} brands...`);
    domainData.brands.forEach(brand => {
      brandStmt.run(domain, brand.name, brand.slug);
      totalBrands++;
    });
    
    console.log(`✅ ${domain} completed: ${domainData.categories.length} categories, ${domainData.brands.length} brands`);
  });

  // Verification
  console.log('\n🔍 Verification:');
  Object.keys(DOMAIN_DATA).forEach(domain => {
    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories WHERE domain = ?').get(domain);
    const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands WHERE domain = ?').get(domain);
    console.log(`  ${domain}: ${categoryCount.count} categories, ${brandCount.count} brands`);
  });

  console.log(`\n🎯 Generation completed!`);
  console.log(`📊 Total: ${totalCategories} categories, ${totalBrands} brands across 5 domains`);
  
  return { totalCategories, totalBrands };
}

// Run if called directly
if (require.main === module) {
  try {
    generateCategoriesAndBrands();
    console.log('\n✅ Categories & Brands generation completed successfully!');
  } catch (error) {
    console.error('\n❌ Categories & Brands generation failed:', error);
    process.exit(1);
  }
}

module.exports = { generateCategoriesAndBrands };