// middleware/auth.js - FIXED VERSION
const AuthUtils = require('../utils/auth');
const { dbConfig } = require('../utils/database');

// Middleware to verify JWT token - FIXED
function authenticateToken(req, res, next) {
  try {
    console.log('🔐 AUTH MIDDLEWARE: Processing authentication');
    
    const authHeader = req.headers['authorization'];
    console.log('📋 AUTH HEADER:', authHeader ? 'Present' : 'Missing');
    
    const token = AuthUtils.extractTokenFromHeader(authHeader);
    console.log('🎫 TOKEN EXTRACTED:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('❌ AUTH FAILED: No token provided');
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid authorization token'
      });
    }
    
    const decoded = AuthUtils.verifyToken(token);
    console.log('🔓 TOKEN VERIFIED:', decoded ? `Yes (User ID: ${decoded.id})` : 'No');
    
    if (!decoded) {
      console.log('❌ AUTH FAILED: Invalid token');
      return res.status(403).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }
    
    // Check if user still exists - REMOVED is_active condition
    const user = dbConfig.getOne(
      'SELECT * FROM users WHERE id = ?', 
      [decoded.id]
    );
    
    console.log('👤 USER LOOKUP:', user ? `Found (${user.username})` : 'Not found');
    
    if (!user) {
      console.log('❌ AUTH FAILED: User not found in database');
      return res.status(403).json({
        success: false,
        error: 'User not found',
        message: 'Account not found'
      });
    }
    
    // Add user info to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      first_name: user.first_name,
      last_name: user.last_name
    };
    
    console.log('✅ AUTH SUCCESS: User authenticated');
    next();
    
  } catch (error) {
    console.error('❌ AUTHENTICATION ERROR:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error.message || 'Internal server error during authentication'
    });
  }
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'This action requires administrator privileges'
    });
  }
  
  next();
}

// Optional authentication (doesn't fail if no token) - FIXED
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = AuthUtils.extractTokenFromHeader(authHeader);
    
    if (token) {
      const decoded = AuthUtils.verifyToken(token);
      if (decoded) {
        // Try to get user data - REMOVED is_active condition
        try {
          const user = dbConfig.getOne(
            'SELECT * FROM users WHERE id = ?', 
            [decoded.id]
          );
          
          if (user) {
            req.user = {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role || 'user',
              first_name: user.first_name,
              last_name: user.last_name
            };
          }
        } catch (dbError) {
          // Silently fail for optional auth
          console.warn('Optional auth database error:', dbError.message);
        }
      }
    }
    
    next();
    
  } catch (error) {
    // For optional auth, we don't fail on errors
    console.warn('Optional auth error:', error.message);
    next();
  }
}

// Middleware to check user ownership or admin access
function requireOwnershipOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  const resourceUserId = parseInt(req.params.user_id || req.params.id);
  
  // Allow if user is admin or owns the resource
  if (req.user.role === 'admin' || req.user.id === resourceUserId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'You can only access your own resources'
    });
  }
}

// Rate limiting middleware (simple implementation)
const rateLimitMap = new Map();

function rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    if (!rateLimitMap.has(clientId)) {
      rateLimitMap.set(clientId, []);
    }
    
    const requests = rateLimitMap.get(clientId);
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again later.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    recentRequests.push(now);
    rateLimitMap.set(clientId, recentRequests);
    
    next();
  };
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  requireOwnershipOrAdmin,
  rateLimit
};