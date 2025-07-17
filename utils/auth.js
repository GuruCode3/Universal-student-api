// utils/auth.js - JWT Authentication Utilities
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthUtils {
  
  // Hash password with bcrypt
  static async hashPassword(password) {
    try {
      console.log('🔐 Hashing password...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('✅ Password hashed successfully');
      return hashedPassword;
    } catch (error) {
      console.error('❌ Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }
  
  // Compare password with hash
  static async comparePassword(password, hash) {
    try {
      console.log('🔍 Comparing password...');
      const isValid = await bcrypt.compare(password, hash);
      console.log('🔑 Password comparison result:', isValid ? 'Valid' : 'Invalid');
      return isValid;
    } catch (error) {
      console.error('❌ Password comparison failed:', error);
      return false;
    }
  }
  
  // Generate JWT token
  static generateToken(user) {
    try {
      console.log(`🎫 Generating JWT token for user: ${user.username}`);
      
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      };
      
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'universal-student-api',
        audience: 'student-frontend'
      });
      
      console.log('✅ JWT token generated successfully');
      return token;
      
    } catch (error) {
      console.error('❌ JWT token generation failed:', error);
      throw new Error('Token generation failed');
    }
  }
  
  // Verify JWT token
  static verifyToken(token) {
    try {
      console.log('🔓 Verifying JWT token...');
      
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'universal-student-api',
        audience: 'student-frontend'
      });
      
      console.log('✅ JWT token verified successfully');
      return decoded;
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('⏰ JWT token expired');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('❌ JWT token invalid');
      } else {
        console.error('❌ JWT verification error:', error);
      }
      return null;
    }
  }
  
  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader) {
    try {
      if (!authHeader) {
        console.log('⚠️ No authorization header provided');
        return null;
      }
      
      if (!authHeader.startsWith('Bearer ')) {
        console.log('⚠️ Authorization header format invalid (missing Bearer)');
        return null;
      }
      
      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      
      if (!token || token.length < 10) {
        console.log('⚠️ Token too short or empty');
        return null;
      }
      
      console.log('✅ Token extracted from header');
      return token;
      
    } catch (error) {
      console.error('❌ Token extraction failed:', error);
      return null;
    }
  }
  
  // Generate a secure random password (for demo users)
  static generateSecurePassword(length = 12) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }
  
  // Validate password strength
  static validatePassword(password) {
    const errors = [];
    
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
    
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }
    
    if (!/[0-9]/.test(password) && password.length < 8) {
      errors.push('Password must contain at least one number or be 8+ characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
  
  // Create demo user credentials
  static createDemoCredentials() {
    return {
      demo: {
        username: 'demo',
        password: 'demo123',
        email: 'demo@example.com',
        role: 'user',
        first_name: 'Demo',
        last_name: 'Student'
      },
      teacher: {
        username: 'teacher',
        password: 'demo123',
        email: 'teacher@example.com',
        role: 'admin',
        first_name: 'Teacher',
        last_name: 'Demo'
      }
    };
  }
  
  // Check if user has permission for action
  static hasPermission(user, action, resource = null) {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin') return true;
    
    // Define permission rules
    const permissions = {
      'user': {
        'read': ['products', 'categories', 'brands', 'profile'],
        'write': ['profile'],
        'delete': []
      },
      'admin': {
        'read': ['*'],
        'write': ['*'],
        'delete': ['*']
      }
    };
    
    const userPermissions = permissions[user.role] || permissions['user'];
    const allowedResources = userPermissions[action] || [];
    
    return allowedResources.includes('*') || allowedResources.includes(resource);
  }
}

module.exports = AuthUtils;