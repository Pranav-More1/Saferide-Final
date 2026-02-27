/**
 * ============================================
 * GuardianSync v2.0 - Error Handler Middleware
 * ============================================
 * 
 * Centralized error handling for the API.
 * Provides consistent error responses and logging.
 */

import logger from '../utils/logger.js';

/**
 * Custom API Error class.
 * Use for operational errors with specific status codes.
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler.
 * Catches requests to undefined routes.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.originalUrl,
    method: req.method,
  });
};

/**
 * Global error handler.
 * Handles all errors and sends appropriate responses.
 */
export const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;
  
  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      userId: req.userId?.toString(),
    });
  } else {
    logger.warn('Client Error:', {
      message: err.message,
      path: req.path,
      method: req.method,
    });
  }
  
  // Handle specific error types
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
    }));
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
    details = { field, value: err.keyValue[field] };
  }
  
  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  
  // Multer file upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected field in upload';
    } else {
      message = err.message;
    }
  }
  
  // Send response
  const response = {
    success: false,
    error: message,
  };
  
  // Include details if available
  if (details) {
    response.details = details;
  }
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.stack = err.stack;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Async handler wrapper.
 * Wraps async route handlers to catch errors automatically.
 * 
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 * 
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
