const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let error = {
    error: 'Internal server error',
    message: 'An unexpected error occurred.',
    code: 'INTERNAL_ERROR'
  };

  let statusCode = 500;

  // Handle Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        error = {
          error: 'Duplicate entry',
          message: 'A record with this data already exists.',
          code: 'DUPLICATE_ENTRY'
        };
        statusCode = 409;
        break;
      case 'P2025':
        error = {
          error: 'Record not found',
          message: 'The requested record was not found.',
          code: 'NOT_FOUND'
        };
        statusCode = 404;
        break;
      case 'P2003':
        error = {
          error: 'Foreign key constraint',
          message: 'The operation violates a foreign key constraint.',
          code: 'FOREIGN_KEY_ERROR'
        };
        statusCode = 400;
        break;
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    error = {
      error: 'Validation failed',
      message: err.message,
      code: 'VALIDATION_ERROR'
    };
    statusCode = 400;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      error: 'Invalid token',
      message: 'The provided token is invalid.',
      code: 'INVALID_TOKEN'
    };
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      error: 'Token expired',
      message: 'The provided token has expired.',
      code: 'TOKEN_EXPIRED'
    };
    statusCode = 401;
  }

  // Handle axios/network errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    error = {
      error: 'External service unavailable',
      message: 'Unable to connect to external service.',
      code: 'SERVICE_UNAVAILABLE'
    };
    statusCode = 503;
  }

  // Handle timeout errors
  if (err.code === 'ECONNABORTED') {
    error = {
      error: 'Request timeout',
      message: 'The request took too long to complete.',
      code: 'TIMEOUT'
    };
    statusCode = 408;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    error.message = 'An unexpected error occurred.';
  }

  res.status(statusCode).json({
    ...error,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

module.exports = errorHandler;
