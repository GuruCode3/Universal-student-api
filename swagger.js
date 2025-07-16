const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Universal Student API',
      version: '2.0.0',
      description: `
# 🎓 Universal Student API

A comprehensive educational API with **20 domains** and **10,000+ products** designed for frontend development learning.

## 🚀 Key Features
- **20 different domains** (movies, books, electronics, etc.)
- **JWT Authentication** with demo accounts
- **Shopping cart functionality** 
- **Advanced search and filtering**
- **Rate limiting** for classroom stability
- **10x performance optimization** with indexes

## 📚 Perfect for Learning
- REST API consumption
- Authentication flows
- Error handling
- Pagination patterns
- State management

## 🎯 Demo Credentials
- Username: \`demo\` | Password: \`demo123\`
- Username: \`teacher\` | Password: \`demo123\`
      `,
      contact: {
        name: 'Educational Support',
        email: 'support@universalapi.edu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'https://universal-student-api-production.up.railway.app',
        description: 'Production Server (Railway)'
      },
      {
        url: 'http://localhost:3000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/v1/auth/login endpoint'
        }
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            domain: { type: 'string', example: 'movies' },
            name: { type: 'string', example: 'Avengers Endgame' },
            price: { type: 'number', format: 'float', example: 19.99 },
            image_url: { type: 'string', example: 'https://picsum.photos/300/400?random=1' },
            attributes: { 
              type: 'object',
              example: { director: 'Marvel Studios', year: 2023, genre: 'Action' }
            },
            category_id: { type: 'integer', example: 1 },
            brand_id: { type: 'integer', example: 1 },
            rating: { type: 'number', format: 'float', example: 4.5 },
            review_count: { type: 'integer', example: 1250 },
            in_stock: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            domain: { type: 'string', example: 'movies' },
            name: { type: 'string', example: 'Action' },
            slug: { type: 'string', example: 'action' },
            description: { type: 'string', example: 'Action movies' },
            product_count: { type: 'integer', example: 125 }
          }
        },
        Brand: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            domain: { type: 'string', example: 'movies' },
            name: { type: 'string', example: 'Marvel Studios' },
            slug: { type: 'string', example: 'marvel-studios' },
            description: { type: 'string', example: 'Marvel Studios brand' },
            product_count: { type: 'integer', example: 87 }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'demo' },
            email: { type: 'string', example: 'demo@example.com' },
            first_name: { type: 'string', example: 'Demo' },
            last_name: { type: 'string', example: 'User' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            is_active: { type: 'boolean', example: true }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'demo' },
            password: { type: 'string', example: 'demo123' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', example: 'student2' },
            email: { type: 'string', example: 'student2@example.com' },
            password: { type: 'string', example: 'password123' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string', example: 'Operation successful' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error type' },
            message: { type: 'string', example: 'Detailed error message' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            current_page: { type: 'integer', example: 1 },
            total_pages: { type: 'integer', example: 25 },
            total_products: { type: 'integer', example: 500 },
            products_per_page: { type: 'integer', example: 20 },
            has_next: { type: 'boolean', example: true },
            has_prev: { type: 'boolean', example: false },
            next_page: { type: 'integer', example: 2 },
            prev_page: { type: 'integer', nullable: true, example: null }
          }
        }
      }
    },
    tags: [
      {
        name: 'System',
        description: 'API health and status endpoints'
      },
      {
        name: 'Products',
        description: 'Product management across all 20 domains'
      },
      {
        name: 'Authentication',
        description: 'User registration, login, and profile management'
      },
      {
        name: 'Shopping Cart',
        description: 'Shopping cart functionality (requires authentication)'
      },
      {
        name: 'Categories',
        description: 'Product categories for each domain'
      },
      {
        name: 'Brands',
        description: 'Product brands for each domain'
      }
    ]
  },
  apis: ['./server.js', './routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

// Custom CSS for better styling
const customCss = `
  .swagger-ui .topbar { display: none; }
  .swagger-ui .info { margin: 20px 0; }
  .swagger-ui .info .title { color: #2c3e50; font-size: 2.5em; }
  .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
  .swagger-ui .btn.authorize { background-color: #28a745; border-color: #28a745; }
  .swagger-ui .btn.authorize:hover { background-color: #218838; border-color: #1e7e34; }
  .swagger-ui .opblock.opblock-get .opblock-summary { background: rgba(97, 175, 254, 0.1); }
  .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(73, 204, 144, 0.1); }
  .swagger-ui .opblock.opblock-put .opblock-summary { background: rgba(252, 161, 48, 0.1); }
  .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(249, 62, 62, 0.1); }
`;

const swaggerOptions = {
  customCss: customCss,
  customSiteTitle: '🎓 Universal Student API Documentation',
  customfavIcon: 'https://raw.githubusercontent.com/swagger-api/swagger-ui/master/src/img/favicon-32x32.png',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    tryItOutEnabled: true
  }
};

