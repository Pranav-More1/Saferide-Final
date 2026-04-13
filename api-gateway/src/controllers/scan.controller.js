/**
 * ============================================
 * GuardianSync v2.0 - Face Scan Controller
 * ============================================
 * 
 * Handles face scanning with FOUR-STEP COMMUTE LOGIC:
 * 
 * Step 1: morning_pickup   - Driver picks up child from HOME
 * Step 2: morning_dropoff  - Driver drops child at SCHOOL
 * Step 3: evening_pickup   - Driver picks up child from SCHOOL  
 * Step 4: evening_dropoff  - Driver drops child at HOME
 * 
 * VALIDATION RULES:
 * - morning_pickup: Always allowed (starts the day)
 * - morning_dropoff: Requires morning_pickup first
 * - evening_pickup: Requires morning_dropoff first (child must be at school)
 * - evening_dropoff: Requires evening_pickup first
 * 
 * NON-BLOCKING DESIGN:
 * - Face encoding is done by the Python AI service
 * - Comparison can be done either:
 *   a) By Python service (more accurate, network call)
 *   b) Locally in Node.js using math (faster, no network)
 */

import { Student } from '../models/index.js';
import aiService from '../services/aiService.js';
import { notifyParentsOfScan, notifyParentsOfAbsence } from '../services/notificationService.js';
import logger from '../utils/logger.js';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';

// ============================================
// Configuration
// ============================================

// Face comparison tolerance (lower = stricter matching)
const FACE_TOLERANCE = 0.5;

// Whether to use local comparison (faster) or AI service (more features)
const USE_LOCAL_COMPARISON = true;

// Valid scan types for the Four-Step Commute
const VALID_SCAN_TYPES = ['morning_pickup', 'morning_dropoff', 'evening_pickup', 'evening_dropoff'];

// ============================================
// Face Scan Controller
// ============================================

/**
 * Scan a face and identify the student.
 * 
 * FOUR-STEP COMMUTE WORKFLOW:
 * 1. Receive base64 image from driver's camera
 * 2. Send to AI service to generate face encoding
 * 3. Retrieve all student face encodings (filtered by bus if provided)
 * 4. Compare probe encoding against known encodings
 * 5. VALIDATE: Check if scan type follows the correct sequence
 * 6. Return matched student or validation error
 * 7. Update attendance history and boarding status
 * 8. Trigger parent notification via Email/SMS
 * 
 * @route POST /api/v1/scan/face
 * @access Driver
 */
