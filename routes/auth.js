// routes/auth.js - DEBUG VERSION to identify the issue
const express = require('express');
const { dbConfig } = require('../utils/database');

const router = express.Router();

console.log('🔐 Authentication routes loading with debug...');

// Check if AuthUtils exists
let AuthUtils;
try {
  AuthUtils = require('../utils/auth');
  console.log('✅ AuthUtils loaded successfully');
} catch (error) {
  console.error('❌ Failed to load AuthUtils:', error.message);
  AuthUtils = null;
}

// Simple middleware without AuthUtils dependency
function authenticateToken(req, res, next) {
  // Simplified version for debugging
  req.user = { id: 1, username: 'demo', role: 'user' }; // Mock user for debugging
  next();
}

// POST /api/v1/auth/login - SIMPLIFIED DEBUG VERSION
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 DEBUG: Login request received');
    console.log('📋 Request body:', req.body);
    
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
      console.log('❌ DEBUG: Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username and password are required'
      });
    }

    console.log(`🔍 DEBUG: Looking for user: ${username}`);

    // Check if dbConfig methods exist
    if (!dbConfig || !dbConfig.getUserByCredentials) {
      console.error('❌ DEBUG: dbConfig.getUserByCredentials not available');
      return res.status(500).json({
        success: false,
        error: 'database_error',
        message: 'Database function not available'
      });
    }

    // Try to find user
    let user;
    try {
      user = dbConfig.getUserByCredentials(username);
      console.log('👤 DEBUG: User lookup result:', user ? 'found' : 'not found');
    } catch (dbError) {
      console.error('❌ DEBUG: Database lookup error:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'database_error',
        message: 'Database lookup failed: ' + dbError.message
      });
    }

    if (!user) {
      console.log('❌ DEBUG: User not found');
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Invalid credentials'
      });
    }

    console.log('👤 DEBUG: User found:', {
      id: user.id,
      username: user.username,
      has_password_hash: !!user.password_hash
    });

    // Check if AuthUtils is available for password comparison
    if (!AuthUtils || !AuthUtils.comparePassword) {
      console.error('❌ DEBUG: AuthUtils.comparePassword not available');
      
      // Fallback: Simple password check for demo accounts
      if ((username === 'demo' || username === 'teacher') && password === 'demo123') {
        console.log('✅ DEBUG: Demo password check passed');
        
        // Simple token generation fallback
        const simpleToken = 'demo-token-' + Date.now();
        
        return res.json({
          success: true,
          message: 'Login successful (debug mode)',
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role || 'user'
            },
            token: simpleToken,
            expires_in: '24h',
            debug_mode: true
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'unauthorized',
          message: 'Password verification not available'
        });
      }
    }

    // Try password comparison
    let isValidPassword;
    try {
      console.log('🔑 DEBUG: Attempting password comparison...');
      isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
      console.log('🔑 DEBUG: Password comparison result:', isValidPassword);
    } catch (passwordError) {
      console.error('❌ DEBUG: Password comparison error:', passwordError.message);
      return res.status(500).json({
        success: false,
        error: 'auth_error',
        message: 'Password verification failed: ' + passwordError.message
      });
    }
    
    if (!isValidPassword) {
      console.log('❌ DEBUG: Invalid password');
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Try token generation
    let token;
    try {
      console.log('🎫 DEBUG: Attempting token generation...');
      if (AuthUtils.generateToken) {
        token = AuthUtils.generateToken(user);
        console.log('🎫 DEBUG: Token generated successfully');
      } else {
        console.log('⚠️ DEBUG: AuthUtils.generateToken not available, using simple token');
        token = 'fallback-token-' + Date.now();
      }
    } catch (tokenError) {
      console.error('❌ DEBUG: Token generation error:', tokenError.message);
      return res.status(500).json({
        success: false,
        error: 'token_error',
        message: 'Token generation failed: ' + tokenError.message
      });
    }

    console.log('✅ DEBUG: Login successful');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        token,
        expires_in: '24h'
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Unexpected login error:', error);
    console.error('❌ DEBUG: Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Internal server error: ' + error.message,
      debug_info: {
        error_name: error.name,
        error_message: error.message,
        stack_preview: error.stack ? error.stack.substring(0, 200) : 'No stack'
      }
    });
  }
});

// POST /api/v1/auth/register - SIMPLIFIED DEBUG VERSION
router.post('/register', async (req, res) => {
  try {
    console.log('📝 DEBUG: Registration request received');
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username, email, and password are required'
      });
    }

    // For debugging, just return success without actually creating user
    res.status(201).json({
      success: true,
      message: 'Registration successful (debug mode)',
      data: {
        user: {
          id: 999,
          username: username,
          email: email,
          role: 'user'
        },
        token: 'debug-registration-token-' + Date.now(),
        expires_in: '24h',
        debug_mode: true
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Registration error: ' + error.message
    });
  }
});

// GET /api/v1/auth/profile - SIMPLIFIED DEBUG VERSION
router.get('/profile', authenticateToken, (req, res) => {
  try {
    console.log('👤 DEBUG: Profile request received');
    
    res.json({
      success: true,
      data: {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        role: 'user',
        debug_mode: true
      }
    });

  } catch (error) {
    console.error('❌ DEBUG: Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Profile error: ' + error.message
    });
  }
});

// GET /api/v1/auth/test - DEBUG SYSTEM STATUS
router.get('/test', (req, res) => {
  try {
    console.log('🧪 DEBUG: Test endpoint accessed');
    
    const systemStatus = {
      success: true,
      message: 'Authentication system debug information',
      debug_info: {
        authutils_available: !!AuthUtils,
        dbconfig_available: !!dbConfig,
        dbconfig_methods: dbConfig ? {
          getUserByCredentials: typeof dbConfig.getUserByCredentials,
          createUser: typeof dbConfig.createUser,
          getUserById: typeof dbConfig.getUserById
        } : 'not available',
        authutils_methods: AuthUtils ? {
          generateToken: typeof AuthUtils.generateToken,
          comparePassword: typeof AuthUtils.comparePassword,
          hashPassword: typeof AuthUtils.hashPassword
        } : 'not available',
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      quick_tests: {
        database_connection: dbConfig ? '✅ Available' : '❌ Missing',
        auth_utilities: AuthUtils ? '✅ Available' : '❌ Missing'
      }
    };

    res.json(systemStatus);

  } catch (error) {
    console.error('❌ DEBUG: Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Test error: ' + error.message
    });
  }
});

// Catch-all for other auth routes
router.use('*', (req, res) => {
  console.log(`⚠️ DEBUG: Unhandled auth route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    error: 'not_found',
    message: 'Auth endpoint not found',
    debug_info: {
      method: req.method,
      path: req.originalUrl,
      available_routes: [
        'POST /api/v1/auth/login',
        'POST /api/v1/auth/register', 
        'GET /api/v1/auth/profile',
        'GET /api/v1/auth/test'
      ]
    }
  });
});

console.log('✅ DEBUG: Authentication routes loaded');

module.exports = router;