// utils/email-service.js - Real Email Service Configuration
const nodemailer = require('nodemailer');

// Email service configuration
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Gmail SMTP Configuration (Production Ready)
      if (process.env.EMAIL_SERVICE === 'gmail') {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER, // your-email@gmail.com
            pass: process.env.GMAIL_APP_PASSWORD // App Password (not regular password)
          },
          secure: true,
          port: 465
        });
      }
      
      // SendGrid SMTP Configuration (Recommended for production)
      else if (process.env.EMAIL_SERVICE === 'sendgrid') {
        this.transporter = nodemailer.createTransporter({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        });
      }
      
      // Generic SMTP Configuration
      else {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      }

      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service connected successfully');
      }
      
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('📧 Email functionality will be disabled');
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(to, resetToken, userFirstName = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: {
          name: 'Universal Student API',
          address: process.env.FROM_EMAIL || process.env.GMAIL_USER
        },
        to: to,
        subject: 'Password Reset Request - Universal Student API',
        html: this.getPasswordResetTemplate(resetUrl, userFirstName),
        text: this.getPasswordResetTextVersion(resetUrl, userFirstName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Password reset email sent:', {
        messageId: result.messageId,
        recipient: to,
        status: 'sent'
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: to
      };

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return {
        success: false,
        error: error.message,
        recipient: to
      };
    }
  }

  // Send email verification email
  async sendEmailVerification(to, verificationToken, userFirstName = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: {
          name: 'Universal Student API',
          address: process.env.FROM_EMAIL || process.env.GMAIL_USER
        },
        to: to,
        subject: 'Verify Your Email - Universal Student API',
        html: this.getEmailVerificationTemplate(verificationUrl, userFirstName),
        text: this.getEmailVerificationTextVersion(verificationUrl, userFirstName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email verification sent:', {
        messageId: result.messageId,
        recipient: to,
        status: 'sent'
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: to
      };

    } catch (error) {
      console.error('❌ Failed to send email verification:', error);
      return {
        success: false,
        error: error.message,
        recipient: to
      };
    }
  }

  // Send order confirmation email
  async sendOrderConfirmation(to, orderData, userFirstName = null) {
    try {
      if (!this.transporter) {
        throw new Error('Email service not initialized');
      }

      const mailOptions = {
        from: {
          name: 'Universal Student API',
          address: process.env.FROM_EMAIL || process.env.GMAIL_USER
        },
        to: to,
        subject: `Order Confirmation #${orderData.id}`,
        html: this.getOrderConfirmationTemplate(orderData, userFirstName),
        text: this.getOrderConfirmationTextVersion(orderData, userFirstName)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Order confirmation sent:', {
        messageId: result.messageId,
        recipient: to,
        orderId: orderData.id
      });

      return {
        success: true,
        messageId: result.messageId,
        recipient: to
      };

    } catch (error) {
      console.error('❌ Failed to send order confirmation:', error);
      return {
        success: false,
        error: error.message,
        recipient: to
      };
    }
  }

  // HTML Email Templates
  getPasswordResetTemplate(resetUrl, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; }
            .header { text-align: center; color: #2c3e50; margin-bottom: 30px; }
            .button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #2980b9; }
            .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🔐 Password Reset Request</h2>
            </div>
            
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            
            <p>We received a request to reset your password for your Universal Student API account.</p>
            
            <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
            </div>
            
            <div class="warning">
                <strong>Important:</strong>
                <ul>
                    <li>This link will expire in 15 minutes</li>
                    <li>If you didn't request this, please ignore this email</li>
                    <li>Your password won't change until you click the link above</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; font-family: monospace;">
                ${resetUrl}
            </p>
            
            <div class="footer">
                <p>This email was sent by Universal Student API</p>
                <p>If you have questions, please contact your instructor</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getEmailVerificationTemplate(verificationUrl, firstName) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; }
            .header { text-align: center; color: #27ae60; margin-bottom: 30px; }
            .button { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .button:hover { background: #219a52; }
            .info { background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>📧 Verify Your Email Address</h2>
            </div>
            
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            
            <p>Thank you for registering with Universal Student API! Please verify your email address to activate your account.</p>
            
            <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify My Email</a>
            </div>
            
            <div class="info">
                <strong>Why verify?</strong>
                <ul>
                    <li>Secure your account</li>
                    <li>Enable password reset functionality</li>
                    <li>Receive important account notifications</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this link:</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; font-family: monospace;">
                ${verificationUrl}
            </p>
            
            <div class="footer">
                <p>This email was sent by Universal Student API</p>
                <p>If you didn't create an account, you can safely ignore this email</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getOrderConfirmationTemplate(orderData, firstName) {
    const itemsList = orderData.items.map(item => 
      `<tr>
        <td>${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">$${item.price.toFixed(2)}</td>
        <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    ).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .container { background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0; }
            .header { text-align: center; color: #28a745; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f8f9fa; font-weight: bold; }
            .total-row { background: #e9ecef; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #666; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>🎉 Order Confirmation</h2>
                <p>Order #${orderData.id}</p>
            </div>
            
            <p>Hello${firstName ? ` ${firstName}` : ''},</p>
            
            <p>Thank you for your order! Here are the details:</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Price</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsList}
                    <tr class="total-row">
                        <td colspan="3">Total</td>
                        <td style="text-align: right;">$${orderData.totals.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            
            <p><strong>Estimated Delivery:</strong> ${new Date(orderData.estimated_delivery).toLocaleDateString()}</p>
            
            <div class="footer">
                <p>This is a demo order confirmation from Universal Student API</p>
                <p>For questions, contact your instructor</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Text versions for email clients that don't support HTML
  getPasswordResetTextVersion(resetUrl, firstName) {
    return `
Password Reset Request

Hello${firstName ? ` ${firstName}` : ''},

We received a request to reset your password for your Universal Student API account.

Click here to reset your password:
${resetUrl}

Important:
- This link will expire in 15 minutes
- If you didn't request this, please ignore this email
- Your password won't change until you click the link above

If you have questions, please contact your instructor.

Universal Student API
    `;
  }

  getEmailVerificationTextVersion(verificationUrl, firstName) {
    return `
Email Verification

Hello${firstName ? ` ${firstName}` : ''},

Thank you for registering with Universal Student API! Please verify your email address to activate your account.

Click here to verify your email:
${verificationUrl}

Why verify?
- Secure your account
- Enable password reset functionality
- Receive important account notifications

If you didn't create an account, you can safely ignore this email.

Universal Student API
    `;
  }

  getOrderConfirmationTextVersion(orderData, firstName) {
    const itemsList = orderData.items.map(item => 
      `${item.name} - Quantity: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    return `
Order Confirmation #${orderData.id}

Hello${firstName ? ` ${firstName}` : ''},

Thank you for your order! Here are the details:

Items:
${itemsList}

Total: $${orderData.totals.total.toFixed(2)}
Estimated Delivery: ${new Date(orderData.estimated_delivery).toLocaleDateString()}

This is a demo order confirmation from Universal Student API.
For questions, contact your instructor.
    `;
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;