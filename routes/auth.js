// routes/auth.js - SECURITY FIXED VERSION
const express = require('express');
const AuthUtils = require('../utils/auth');
const { dbConfig } = require('../utils/database');

const router = express.Router();

console.log('🔐 Secure authentication routes loading...');

// Simple middleware
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Authorization header required'
      });
    }
    
    const token = AuthUtils.extractTokenFromHeader(authHeader);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Valid token required'
      });
    }
    
    const decoded = AuthUtils.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'Invalid or expired token'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Authentication error'
    });
  }
}

// 🚨 SECURITY FIXED LOGIN - No more authentication bypass
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Secure login request');
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username and password are required'
      });
    }

    // 🛡️ SECURITY FIX: STRICT user lookup - EXACT match required
    let user = null;
    let userFound = false;
    
    try {
      console.log('🔍 Secure database query for user:', username);
      
      if (dbConfig && dbConfig.executeQuery) {
        const users = dbConfig.executeQuery(
          'SELECT * FROM users WHERE username = ? OR email = ?',
          [username, username]
        );
        user = users.length > 0 ? users[0] : null;
        userFound = !!user;
        console.log('👤 Database query result:', userFound ? 'FOUND' : 'NOT FOUND');
      }
      
      // 🔒 CRITICAL: Only check demo users if EXACT username match
      if (!user) {
        // EXACT match for demo accounts only
        if (username === 'demo' || username === 'teacher') {
          console.log('🎭 Checking demo user credentials for:', username);
          
          const hashedPassword = await AuthUtils.hashPassword('demo123');
          user = {
            id: username === 'demo' ? 1 : 2,
            username: username, // EXACT match
            email: username === 'demo' ? 'demo@example.com' : 'teacher@example.com',
            password_hash: hashedPassword,
            first_name: username === 'demo' ? 'Demo' : 'Teacher',
            last_name: username === 'demo' ? 'User' : 'Admin',
            role: username === 'demo' ? 'user' : 'admin'
          };
          userFound = true;
          console.log('🎭 Demo user loaded for EXACT username:', username);
        } else {
          // 🚨 SECURITY: Reject any non-exact username immediately
          console.log('❌ User not found for username:', username);
        }
      }
      
    } catch (dbError) {
      console.error('❌ Database query failed:', dbError);
      
      // 🔒 EMERGENCY: Only for EXACT demo usernames with correct password
      if ((username === 'demo' || username === 'teacher') && password === 'demo123') {
        console.log('🆘 Emergency authentication for EXACT demo user:', username);
        
        const token = AuthUtils.generateToken({
          id: username === 'demo' ? 1 : 2,
          username: username, // Must be exact
          email: username === 'demo' ? 'demo@example.com' : 'teacher@example.com',
          role: username === 'demo' ? 'user' : 'admin'
        });
        
        return res.json({
          success: true,
          message: 'Login successful (emergency mode)',
          data: {
            user: {
              id: username === 'demo' ? 1 : 2,
              username: username, // Exact username returned
              email: username === 'demo' ? 'demo@example.com' : 'teacher@example.com',
              role: username === 'demo' ? 'user' : 'admin'
            },
            token,
            expires_in: '24h',
            emergency_mode: true
          }
        });
      } else {
        // 🛡️ SECURITY: Reject everything else
        console.log('❌ Emergency auth failed - invalid credentials for:', username);
      }
    }

    // 🚨 CRITICAL: If no user found, return 401 IMMEDIATELY
    if (!user || !userFound) {
      console.log('❌ Authentication failed - User not found:', username);
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password'
      });
    }

    // 🔒 Password verification ONLY for found users
    let isValidPassword = false;
    try {
      if (user.password_hash) {
        isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
      } else if ((username === 'demo' || username === 'teacher') && password === 'demo123') {
        // Demo account password check ONLY if username is exact
        isValidPassword = true;
        console.log('🎭 Demo password verified for:', username);
      }
    } catch (passwordError) {
      console.error('❌ Password verification failed:', passwordError);
      
      // Last resort ONLY for exact demo users
      if ((username === 'demo' || username === 'teacher') && password === 'demo123') {
        isValidPassword = true;
        console.log('🆘 Emergency password check for:', username);
      }
    }
    
    // 🛡️ SECURITY: If password is invalid, return 401
    if (!isValidPassword) {
      console.log('❌ Authentication failed - Invalid password for:', username);
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password'
      });
    }

    // ✅ Generate token ONLY after BOTH username AND password are verified
    const token = AuthUtils.generateToken(user);

    console.log('✅ Login successful for verified user:', user.username);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username, // This MUST match the input username
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
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Login failed: ' + error.message
    });
  }
});

