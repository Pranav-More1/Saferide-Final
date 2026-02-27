/**
 * ============================================
 * GuardianSync v2.0 - User Model
 * ============================================
 * 
 * Base user schema for authentication.
 * Supports role-based access control (RBAC).
 * 
 * Roles:
 * - admin: School administrators
 * - driver: Bus drivers
 * - parent: Parents/guardians
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// ============================================
// Schema Definition
// ============================================

const userSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Never return password by default
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number'],
  },
  
  // Role-Based Access Control
  role: {
    type: String,
    enum: {
      values: ['admin', 'driver', 'parent'],
      message: 'Role must be admin, driver, or parent',
    },
    default: 'parent',
    index: true,
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // For drivers: assigned bus
  assignedBus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    default: null,
  },
  
  // For parents: linked children
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
  }],
  
  // Security
  lastLogin: {
    type: Date,
    default: null,
  },
  
  passwordChangedAt: Date,
  
  passwordResetToken: String,
  
  passwordResetExpires: Date,
  
  // Refresh tokens for multiple device support
  refreshTokens: [{
    token: String,
    device: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
  }],

}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.refreshTokens;
      delete ret.__v;
      return ret;
    }
  }
});

// ============================================
// Indexes for Performance
// ============================================

userSchema.index({ email: 1, role: 1 });
userSchema.index({ role: 1, isActive: 1 });

// ============================================
// Pre-save Middleware
// ============================================

/**
 * Hash password before saving if modified.
 * Also updates passwordChangedAt timestamp.
 */
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost factor of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Update passwordChangedAt (skip for new documents)
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1s to ensure token issued after
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ============================================
// Instance Methods
// ============================================

/**
 * Compare provided password with hashed password.
 * @param {string} candidatePassword - Plain text password to check
 * @returns {Promise<boolean>} - True if passwords match
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if password was changed after a given timestamp.
 * Used to invalidate tokens issued before password change.
 * @param {number} jwtTimestamp - Token issued at timestamp
 * @returns {boolean} - True if password changed after token issued
 */
userSchema.methods.changedPasswordAfter = function(jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

/**
 * Update last login timestamp.
 */
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  await this.save({ validateBeforeSave: false });
};

// ============================================
// Static Methods
// ============================================

/**
 * Find user by email with password field included.
 * Used for authentication.
 * @param {string} email - User email
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

/**
 * Find all users by role.
 * @param {string} role - User role
 * @returns {Promise<User[]>}
 */
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

// ============================================
// Export Model
// ============================================

const User = mongoose.model('User', userSchema);

export default User;