/**
 * @swagger
 * /:
 *   get:
 *     tags: [System]
 *     summary: Get API information
 *     description: Returns comprehensive API information including available domains, features, and demo credentials
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "🎓 Universal Student API"
 *                 version:
 *                   type: string
 *                   example: "2.0.0"
 *                 status:
 *                   type: string
 *                   example: "Running ✅"
 *                 features:
 *                   type: array
 *                   items:
 *                     type: string
 *                 domains:
 *                   type: array
 *                   items:
 *                     type: string
 *                 demo_credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       password:
 *                         type: string
 *                       role:
 *                         type: string
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check
 *     description: Returns API health status and system metrics
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 performance:
 *                   type: string
 *                   example: "optimized"
 *                 uptime:
 *                   type: number
 *                   example: 3600
 *                 memory:
 *                   type: object
 */

/**
 * @swagger
 * /api/v1/domains:
 *   get:
 *     tags: [System]
 *     summary: Get available domains
 *     description: Returns list of all available domains with example URLs
 *     responses:
 *       200:
 *         description: Domains retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         domains:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["movies", "books", "electronics"]
 *                         total:
 *                           type: integer
 *                           example: 20
 *                         example_urls:
 *                           type: object
 */

/**
 * @swagger
 * /api/v1/{domain}/products:
 *   get:
 *     tags: [Products]
 *     summary: Get products for a domain
 *     description: Retrieve paginated products for a specific domain (movies, books, electronics, etc.)
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *           enum: [movies, books, electronics, restaurants, fashion, games, music, food, toys, hotels, cars, medicines, courses, events, apps, flights, pets, realestate, sports, tools]
 *         description: Domain name
 *         example: movies
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 500
 *         description: Number of products per page
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         description: Invalid domain or parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/{domain}/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get single product
 *     description: Retrieve detailed information about a specific product including related products
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain name
 *         example: movies
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Product ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         product:
 *                           $ref: '#/components/schemas/Product'
 *                         related_products:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/{domain}/products/search:
 *   get:
 *     tags: [Products]
 *     summary: Search products
 *     description: Search and filter products within a domain
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain name
 *         example: movies
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *         example: batman
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category slug
 *         example: action
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand slug
 *         example: marvel-studios
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *         example: 10
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *         example: 50
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     search:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                         results_found:
 *                           type: integer
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       400:
 *         description: Search query required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/{domain}/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get categories for domain
 *     description: Retrieve all categories for a specific domain with product counts
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain name
 *         example: movies
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/v1/{domain}/brands:
 *   get:
 *     tags: [Brands]
 *     summary: Get brands for domain
 *     description: Retrieve all brands for a specific domain with product counts
 *     parameters:
 *       - in: path
 *         name: domain
 *         required: true
 *         schema:
 *           type: string
 *         description: Domain name
 *         example: movies
 *     responses:
 *       200:
 *         description: Brands retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Brand'
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and receive JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: User registration
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         token:
 *                           type: string
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     description: Retrieve authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     tags: [Shopping Cart]
 *     summary: Get user's shopping cart
 *     description: Retrieve all items in the authenticated user's cart
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               product:
 *                                 $ref: '#/components/schemas/Product'
 *                               quantity:
 *                                 type: integer
 *                               subtotal:
 *                                 type: number
 *                         total:
 *                           type: number
 *                         item_count:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/cart/add:
 *   post:
 *     tags: [Shopping Cart]
 *     summary: Add item to cart
 *     description: Add a product to the authenticated user's cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, domain]
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               domain:
 *                 type: string
 *                 example: "movies"
 *               quantity:
 *                 type: integer
 *                 default: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};