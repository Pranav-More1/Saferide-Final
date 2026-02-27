/**
 * ============================================
 * GuardianSync v2.0 - Student Controller
 * ============================================
 * 
 * Handles all student-related operations:
 * - CRUD operations for students
 * - Face registration (with AI service integration)
 * - Student assignment to buses
 * 
 * ARCHITECTURE:
 * 1. Image upload -> Cloud storage (S3/Cloudinary)
 * 2. Image -> Python AI service -> Face encoding (128 floats)
 * 3. Face encoding + photo URL -> MongoDB
 * 
 * NO raw images are stored in the database.
 */

import { Student, Bus, User } from '../models/index.js';
import aiService from '../services/aiService.js';
import storageService from '../services/storageService.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// ============================================
// Student CRUD Operations
// ============================================

/**
 * Create a new student.
 * Does NOT include face registration - use registerFace endpoint separately.
 * 
 * @route POST /api/v1/students
 * @access Admin
 */
export const createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    studentId,
    grade,
    section,
    dateOfBirth,
    parentIds,
    primaryGuardianId,
    assignedBusId,
    busId, // From admin form
    pickupLocation,
    dropoffLocation,
    specialNeeds,
    notes,
    // Admin form fields
    parentName,
    parentPhone,
    parentEmail,
    address,
  } = req.body;

  // Auto-generate studentId if not provided
  const finalStudentId = studentId || `STU${Date.now().toString(36).toUpperCase()}`;

  // Check if student ID already exists
  const existingStudent = await Student.findOne({ studentId: finalStudentId });
  if (existingStudent) {
    throw new ApiError(409, 'Student ID already exists');
  }

  // Validate parent IDs if provided
  if (parentIds && parentIds.length > 0) {
    const parents = await User.find({ _id: { $in: parentIds }, role: 'parent' });
    if (parents.length !== parentIds.length) {
      throw new ApiError(400, 'One or more parent IDs are invalid');
    }
  }

  // Use busId from form or assignedBusId
  const finalBusId = (busId && busId.length === 24) ? busId : assignedBusId;

  // Validate bus ID if provided
  if (finalBusId) {
    const bus = await Bus.findById(finalBusId);
    if (!bus) {
      throw new ApiError(400, 'Invalid bus ID');
    }
  }

  // Build pickup location from address if provided (without coordinates unless specified)
  let finalPickupLocation = undefined;
  if (pickupLocation?.address || address) {
    finalPickupLocation = {
      address: pickupLocation?.address || address,
      notes: pickupLocation?.notes,
    };
    // Only add coordinates if actually provided
    if (pickupLocation?.coordinates?.longitude && pickupLocation?.coordinates?.latitude) {
      finalPickupLocation.coordinates = {
        type: 'Point',
        coordinates: [pickupLocation.coordinates.longitude, pickupLocation.coordinates.latitude],
      };
    }
  }

  // Build dropoff location if provided
  let finalDropoffLocation = undefined;
  if (dropoffLocation?.address) {
    finalDropoffLocation = {
      address: dropoffLocation.address,
      notes: dropoffLocation.notes,
    };
    if (dropoffLocation?.coordinates?.longitude && dropoffLocation?.coordinates?.latitude) {
      finalDropoffLocation.coordinates = {
        type: 'Point',
        coordinates: [dropoffLocation.coordinates.longitude, dropoffLocation.coordinates.latitude],
      };
    }
  }

  // Create student record
  const student = await Student.create({
    name,
    studentId: finalStudentId,
    grade,
    section,
    dateOfBirth,
    parents: parentIds || [],
    primaryGuardian: primaryGuardianId,
    assignedBus: finalBusId,
    // Store parent info directly on student
    parentName,
    parentPhone,
    parentEmail,
    pickupLocation: finalPickupLocation,
    dropoffLocation: finalDropoffLocation,
    specialNeeds,
    notes,
  });

  // Update parent's children array
  if (parentIds && parentIds.length > 0) {
    await User.updateMany(
      { _id: { $in: parentIds } },
      { $addToSet: { children: student._id } }
    );
  }

  logger.info(`Student created: ${student.studentId} by admin ${req.user._id}`);

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: student,
  });
});

/**
 * Get all students with filtering and pagination.
 * 
 * @route GET /api/v1/students
 * @access Admin, Driver (own bus only)
 */
