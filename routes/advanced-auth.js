// routes/advanced-auth.js - Password Reset და Email Verification
const express = require('express');
const AuthUtils = require('../utils/auth');
const emailService = require('../utils/email-service');
const router = express.Router();

// Simple middleware for auth
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
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Authentication error'
    });
  }
}

// TOKEN STORAGE (In production, use Redis)
global.resetTokens = global.resetTokens || new Map();
global.verificationTokens = global.verificationTokens || new Map();

// PASSWORD RESET REQUEST
router.post('/forgot-password', async (req, res) => {
  try {
    console.log('Password reset request received');
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Email is required'
      });
    }

    console.log(`Looking for user with email: ${email}`);
    
    // Find user by email
    const user = global.userPersistence.findUserByUsername(email);
    
    if (!user) {
      console.log(`User not found: ${email}`);
      // Security: Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If the email exists in our system, a reset link has been sent',
        development_note: 'User not found, but we don\'t reveal this for security'
      });
    }

    console.log(`User found: ${user.username}`);

    // Generate reset token (15 minutes)
    const resetToken = AuthUtils.generateToken({
      id: user.id,
      email: user.email,
      purpose: 'password_reset'
    });

    console.log(`Generated reset token: ${resetToken.substring(0, 20)}...`);

    // Store reset token with expiration
    global.resetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expires: Date.now() + 15 * 60 * 1000 // 15 minutes
    });

    console.log(`Stored token, total tokens: ${global.resetTokens.size}`);

    // Send reset email
    const emailResult = await emailService.sendPasswordResetEmail(
      user.email, 
      resetToken, 
      user.first_name
    );

    console.log('Email send result:', emailResult);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Password reset instructions sent to your email',
        data: {
          email_sent_to: user.email,
          expires_in: '15 minutes',
          // Development only - remove in production
          development_info: {
            token_preview: resetToken.substring(0, 30) + '...',
            direct_reset_url: `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password-form?token=${resetToken}`
          }
        }
      });
    } else {
      console.error('Email send failed:', emailResult.error);
      
      res.status(500).json({
        success: false,
        error: 'email_send_failed',
        message: 'Failed to send reset email. Please try again later.',
        development_info: {
          error: emailResult.error,
          token_for_manual_testing: resetToken
        }
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to process password reset request'
    });
  }
});

