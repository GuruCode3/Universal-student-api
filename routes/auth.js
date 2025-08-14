// routes/auth.js - Authentication Routes (FIXED VERSION)
const express = require('express');
const AuthUtils = require('../utils/auth');
const { dbConfig } = require('../utils/database');

const router = express.Router();

console.log('🔐 Authentication routes loading...');

// Middleware to verify JWT token
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
    console.error('❌ Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Authentication error'
    });
  }
}

// POST /api/v1/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('📝 User registration request');
    const { username, email, password, first_name, last_name } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = dbConfig.getUserByCredentials(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // Create user
    const result = dbConfig.createUser({
      username,
      email,
      password_hash: hashedPassword,
      first_name: first_name || null,
      last_name: last_name || null,
      role: 'user'
    });

    if (result.success) {
      const newUser = dbConfig.getUserById(result.userId);
      const token = AuthUtils.generateToken(newUser);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role
          },
          token,
          expires_in: '24h'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'server_error',
        message: 'Failed to create user'
      });
    }

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Internal server error'
    });
  }
});

// POST /api/v1/auth/login - Login user  
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 User login request');
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username and password are required'
      });
    }

    // Find user
    const user = dbConfig.getUserByCredentials(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'unauthorized',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = AuthUtils.generateToken(user);

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
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/auth/profile - Get user profile (protected)
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = dbConfig.getUserById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'not_found',
        message: 'User not found'
      });
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
      message: 'Internal server error'
    });
  }
});

// PUT /api/v1/auth/profile - Update user profile (protected)
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;

    const result = dbConfig.updateUser(req.user.id, {
      first_name,
      last_name,
      email
    });

    if (result.success) {
      const updatedUser = dbConfig.getUserById(req.user.id);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.role,
          updated_at: updatedUser.updated_at
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'update_failed',
        message: 'Failed to update profile'
      });
    }

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Internal server error'
    });
  }
});

// POST /api/v1/auth/logout - Logout user
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful',
    note: 'Please remove the token from client storage'
  });
});

// GET /api/v1/auth/users - Get all users (admin only)
router.get('/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'forbidden',
        message: 'Admin access required'
      });
    }

    const users = dbConfig.getAllUsers();
    
    const safeUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }));

    res.json({
      success: true,
      data: safeUsers,
      meta: {
        total_users: safeUsers.length
      }
    });

  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/auth/test - Test authentication system
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication system is working! ✅',
    version: '2.0.0',
    endpoints: [
      'POST /api/v1/auth/register',
      'POST /api/v1/auth/login',
      'GET /api/v1/auth/profile (requires token)',
      'PUT /api/v1/auth/profile (requires token)',
      'POST /api/v1/auth/logout (requires token)',
      'GET /api/v1/auth/users (admin only)',
      'GET /api/v1/auth/test'
    ],
    demo_accounts: {
      user: { username: 'demo', password: 'demo123' },
      admin: { username: 'teacher', password: 'demo123' }
    },
    usage: {
      login: {
        method: 'POST',
        url: '/api/v1/auth/login',
        body: { username: 'demo', password: 'demo123' }
      },
      auth_header: 'Authorization: Bearer <token>'
    }
  });
});

console.log('✅ Authentication routes loaded successfully');

module.exports = router;