export const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, busId, grade, boardingStatus, search } = req.query;

  // Build query
  const query = { isActive: true };

  // Filter by bus
  if (busId) {
    query.assignedBus = busId;
  }

  // For drivers, only show students on their bus
  if (req.user.role === 'driver') {
    if (!req.user.assignedBus) {
      return res.json({
        success: true,
        data: [],
        pagination: { total: 0, page, limit },
      });
    }
    query.assignedBus = req.user.assignedBus;
  }

  // Filter by grade
  if (grade) {
    query.grade = grade;
  }

  // Filter by boarding status
  if (boardingStatus) {
    query.boardingStatus = boardingStatus;
  }

  // Text search
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
    ];
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;

  const [students, total] = await Promise.all([
    Student.find(query)
      .populate('assignedBus', 'busNumber routeName')
      .populate('primaryGuardian', 'name phone email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 })
      .lean(),
    Student.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: students,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get a single student by ID.
 * 
 * @route GET /api/v1/students/:id
 * @access Admin, Driver (own bus), Parent (own child)
 */
export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id)
    .populate('assignedBus', 'busNumber routeName driver')
    .populate('parents', 'name phone email')
    .populate('primaryGuardian', 'name phone email');

  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Access control
  if (req.user.role === 'driver') {
    if (!student.assignedBus || student.assignedBus._id.toString() !== req.user.assignedBus?.toString()) {
      throw new ApiError(403, 'Access denied to this student');
    }
  }

  if (req.user.role === 'parent') {
    if (!student.parents.some(p => p._id.toString() === req.user._id.toString())) {
      throw new ApiError(403, 'Access denied to this student');
    }
  }

  res.json({
    success: true,
    data: student,
  });
});

/**
 * Update a student.
 * 
 * @route PATCH /api/v1/students/:id
 * @access Admin
 */
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Handle busId from admin form -> assignedBus
  if (updates.busId !== undefined) {
    updates.assignedBus = updates.busId && updates.busId.length === 24 ? updates.busId : null;
    delete updates.busId;
  }

  // Handle location updates
  if (updates.pickupLocation?.coordinates) {
    updates.pickupLocation.coordinates = {
      type: 'Point',
      coordinates: [
        updates.pickupLocation.coordinates.longitude,
        updates.pickupLocation.coordinates.latitude,
      ],
    };
  }

  if (updates.dropoffLocation?.coordinates) {
    updates.dropoffLocation.coordinates = {
      type: 'Point',
      coordinates: [
        updates.dropoffLocation.coordinates.longitude,
        updates.dropoffLocation.coordinates.latitude,
      ],
    };
  }

  // Apply updates
  Object.assign(student, updates);
  await student.save();

  logger.info(`Student updated: ${student.studentId} by admin ${req.user._id}`);

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: student,
  });
});

/**
 * Delete (deactivate) a student.
 * 
 * @route DELETE /api/v1/students/:id
 * @access Admin
 */
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Soft delete
  student.isActive = false;
  await student.save();

  // Remove from parents' children arrays
  await User.updateMany(
    { children: student._id },
    { $pull: { children: student._id } }
  );

  logger.info(`Student deactivated: ${student.studentId} by admin ${req.user._id}`);

  res.json({
    success: true,
    message: 'Student deactivated successfully',
  });
});

// ============================================
// Face Registration
// ============================================

/**
 * Register a student's face.
 * 
 * WORKFLOW:
 * 1. Receive image (multipart/form-data)
 * 2. Upload image to cloud storage (S3/Cloudinary)
 * 3. Send image to Python AI service for face encoding
 * 4. Store face encoding (128 floats) and photo URL in MongoDB
 * 
 * @route POST /api/v1/students/:id/face
 * @access Admin
 */
export const registerFace = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate student exists
  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Check if file was uploaded
  if (!req.file) {
    throw new ApiError(400, 'No image file provided');
  }

  logger.info(`Processing face registration for student: ${student.studentId}`);

  try {
    // ==========================================
    // STEP 1: Upload image to cloud storage
    // ==========================================
    // This is where S3 or Cloudinary upload happens.
    // The actual image is stored externally, NOT in MongoDB.

    const { url: photoUrl, key: storageKey } = await storageService.uploadImage(
      req.file.buffer,
      'student-photos', // Folder in cloud storage
      `${student.studentId}-${Date.now()}.jpg`
    );

    logger.info(`Photo uploaded to storage: ${storageKey}`);

    // ==========================================
    // STEP 2: Generate face encoding via AI service
    // ==========================================
    // Send the image to the Python FastAPI service.
    // This is NON-BLOCKING for the Node.js event loop.

    const encodingResult = await aiService.encodeFaceFromBuffer(
      req.file.buffer,
      req.file.originalname
    );

    // Check if face was detected successfully
    if (!encodingResult.success || !encodingResult.face_encoding) {
      // Clean up uploaded photo since face encoding failed
      await storageService.deleteImage(storageKey);

      throw new ApiError(400, encodingResult.message || 'No face detected in the image. Please upload a clear face photo.');
    }

    // Warn if multiple faces detected
    if (encodingResult.faces_detected > 1) {
      logger.warn(`Multiple faces (${encodingResult.faces_detected}) detected for student ${student.studentId}. Using first face.`);
    }

    // ==========================================
    // STEP 3: Save encoding and photo URL to MongoDB
    // ==========================================
    // ONLY the face encoding (128 floats) and URL are stored.
    // NO raw image data in the database.

    // Delete old photo if exists
    if (student.photoUrl) {
      await storageService.deleteImage(student.photoUrl);
    }

    // Update student with face data
    await student.updateFaceEncoding(encodingResult.face_encoding, photoUrl);

    logger.info(`Face registered successfully for student: ${student.studentId}`);

    res.json({
      success: true,
      message: 'Face registered successfully',
      data: {
        studentId: student.studentId,
        photoUrl: student.photoUrl,
        hasFaceEncoding: student.hasFaceEncoding,
        facesDetected: encodingResult.faces_detected,
      },
    });
  } catch (error) {
    // Re-throw ApiErrors
    if (error instanceof ApiError) {
      throw error;
    }

    logger.error('Face registration failed:', error);
    throw new ApiError(500, `Face registration failed: ${error.message}`);
  }
});

