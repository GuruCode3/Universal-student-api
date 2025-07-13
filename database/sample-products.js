const { db } = require('./connection');

function addSampleProducts() {
  try {
    console.log('🎬 Adding sample products...');
    
    // Sample movies
    const movies = [
      {
        domain: 'movies',
        name: 'Inception',
        price: 15.99,
        image_url: 'https://picsum.photos/300/450?random=movie1',
        attributes: JSON.stringify({
          director: 'Christopher Nolan',
          year: 2010,
          genre: ['Sci-Fi', 'Thriller'],
          duration: 148,
          imdb_rating: 8.8
        }),
        category_id: 4, // Sci-Fi
        brand_id: 1, // Warner Bros
        rating: 4.8,
        review_count: 1547
      },
      {
        domain: 'movies',
        name: 'The Dark Knight',
        price: 12.99,
        image_url: 'https://picsum.photos/300/450?random=movie2',
        attributes: JSON.stringify({
          director: 'Christopher Nolan',
          year: 2008,
          genre: ['Action', 'Crime'],
          duration: 152,
          imdb_rating: 9.0
        }),
        category_id: 1, // Action
        brand_id: 1, // Warner Bros
        rating: 4.9,
        review_count: 2156
      }
    ];
    
    // Sample books
    const books = [
      {
        domain: 'books',
        name: '1984',
        price: 10.99,
        image_url: 'https://picsum.photos/240/360?random=book1',
        attributes: JSON.stringify({
          author: 'George Orwell',
          isbn: '978-0-452-28423-4',
          pages: 328,
          publisher: 'Penguin Books',
          publication_year: 1949,
          language: 'English'
        }),
        category_id: 5, // Fiction
        brand_id: 4, // Penguin Books
        rating: 4.6,
        review_count: 892
      },
      {
        domain: 'books',
        name: 'To Kill a Mockingbird',
        price: 8.99,
        image_url: 'https://picsum.photos/240/360?random=book2',
        attributes: JSON.stringify({
          author: 'Harper Lee',
          isbn: '978-0-06-112008-4',
          pages: 376,
          publisher: 'HarperCollins',
          publication_year: 1960,
          language: 'English'
        }),
        category_id: 5, // Fiction
        brand_id: 5, // HarperCollins
        rating: 4.7,
        review_count: 1234
      }
    ];
    
    const stmt = db.prepare(`
      INSERT INTO products (
        domain, name, price, image_url, attributes, 
        category_id, brand_id, rating, review_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Insert movies
    movies.forEach(movie => {
      stmt.run(
        movie.domain, movie.name, movie.price, movie.image_url,
        movie.attributes, movie.category_id, movie.brand_id,
        movie.rating, movie.review_count
      );
    });
    
    // Insert books
    books.forEach(book => {
      stmt.run(
        book.domain, book.name, book.price, book.image_url,
        book.attributes, book.category_id, book.brand_id,
        book.rating, book.review_count
      );
    });
    
    console.log('✅ Sample products added!');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to add sample products:', error);
    return false;
  }
}

module.exports = { addSampleProducts };