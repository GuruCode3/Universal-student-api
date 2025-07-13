const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // ✅ FIXED: bcrypt → bcryptjs

// JWT Secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-universal-student-api-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthUtils {
  
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateToken(user) {
    try {
      console.log('🔐 GENERATING TOKEN for user:', user.username);
      
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      };
      
      const options = {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'UniversalStudentAPI'
      };
      
      console.log('📝 TOKEN PAYLOAD:', payload);
      console.log('⚙️ TOKEN OPTIONS:', options);
      console.log('🔑 JWT SECRET (first 10 chars):', JWT_SECRET.substring(0, 10) + '...');
      
      const token = jwt.sign(payload, JWT_SECRET, options);
      console.log('✅ TOKEN GENERATED (first 50 chars):', token.substring(0, 50) + '...');
      
      return token;
    } catch (error) {
      console.error('❌ Token generation error:', error);
      throw new Error('Failed to generate authentication token');
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object|null} Decoded token payload or null if invalid
   */
  static verifyToken(token) {
    try {
      console.log('🔓 VERIFYING TOKEN...');
      console.log('🎫 TOKEN (first 50 chars):', token ? token.substring(0, 50) + '...' : 'NULL');
      console.log('🔑 VERIFY SECRET (first 10 chars):', JWT_SECRET.substring(0, 10) + '...');
      
      if (!token) {
        console.log('❌ VERIFY FAILED: No token provided');
        return null;
      }
      
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ TOKEN VERIFIED successfully');
      console.log('📋 DECODED PAYLOAD:', {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      return decoded;
    } catch (error) {
      console.log('❌ TOKEN VERIFICATION FAILED:');
      console.log('   Error Name:', error.name);
      console.log('   Error Message:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        console.log('⏰ Token expired at:', new Date(error.expiredAt).toISOString());
      } else if (error.name === 'JsonWebTokenError') {
        console.log('🚫 Invalid token format or signature');
      } else {
        console.error('❌ Unexpected token verification error:', error);
      }
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null if not found
   */
  static extractTokenFromHeader(authHeader) {
    console.log('🎫 EXTRACTING TOKEN from header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return null;
    }
    
    // Support both "Bearer token" and "token" formats
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      console.log('✅ TOKEN EXTRACTED (Bearer format, first 30 chars):', token.substring(0, 30) + '...');
      return token;
    }
    
    // Direct token without "Bearer " prefix
    console.log('✅ TOKEN EXTRACTED (direct format, first 30 chars):', authHeader.substring(0, 30) + '...');
    return authHeader;
  }

  /**
   * Hash password using bcryptjs
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    try {
      if (!password) {
        throw new Error('Password is required');
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      console.error('❌ Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password with hashed password using bcryptjs
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if passwords match
   */
  static async comparePassword(password, hashedPassword) {
    try {
      if (!password || !hashedPassword) {
        return false;
      }
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      console.error('❌ Password comparison error:', error);
      return false;
    }
  }
}

module.exports = AuthUtils;