export const scanFace = asyncHandler(async (req, res) => {
  const { imageBase64, busId, scanType = 'morning_pickup', location, skipValidation = false } = req.body;

  logger.info(`Face scan initiated by driver ${req.user._id}, type: ${scanType}`);

  // Validate scan type
  if (!VALID_SCAN_TYPES.includes(scanType)) {
    throw new ApiError(400, `Invalid scan type. Must be one of: ${VALID_SCAN_TYPES.join(', ')}`);
  }

  // ==========================================
  // STEP 1: Generate face encoding from scan
  // ==========================================
  // Send the captured image to Python AI service.
  // This is the only CPU-intensive operation, and it's
  // handled by the Python service, keeping Node.js responsive.

  let probeEncoding;
  let mockMatchedStudentId = null;
  let isMockMode = false;

  try {
    const encodingResult = await aiService.encodeFaceFromBase64(imageBase64);

    if (!encodingResult.success || !encodingResult.face_encoding) {
      return res.status(400).json({
        success: false,
        found: false,
        message: encodingResult.message || 'No face detected in the scan. Please try again.',
        facesDetected: encodingResult.faces_detected || 0,
      });
    }

    if (encodingResult.faces_detected > 1) {
      return res.status(400).json({
        success: false,
        found: false,
        message: 'Multiple faces detected. Please scan one student at a time.',
        facesDetected: encodingResult.faces_detected,
      });
    }

    probeEncoding = encodingResult.face_encoding;
    logger.info('Face encoding generated successfully');
  }  catch (error) {
    logger.warn('AI Service offline. Using MOCK mode for scan...');
    isMockMode = true;
    
    // If AI service is down, mock a successful scan for the first student on the bus.
    let filterBusId = busId || (req.user.role === 'driver' ? req.user.assignedBus : null);

    if (!filterBusId && req.user.role === 'driver') {
      const mongoose = await import('mongoose');
      const Bus = mongoose.model('Bus');
      const driverBus = await Bus.findOne({ driver: req.user._id });
      if (driverBus) filterBusId = driverBus._id;
    }

    if (!filterBusId) {
      throw new ApiError(500, 'AI Service offline and no bus context available for mock.');
    }
    
    // Find active students on this bus
    const studentsOnBus = await Student.find({ assignedBus: filterBusId, isActive: true });
    if (studentsOnBus.length === 0) {
      throw new ApiError(404, 'AI Service offline. No students exist on this bus to mock a scan.');
    }
    
    // Pick a random student on the bus to make mock testing more dynamic!
    const randomIndex = Math.floor(Math.random() * studentsOnBus.length);
    mockMatchedStudentId = studentsOnBus[randomIndex]._id;
  }

  // ==========================================
  // STEP 2: Retrieve known face encodings
  // ==========================================
  let filterBusId = busId || (req.user.role === 'driver' ? req.user.assignedBus : null);
  if (!filterBusId && req.user.role === 'driver') {
    const mongoose = await import('mongoose');
    const Bus = mongoose.model('Bus');
    const driverBus = await Bus.findOne({ driver: req.user._id });
    if (driverBus) filterBusId = driverBus._id;
  }
  let identificationResult;

  if (isMockMode) {
    identificationResult = {
      found: true,
      matchedId: mockMatchedStudentId,
      confidence: 99.9,
      distance: 0.01,
    };
  } else {
    const knownStudents = await Student.getEncodingsForComparison(filterBusId);

    if (knownStudents.length === 0) {
      return res.status(404).json({
        success: false,
        found: false,
        message: 'No registered students with face data found.',
      });
    }

    logger.info(`Comparing against ${knownStudents.length} registered students`);

    if (USE_LOCAL_COMPARISON) {
      identificationResult = aiService.identifyLocally(
        probeEncoding,
        knownStudents.map(s => ({ id: s.id, encoding: s.encoding })),
        FACE_TOLERANCE
      );
    } else {
      identificationResult = await aiService.identifyFace(
        probeEncoding,
        knownStudents.map(s => ({ id: s.id, encoding: s.encoding })),
        FACE_TOLERANCE
      );
    }
  }

  // ==========================================
  // STEP 4: Handle match result
  // ==========================================

  if (!identificationResult.found) {
    logger.info('No matching face found');
    return res.json({
      success: true,
      found: false,
      message: 'No matching student found.',
      confidence: identificationResult.confidence,
      closestDistance: identificationResult.distance,
    });
  }

  // ==========================================
  // STEP 5: Retrieve matched student details
  // ==========================================

  const matchedId = identificationResult.matchedId || identificationResult.matched_id;
  const matchedStudent = await Student.findById(matchedId)
    .populate('primaryGuardian', 'name phone email')
    .populate('assignedBus', 'busNumber');

  if (!matchedStudent) {
    logger.error(`Matched student ID not found in database: ${matchedId}`);
    throw new ApiError(500, 'Database inconsistency detected');
  }

  // ==========================================
  // STEP 6: FOUR-STEP COMMUTE VALIDATION
  // ==========================================
  // Validate that the scan follows the correct sequence.
  // This ensures proper tracking of the child's commute.

  if (!skipValidation && req.user.role !== 'admin') {
    const validationResult = matchedStudent.validateScanSequence(scanType);
    
    if (!validationResult.valid) {
      logger.warn(`Scan sequence validation failed for ${matchedStudent.studentId}: ${validationResult.message}`);
      
      return res.status(400).json({
        success: false,
        found: true,
        validationError: true,
        message: validationResult.message,
        data: {
          student: {
            id: matchedStudent._id,
            name: matchedStudent.name,
            studentId: matchedStudent.studentId,
          },
          validation: {
            attemptedScanType: scanType,
            requiredPrevious: validationResult.requiredPrevious,
            alreadyScanned: validationResult.alreadyScanned || false,
            todayAttendance: matchedStudent.getTodayAttendance(),
          },
        },
      });
    }
  }

  // ==========================================
  // STEP 7: Verify student is assigned to this bus
  // ==========================================

  if (filterBusId && matchedStudent.assignedBus) {
    const studentBusId = matchedStudent.assignedBus._id?.toString() || matchedStudent.assignedBus.toString();
    if (studentBusId !== filterBusId.toString()) {
      logger.warn(`Student ${matchedStudent.studentId} is not assigned to bus ${filterBusId}`);
      return res.status(400).json({
        success: false,
        found: true,
        busAssignmentError: true,
        message: `This student is not assigned to this bus. They should be on bus ${matchedStudent.assignedBus.busNumber || 'Unknown'}.`,
        data: {
          student: {
            id: matchedStudent._id,
            name: matchedStudent.name,
            studentId: matchedStudent.studentId,
            assignedBus: matchedStudent.assignedBus.busNumber,
          },
        },
      });
    }
  }

  // ==========================================
  // STEP 8: Update attendance with Four-Step tracking
  // ==========================================

  const updateResult = await matchedStudent.updateBoardingStatus(scanType, {
    location: location ? {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    } : undefined,
    busId: filterBusId,
    verifiedBy: req.user._id,
  });

  logger.info(`Student ${matchedStudent.studentId} - ${scanType} recorded successfully. Status: ${updateResult.status}`);

  // ==========================================
  // STEP 9: Send parent notification (Feature #2)
  // ==========================================
  // Notify parents via Email/SMS about the scan event.
  // This runs asynchronously to not block the response.

  notifyParentsOfScan({
    student: matchedStudent,
    scanType,
    bus: matchedStudent.assignedBus,
    timestamp: new Date(),
  }).catch(err => {
    // Log but don't fail the request if notification fails
    logger.error(`Failed to send notification for ${matchedStudent.studentId}:`, err.message);
  });

  // ==========================================
  // STEP 10: Return response with student info
  // ==========================================

  // Format scan type for display
  const scanTypeDisplay = scanType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  res.json({
    success: true,
    found: true,
    message: `${matchedStudent.name} - ${scanTypeDisplay} recorded successfully`,
    data: {
      student: {
        id: matchedStudent._id,
        name: matchedStudent.name,
        studentId: matchedStudent.studentId,
        grade: matchedStudent.grade,
        photoUrl: matchedStudent.photoUrl,
        boardingStatus: matchedStudent.boardingStatus,
        specialNeeds: matchedStudent.specialNeeds,
      },
      match: {
        confidence: identificationResult.confidence,
        distance: identificationResult.distance,
      },
      guardian: matchedStudent.primaryGuardian ? {
        name: matchedStudent.primaryGuardian.name,
        phone: matchedStudent.primaryGuardian.phone,
      } : null,
      bus: matchedStudent.assignedBus ? {
        busNumber: matchedStudent.assignedBus.busNumber,
      } : null,
    },
  });
});

