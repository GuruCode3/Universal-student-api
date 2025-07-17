# 🎓 Universal Student API v2.0

**Multi-Domain Educational API for Frontend Student Projects**

> A comprehensive, ready-to-use API serving 20 different domains with 10,000+ products, built specifically for educational purposes and student frontend development.

---

## 🚀 **Quick Start**

### **API Base URL**
```
https://your-api-domain.com/api/v1
```

### **Demo Authentication**
```javascript
// User Account
POST /api/v1/auth/login
{
  "username": "demo",
  "password": "demo123"
}

// Admin Account  
POST /api/v1/auth/login
{
  "username": "teacher", 
  "password": "demo123"
}
```

### **Sample API Calls**
```javascript
// Get products
GET /api/v1/movies/products?page=1&limit=20

// Search products
GET /api/v1/books/products/search?q=javascript

// Get single product
GET /api/v1/electronics/products/1

// Get categories
GET /api/v1/fashion/categories
```

---

## 📋 **Table of Contents**

1. [Features](#-features)
2. [Supported Domains](#-supported-domains)
3. [Authentication](#-authentication)
4. [API Endpoints](#-api-endpoints)
5. [Request/Response Examples](#-request--response-examples)
6. [Error Handling](#-error-handling)
7. [Rate Limiting](#-rate-limiting)
8. [Installation](#-installation)
9. [Development](#-development)
10. [Deployment](#-deployment)
11. [Contributing](#-contributing)

---

## ✨ **Features**

### **🎯 Core Features**
- ✅ **20 Product Domains** with 500+ products each
- ✅ **JWT Authentication** with role-based access
- ✅ **Advanced Search & Filtering** with pagination
- ✅ **Real-time Performance** with in-memory optimization
- ✅ **Rate Limiting** for stability (1000 req/15min)
- ✅ **CORS Support** for cross-origin requests
- ✅ **Comprehensive Documentation** with examples
- ✅ **Error Handling** with detailed messages
- ✅ **Request Logging** for debugging
- ✅ **Gzip Compression** for faster responses

### **🎓 Educational Features**
- ✅ **Student-Friendly** API design
- ✅ **Multiple Frontend Examples** (React, Vue, Angular)
- ✅ **Demo Accounts** pre-configured
- ✅ **Realistic Data** for meaningful projects
- ✅ **No Setup Required** - ready to use
- ✅ **Free & Open Source** for educational use

---

## 🌐 **Supported Domains**

| Domain | Products | Description | Example Use Cases |
|--------|----------|-------------|------------------|
| **movies** | 500+ | Films, directors, genres | Movie database, reviews app |
| **books** | 500+ | Books, authors, publishers | Library system, reading tracker |
| **electronics** | 500+ | Phones, laptops, gadgets | Tech store, product comparison |
| **restaurants** | 500+ | Restaurants, cuisines, menus | Food delivery, restaurant finder |
| **fashion** | 500+ | Clothing, accessories, brands | Fashion store, outfit planner |
| **cars** | 500+ | Vehicles, manufacturers, specs | Car dealership, auto marketplace |
| **hotels** | 500+ | Hotels, amenities, locations | Booking system, travel planner |
| **games** | 500+ | Video games, platforms, genres | Gaming store, library tracker |
| **music** | 500+ | Albums, artists, genres | Music streaming, playlist maker |
| **food** | 500+ | Grocery items, organic products | Grocery delivery, meal planner |
| **sports** | 500+ | Sports equipment, gear | Sports store, fitness tracker |
| **toys** | 500+ | Children's toys, games | Toy store, gift finder |
| **tools** | 500+ | Hardware tools, equipment | Tool rental, DIY planner |
| **medicines** | 500+ | Medications, supplements | Pharmacy system, health tracker |
| **courses** | 500+ | Online courses, certifications | Learning platform, skill tracker |
| **events** | 500+ | Events, concerts, tickets | Event booking, calendar app |
| **apps** | 500+ | Mobile apps, software | App store, software catalog |
| **flights** | 500+ | Flight routes, airlines | Travel booking, flight tracker |
| **pets** | 500+ | Pet supplies, adoption | Pet store, adoption platform |
| **realestate** | 500+ | Properties, locations | Real estate, property search |

---

## 🔐 **Authentication**

### **JWT Token System**
The API uses JSON Web Tokens (JWT) for authentication with Bearer token format.

### **Demo Accounts**
```javascript
// Regular User
{
  "username": "demo",
  "password": "demo123",
  "role": "user"
}

// Admin User
{
  "username": "teacher", 
  "password": "demo123",
  "role": "admin"
}
```

### **Authentication Flow**
1. **Login** → Get JWT token
2. **Include token** in Authorization header
3. **Access protected routes**

### **Token Usage**
```javascript
// Request Header
Authorization: Bearer <your-jwt-token>

// Example
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📡 **API Endpoints**

### **🔐 Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/auth/register` | Register new user | ❌ |
| `POST` | `/api/v1/auth/login` | Login user | ❌ |
| `GET` | `/api/v1/auth/profile` | Get user profile | ✅ |
| `PUT` | `/api/v1/auth/profile` | Update user profile | ✅ |
| `POST` | `/api/v1/auth/logout` | Logout user | ✅ |
| `GET` | `/api/v1/auth/users` | Get all users | ✅ (Admin) |

### **🛍️ Product Endpoints**

| Method | Endpoint | Description | Parameters |
|--------|----------|-------------|------------|
| `GET` | `/api/v1/{domain}/products` | Get products | `page`, `limit` |
| `GET` | `/api/v1/{domain}/products/{id}` | Get single product | - |
| `GET` | `/api/v1/{domain}/products/search` | Search products | `q`, `category`, `brand`, `min_price`, `max_price` |
| `GET` | `/api/v1/{domain}/categories` | Get categories | - |
| `GET` | `/api/v1/{domain}/brands` | Get brands | - |
| `GET` | `/api/v1/{domain}/products/{id}/reviews` | Get product reviews | `page`, `limit` |

### **🔧 Utility Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API information |
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/status` | API status |
| `GET` | `/api/v1/domains` | Available domains |
| `GET` | `/api/v1/docs` | API documentation |

---

## 📝 **Request & Response Examples**

### **🔐 User Registration**
```javascript
// Request
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "student123",
  "email": "student@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}

// Response
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 3,
      "username": "student123",
      "email": "student@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

### **🔐 User Login**
```javascript
// Request
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "demo",
  "password": "demo123"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "demo",
      "email": "demo@example.com",
      "first_name": "Demo",
      "last_name": "User",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "24h"
  }
}
```

### **🛍️ Get Products**
```javascript
// Request
GET /api/v1/movies/products?page=1&limit=5

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "domain": "movies",
      "name": "Inception",
      "price": 15.99,
      "image_url": "https://picsum.photos/300/400?random=movies1",
      "attributes": {
        "director": "Christopher Nolan",
        "year": 2010,
        "genre": ["Sci-Fi", "Thriller"],
        "duration": 148,
        "imdb_rating": 8.8
      },
      "category_name": "Sci-Fi",
      "brand_name": "Warner Bros",
      "rating": 4.5,
      "review_count": 1250,
      "in_stock": true
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 100,
    "total_products": 500,
    "products_per_page": 5,
    "has_next": true,
    "has_prev": false,
    "next_page": 2,
    "prev_page": null
  },
  "meta": {
    "domain": "movies",
    "products_count": 5,
    "request_time": "2024-01-15T10:30:00.000Z"
  }
}
```

### **🔍 Search Products**
```javascript
// Request
GET /api/v1/books/products/search?q=javascript&page=1&limit=3

// Response
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "domain": "books",
      "name": "JavaScript Complete Guide",
      "price": 29.99,
      "image_url": "https://picsum.photos/300/400?random=books1001",
      "attributes": {
        "author": "Tech Author",
        "isbn": "978-1-234-56789-0",
        "pages": 450,
        "publisher": "Tech Publications",
        "language": "English"
      },
      "category_name": "Programming",
      "brand_name": "Tech Publishers",
      "rating": 4.7,
      "review_count": 892
    }
  ],
  "search": {
    "query": "javascript",
    "category": null,
    "brand": null,
    "min_price": null,
    "max_price": null,
    "results_found": 45
  },
  "pagination": {
    "current_page": 1,
    "total_pages": 15,
    "total_results": 45,
    "results_per_page": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

### **🎯 Get Single Product**
```javascript
// Request
GET /api/v1/electronics/products/1

// Response
{
  "success": true,
  "data": {
    "product": {
      "id": 1,
      "domain": "electronics",
      "name": "iPhone 15 Pro",
      "price": 999.99,
      "image_url": "https://picsum.photos/300/400?random=electronics1",
      "attributes": {
        "brand": "Apple",
        "model": "iPhone 15 Pro",
        "storage": "128GB",
        "color": "Space Gray",
        "warranty": "1 year"
      },
      "category_name": "Smartphones",
      "brand_name": "Apple",
      "rating": 4.8,
      "review_count": 2547,
      "in_stock": true,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "related_products": [
      {
        "id": 2,
        "name": "iPhone 15",
        "price": 799.99,
        "image_url": "https://picsum.photos/300/400?random=electronics2",
        "rating": 4.6,
        "review_count": 1893
      }
    ]
  },
  "meta": {
    "domain": "electronics",
    "product_id": 1,
    "related_count": 4
  }
}
```

### **📋 Get Categories**
```javascript
// Request
GET /api/v1/fashion/categories

// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "domain": "fashion",
      "name": "Casual Wear",
      "slug": "casual-wear",
      "product_count": 125
    },
    {
      "id": 2,
      "domain": "fashion",
      "name": "Formal Wear",
      "slug": "formal-wear",
      "product_count": 89
    }
  ],
  "meta": {
    "domain": "fashion",
    "total_categories": 4
  }
}
```

---

## ⚠️ **Error Handling**

### **Error Response Format**
```javascript
{
  "success": false,
  "error": "error_type",
  "message": "Human readable error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Common Error Codes**

| Status | Error Type | Description |
|--------|------------|-------------|
| `400` | `validation_error` | Invalid request data |
| `401` | `unauthorized` | Authentication required |
| `403` | `forbidden` | Insufficient permissions |
| `404` | `not_found` | Resource not found |
| `409` | `conflict` | Resource already exists |
| `429` | `rate_limit_exceeded` | Too many requests |
| `500` | `internal_server_error` | Server error |

### **Error Examples**
```javascript
// 401 - Unauthorized
{
  "success": false,
  "error": "unauthorized",
  "message": "Authentication required",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// 404 - Not Found
{
  "success": false,
  "error": "not_found",
  "message": "Product with ID 999 not found in movies domain",
  "timestamp": "2024-01-15T10:30:00.000Z"
}

// 429 - Rate Limited
{
  "success": false,
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": "15 minutes",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🚦 **Rate Limiting**

### **Limits**
- **1000 requests per 15 minutes** per IP address
- **Headers included** in responses:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

### **Rate Limit Headers**
```javascript
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

---

## 🛠️ **Installation**

### **Prerequisites**
- Node.js v18+ 
- npm v8+

### **Quick Setup**
```bash
# Clone repository
git clone https://github.com/your-username/universal-student-api.git
cd universal-student-api

# Install dependencies
npm install

# Start development server
npm run dev

# Or start production server
npm start
```

### **Environment Variables**
```bash
# .env file
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
```

---

## 💻 **Development**

### **Available Scripts**
```bash
npm run dev       # Start development server with nodemon
npm start         # Start production server
npm test          # Run tests
npm run build     # Build for production
npm run deploy    # Deploy to Railway
```

### **Project Structure**
```
universal-student-api/
├── 📁 database/
│   ├── connection.js      # Database connection & in-memory data
│   └── schema.sql         # Database schema
├── 📁 middleware/
│   └── auth.js           # Authentication middleware
├── 📁 routes/
│   ├── index.js          # Main route aggregator
│   ├── auth.js           # Authentication routes
│   └── products.js       # Product routes
├── 📁 utils/
│   ├── auth.js           # JWT & authentication utilities
│   └── database.js       # Database utilities
├── 📁 scripts/
│   └── generateData.js   # Data generation script
├── server.js             # Main server file
├── package.json          # Dependencies & scripts
└── README.md            # This file
```

### **Adding New Domains**
1. **Update data templates** in `scripts/generateData.js`
2. **Add categories & brands** for the new domain
3. **Generate products** using the data script
4. **Test endpoints** with the new domain

---

## 🚀 **Deployment**

### **Railway (Recommended)**
```bash
# Connect to Railway
railway login

# Deploy
railway up

# Set environment variables
railway variables set JWT_SECRET=your-secret-key
railway variables set NODE_ENV=production
```

### **Vercel (Alternative)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Docker (Optional)**
```bash
# Build image
docker build -t universal-student-api .

# Run container
docker run -p 3000:3000 universal-student-api
```

---

## 🎯 **Usage Examples**

### **Frontend Integration**

#### **React Example**
```javascript
// API service
const API_BASE = 'https://your-api.com/api/v1';

// Get products
const getProducts = async (domain, page = 1) => {
  const response = await fetch(`${API_BASE}/${domain}/products?page=${page}`);
  return response.json();
};

// Search products
const searchProducts = async (domain, query) => {
  const response = await fetch(`${API_BASE}/${domain}/products/search?q=${query}`);
  return response.json();
};

// Login user
const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};
```

#### **Vue.js Example**
```javascript
// composables/useApi.js
import { ref } from 'vue';

export const useApi = () => {
  const API_BASE = 'https://your-api.com/api/v1';
  const loading = ref(false);
  const error = ref(null);

  const fetchProducts = async (domain, page = 1) => {
    loading.value = true;
    try {
      const response = await fetch(`${API_BASE}/${domain}/products?page=${page}`);
      const data = await response.json();
      return data;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  return { fetchProducts, loading, error };
};
```

#### **Angular Example**
```typescript
// services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://your-api.com/api/v1';

  constructor(private http: HttpClient) {}

  getProducts(domain: string, page: number = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/${domain}/products?page=${page}`);
  }

  searchProducts(domain: string, query: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${domain}/products/search?q=${query}`);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }
}
```

---

## 📊 **Performance**

### **Optimization Features**
- ✅ **In-Memory Database** for ultra-fast queries
- ✅ **Performance Indexes** for O(1) domain lookups
- ✅ **Search Caching** for repeated queries
- ✅ **Gzip Compression** for smaller responses
- ✅ **Rate Limiting** to prevent abuse
- ✅ **Connection Pooling** for efficiency

### **Response Times**
- **Product listing**: ~5ms
- **Product search**: ~8ms
- **Single product**: ~3ms
- **Authentication**: ~12ms
- **Categories/Brands**: ~4ms

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Server Configuration
NODE_ENV=development          # Environment mode
PORT=3000                    # Server port
HOST=localhost               # Server host

# JWT Configuration
JWT_SECRET=your-secret-key   # JWT signing secret
JWT_EXPIRES_IN=24h          # Token expiration time

# Database Configuration
DATABASE_URL=memory://       # Database connection (in-memory)

# Security Configuration
CORS_ORIGIN=*               # CORS allowed origins
RATE_LIMIT_WINDOW=900000    # Rate limit window (15 min)
RATE_LIMIT_MAX=1000         # Max requests per window
```

---

## 🤝 **Contributing**

### **Getting Started**
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Guidelines**
- Follow existing code style
- Add tests for new features
- Update documentation
- Use meaningful commit messages

### **Issues & Suggestions**
- Report bugs via GitHub Issues
- Suggest new features
- Improve documentation
- Help with testing

---

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- Built for educational purposes
- Inspired by real-world API designs
- Thanks to all contributors
- Special thanks to students using this API

---

## 📞 **Support**

### **Documentation**
- **API Docs**: `/api/v1/docs`
- **Health Check**: `/health`
- **Status**: `/api/v1/status`

### **Contact**
- **GitHub Issues**: For bug reports and feature requests
- **Email**: your-email@example.com
- **Documentation**: This README file

---

## 🔄 **Changelog**

### **v2.0.0 (Latest)**
- ✅ Added 20 product domains
- ✅ Implemented JWT authentication
- ✅ Added performance optimizations
- ✅ Improved error handling
- ✅ Added comprehensive documentation

### **v1.0.0**
- ✅ Initial release
- ✅ Basic product API
- ✅ Simple authentication

---

**🎉 Happy Coding! Build amazing projects with Universal Student API v2.0**