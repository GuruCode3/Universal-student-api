// middleware/domainValidation.js - ახალი ფაილი
const VALID_DOMAINS = [
  'movies', 'books', 'electronics', 'restaurants', 'fashion',
  'cars', 'hotels', 'games', 'music', 'food', 'sports',
  'toys', 'tools', 'medicines', 'courses', 'events',
  'apps', 'flights', 'pets', 'realestate'
];

function validateDomain(req, res, next) {
  const domain = req.params.domain;
  
  console.log('🔍 Domain validation check:', domain);
  
  if (!domain) {
    return res.status(400).json({
      success: false,
      error: 'bad_request',
      message: 'Domain parameter is required'
    });
  }
  
  if (!VALID_DOMAINS.includes(domain.toLowerCase())) {
    console.log('❌ Invalid domain attempted:', domain);
    return res.status(404).json({
      success: false,
      error: 'domain_not_found',
      message: `Domain '${domain}' not found`,
      available_domains: VALID_DOMAINS,
      suggestion: 'Use one of the available domains listed above'
    });
  }
  
  console.log('✅ Domain validation passed:', domain);
  next();
}

module.exports = { validateDomain, VALID_DOMAINS };

// routes/products.js-ში ეს middleware დამატება საჭიროა:
// const { validateDomain } = require('../middleware/domainValidation');
//
// router.get('/:domain/products', validateDomain, (req, res) => {
//   // existing products logic
// });
//
// router.get('/:domain/products/:id', validateDomain, (req, res) => {
//   // existing product by ID logic  
// });
//
// router.get('/:domain/products/search', validateDomain, (req, res) => {
//   // existing search logic
// });
//
// router.get('/:domain/categories', validateDomain, (req, res) => {
//   // existing categories logic
// });
//
// router.get('/:domain/brands', validateDomain, (req, res) => {
//   // existing brands logic
// });