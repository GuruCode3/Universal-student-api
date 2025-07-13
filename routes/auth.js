// routes/auth.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const AuthUtils = require('../utils/auth');
const { authenticateToken } = require('../middleware/auth');
const { dbConfig } = require('../utils/database');

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, first_name, last_name } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Username, email, and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = dbConfig.getOne(
      'SELECT id FROM users WHERE username = ? OR email = ?', 
      [username, email]
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'Username or email is already registered'
      });
    }
    
    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);
    
    // Insert new user
    const result = dbConfig.executeQuery(`
      INSERT INTO users (username, email, password_hash, first_name, last_name) 
      VALUES (?, ?, ?, ?, ?)
    `, [username, email, hashedPassword, first_name || null, last_name || null]);
    
    // Get created user
    const newUser = dbConfig.getOne(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?', 
      [result.lastInsertRowid]
    );
    
    // Generate JWT token
    const token = AuthUtils.generateToken(newUser);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: newUser,
        token: token,
        expires_in: '24h'
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message || 'Internal server error during registration'
    });
  }
});

// User Login - FIXED VERSION
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 LOGIN REQUEST:', { username: req.body.username });
    
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing credentials',
        message: 'Username and password are required'
      });
    }
    
    // Find user (can login with username or email) - REMOVED is_active condition
    const user = dbConfig.getOne(
      'SELECT * FROM users WHERE username = ? OR email = ?', 
      [username, username]
    );
    
    console.log('👤 USER FOUND:', user ? `Yes (${user.username})` : 'No');
    
    if (!user) {
      console.log('❌ LOGIN FAILED: User not found');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
    console.log('🔑 PASSWORD VALID:', isValidPassword ? 'Yes' : 'No');
    
    if (!isValidPassword) {
      console.log('❌ LOGIN FAILED: Invalid password');
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      });
    }
    
    // Generate JWT token
    const token = AuthUtils.generateToken(user);
    console.log('✅ LOGIN SUCCESS: Token generated');
    
    // Update last login (optional)
    try {
      dbConfig.executeQuery(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [user.id]
      );
    } catch (updateError) {
      // If updated_at column doesn't exist, just continue
      console.log('⚠️ Could not update last login time (column may not exist)');
    }
    
    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token: token,
        expires_in: '24h'
      }
    });
    
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message || 'Internal server error during login'
    });
  }
});

// Get User Profile (Protected Route)
router.get('/profile', authenticateToken, (req, res) => {
  try {
    // Get fresh user data from database
    const user = dbConfig.getOne(`
      SELECT id, username, email, first_name, last_name, avatar_url, role, created_at 
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: user
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// Update User Profile (Protected Route)
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { first_name, last_name, avatar_url } = req.body;
    
    // Update user profile - handle case where updated_at column may not exist
    try {
      dbConfig.executeQuery(`
        UPDATE users 
        SET first_name = ?, last_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [first_name || null, last_name || null, avatar_url || null, req.user.id]);
    } catch (updateError) {
      // If updated_at column doesn't exist, update without it
      dbConfig.executeQuery(`
        UPDATE users 
        SET first_name = ?, last_name = ?, avatar_url = ?
        WHERE id = ?
      `, [first_name || null, last_name || null, avatar_url || null, req.user.id]);
    }
    
    // Get updated user data
    const updatedUser = dbConfig.getOne(`
      SELECT id, username, email, first_name, last_name, avatar_url, role, created_at 
      FROM users WHERE id = ?
    `, [req.user.id]);
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
    
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// Logout (Optional - for token blacklisting)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    note: 'Please remove the token from your client storage'
  });
});

// Test endpoint to check auth setup
router.get('/test', (req, res) => {
  try {
    const validation = dbConfig.validateDatabase();
    
    res.json({
      success: true,
      message: 'Auth system is working',
      data: {
        database_status: validation,
        endpoints: [
          'POST /api/v1/auth/register',
          'POST /api/v1/auth/login',
          'GET /api/v1/auth/profile'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      message: error.message
    });
  }
});

// Get All Users (Admin Only)
router.get('/users', authenticateToken, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        message: 'This action requires administrator privileges'
      });
    }
    
    const users = dbConfig.executeQuery(`
      SELECT id, username, email, first_name, last_name, role, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: {
        users: users,
        total: users.length
      }
    });
    
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

module.exports = router;