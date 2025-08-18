// routes/auth.js - COMPLETE FIXED VERSION WITH PERSISTENCE SUPPORT
const express = require('express');
const AuthUtils = require('../utils/auth');
const { dbConfig } = require('../utils/database');

const router = express.Router();

console.log('🔐 FIXED Secure authentication routes with persistence loading...');

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

// 🔐 LOGIN ENDPOINT - FIXED WITH PERSISTENCE SUPPORT
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 FIXED login request with persistence support');
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username and password are required'
      });
    }

    // 🔧 FIX: First check persistent storage for user
    const persistentUser = global.userPersistence.findUserByUsername(username);
    
    if (persistentUser) {
      console.log('🔍 Found user in persistent storage:', persistentUser.username);
      
      // Compare password with stored hash
      const isValidPassword = await AuthUtils.comparePassword(password, persistentUser.password);
      
      if (isValidPassword) {
        console.log('✅ Persistent user login successful:', persistentUser.username);
        
        // Generate token
        const token = AuthUtils.generateToken(persistentUser);
        
        return res.json({
          success: true,
          message: 'Login successful (persistent user)',
          data: {
            user: {
              id: persistentUser.id,
              username: persistentUser.username,
              email: persistentUser.email,
              first_name: persistentUser.first_name,
              last_name: persistentUser.last_name,
              role: persistentUser.role
            },
            token: token,
            expires_in: '24h'
          }
        });
      } else {
        console.log('❌ Invalid password for persistent user:', persistentUser.username);
        return res.status(401).json({
          success: false,
          error: 'invalid_credentials',
          message: 'Invalid username or password'
        });
      }
    }

    // 🔧 FIX: Fallback to hardcoded demo users if not found in persistence
    const ALLOWED_USERS = ['demo', 'teacher'];
    
    if (!ALLOWED_USERS.includes(username)) {
      console.log('🚨 SECURITY BLOCK: Username not in persistent storage or demo users:', username);
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password'
      });
    }

    // Password check for demo users
    if (password !== 'demo123') {
      console.log('🚨 SECURITY BLOCK: Invalid password for demo user:', username);
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password'
      });
    }

    // 🔒 SECURE: Only valid demo combinations get tokens
    let user = null;
    
    if (username === 'demo' && password === 'demo123') {
      user = {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        first_name: 'Demo',
        last_name: 'User',
        role: 'user'
      };
    } else if (username === 'teacher' && password === 'demo123') {
      user = {
        id: 2,
        username: 'teacher',
        email: 'teacher@example.com',
        first_name: 'Teacher',
        last_name: 'Admin',
        role: 'admin'
      };
    }

    if (!user) {
      console.log('❌ No valid demo user found for:', username);
      return res.status(401).json({
        success: false,
        error: 'invalid_credentials',
        message: 'Invalid username or password'
      });
    }

    // ✅ Generate token ONLY for validated demo users
    const token = AuthUtils.generateToken(user);

    console.log('✅ Demo user login successful:', user.username);
    res.json({
      success: true,
      message: 'Login successful (demo user)',
      data: {
        user: user,
        token: token,
        expires_in: '24h'
      }
    });

  } catch (error) {
    console.error('❌ LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Login failed: ' + error.message
    });
  }
});

// 📝 REGISTRATION ENDPOINT - COMPLETELY FIXED WITH PERSISTENCE
router.post('/register', async (req, res) => {
  try {
    console.log('📝 User registration request with persistence support');
    const { username, email, password, first_name, last_name } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Username, email, and password are required'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Invalid email format'
      });
    }

    // Password strength validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // 🔧 FIX: Check for existing users using persistence system
    const existingUserByUsername = global.userPersistence.findUserByUsername(username);
    const existingUserByEmail = global.userPersistence.findUserByUsername(email); // This function checks both username and email
    
    if (existingUserByUsername) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'Username already exists'
      });
    }

    if (existingUserByEmail && existingUserByEmail.email === email) {
      return res.status(409).json({
        success: false,
        error: 'conflict',
        message: 'Email already exists'
      });
    }

    // Hash password
    const hashedPassword = await AuthUtils.hashPassword(password);

    // 🔧 FIX: Create new user object for persistence
    const newUserForPersistence = {
      username: username,
      email: email,
      password: hashedPassword, // 🔧 FIX: Use hashed password for persistence
      first_name: first_name || null,
      last_name: last_name || null,
      role: 'user'
    };

    // 🔧 FIX: Save user using persistence system
    const savedUser = global.userPersistence.saveUser(newUserForPersistence);
    
    if (!savedUser) {
      return res.status(500).json({
        success: false,
        error: 'server_error',
        message: 'Failed to save user to persistence storage'
      });
    }

    console.log('✅ User saved to persistence storage:', savedUser.username, 'ID:', savedUser.id);

    // Generate token for immediate login (using saved user data)
    const token = AuthUtils.generateToken(savedUser);

    console.log('✅ User registration successful and persisted:', username);
    res.status(201).json({
      success: true,
      message: 'User registered successfully and saved to persistent storage',
      data: {
        user: {
          id: savedUser.id,
          username: savedUser.username,
          email: savedUser.email,
          first_name: savedUser.first_name,
          last_name: savedUser.last_name,
          role: savedUser.role,
          created_at: savedUser.created_at
        },
        token: token,
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

// 👤 PROFILE ENDPOINT - UPDATED WITH PERSISTENCE SUPPORT
router.get('/profile', authenticateToken, (req, res) => {
  try {
    // Try to get fresh user data from persistence if available
    let userProfile = req.user;
    
    if (req.user.id && global.userPersistence) {
      const freshUserData = global.userPersistence.findUserById(req.user.id);
      if (freshUserData) {
        userProfile = freshUserData;
      }
    }

    res.json({
      success: true,
      data: {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        role: userProfile.role,
        created_at: userProfile.created_at
      }
    });
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to get profile'
    });
  }
});

// 🚪 LOGOUT ENDPOINT
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// 🧪 TEST ENDPOINT - UPDATED
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'COMPLETE PERSISTENCE FIX ACTIVE! 🛡️',
    version: '3.0.0-PERSISTENCE-FIXED',
    security: 'Persistent user storage + Demo users + Strict validation',
    features: [
      'User registration with persistent storage',
      'Login checks persistent storage first',
      'Demo users still work (demo/demo123, teacher/demo123)',
      'Hashed passwords for security',
      'Auto-save to data/users.json',
      'Cross-restart user persistence'
    ],
    timestamp: new Date().toISOString(),
    persistence_status: {
      users_loaded: global.userPersistence ? global.userPersistence.getUsers().length : 0,
      system_ready: !!global.userPersistence
    }
  });
});

// 🔄 CACHE BUST ENDPOINT - UPDATED
router.get('/cache-bust', (req, res) => {
  res.json({
    success: true,
    message: 'COMPLETE PERSISTENCE FIX DEPLOYED',
    version: '3.0.0-PERSISTENCE-FIXED',
    timestamp: new Date().toISOString(),
    random: Math.random(),
    persistence_working: !!global.userPersistence
  });
});

console.log('✅ COMPLETE FIXED authentication routes loaded - User persistence working!');

module.exports = router;