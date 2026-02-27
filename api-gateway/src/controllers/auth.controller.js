/**
 * ============================================
 * GuardianSync v2.0 - Auth Controller
 * ============================================
 * 
 * Handles authentication operations:
 * - User registration
 * - Login with JWT
 * - Token refresh
 * - Password management
 */

import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// ============================================
// Token Generation
// ============================================

/**
 * Generate JWT access token.
 * 
 * @param {Object} user - User document
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Generate JWT refresh token.
 * 
 * @param {Object} user - User document
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { userId: user._id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
};

/**
 * Parse expiration time string to milliseconds.
 * 
 * @param {string} timeStr - e.g., '7d', '30d', '1h'
 * @returns {number} Milliseconds
 */
const parseExpiresIn = (timeStr) => {
  const match = timeStr.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const [, num, unit] = match;
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return parseInt(num) * multipliers[unit];
};

// ============================================
// Controller Methods
// ============================================

/**
 * Register a new user.
 * 
 * @route POST /api/v1/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name, phone, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  // Create user
  const user = await User.create({
    email,
    password,
    name,
    phone,
    role: role || 'parent',
  });

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  user.refreshTokens.push({
    token: refreshToken,
    device: req.headers['user-agent'] || 'unknown',
    expiresAt: new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn)),
  });
  await user.save({ validateBeforeSave: false });

  logger.info(`User registered: ${user.email} (${user.role})`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn,
      },
    },
  });
});

/**
 * Login user.
 * 
 * @route POST /api/v1/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findByEmailWithPassword(email);

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError(401, 'Account has been deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token (limit to 5 devices)
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift(); // Remove oldest
  }
  user.refreshTokens.push({
    token: refreshToken,
    device: req.headers['user-agent'] || 'unknown',
    expiresAt: new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn)),
  });

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedBus: user.assignedBus,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn,
      },
    },
  });
});

/**
 * Refresh access token.
 * 
 * @route POST /api/v1/auth/refresh
 * @access Public
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  // Find user
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'User not found or inactive');
  }

  // Check if refresh token exists in user's tokens
  const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
  if (tokenIndex === -1) {
    throw new ApiError(401, 'Refresh token not found. Please login again.');
  }

  // Check if token is expired
  if (user.refreshTokens[tokenIndex].expiresAt < new Date()) {
    user.refreshTokens.splice(tokenIndex, 1);
    await user.save({ validateBeforeSave: false });
    throw new ApiError(401, 'Refresh token expired. Please login again.');
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  res.json({
    success: true,
    data: {
      accessToken,
      expiresIn: config.jwt.expiresIn,
    },
  });
});

/**
 * Logout user.
 * 
 * @route POST /api/v1/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (token && req.user) {
    // Remove refresh token
    req.user.refreshTokens = req.user.refreshTokens.filter(t => t.token !== token);
    await req.user.save({ validateBeforeSave: false });
  }

  logger.info(`User logged out: ${req.user?.email}`);

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Get current user profile.
 * 
 * @route GET /api/v1/auth/me
 * @access Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('assignedBus', 'busNumber routeName')
    .populate('children', 'name studentId grade');

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Change password.
 * 
 * @route POST /api/v1/auth/change-password
 * @access Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  
  // Invalidate all refresh tokens (force re-login on all devices)
  user.refreshTokens = [];
  
  await user.save();

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshTokens.push({
    token: refreshToken,
    device: req.headers['user-agent'] || 'unknown',
    expiresAt: new Date(Date.now() + parseExpiresIn(config.jwt.refreshExpiresIn)),
  });
  await user.save({ validateBeforeSave: false });

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.expiresIn,
      },
    },
  });
});

export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
};