// PASSWORD RESET FORM (HTML page for easy testing)
router.get('/reset-password-form', (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).send('Reset token is required');
  }

  // Check if token exists and is valid
  const tokenData = global.resetTokens.get(token);
  if (!tokenData || tokenData.expires < Date.now()) {
    return res.status(400).send(`
      <h2>Invalid or Expired Token</h2>
      <p>This password reset link has expired or is invalid.</p>
      <p>Please request a new password reset.</p>
    `);
  }

  // Return HTML form
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Reset Password - Universal Student API</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
            .form-group { margin: 15px 0; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007bff; color: white; padding: 12px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
            button:hover { background: #0056b3; }
            .error { color: red; margin: 10px 0; }
            .success { color: green; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h2>Reset Your Password</h2>
        <form id="resetForm">
            <div class="form-group">
                <label for="password">New Password:</label>
                <input type="password" id="password" name="password" required minlength="6" 
                       placeholder="Enter new password (min 6 characters)">
            </div>
            <div class="form-group">
                <label for="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required 
                       placeholder="Confirm new password">
            </div>
            <button type="submit">Reset Password</button>
        </form>
        <div id="message"></div>
        
        <script>
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const messageDiv = document.getElementById('message');
            
            // Clear previous messages
            messageDiv.innerHTML = '';
            
            // Validate passwords match
            if (password !== confirmPassword) {
                messageDiv.innerHTML = '<div class="error">Passwords do not match!</div>';
                return;
            }
            
            if (password.length < 6) {
                messageDiv.innerHTML = '<div class="error">Password must be at least 6 characters!</div>';
                return;
            }
            
            try {
                const response = await fetch('/api/v1/auth/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: '${token}',
                        new_password: password
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    messageDiv.innerHTML = '<div class="success">' + result.message + '</div>';
                    document.getElementById('resetForm').style.display = 'none';
                } else {
                    messageDiv.innerHTML = '<div class="error">' + result.message + '</div>';
                }
            } catch (error) {
                messageDiv.innerHTML = '<div class="error">Network error. Please try again.</div>';
            }
        });
        </script>
    </body>
    </html>
  `);
});

// PASSWORD RESET EXECUTION
router.post('/reset-password', async (req, res) => {
  try {
    console.log('Password reset execution request');
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Token and new password are required'
      });
    }

    // Password validation
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Password must be at least 6 characters long'
      });
    }

    console.log(`Reset token received: ${token.substring(0, 20)}...`);
    console.log(`Available tokens: ${global.resetTokens.size}`);

    // Verify reset token
    const tokenData = global.resetTokens.get(token);

    if (!tokenData) {
      console.log('Token not found in storage');
      return res.status(400).json({
        success: false,
        error: 'invalid_token',
        message: 'Invalid reset token'
      });
    }

    if (tokenData.expires < Date.now()) {
      console.log('Token expired');
      global.resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'expired_token',
        message: 'Reset token has expired'
      });
    }

    console.log(`Token valid for user ID: ${tokenData.userId}`);

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(new_password);
    console.log('New password hashed');

    // Update user password using persistence
    const user = global.userPersistence.findUserById(tokenData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'user_not_found',
        message: 'User not found'
      });
    }

    // Update password
    const updated = global.userPersistence.updateUser(tokenData.userId, {
      password: hashedPassword,
      password_updated_at: new Date().toISOString()
    });

    if (updated) {
      // Remove used token
      global.resetTokens.delete(token);
      console.log(`Password updated successfully for user: ${user.username}`);

      res.json({
        success: true,
        message: 'Password reset successfully',
        data: {
          username: user.username,
          updated_at: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'update_failed',
        message: 'Failed to update password'
      });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to reset password'
    });
  }
});

// EMAIL VERIFICATION REQUEST (მარტივი დავალება სტუდენტებისთვის)
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    console.log(`Email verification request from: ${user.username}`);

    // Check if already verified
    const fullUser = global.userPersistence.findUserById(user.id);
    if (fullUser && fullUser.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'already_verified',
        message: 'Email is already verified'
      });
    }

    // Generate verification token (24 hours)
    const verificationToken = AuthUtils.generateToken({
      id: user.id,
      email: user.email,
      purpose: 'email_verification'
    });

    // Store verification token
    global.verificationTokens.set(verificationToken, {
      userId: user.id,
      email: user.email,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    const emailResult = await emailService.sendEmailVerification(
      user.email,
      verificationToken,
      fullUser?.first_name
    );

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Verification email sent successfully',
        data: {
          email_sent_to: user.email,
          expires_in: '24 hours',
          development_info: {
            verification_url: `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email?token=${verificationToken}`
          }
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'email_send_failed',
        message: 'Failed to send verification email',
        development_info: {
          token_for_manual_testing: verificationToken
        }
      });
    }

  } catch (error) {
    console.error('Email verification send error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Failed to send verification email'
    });
  }
});

// EMAIL VERIFICATION EXECUTION
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Verification token is required'
      });
    }

    console.log(`Email verification attempt with token: ${token.substring(0, 20)}...`);

    // Verify token
    const tokenData = global.verificationTokens.get(token);

    if (!tokenData || tokenData.expires < Date.now()) {
      if (tokenData && tokenData.expires < Date.now()) {
        global.verificationTokens.delete(token);
      }
      
      return res.status(400).json({
        success: false,
        error: 'invalid_token',
        message: 'Invalid or expired verification token'
      });
    }

    // Update user as verified
    const updated = global.userPersistence.updateUser(tokenData.userId, {
      email_verified: true,
      email_verified_at: new Date().toISOString()
    });

    if (updated) {
      global.verificationTokens.delete(token);
      console.log(`Email verified for user ID: ${tokenData.userId}`);

      res.json({
        success: true,
        message: 'Email verified successfully',
        data: {
          email: tokenData.email,
          verified_at: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'verification_failed',
        message: 'Failed to verify email'
      });
    }

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'Email verification failed'
    });
  }
});

// TESTING ENDPOINT
router.get('/test-email', async (req, res) => {
  try {
    const { to } = req.query;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address required. Use: /api/v1/auth/test-email?to=your-email@gmail.com'
      });
    }

    // Test email send
    const testResult = await emailService.sendPasswordResetEmail(
      to,
      'TEST_TOKEN_12345',
      'Test User'
    );

    res.json({
      success: true,
      message: 'Test email attempted',
      data: testResult
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// STATUS ENDPOINT
router.get('/advanced-status', (req, res) => {
  res.json({
    success: true,
    message: 'Advanced Authentication Module Active',
    features: {
      password_reset: 'Available',
      email_verification: 'Available', 
      email_service: emailService.transporter ? 'Connected' : 'Disabled'
    },
    tokens: {
      reset_tokens_active: global.resetTokens.size,
      verification_tokens_active: global.verificationTokens.size
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;