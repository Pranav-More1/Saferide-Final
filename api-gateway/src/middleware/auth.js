/**
 * ============================================
 * GuardianSync v2.0 - Authentication Middleware
 * ============================================
 * 
 * JWT-based authentication with Role-Based Access Control (RBAC).
 * 
 * Features:
 * - Token verification
 * - Role-based route protection
 * - Password change detection (token invalidation)
 */

import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

/**
 * Authentication middleware.
 * Verifies JWT token and attaches user to request.
 * 
 * @example
 * router.get('/protected', authenticate, (req, res) => {
 *   console.log(req.user); // Authenticated user
 * });
 */
export const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid token.',
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token format.',
      });
    }
    
    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. Please log in again.',
          code: 'TOKEN_INVALID',
        });
      }
      throw err;
    }
    
    // 3. Check if user still exists
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User no longer exists.',
      });
    }
    
    // 4. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'User account has been deactivated.',
      });
    }
    
    // 5. Check if password was changed after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        error: 'Password was recently changed. Please log in again.',
        code: 'PASSWORD_CHANGED',
      });
    }
    
    // 6. Attach user to request
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.',
    });
  }
};

/**
 * Role-Based Access Control middleware.
 * Restricts access to specific user roles.
 * 
 * @param {...string} allowedRoles - Roles allowed to access the route
 * @returns {Function} Express middleware
 * 
 * @example
 * // Only admins can access
 * router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
 * 
 * // Admins and drivers can access
 * router.get('/students', authenticate, authorize('admin', 'driver'), getStudents);
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // User must be authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Authorization failed: User ${req.user._id} with role '${req.user.role}' attempted to access route requiring roles: ${allowedRoles.join(', ')}`);
      
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to perform this action.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
      });
    }
    
    next();
  };
};

/**
 * Optional authentication middleware.
 * Attaches user if token is present, but doesn't require it.
 * Useful for routes that behave differently for authenticated users.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
      }
    } catch (err) {
      // Token invalid, but that's okay for optional auth
      logger.debug('Optional auth: Invalid token provided');
    }
    
    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

/**
 * Check if user owns the resource or is admin.
 * Useful for routes where users can only access their own data.
 * 
 * @param {Function} getOwnerId - Function to extract owner ID from request
 * @returns {Function} Express middleware
 * 
 * @example
 * router.put('/profile', authenticate, isOwnerOrAdmin((req) => req.params.userId), updateProfile);
 */
export const isOwnerOrAdmin = (getOwnerId) => {
  return async (req, res, next) => {
    try {
      // Admins can access anything
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get owner ID
      const ownerId = await getOwnerId(req);
      
      // Check if current user is the owner
      if (ownerId && req.user._id.toString() === ownerId.toString()) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        error: 'You can only access your own resources.',
      });
    } catch (error) {
      logger.error('Owner check error:', error);
      next(error);
    }
  };
};

/**
 * Rate limiting per user.
 * Prevents abuse by limiting requests per user per time window.
 * Simple in-memory implementation - use Redis in production.
 */
const userRequestCounts = new Map();

export const rateLimitByUser = (maxRequests = 100, windowMs = 60000) => {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    
    let userData = userRequestCounts.get(userId);
    
    if (!userData || now - userData.windowStart > windowMs) {
      // Start new window
      userData = { count: 1, windowStart: now };
      userRequestCounts.set(userId, userData);
      return next();
    }
    
    userData.count++;
    
    if (userData.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down.',
        retryAfter: Math.ceil((userData.windowStart + windowMs - now) / 1000),
      });
    }
    
    next();
  };
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  isOwnerOrAdmin,
  rateLimitByUser,
};
