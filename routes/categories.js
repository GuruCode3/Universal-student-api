const express = require('express');
const { db } = require('../database/connection');
const router = express.Router();

// GET /api/v1/:domain/categories
router.get('/:domain/categories', (req, res) => {
  console.log('🔍 CATEGORIES REQUEST HIT!', req.params, req.originalUrl);
  
  try {
    const { domain } = req.params;
    console.log('📂 Domain from params:', domain);
    
    const categories = db.prepare(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.domain = c.domain
      WHERE c.domain = ?
      GROUP BY c.id
      ORDER BY c.name
    `).all(domain);
    
    console.log('📋 Categories found:', categories.length);
    console.log('📋 Categories data:', categories);
    
    res.json({
      success: true,
      data: categories,
      meta: {
        domain: domain,
        total_categories: categories.length
      }
    });
    
  } catch (error) {
    console.error('❌ Categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// GET /api/v1/:domain/categories/:id
router.get('/:domain/categories/:id', (req, res) => {
  console.log('🔍 SINGLE CATEGORY REQUEST HIT!', req.params);
  
  try {
    const { domain, id } = req.params;
    
    const category = db.prepare(`
      SELECT 
        c.*,
        COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.domain = c.domain
      WHERE c.domain = ? AND c.id = ?
      GROUP BY c.id
    `).get(domain, id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found',
        message: `Category with ID ${id} not found in ${domain} domain`
      });
    }
    
    res.json({
      success: true,
      data: category
    });
    
  } catch (error) {
    console.error('❌ Single category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category',
      message: error.message
    });
  }
});

module.exports = router;