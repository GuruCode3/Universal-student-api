// utils/auth.js - FIXED VERSION WITH BETTER TOKEN HANDLING
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret - FIXED: Better secret handling
const JWT_SECRET = process.env.JWT_SECRET || 'universal-student-api-super-secret-key-2024-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

console.log('🔐 JWT_SECRET loaded:', JWT_SECRET ? 'YES' : 'NO');
console.log('⏰ JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

// Auth utility functions
const AuthUtils = {
  // Generate JWT token for user - FIXED VERSION
  generateToken: (user) => {
    try {
      console.log('🎫 Generating JWT token for user:', user.username, 'ID:', user.id);
      
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        iat: Math.floor(Date.now() / 1000) // Issued at time
      };
      
      console.log('📋 Token payload:', payload);
      
      const token = jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'universal-student-api',
        audience: 'student-frontend-apps'
      });
      
      console.log('✅ JWT token generated successfully, length:', token.length);
      console.log('🎫 Token preview:', token.substring(0, 50) + '...');
      
      return token;
      
    } catch (error) {
      console.error('❌ JWT token generation failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        user: user
      });
      throw new Error('Token generation failed: ' + error.message);
    }
  },
  
  // Verify JWT token - FIXED VERSION
  verifyToken: (token) => {
    try {
      console.log('🔍 Verifying JWT token...');
      console.log('🎫 Token preview:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
      
      if (!token) {
        console.log('❌ No token provided for verification');
        return null;
      }
      
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'universal-student-api',
        audience: 'student-frontend-apps'
      });
      
      console.log('✅ JWT token verified successfully');
      console.log('👤 Decoded user:', {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      });
      
      return decoded;
      
    } catch (error) {
      console.error('❌ JWT token verification failed:', error.message);
      
      // Handle specific JWT errors with detailed logging
      if (error.name === 'TokenExpiredError') {
        console.log('⏰ Token expired at:', error.expiredAt);
        console.log('🕐 Current time:', new Date());
        return null;
      }
      
      if (error.name === 'JsonWebTokenError') {
        console.log('🔒 Invalid token format or signature');
        console.log('🔍 Token details:', {
          message: error.message,
          token_length: token ? token.length : 0,
          token_preview: token ? token.substring(0, 20) : 'none'
        });
        return null;
      }
      
      if (error.name === 'NotBeforeError') {
        console.log('⏰ Token not active yet');
        return null;
      }
      
      console.error('❌ Unknown JWT error:', error);
      return null;
    }
  },
  
  // Extract token from Authorization header - FIXED VERSION
  extractTokenFromHeader: (authHeader) => {
    try {
      console.log('📋 Extracting token from header...');
      console.log('📋 Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'MISSING');
      
      if (!authHeader) {
        console.log('⚠️ No authorization header provided');
        return null;
      }
      
      // Handle both "Bearer TOKEN" and "TOKEN" formats
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim(); // Remove "Bearer " prefix
        console.log('🎫 Token extracted from Bearer format, length:', token.length);
        return token;
      } else {
        // Direct token format
        const token = authHeader.trim();
        console.log('🎫 Token extracted from direct format, length:', token.length);
        return token;
      }
      
    } catch (error) {
      console.error('❌ Token extraction failed:', error);
      return null;
    }
  },
  
  // Hash password using bcrypt - FIXED VERSION
  hashPassword: async (password) => {
    try {
      console.log('🔒 Hashing password...');
      
      if (!password || password.length < 3) {
        throw new Error('Password must be at least 3 characters long');
      }
      
      console.log('🔒 Password length:', password.length);
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log('✅ Password hashed successfully');
      console.log('🔒 Hash preview:', hashedPassword.substring(0, 20) + '...');
      
      return hashedPassword;
      
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Password hashing failed: ' + error.message);
    }
  },
  
  // Compare password with hash - FIXED VERSION
  comparePassword: async (plainPassword, hashedPassword) => {
    try {
      console.log('🔑 Comparing password with hash...');
      console.log('🔑 Plain password length:', plainPassword ? plainPassword.length : 0);
      console.log('🔑 Hash preview:', hashedPassword ? hashedPassword.substring(0, 20) + '...' : 'NO HASH');
      
      if (!plainPassword || !hashedPassword) {
        console.log('⚠️ Missing password or hash for comparison');
        return false;
      }
      
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      
      console.log('🔑 Password comparison result:', isMatch ? 'MATCH ✅' : 'NO MATCH ❌');
      
      return isMatch;
      
    } catch (error) {
      console.error('❌ Password comparison failed:', error);
      return false;
    }
  },
  
  // Generate random password (for testing/demos) - ENHANCED
  generateRandomPassword: (length = 12) => {
    try {
      console.log('🎲 Generating random password...');
      
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      console.log('✅ Random password generated, length:', password.length);
      return password;
      
    } catch (error) {
      console.error('❌ Random password generation failed:', error);
      return 'defaultPassword123';
    }
  },
  
  // Decode JWT token without verification (for debugging) - ENHANCED
  decodeToken: (token) => {
    try {
      console.log('🔍 Decoding JWT token (no verification)...');
      
      if (!token) {
        console.log('❌ No token provided for decoding');
        return null;
      }
      
      const decoded = jwt.decode(token, { complete: true });
      
      if (decoded) {
        console.log('📋 Token decoded successfully');
        console.log('📋 Token header:', decoded.header);
        console.log('📋 Token payload:', decoded.payload);
        console.log('📋 Token signature present:', !!decoded.signature);
        return decoded;
      } else {
        console.log('⚠️ Token decoding failed');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Token decoding failed:', error);
      return null;
    }
  },
  
  // Check if token is expired - ENHANCED
  isTokenExpired: (token) => {
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        console.log('⚠️ Token has no expiration or invalid');
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp < currentTime;
      
      console.log('⏰ Token expiration check:', {
        current_time: currentTime,
        token_exp: decoded.exp,
        is_expired: isExpired,
        time_remaining: isExpired ? 0 : decoded.exp - currentTime
      });
      
      return isExpired;
      
    } catch (error) {
      console.error('❌ Token expiration check failed:', error);
      return true;
    }
  },
  
  // Get token expiration time - ENHANCED
  getTokenExpirationTime: (token) => {
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      const expirationTime = new Date(decoded.exp * 1000);
      console.log('⏰ Token expires at:', expirationTime);
      
      return expirationTime;
      
    } catch (error) {
      console.error('❌ Get token expiration failed:', error);
      return null;
    }
  },
  
  // Validate user role - ENHANCED
  hasRole: (user, requiredRole) => {
    try {
      console.log(`🔐 Checking if user ${user.username} has role: ${requiredRole}`);
      
      if (!user || !user.role) {
        console.log('⚠️ User or role not found');
        return false;
      }
      
      // Role hierarchy: admin > user
      const roleHierarchy = {
        'admin': 2,
        'user': 1
      };
      
      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
      
      const hasAccess = userRoleLevel >= requiredRoleLevel;
      
      console.log(`🔐 Role check result:`, {
        user_role: user.role,
        required_role: requiredRole,
        user_level: userRoleLevel,
        required_level: requiredRoleLevel,
        has_access: hasAccess
      });
      
      return hasAccess;
      
    } catch (error) {
      console.error('❌ Role validation failed:', error);
      return false;
    }
  },
  
  // Validate email format - ENHANCED
  isValidEmail: (email) => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      
      console.log(`📧 Email validation for ${email}: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
      return isValid;
      
    } catch (error) {
      console.error('❌ Email validation failed:', error);
      return false;
    }
  },
  
  // Validate username format - ENHANCED
  isValidUsername: (username) => {
    try {
      // Username rules: 3-20 characters, alphanumeric and underscore only
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      const isValid = usernameRegex.test(username);
      
      console.log(`👤 Username validation for ${username}: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
      return isValid;
      
    } catch (error) {
      console.error('❌ Username validation failed:', error);
      return false;
    }
  },
  
  // Create demo users helper - ENHANCED
  createDemoUserData: () => {
    return {
      demo_user: {
        username: 'demo',
        email: 'demo@example.com',
        password: 'demo123',
        first_name: 'Demo',
        last_name: 'User',
        role: 'user'
      },
      admin_user: {
        username: 'teacher',
        email: 'teacher@example.com',
        password: 'demo123',
        first_name: 'Teacher',
        last_name: 'Admin',
        role: 'admin'
      }
    };
  },
  
  // Debug authentication flow - NEW
  debugAuthFlow: (step, data) => {
    console.log(`🔍 AUTH DEBUG [${step}]:`, {
      timestamp: new Date().toISOString(),
      step: step,
      data: data
    });
  }
};

// Export auth utilities
module.exports = AuthUtils;