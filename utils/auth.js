// utils/auth.js - JWT Authentication Utilities - DEBUG VERSION
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthUtils {
  
  // Hash password with bcrypt
  static async hashPassword(password) {
    try {
      console.log('🔐 DEBUG: Hashing password...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('✅ DEBUG: Password hashed successfully');
      console.log('🔐 DEBUG: Hash preview:', hashedPassword.substring(0, 20) + '...');
      return hashedPassword;
    } catch (error) {
      console.error('❌ DEBUG: Password hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }
  
  // Compare password with hash - ENHANCED DEBUG VERSION
  static async comparePassword(password, hash) {
    try {
      console.log('🔍 DEBUG: Starting password comparison...');
      console.log('🔍 DEBUG: Input password:', password);
      console.log('🔍 DEBUG: Input hash preview:', hash ? hash.substring(0, 30) + '...' : 'NULL/UNDEFINED');
      console.log('🔍 DEBUG: Input hash length:', hash ? hash.length : 'NULL');
      console.log('🔍 DEBUG: Hash starts with $2b$:', hash ? hash.startsWith('$2b$') : 'NO HASH');
      
      if (!password) {
        console.log('❌ DEBUG: Password is empty/null');
        return false;
      }
      
      if (!hash) {
        console.log('❌ DEBUG: Hash is empty/null');
        return false;
      }
      
      if (typeof password !== 'string') {
        console.log('❌ DEBUG: Password is not a string:', typeof password);
        return false;
      }
      
      if (typeof hash !== 'string') {
        console.log('❌ DEBUG: Hash is not a string:', typeof hash);
        return false;
      }
      
      // Test with known demo123 hash
      const knownHash = '$2b$10$N9qo8uLOickgx2ZMRZoMye/hgcAlQe7GUJl7G6iEWpKXpMLOG3.h2';
      console.log('🔍 DEBUG: Hash matches known demo123 hash:', hash === knownHash);
      
      console.log('🔍 DEBUG: Calling bcrypt.compare...');
      const isValid = await bcrypt.compare(password, hash);
      console.log('🔑 DEBUG: Password comparison result:', isValid);
      
      // Additional test with known hash
      if (!isValid && password === 'demo123') {
        console.log('🔍 DEBUG: Testing with known demo123 hash...');
        const testResult = await bcrypt.compare('demo123', knownHash);
        console.log('🔑 DEBUG: Known hash test result:', testResult);
      }
      
      return isValid;
      
    } catch (error) {
      console.error('❌ DEBUG: Password comparison failed:', error);
      console.error('❌ DEBUG: Error details:', error.message);
      console.error('❌ DEBUG: Error stack:', error.stack);
      return false;
    }
  }
  
  // Generate JWT token
  static generateToken(user) {
    try {
      console.log(`🎫 DEBUG: Generating JWT token for user: ${user.username}`);
      
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      };
      
      console.log('🎫 DEBUG: Token payload:', payload);
      
      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'universal-student-api',
        audience: 'student-frontend'
      });
      
      console.log('✅ DEBUG: JWT token generated successfully');
      console.log('🎫 DEBUG: Token preview:', token.substring(0, 50) + '...');
      return token;
      
    } catch (error) {
      console.error('❌ DEBUG: JWT token generation failed:', error);
      throw new Error('Token generation failed');
    }
  }
  
  // Verify JWT token
  static verifyToken(token) {
    try {
      console.log('🔓 DEBUG: Verifying JWT token...');
      console.log('🔓 DEBUG: Token preview:', token ? token.substring(0, 30) + '...' : 'NULL');
      
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'universal-student-api',
        audience: 'student-frontend'
      });
      
      console.log('✅ DEBUG: JWT token verified successfully');
      console.log('🔓 DEBUG: Decoded payload:', decoded);
      return decoded;
      
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.log('⏰ DEBUG: JWT token expired');
      } else if (error.name === 'JsonWebTokenError') {
        console.log('❌ DEBUG: JWT token invalid');
      } else {
        console.error('❌ DEBUG: JWT verification error:', error);
      }
      return null;
    }
  }
  
  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader) {
    try {
      console.log('🔍 DEBUG: Extracting token from header...');
      console.log('🔍 DEBUG: Auth header:', authHeader ? authHeader.substring(0, 30) + '...' : 'NULL');
      
      if (!authHeader) {
        console.log('⚠️ DEBUG: No authorization header provided');
        return null;
      }
      
      if (!authHeader.startsWith('Bearer ')) {
        console.log('⚠️ DEBUG: Authorization header format invalid (missing Bearer)');
        return null;
      }
      
      const token = authHeader.slice(7); // Remove 'Bearer ' prefix
      
      if (!token || token.length < 10) {
        console.log('⚠️ DEBUG: Token too short or empty');
        return null;
      }
      
      console.log('✅ DEBUG: Token extracted from header successfully');
      return token;
      
    } catch (error) {
      console.error('❌ DEBUG: Token extraction failed:', error);
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