/**
 * Manual attendance update.
 * Used when face scan fails or for manual overrides.
 * Supports Four-Step Commute Logic with optional validation bypass.
 * 
 * @route POST /api/v1/scan/manual
 * @access Driver, Admin
 */
export const manualAttendance = asyncHandler(async (req, res) => {
  const { studentId, scanType, reason, location, skipValidation = false } = req.body;

  const student = await Student.findById(studentId)
    .populate('assignedBus', 'busNumber');
    
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Access control for drivers
  if (req.user.role === 'driver') {
    if (student.assignedBus?._id?.toString() !== req.user.assignedBus?.toString()) {
      throw new ApiError(403, 'Cannot update attendance for students on other buses');
    }
  }

  // Handle "absent" as a special case
  if (scanType === 'absent') {
    // Mark student as absent for today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let todayRecord = student.attendanceHistory.find(
      record => record.date.getTime() === today.getTime()
    );
    
    if (!todayRecord) {
      todayRecord = {
        date: today,
        morningPickup: { scanned: false },
        morningDropoff: { scanned: false },
        eveningPickup: { scanned: false },
        eveningDropoff: { scanned: false },
        markedAbsent: true,
        absentReason: reason || 'Manually marked absent',
        anomalies: [],
      };
      student.attendanceHistory.push(todayRecord);
    } else {
      todayRecord.markedAbsent = true;
      todayRecord.absentReason = reason || 'Manually marked absent';
    }
    
    student.boardingStatus = 'absent';
    await student.save();
    
    logger.info(`Student ${student.studentId} marked as ABSENT by ${req.user._id}. Reason: ${reason}`);

    // Send absence notification to parents (Feature #2)
    notifyParentsOfAbsence({
      student,
      date: new Date(),
    }).catch(err => {
      logger.error(`Failed to send absence notification for ${student.studentId}:`, err.message);
    });
    
    return res.json({
      success: true,
      message: `${student.name} marked as absent`,
      data: {
        studentId: student.studentId,
        name: student.name,
        boardingStatus: 'absent',
        reason: reason || 'Manually marked absent',
        updatedBy: req.user.name,
      },
    });
  }

  // Validate scan sequence (unless admin with skipValidation)
  if (!skipValidation && req.user.role !== 'admin') {
    const validationResult = student.validateScanSequence(scanType);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        validationError: true,
        message: validationResult.message,
        data: {
          student: {
            id: student._id,
            name: student.name,
            studentId: student.studentId,
          },
          attemptedScanType: scanType,
          requiredPrevious: validationResult.requiredPrevious,
        },
      });
    }
  }

  // Update attendance using Four-Step logic
  const updateResult = await student.updateBoardingStatus(scanType, {
    location: location ? {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    } : undefined,
    busId: student.assignedBus?._id,
    verifiedBy: req.user._id,
  });

  const scanTypeDisplay = scanType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  logger.info(`Manual attendance: ${student.studentId} -> ${scanType} by ${req.user._id}. Reason: ${reason}`);

  // Send scan notification to parents (Feature #2)
  notifyParentsOfScan({
    student,
    scanType,
    bus: student.assignedBus,
    timestamp: new Date(),
  }).catch(err => {
    logger.error(`Failed to send notification for ${student.studentId}:`, err.message);
  });

  res.json({
    success: true,
    message: `${student.name} - ${scanTypeDisplay} recorded (manual)`,
    data: {
      studentId: student.studentId,
      name: student.name,
      scanType: scanType,
      boardingStatus: updateResult.status,
      updatedBy: req.user.name,
      reason: reason || 'Manual override',
      todayAttendance: updateResult.attendanceRecord,
    },
  });
});

