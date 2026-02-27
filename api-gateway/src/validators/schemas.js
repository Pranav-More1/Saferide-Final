/**
 * ============================================
 * GuardianSync v2.0 - Zod Validation Schemas
 * ============================================
 * 
 * Strict input validation using Zod.
 * All API inputs must pass through these validators.
 * 
 * Benefits:
 * - Type-safe validation
 * - Automatic TypeScript types (if used)
 * - Clear, descriptive error messages
 * - Runtime validation that matches compile-time types
 */

import { z } from 'zod';

// ============================================
// Common Validators
// ============================================

/**
 * MongoDB ObjectId validator.
 * Validates 24-character hex string.
 */
export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

/**
 * Email validator with normalization.
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

/**
 * Password validator.
 * Requires: 8+ chars, uppercase, lowercase, number.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Phone number validator (flexible format).
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\+\(\)]{7,}$/, 'Invalid phone number format')
  .optional()
  .or(z.literal(''))
  .transform(val => val || undefined);

/**
 * Coordinates validator for geolocation.
 */
export const coordinatesSchema = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

/**
 * Face encoding validator.
 * Must be exactly 128 floating-point numbers.
 */
export const faceEncodingSchema = z
  .array(z.number())
  .length(128, 'Face encoding must be exactly 128 dimensions');

// ============================================
// Auth Validators
// ============================================

/**
 * User registration schema.
 */
export const registerSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    phone: phoneSchema,
    role: z.enum(['admin', 'driver', 'parent']).default('parent'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

/**
 * Login schema.
 */
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
  }),
});

/**
 * Refresh token schema.
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

/**
 * Password change schema.
 */
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'New passwords do not match',
    path: ['confirmNewPassword'],
  }),
});

// ============================================
// Student Validators
// ============================================

/**
 * Student registration schema.
 * Accepts fields from admin dashboard form.
 */
export const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    studentId: z.string().toUpperCase().trim().optional(), // Auto-generated if not provided
    grade: z.string().min(1, 'Grade is required').trim(),
    section: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    
    // Parent info from admin form
    parentName: z.string().min(2).max(100).trim().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().email().toLowerCase().trim().optional().or(z.literal('')),
    
    // Address from admin form (simple string)
    address: z.string().max(500).trim().optional(),
    
    // Bus assignment (accepts both field names)
    busId: objectIdSchema.optional().or(z.literal('')),
    assignedBusId: objectIdSchema.optional(),
    
    // Legacy/advanced fields
    parentIds: z.array(objectIdSchema).optional(),
    primaryGuardianId: objectIdSchema.optional(),
    pickupLocation: z.object({
      address: z.string().min(1),
      coordinates: coordinatesSchema.optional(),
      notes: z.string().max(200).optional(),
    }).optional(),
    dropoffLocation: z.object({
      address: z.string().min(1),
      coordinates: coordinatesSchema.optional(),
      notes: z.string().max(200).optional(),
    }).optional(),
    specialNeeds: z.object({
      hasSpecialNeeds: z.boolean().default(false),
      details: z.string().max(500).optional(),
    }).optional(),
    notes: z.string().max(500).optional(),
  }),
});

/**
 * Student update schema.
 */
export const updateStudentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().min(2).max(100).trim().optional(),
    grade: z.string().trim().optional(),
    section: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    parentIds: z.array(objectIdSchema).optional(),
    primaryGuardianId: objectIdSchema.optional(),
    assignedBusId: objectIdSchema.nullable().optional(),
    busId: objectIdSchema.optional().or(z.literal('')), // From admin form
    // Admin form fields
    parentName: z.string().min(2).max(100).trim().optional(),
    parentPhone: z.string().optional(),
    parentEmail: z.string().email().toLowerCase().trim().optional().or(z.literal('')),
    address: z.string().max(500).trim().optional(),
    pickupLocation: z.object({
      address: z.string().min(1),
      coordinates: coordinatesSchema.optional(),
      notes: z.string().max(200).optional(),
    }).optional(),
    dropoffLocation: z.object({
      address: z.string().min(1),
      coordinates: coordinatesSchema.optional(),
      notes: z.string().max(200).optional(),
    }).optional(),
    specialNeeds: z.object({
      hasSpecialNeeds: z.boolean(),
      details: z.string().max(500).optional(),
    }).optional(),
    notes: z.string().max(500).optional(),
    isActive: z.boolean().optional(),
  }),
});