/**
 * Remove a student's face registration.
 * Used for GDPR compliance or re-registration.
 * 
 * @route DELETE /api/v1/students/:id/face
 * @access Admin
 */
export const removeFace = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findById(id);
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Delete photo from storage
  if (student.photoUrl) {
    await storageService.deleteImage(student.photoUrl);
  }

  // Clear face encoding
  await student.clearFaceEncoding();

  logger.info(`Face registration removed for student: ${student.studentId}`);

  res.json({
    success: true,
    message: 'Face registration removed successfully',
  });
});

// ============================================
// Boarding Status
// ============================================

/**
 * Get boarding status for all students on a bus.
 * 
 * @route GET /api/v1/students/bus/:busId/status
 * @access Admin, Driver (own bus)
 */
export const getBoardingStatus = asyncHandler(async (req, res) => {
  const { busId } = req.params;

  // Verify bus exists
  const bus = await Bus.findById(busId);
  if (!bus) {
    throw new ApiError(404, 'Bus not found');
  }

  // Access control for drivers
  if (req.user.role === 'driver' && bus._id.toString() !== req.user.assignedBus?.toString()) {
    throw new ApiError(403, 'Access denied to this bus');
  }

  // Get all students on this bus with boarding status
  const students = await Student.find({
    assignedBus: busId,
    isActive: true,
  })
    .select('name studentId grade boardingStatus lastBoardingEvent photoUrl hasFaceEncoding')
    .sort({ name: 1 })
    .lean();

  // Summarize counts using Four-Step Commute Logic statuses
  const summary = {
    total: students.length,
    waiting: students.filter(s => s.boardingStatus === 'not_boarded').length,
    morningPickedUp: students.filter(s => s.boardingStatus === 'morning_picked_up').length,
    atSchool: students.filter(s => s.boardingStatus === 'at_school').length,
    eveningPickedUp: students.filter(s => s.boardingStatus === 'evening_picked_up').length,
    droppedHome: students.filter(s => s.boardingStatus === 'dropped_home').length,
    absent: students.filter(s => s.boardingStatus === 'absent').length,
  };

  res.json({
    success: true,
    data: {
      bus: {
        id: bus._id,
        busNumber: bus.busNumber,
        routeName: bus.routeName,
      },
      summary,
      students,
    },
  });
});

/**
 * Reset boarding status for all students on a bus.
 * Called at the start of a new trip.
 * 
 * @route POST /api/v1/students/bus/:busId/reset-status
 * @access Admin, Driver (own bus)
 */
export const resetBoardingStatus = asyncHandler(async (req, res) => {
  const { busId } = req.params;

  // Verify bus exists and access control
  const bus = await Bus.findById(busId);
  if (!bus) {
    throw new ApiError(404, 'Bus not found');
  }

  if (req.user.role === 'driver' && bus._id.toString() !== req.user.assignedBus?.toString()) {
    throw new ApiError(403, 'Access denied to this bus');
  }

  // Reset all students on this bus
  const result = await Student.updateMany(
    { assignedBus: busId, isActive: true },
    { $set: { boardingStatus: 'not_boarded' } }
  );

  logger.info(`Boarding status reset for bus ${bus.busNumber}: ${result.modifiedCount} students`);

  res.json({
    success: true,
    message: `Boarding status reset for ${result.modifiedCount} students`,
  });
});

export default {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  registerFace,
  removeFace,
  getBoardingStatus,
  resetBoardingStatus,
};