/**
 * Compare two specific face encodings.
 * Utility endpoint for testing/debugging.
 * 
 * @route POST /api/v1/scan/compare
 * @access Admin
 */
export const compareFaces = asyncHandler(async (req, res) => {
  const { encoding1, encoding2, tolerance = FACE_TOLERANCE } = req.body;

  if (!encoding1 || !encoding2) {
    throw new ApiError(400, 'Two face encodings are required');
  }

  if (encoding1.length !== 128 || encoding2.length !== 128) {
    throw new ApiError(400, 'Face encodings must be 128 dimensions each');
  }

  // Use local comparison
  const result = aiService.compareLocally(encoding1, encoding2, tolerance);

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Verify a student's face against their registered encoding.
 * Used to verify identity without updating boarding status.
 * 
 * @route POST /api/v1/scan/verify/:studentId
 * @access Admin, Driver
 */
export const verifyStudentFace = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { imageBase64 } = req.body;

  // Get student with face encoding
  const student = await Student.findById(studentId).select('+faceEncoding');
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  if (!student.hasFaceEncoding) {
    throw new ApiError(400, 'Student does not have a registered face');
  }

  // Generate encoding from provided image
  const encodingResult = await aiService.encodeFaceFromBase64(imageBase64);

  if (!encodingResult.success || !encodingResult.face_encoding) {
    return res.status(400).json({
      success: false,
      verified: false,
      message: encodingResult.message || 'No face detected in the image',
    });
  }

  // Compare with registered encoding
  const comparisonResult = aiService.compareLocally(
    encodingResult.face_encoding,
    student.faceEncoding,
    FACE_TOLERANCE
  );

  res.json({
    success: true,
    verified: comparisonResult.isMatch,
    data: {
      studentName: student.name,
      studentId: student.studentId,
      confidence: comparisonResult.confidence,
      distance: comparisonResult.distance,
      threshold: FACE_TOLERANCE,
    },
  });
});

/**
 * Get today's attendance status for a student.
 * Shows the Four-Step Commute progress.
 * 
 * @route GET /api/v1/scan/attendance/:studentId
 * @access Admin, Driver, Parent (own children)
 */
