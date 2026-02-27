/**
 * ============================================
 * GuardianSync v2.0 - User Routes
 * ============================================
 * 
 * Handles user management (drivers, parents)
 */

import { Router } from 'express';
import { User } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// User Management Routes
// ============================================

/**
 * @route GET /api/v1/users
 * @desc Get all users (optionally filter by role)
 * @access Admin
 */
router.get(
  '/',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { role, search, page = 1, limit = 50 } = req.query;
    
    const query = { isActive: true };
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-refreshTokens')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      drivers: users, // Alias for frontend compatibility
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
      .select('-refreshTokens')
      .lean();

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user
 * @access Admin
 */
router.put(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const { name, email, phone, licenseNumber, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (licenseNumber) user.licenseNumber = licenseNumber;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        licenseNumber: user.licenseNumber,
        isActive: user.isActive,
      },
    });
  })
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete user (soft delete)
 * @access Admin
 */
router.delete(
  '/:id',
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      throw new ApiError(400, 'Cannot delete your own account');
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  })
);

export default router;