/**
 * Get student by ID schema.
 */
export const getStudentSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// ============================================
// Face Scan Validators
// ============================================

/**
 * Face scan request schema.
 * Used when driver scans a student's face.
 * 
 * Four-Step Commute Logic:
 * - morning_pickup: Home → Bus (start of day)
 * - morning_dropoff: Bus → School
 * - evening_pickup: School → Bus
 * - evening_dropoff: Bus → Home (end of day)
 */
export const faceScanSchema = z.object({
  body: z.object({
    // Base64 encoded image from camera
    imageBase64: z.string().min(100, 'Invalid image data'),
    // Bus ID for filtering students
    busId: objectIdSchema.optional(),
    // Four-Step scan type
    scanType: z.enum([
      'morning_pickup',    // Step 1: Driver picks up child from home
      'morning_dropoff',   // Step 2: Driver drops child at school
      'evening_pickup',    // Step 3: Driver picks up child from school
      'evening_dropoff'    // Step 4: Driver drops child at home
    ]).default('morning_pickup'),
    // GPS coordinates where scan occurred
    location: coordinatesSchema.optional(),
    // Skip sequence validation (for admin overrides)
    skipValidation: z.boolean().default(false),
  }),
});

/**
 * Manual attendance update schema.
 * For cases where face scan fails.
 */
export const manualAttendanceSchema = z.object({
  body: z.object({
    studentId: objectIdSchema,
    scanType: z.enum([
      'morning_pickup',
      'morning_dropoff',
      'evening_pickup',
      'evening_dropoff',
      'absent'
    ]),
    reason: z.string().max(200).optional(),
    location: coordinatesSchema.optional(),
    skipValidation: z.boolean().default(false),
  }),
});

// ============================================
// Bus Validators
// ============================================

/**
 * Create bus schema.
 */
export const createBusSchema = z.object({
  body: z.object({
    busNumber: z.string().min(1, 'Bus number is required').toUpperCase().trim(),
    licensePlate: z.string().min(1, 'License plate is required').toUpperCase().trim(),
    routeName: z.string().min(1, 'Route name is required').trim(),
    routeDescription: z.string().max(500).optional(),
    capacity: z.number().int().min(1).max(100),
    driverId: objectIdSchema.optional(),
    schedule: z.object({
      morningPickupStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      morningPickupEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      afternoonDropoffStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      afternoonDropoffEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    }).optional(),
  }),
});

/**
 * Update bus location schema.
 * Used by driver app to send location updates.
 */
export const updateBusLocationSchema = z.object({
  body: z.object({
    busId: objectIdSchema,
    longitude: z.number().min(-180).max(180),
    latitude: z.number().min(-90).max(90),
    speed: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
    accuracy: z.number().min(0).optional(),
  }),
});

// ============================================
// Query Validators
// ============================================

/**
 * Pagination query schema.
 */
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * Student list query schema.
 */
export const studentListQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    busId: objectIdSchema.optional(),
    grade: z.string().optional(),
    boardingStatus: z.enum([
      'not_boarded',
      'morning_picked_up',
      'at_school',
      'evening_picked_up',
      'dropped_home',
      'absent'
    ]).optional(),
    search: z.string().max(100).optional(),
  }),
});

// ============================================
// Export all schemas
// ============================================

export default {
  // Common
  objectIdSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  coordinatesSchema,
  faceEncodingSchema,
  
  // Auth
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  
  // Student
  createStudentSchema,
  updateStudentSchema,
  getStudentSchema,
  
  // Face Scan
  faceScanSchema,
  manualAttendanceSchema,
  
  // Bus
  createBusSchema,
  updateBusLocationSchema,
  
  // Query
  paginationSchema,
  studentListQuerySchema,
};
