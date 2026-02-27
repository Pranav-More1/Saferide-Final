/**
 * ============================================
 * GuardianSync v2.0 - Bus Model
 * ============================================
 * 
 * Schema for bus/vehicle information.
 * Linked to drivers and students.
 */

import mongoose from 'mongoose';

// ============================================
// Schema Definition
// ============================================

const busSchema = new mongoose.Schema({
  // Bus identification
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  
  // Registration/license plate
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  
  // Route information
  routeName: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true,
  },
  
  routeDescription: {
    type: String,
    trim: true,
  },
  
  // Capacity
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [100, 'Capacity cannot exceed 100'],
  },
  
  // Assigned driver
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  
  // Current status
  status: {
    type: String,
    enum: ['inactive', 'en_route', 'at_stop', 'returning', 'completed'],
    default: 'inactive',
    index: true,
  },
  
  // Active tracking flag
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  
  // Schedule
  schedule: {
    morningPickupStart: String, // e.g., "07:00"
    morningPickupEnd: String,   // e.g., "08:30"
    afternoonDropoffStart: String,
    afternoonDropoffEnd: String,
  },

}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// ============================================
// Virtuals
// ============================================

/**
 * Get count of students assigned to this bus.
 */
busSchema.virtual('studentCount', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'assignedBus',
  count: true,
});

// ============================================
// Export Model
// ============================================

const Bus = mongoose.model('Bus', busSchema);

export default Bus;
