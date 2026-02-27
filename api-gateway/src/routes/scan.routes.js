/**
 * ============================================
 * GuardianSync v2.0 - Scan Routes
 * ============================================
 * 
 * FOUR-STEP COMMUTE WORKFLOW:
 * 1. morning_pickup   - Driver picks up child from home
 * 2. morning_dropoff  - Driver drops child at school
 * 3. evening_pickup   - Driver picks up child from school
 * 4. evening_dropoff  - Driver drops child at home
 */

import { Router } from 'express';
import scanController from '../controllers/scan.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { faceScanSchema, manualAttendanceSchema } from '../validators/schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// Face Scan Routes
// ============================================

/**
 * @route POST /api/v1/scan/face
 * @desc Scan a face and identify student (Four-Step Commute)
 * @access Driver
 * @body {imageBase64, busId?, scanType, location?, skipValidation?}
 * @scanTypes morning_pickup | morning_dropoff | evening_pickup | evening_dropoff
 */
router.post(
  '/face',
  authorize('driver', 'admin'),
  validate(faceScanSchema),
  scanController.scanFace
);

/**
 * @route POST /api/v1/scan/manual
 * @desc Manual attendance update (Four-Step Commute)
 * @access Driver, Admin
 * @body {studentId, scanType, reason?, location?, skipValidation?}
 */
router.post(
  '/manual',
  authorize('driver', 'admin'),
  validate(manualAttendanceSchema),
  scanController.manualAttendance
);

/**
 * @route GET /api/v1/scan/attendance/:studentId
 * @desc Get today's attendance status for a student
 * @access Admin, Driver, Parent (own children)
 * @query {date?} - Optional date in YYYY-MM-DD format
 */
router.get(
  '/attendance/:studentId',
  authorize('admin', 'driver', 'parent'),
  scanController.getStudentAttendance
);

/**
 * @route GET /api/v1/scan/bus/:busId/attendance
 * @desc Get attendance summary for all students on a bus
 * @access Admin, Driver (own bus)
 */
router.get(
  '/bus/:busId/attendance',
  authorize('admin', 'driver'),
  scanController.getBusAttendance
);

/**
 * @route POST /api/v1/scan/compare
 * @desc Compare two face encodings (utility endpoint)
 * @access Admin
 */
router.post(
  '/compare',
  authorize('admin'),
  scanController.compareFaces
);

/**
 * @route POST /api/v1/scan/verify/:studentId
 * @desc Verify a face against a specific student
 * @access Admin, Driver
 */
router.post(
  '/verify/:studentId',
  authorize('admin', 'driver'),
  scanController.verifyStudentFace
);

export default router;
