// utils/auth.js - JWT & Authentication Utilities for Universal Student API v2.0
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Auth utility functions
const AuthUtils = {
  // Generate JWT token for user
  generateToken: (user) => {
    try {
      console.log('🎫 Generating JWT token for user:', user.username);
      
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        iat: Math.floor(Date.now() / 1000) // Issued at time
      };
      
      const token = jwt.sign(payload, JWT_SECRET, { 
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'universal-student-api',
        audience: 'student-frontend-apps'
      });
      
      console.log('✅ JWT token generated successfully');
      return token;
      
    } catch (error) {
      console.error('❌ JWT token generation failed:', error);
      throw new Error('Token generation failed');
    }
  },
  
  // Verify JWT token
  verifyToken: (token) => {
    try {
      console.log('🔍 Verifying JWT token...');
      
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'universal-student-api',
        audience: 'student-frontend-apps'
      });
      
      console.log('✅ JWT token verified successfully for user:', decoded.username);
      return decoded;
      
    } catch (error) {
      console.error('❌ JWT token verification failed:', error.message);
      
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        console.log('⏰ Token expired at:', error.expiredAt);
        return null;
      }
      
      if (error.name === 'JsonWebTokenError') {
        console.log('🔒 Invalid token format or signature');
        return null;
      }
      
      if (error.name === 'NotBeforeError') {
        console.log('⏰ Token not active yet');
        return null;
      }
      
      return null;
    }
  },
  
  // Extract token from Authorization header
  extractTokenFromHeader: (authHeader) => {
    try {
      console.log('📋 Extracting token from header...');
      
      if (!authHeader) {
        console.log('⚠️ No authorization header provided');
        return null;
      }
      
      // Handle both "Bearer TOKEN" and "TOKEN" formats
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('🎫 Token extracted from Bearer format');
        return token;
      } else {
        // Direct token format
        console.log('🎫 Token extracted from direct format');
        return authHeader;
      }
      
    } catch (error) {
      console.error('❌ Token extraction failed:', error);
      return null;
    }
  },
  
  // Hash password using bcrypt
  hashPassword: async (password) => {
    try {
      console.log('🔒 Hashing password...');
      
      if (!password || password.length < 3) {
        throw new Error('Password must be at least 3 characters long');
      }
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log('✅ Password hashed successfully');
      return hashedPassword;
      
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Password hashing failed: ' + error.message);
    }
  },
  
  // Compare password with hash
  comparePassword: async (plainPassword, hashedPassword) => {
    try {
      console.log('🔑 Comparing password with hash...');
      
      if (!plainPassword || !hashedPassword) {
        console.log('⚠️ Missing password or hash for comparison');
        return false;
      }
      
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      
      console.log('🔑 Password comparison result:', isMatch ? 'MATCH' : 'NO MATCH');
      return isMatch;
      
    } catch (error) {
      console.error('❌ Password comparison failed:', error);
      return false;
    }
  },
  
  // Generate random password (for testing/demos)
  generateRandomPassword: (length = 12) => {
    try {
      console.log('🎲 Generating random password...');
      
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      console.log('✅ Random password generated');
      return password;
      
    } catch (error) {
      console.error('❌ Random password generation failed:', error);
      return 'defaultPassword123';
    }
  },
  
  // Decode JWT token without verification (for debugging)
  decodeToken: (token) => {
    try {
      console.log('🔍 Decoding JWT token (no verification)...');
      
      const decoded = jwt.decode(token, { complete: true });
      
      if (decoded) {
        console.log('📋 Token decoded successfully');
        console.log('📋 Token header:', decoded.header);
        console.log('📋 Token payload:', decoded.payload);
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
  
  // Check if token is expired
  isTokenExpired: (token) => {
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp < currentTime;
      
      console.log('⏰ Token expiration check:', isExpired ? 'EXPIRED' : 'VALID');
      return isExpired;
      
    } catch (error) {
      console.error('❌ Token expiration check failed:', error);
      return true;
    }
  },
  
  // Get token expiration time
  getTokenExpirationTime: (token) => {
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
      
    } catch (error) {
      console.error('❌ Get token expiration failed:', error);
      return null;
    }
  },
  
  // Validate user role
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
      
      console.log(`🔐 Role check result: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
      return hasAccess;
      
    } catch (error) {
      console.error('❌ Role validation failed:', error);
      return false;
    }
  },
  
  // Validate email format
  isValidEmail: (email) => {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(email);
      
      console.log(`📧 Email validation for ${email}: ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid;
      
    } catch (error) {
      console.error('❌ Email validation failed:', error);
      return false;
    }
  },
  
  // Validate username format
  isValidUsername: (username) => {
    try {
      // Username rules: 3-20 characters, alphanumeric and underscore only
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      const isValid = usernameRegex.test(username);
      
      console.log(`👤 Username validation for ${username}: ${isValid ? 'VALID' : 'INVALID'}`);
      return isValid;
      
    } catch (error) {
      console.error('❌ Username validation failed:', error);
      return false;
    }
  },
  
  // Create demo users helper
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
  }
};

// Export auth utilities
module.exports = AuthUtils;