// SIMPLE REGISTER - Direct database query
router.post('/register', async (req, res) => {
  try {
    console.log('📝 Simple registration request');
    const { username, email, password, first_name, last_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username, email, and password are required'
      });
    }

    // Check if user exists - DIRECT QUERY
    let existingUser = null;
    try {
      if (dbConfig && dbConfig.executeQuery) {
        const users = dbConfig.executeQuery(
          'SELECT id FROM users WHERE username = ? OR email = ?',
          [username, email]
        );
        existingUser = users.length > 0 ? users[0] : null;
      }
    } catch (checkError) {
      console.log('⚠️ Could not check existing user, proceeding...');
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Insert user - DIRECT QUERY
    let newUserId = Date.now(); // fallback ID
    try {
      if (dbConfig && dbConfig.run) {
        const result = dbConfig.run(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, role)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [username, email, hashedPassword, first_name || null, last_name || null, 'user']);
        
        if (result.lastInsertRowid) {
          newUserId = result.lastInsertRowid;
        }
      }
    } catch (insertError) {
      console.error('❌ User insertion failed:', insertError);
      return res.status(500).json({
        success: false,
        error: 'database_error',
        message: 'Failed to create user'
      });
    }

    // Create user object for token
    const newUser = {
      id: newUserId,
      username,
      email,
      first_name: first_name || null,
      last_name: last_name || null,
      role: 'user'
    };

    // Generate token
    const token = AuthUtils.generateToken(newUser);

    console.log('✅ Registration successful');
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token,
        expires_in: '24h'
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Registration failed: ' + error.message
    });
  }
});

// SIMPLE PROFILE - Mock response
router.get('/profile', authenticateToken, (req, res) => {
  try {
    console.log('👤 Profile request for user:', req.user.username);
    
    // Try to get fresh user data
    let user = null;
    try {
      if (dbConfig && dbConfig.executeQuery) {
        const users = dbConfig.executeQuery('SELECT * FROM users WHERE id = ?', [req.user.id]);
        user = users.length > 0 ? users[0] : null;
      }
    } catch (dbError) {
      console.log('⚠️ Database lookup failed, using token data');
    }
    
    // Fallback to token data
    if (!user) {
      user = {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        first_name: req.user.first_name || null,
        last_name: req.user.last_name || null,
        role: req.user.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Profile retrieval failed'
    });
  }
});

// Simple logout
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    note: 'Please remove the token from client storage'
  });
});

// Updated test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'SECURE authentication system working! ✅',
    version: '2.0.1 - Security Fixed',
    status: 'AUTHENTICATION BYPASS BUG FIXED',
    security_improvements: [
      'Strict username matching enforced',
      'No more authentication bypass vulnerability',
      'Exact credential validation required',
      'Proper 401 responses for invalid users'
    ],
    endpoints: [
      'POST /api/v1/auth/login (SECURE - exact username match only)',
      'POST /api/v1/auth/register (with direct database queries)',
      'GET /api/v1/auth/profile (requires token)',
      'POST /api/v1/auth/logout (requires token)',
      'GET /api/v1/auth/test'
    ],
    demo_accounts: {
      user: { username: 'demo', password: 'demo123' },
      admin: { username: 'teacher', password: 'demo123' }
    },
    notes: [
      'SECURITY FIX: Authentication bypass vulnerability resolved',
      'Only exact username matches are allowed',
      'Invalid usernames return proper 401 errors',
      'Emergency fallback only for exact demo accounts'
    ]
  });
});

console.log('✅ SECURE authentication routes loaded - SECURITY BUG FIXED!');

module.exports = router;