// Production-grade error handling utilities
const createStandardResponse = (success, data = null, error = null, message = '', metadata = {}) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  if (success) {
    response.data = data;
    if (message) response.message = message;
  } else {
    response.error = error;
    response.message = message;
  }

  return response;
};

const createErrorResponse = (error, message, statusCode = 500, metadata = {}) => {
  return {
    success: false,
    error,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...metadata
  };
};

const createSuccessResponse = (data, message = '', metadata = {}) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    ...metadata
  };
};

// Error types for consistent error handling
const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  NOT_FOUND: 'not_found',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  SERVER_ERROR: 'server_error',
  DATABASE_ERROR: 'database_error'
};

// Student-friendly error messages
const STUDENT_FRIENDLY_MESSAGES = {
  [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input data and try again',
  [ERROR_TYPES.AUTHENTICATION_ERROR]: 'Please login with valid credentials',
  [ERROR_TYPES.AUTHORIZATION_ERROR]: 'You don\'t have permission to access this resource',
  [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_TYPES.RATE_LIMIT_ERROR]: 'You\'re making requests too quickly. Please wait a moment',
  [ERROR_TYPES.SERVER_ERROR]: 'Something went wrong on our end. Please try again later',
  [ERROR_TYPES.DATABASE_ERROR]: 'Database temporarily unavailable. Please try again'
};

// Express error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error(`❌ Error [${req.method} ${req.path}]:`, err.message);
  
  // Log additional details in production
  if (process.env.NODE_ENV === 'production') {
    console.error('Error details:', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      stack: err.stack
    });
  }

  // Handle specific error types
  let statusCode = 500;
  let errorType = ERROR_TYPES.SERVER_ERROR;
  let message = STUDENT_FRIENDLY_MESSAGES[ERROR_TYPES.SERVER_ERROR];

  // Rate limiting errors
  if (err.status === 429) {
    statusCode = 429;
    errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
    message = STUDENT_FRIENDLY_MESSAGES[ERROR_TYPES.RATE_LIMIT_ERROR];
  }

  // Authentication errors
  if (err.name === 'UnauthorizedError' || err.status === 401) {
    statusCode = 401;
    errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
    message = STUDENT_FRIENDLY_MESSAGES[ERROR_TYPES.AUTHENTICATION_ERROR];
  }

  // Validation errors
  if (err.name === 'ValidationError' || err.status === 400) {
    statusCode = 400;
    errorType = ERROR_TYPES.VALIDATION_ERROR;
    message = STUDENT_FRIENDLY_MESSAGES[ERROR_TYPES.VALIDATION_ERROR];
  }

  // Not found errors
  if (err.status === 404) {
    statusCode = 404;
    errorType = ERROR_TYPES.NOT_FOUND;
    message = STUDENT_FRIENDLY_MESSAGES[ERROR_TYPES.NOT_FOUND];
  }

  const errorResponse = createErrorResponse(
    errorType,
    message,
    statusCode,
    {
      request_id: Date.now(),
      documentation: '/api-docs',
      support: 'Check /health endpoint for system status',
      ...(process.env.NODE_ENV === 'development' && { 
        details: err.message,
        stack: err.stack 
      })
    }
  );

  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res) => {
  console.log(`⚠️ 404 - Endpoint not found: ${req.method} ${req.originalUrl}`);
  
  const errorResponse = createErrorResponse(
    ERROR_TYPES.NOT_FOUND,
    `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    404,
    {
      suggestions: [
        'Check the URL spelling',
        'Verify the HTTP method (GET, POST, etc.)',
        'Ensure the domain parameter is valid',
        'Visit /api-docs for complete documentation'
      ],
      available_endpoints: [
        'GET /',
        'GET /health',
        'GET /performance',
        'GET /api-docs',
        'GET /api/v1/status',
        'GET /api/v1/domains',
        'POST /api/v1/auth/register',
        'POST /api/v1/auth/login',
        'GET /api/v1/auth/profile',
        'GET /api/v1/cart',
        'GET /api/v1/{domain}/products',
        'GET /api/v1/{domain}/products/search?q=term',
        'GET /api/v1/{domain}/categories',
        'GET /api/v1/{domain}/brands'
      ],
      documentation: {
        interactive: '/api-docs',
        readme: 'Complete student guide available',
        test_collection: '100+ test cases ready'
      },
      rate_limits: {
        note: "Remember the rate limits to keep API fast",
        general: "100 requests / 15 minutes",
        products: "200 requests / 5 minutes"
      }
    }
  );

  res.status(404).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Input validation helper
const validateInput = (schema, data) => {
  // Simple validation helper - in production, use Joi or similar
  const errors = [];
  
  if (schema.required) {
    schema.required.forEach(field => {
      if (!data[field]) {
        errors.push(`${field} is required`);
      }
    });
  }
  
  if (schema.types) {
    Object.keys(schema.types).forEach(field => {
      if (data[field] && typeof data[field] !== schema.types[field]) {
        errors.push(`${field} must be of type ${schema.types[field]}`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limit error handler
const rateLimitHandler = (req, res) => {
  const errorResponse = createErrorResponse(
    ERROR_TYPES.RATE_LIMIT_ERROR,
    'Too many requests. Please wait before trying again.',
    429,
    {
      retry_after: '15 minutes',
      tip: 'This helps keep the API fast for all students! 🎓',
      documentation: '/api-docs',
      current_limits: {
        general: '100 requests / 15 minutes',
        products: '200 requests / 5 minutes'
      }
    }
  );

  res.status(429).json(errorResponse);
};

module.exports = {
  createStandardResponse,
  createErrorResponse,
  createSuccessResponse,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  validateInput,
  rateLimitHandler,
  ERROR_TYPES,
  STUDENT_FRIENDLY_MESSAGES
};