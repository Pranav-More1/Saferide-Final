/**
 * ============================================
 * GuardianSync v2.0 - Student Routes
 * ============================================
 */

import { Router } from 'express';
import multer from 'multer';
import studentController from '../controllers/student.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createStudentSchema,
  updateStudentSchema,
  getStudentSchema,
  studentListQuerySchema,
} from '../validators/schemas.js';

const router = Router();

// ============================================
// Multer Configuration for Face Image Upload
// ============================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// ============================================
// All routes require authentication
// ============================================

router.use(authenticate);

// ============================================
// Student CRUD Routes
// ============================================

/**
 * @route GET /api/v1/students
 * @desc Get all students with filtering
 * @access Admin, Driver (own bus only)
 */
router.get(
  '/',
  authorize('admin', 'driver'),
  validate(studentListQuerySchema),
  studentController.getStudents
);

/**
 * @route POST /api/v1/students
 * @desc Create a new student
 * @access Admin
 */
router.post(
  '/',
  authorize('admin'),
  validate(createStudentSchema),
  studentController.createStudent
);

/**
 * @route GET /api/v1/students/:id
 * @desc Get student by ID
 * @access Admin, Driver (own bus), Parent (own child)
 */
router.get(
  '/:id',
  authorize('admin', 'driver', 'parent'),
  validate(getStudentSchema),
  studentController.getStudentById
);

/**
 * @route PATCH /api/v1/students/:id
 * @desc Update student
 * @access Admin
 */
router.patch(
  '/:id',
  authorize('admin'),
  validate(updateStudentSchema),
  studentController.updateStudent
);

/**
 * @route DELETE /api/v1/students/:id
 * @desc Deactivate student
 * @access Admin
 */
router.delete(
  '/:id',
  authorize('admin'),
  validate(getStudentSchema),
  studentController.deleteStudent
);

// ============================================
// Face Registration Routes
// ============================================

/**
 * @route POST /api/v1/students/:id/face
 * @desc Register student's face
 * @access Admin
 */
router.post(
  '/:id/face',
  authorize('admin'),
  upload.single('photo'),
  studentController.registerFace
);

/**
 * @route DELETE /api/v1/students/:id/face
 * @desc Remove student's face registration
 * @access Admin
 */
router.delete(
  '/:id/face',
  authorize('admin'),
  studentController.removeFace
);

// ============================================
// Boarding Status Routes
// ============================================

/**
 * @route GET /api/v1/students/bus/:busId/status
 * @desc Get boarding status for all students on a bus
 * @access Admin, Driver (own bus)
 */
router.get(
  '/bus/:busId/status',
  authorize('admin', 'driver'),
  studentController.getBoardingStatus
);

/**
 * @route POST /api/v1/students/bus/:busId/reset-status
 * @desc Reset boarding status for all students on a bus
 * @access Admin, Driver (own bus)
 */
router.post(
  '/bus/:busId/reset-status',
  authorize('admin', 'driver'),
  studentController.resetBoardingStatus
);

export default router;
