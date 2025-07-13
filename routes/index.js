const express = require('express');
const { rateLimit } = require('../middleware/auth');

// Import all route modules
const authRoutes = require('./auth');
const cartRoutes = require('./cart');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const brandsRoutes = require('./brands');
const productDetailsRoutes = require('./product-details');

function setupRoutes(app) {
  console.log('🛠️ Setting up all routes...');

  // Rate limiting middleware for API routes
  const apiRateLimit = rateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
  app.use('/api', apiRateLimit);

  // Mount authentication routes first
  app.use('/api/v1/auth', authRoutes);
  console.log('✅ Auth routes mounted: /api/v1/auth/*');

  // Mount cart routes (protected)
  app.use('/api/v1/cart', cartRoutes);
  console.log('✅ Cart routes mounted: /api/v1/cart/*');

  // Mount domain-specific routes
  // Order matters! More specific routes should come first
  
  // Product details routes (must come before general products routes)
  app.use('/api/v1/:domain/products', productDetailsRoutes);
  console.log('✅ Product details routes mounted: /api/v1/:domain/products/:id/*');

  // General products routes
  app.use('/api/v1/:domain', productsRoutes);
  console.log('✅ Products routes mounted: /api/v1/:domain/products');

  // Categories routes
  app.use('/api/v1/:domain', categoriesRoutes);
  console.log('✅ Categories routes mounted: /api/v1/:domain/categories');

  // Brands routes
  app.use('/api/v1/:domain', brandsRoutes);
  console.log('✅ Brands routes mounted: /api/v1/:domain/brands');

  console.log('🎉 All routes mounted successfully!');
}

// Export route setup function
module.exports = {
  setupRoutes
};