const express = require('express');
const { db } = require('../database/connection');
const router = express.Router();

// GET /api/v1/:domain/brands
router.get('/:domain/brands', (req, res) => {
  console.log('🏷️ BRANDS REQUEST HIT!', req.params, req.originalUrl);
  
  try {
    const { domain } = req.params;
    console.log('📂 Domain from params:', domain);
    
    const brands = db.prepare(`
      SELECT 
        b.*,
        COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.domain = b.domain
      WHERE b.domain = ?
      GROUP BY b.id
      ORDER BY b.name
    `).all(domain);
    
    console.log('🏷️ Brands found:', brands.length);
    console.log('🏷️ Brands data:', brands);
    
    res.json({
      success: true,
      data: brands,
      meta: {
        domain: domain,
        total_brands: brands.length
      }
    });
    
  } catch (error) {
    console.error('❌ Brands error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brands',
      message: error.message
    });
  }
});

// GET /api/v1/:domain/brands/:id
router.get('/:domain/brands/:id', (req, res) => {
  console.log('🏷️ SINGLE BRAND REQUEST HIT!', req.params);
  
  try {
    const { domain, id } = req.params;
    
    const brand = db.prepare(`
      SELECT 
        b.*,
        COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON b.id = p.brand_id AND p.domain = b.domain
      WHERE b.domain = ? AND b.id = ?
      GROUP BY b.id
    `).get(domain, id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        error: 'Brand not found',
        message: `Brand with ID ${id} not found in ${domain} domain`
      });
    }
    
    res.json({
      success: true,
      data: brand
    });
    
  } catch (error) {
    console.error('❌ Single brand error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch brand',
      message: error.message
    });
  }
});

module.exports = router;