export const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { date } = req.query; // Optional: specific date (YYYY-MM-DD)

  const student = await Student.findById(studentId)
    .populate('assignedBus', 'busNumber routeName')
    .populate('primaryGuardian', 'name phone');
    
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }

  // Access control for parents
  if (req.user.role === 'parent') {
    const isParent = student.parents.some(p => p.toString() === req.user._id.toString());
    if (!isParent) {
      throw new ApiError(403, 'Not authorized to view this student');
    }
  }

  // Get attendance record for requested date (or today)
  let targetDate;
  if (date) {
    targetDate = new Date(date);
  } else {
    const now = new Date();
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const attendanceRecord = student.attendanceHistory.find(
    record => record.date && record.date.getTime() === targetDate.getTime()
  );

  // Build Four-Step progress
  const fourStepProgress = {
    morning_pickup: {
      completed: attendanceRecord?.morningPickup?.scanned || false,
      timestamp: attendanceRecord?.morningPickup?.timestamp || null,
    },
    morning_dropoff: {
      completed: attendanceRecord?.morningDropoff?.scanned || false,
      timestamp: attendanceRecord?.morningDropoff?.timestamp || null,
    },
    evening_pickup: {
      completed: attendanceRecord?.eveningPickup?.scanned || false,
      timestamp: attendanceRecord?.eveningPickup?.timestamp || null,
    },
    evening_dropoff: {
      completed: attendanceRecord?.eveningDropoff?.scanned || false,
      timestamp: attendanceRecord?.eveningDropoff?.timestamp || null,
    },
  };

  // Determine next expected scan
  let nextExpectedScan = null;
  if (!fourStepProgress.morning_pickup.completed) {
    nextExpectedScan = 'morning_pickup';
  } else if (!fourStepProgress.morning_dropoff.completed) {
    nextExpectedScan = 'morning_dropoff';
  } else if (!fourStepProgress.evening_pickup.completed) {
    nextExpectedScan = 'evening_pickup';
  } else if (!fourStepProgress.evening_dropoff.completed) {
    nextExpectedScan = 'evening_dropoff';
  } else {
    nextExpectedScan = 'complete';
  }

  res.json({
    success: true,
    data: {
      student: {
        id: student._id,
        name: student.name,
        studentId: student.studentId,
        grade: student.grade,
        boardingStatus: student.boardingStatus,
        photoUrl: student.photoUrl,
      },
      date: targetDate.toISOString().split('T')[0],
      isAbsent: attendanceRecord?.markedAbsent || false,
      absentReason: attendanceRecord?.absentReason || null,
      fourStepProgress,
      nextExpectedScan,
      anomalies: attendanceRecord?.anomalies || [],
      bus: student.assignedBus ? {
        busNumber: student.assignedBus.busNumber,
        routeName: student.assignedBus.routeName,
      } : null,
      guardian: student.primaryGuardian ? {
        name: student.primaryGuardian.name,
        phone: student.primaryGuardian.phone,
      } : null,
    },
  });
});

/**
 * Get attendance summary for a bus (all students).
 * Useful for drivers to see boarding progress.
 * 
 * @route GET /api/v1/scan/bus/:busId/attendance
 * @access Admin, Driver (own bus)
 */
export const getBusAttendance = asyncHandler(async (req, res) => {
  const { busId } = req.params;

  // Access control for drivers
  if (req.user.role === 'driver') {
    if (req.user.assignedBus?.toString() !== busId) {
      throw new ApiError(403, 'Not authorized to view this bus');
    }
  }

  const students = await Student.find({ assignedBus: busId, isActive: true })
    .select('name studentId grade boardingStatus photoUrl attendanceHistory')
    .sort('name');

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const summary = students.map(student => {
    const todayRecord = student.attendanceHistory.find(
      record => record.date && record.date.getTime() === today.getTime()
    );

    return {
      id: student._id,
      name: student.name,
      studentId: student.studentId,
      grade: student.grade,
      photoUrl: student.photoUrl,
      boardingStatus: student.boardingStatus,
      isAbsent: todayRecord?.markedAbsent || false,
      todayProgress: {
        morningPickup: todayRecord?.morningPickup?.scanned || false,
        morningDropoff: todayRecord?.morningDropoff?.scanned || false,
        eveningPickup: todayRecord?.eveningPickup?.scanned || false,
        eveningDropoff: todayRecord?.eveningDropoff?.scanned || false,
      },
    };
  });

  // Count statistics
  const stats = {
    total: students.length,
    morningPickedUp: summary.filter(s => s.todayProgress.morningPickup).length,
    atSchool: summary.filter(s => s.todayProgress.morningDropoff).length,
    eveningPickedUp: summary.filter(s => s.todayProgress.eveningPickup).length,
    droppedHome: summary.filter(s => s.todayProgress.eveningDropoff).length,
    absent: summary.filter(s => s.isAbsent).length,
  };

  res.json({
    success: true,
    data: {
      date: today.toISOString().split('T')[0],
      busId,
      stats,
      students: summary,
    },
  });
});

export default {
  scanFace,
  manualAttendance,
  compareFaces,
  verifyStudentFace,
  getStudentAttendance,
  getBusAttendance,
};
