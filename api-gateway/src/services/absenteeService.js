/**
 * ============================================
 * SafeRide v2.0 - Absentee Detection Service
 * ============================================
 * 
 * Feature #3: Absentee Auto-Detection
 * 
 * Automatically detects students who:
 * 1. Were not picked up in the morning (no morning_pickup scan)
 * 2. Were picked up but never arrived at school (morning_pickup but no morning_dropoff)
 * 
 * These students are marked as absent and their parents are notified.
 * 
 * DETECTION LOGIC:
 * - Runs daily at configured time (default: 9:30 AM on weekdays)
 * - Checks all active students assigned to buses
 * - Compares today's attendance records against expected scans
 * - Marks missing students as absent
 * - Sends notifications via Email/SMS (Feature #2 integration)
 */

import { Student, Bus } from '../models/index.js';
import { notifyParentsOfAbsence, sendCustomNotification } from './notificationService.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the start of today in local timezone.
 * @returns {Date} Start of today (midnight)
 */
const getTodayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Check if a student has a specific scan for today.
 * @param {Object} student - Student document with attendanceHistory
 * @param {string} scanType - Type of scan to check
 * @returns {boolean} Whether the scan exists for today
 */
const hasTodayScan = (student, scanType) => {
  const today = getTodayStart();
  const todayRecord = student.attendanceHistory?.find(
    record => new Date(record.date).getTime() === today.getTime()
  );
  
  if (!todayRecord) return false;
  
  const scanTypeMap = {
    'morning_pickup': 'morningPickup',
    'morning_dropoff': 'morningDropoff',
    'evening_pickup': 'eveningPickup',
    'evening_dropoff': 'eveningDropoff',
  };
  
  const fieldName = scanTypeMap[scanType];
  return todayRecord[fieldName]?.scanned === true;
};

/**
 * Check if student is already marked absent today.
 * @param {Object} student - Student document
 * @returns {boolean} Whether student is already absent
 */
const isAlreadyAbsent = (student) => {
  const today = getTodayStart();
  const todayRecord = student.attendanceHistory?.find(
    record => new Date(record.date).getTime() === today.getTime()
  );
  
  return todayRecord?.markedAbsent === true || student.boardingStatus === 'absent';
};

// ============================================
// MAIN DETECTION FUNCTIONS
// ============================================

/**
 * Detect students who should be marked absent.
 * 
 * Absence criteria:
 * 1. NO_PICKUP: No morning_pickup scan by cutoff time
 * 2. INCOMPLETE_COMMUTE: Has morning_pickup but no morning_dropoff
 * 
 * @param {Object} options - Detection options
 * @param {string} options.busFilter - 'all' or comma-separated bus IDs
 * @param {boolean} options.dryRun - If true, don't mark absent, just report
 * @returns {Promise<Object>} Detection results
 */
export const detectAbsentStudents = async ({ busFilter = 'all', dryRun = false } = {}) => {
  const results = {
    checkedAt: new Date(),
    totalStudentsChecked: 0,
    absentees: {
      noPickup: [],      // Never picked up
      incompleteCommute: [], // Picked up but didn't arrive
    },
    alreadyAbsent: [],
    errors: [],
  };
  
  try {
    // Build query for active students on buses
    const studentQuery = {
      isActive: true,
      assignedBus: { $exists: true, $ne: null },
    };
    
    // Apply bus filter if specified
    if (busFilter !== 'all') {
      const busIds = busFilter.split(',').map(id => id.trim());
      studentQuery.assignedBus = { $in: busIds };
    }
    
    // Fetch students with today's attendance
    const students = await Student.find(studentQuery)
      .populate('assignedBus', 'busNumber routeName')
      .populate('parents', 'name email phone')
      .populate('primaryGuardian', 'name email phone')
      .lean();
    
    results.totalStudentsChecked = students.length;
    logger.info(`Absentee detection: Checking ${students.length} students`);
    
    for (const student of students) {
      try {
        // Skip if already marked absent
        if (isAlreadyAbsent(student)) {
          results.alreadyAbsent.push({
            id: student._id,
            name: student.name,
            studentId: student.studentId,
          });
          continue;
        }
        
        const hasMorningPickup = hasTodayScan(student, 'morning_pickup');
        const hasMorningDropoff = hasTodayScan(student, 'morning_dropoff');
        
        // Case 1: No pickup at all
        if (!hasMorningPickup) {
          results.absentees.noPickup.push({
            id: student._id,
            name: student.name,
            studentId: student.studentId,
            grade: student.grade,
            bus: student.assignedBus?.busNumber,
            reason: 'No morning pickup recorded',
            parents: student.parents || [],
            primaryGuardian: student.primaryGuardian,
          });
        }
        // Case 2: Picked up but never arrived at school
        else if (hasMorningPickup && !hasMorningDropoff) {
          results.absentees.incompleteCommute.push({
            id: student._id,
            name: student.name,
            studentId: student.studentId,
            grade: student.grade,
            bus: student.assignedBus?.busNumber,
            reason: 'Picked up but did not arrive at school',
            parents: student.parents || [],
            primaryGuardian: student.primaryGuardian,
          });
        }
      } catch (studentError) {
        results.errors.push({
          studentId: student.studentId,
          error: studentError.message,
        });
      }
    }
    
    logger.info(`Absentee detection results: ${results.absentees.noPickup.length} no pickup, ${results.absentees.incompleteCommute.length} incomplete commute`);
    
  } catch (error) {
    logger.error('Absentee detection failed:', error);
    results.errors.push({ error: error.message });
  }
  
  return results;
};

/**
 * Mark students as absent and notify parents.
 * This is the main function called by the scheduler.
 * 
 * @param {Object} options - Options
 * @param {boolean} options.notifyParents - Send notifications to parents
 * @param {boolean} options.notifyAdmin - Send summary to admin
 * @returns {Promise<Object>} Processing results
 */
export const processAbsentees = async (options = {}) => {
  const {
    notifyParents = config.absenteeDetection.notifyParents,
    notifyAdmin = config.absenteeDetection.notifyAdmin,
    dryRun = false,
  } = options;
  
  const results = {
    processedAt: new Date(),
    detection: null,
    marked: {
      success: [],
      failed: [],
    },
    notifications: {
      sent: 0,
      failed: 0,
    },
  };
  
  // Step 1: Detect absent students
  const detection = await detectAbsentStudents({
    busFilter: config.absenteeDetection.busFilter,
  });
  results.detection = detection;
  
  // Combine all absentees
  const allAbsentees = [
    ...detection.absentees.noPickup,
    ...detection.absentees.incompleteCommute,
  ];
  
  if (allAbsentees.length === 0) {
    logger.info('No absentees detected today');
    return results;
  }
  
  logger.info(`Processing ${allAbsentees.length} absentees`);
  
  // Step 2: Mark each student as absent
  for (const absentee of allAbsentees) {
    if (dryRun) {
      results.marked.success.push(absentee);
      continue;
    }
    
    try {
      const student = await Student.findById(absentee.id);
      if (!student) {
        results.marked.failed.push({ ...absentee, error: 'Student not found' });
        continue;
      }
      
      // Get or create today's attendance record
      const today = getTodayStart();
      let todayRecord = student.attendanceHistory.find(
        record => new Date(record.date).getTime() === today.getTime()
      );
      
      if (!todayRecord) {
        todayRecord = {
          date: today,
          morningPickup: { scanned: false },
          morningDropoff: { scanned: false },
          eveningPickup: { scanned: false },
          eveningDropoff: { scanned: false },
          markedAbsent: true,
          absentReason: absentee.reason,
          autoDetected: true,
          anomalies: [],
        };
        student.attendanceHistory.push(todayRecord);
      } else {
        todayRecord.markedAbsent = true;
        todayRecord.absentReason = absentee.reason;
        todayRecord.autoDetected = true;
      }
      
      student.boardingStatus = 'absent';
      await student.save();
      
      results.marked.success.push(absentee);
      logger.info(`Marked ${student.studentId} as absent: ${absentee.reason}`);
      
      // Step 3: Notify parents
      if (notifyParents) {
        try {
          const notifResult = await notifyParentsOfAbsence({
            student,
            date: new Date(),
          });
          results.notifications.sent += notifResult.emailsSent + notifResult.smsSent;
          results.notifications.failed += notifResult.emailsFailed + notifResult.smsFailed;
        } catch (notifError) {
          logger.error(`Failed to notify parents of ${student.studentId}:`, notifError.message);
          results.notifications.failed++;
        }
      }
      
    } catch (error) {
      logger.error(`Failed to mark ${absentee.studentId} as absent:`, error.message);
      results.marked.failed.push({ ...absentee, error: error.message });
    }
  }
  
  // Step 4: Send admin summary if configured
  if (notifyAdmin && config.absenteeDetection.adminEmail && allAbsentees.length > 0) {
    try {
      const adminSummary = generateAdminSummary(results);
      await sendCustomNotification({
        emails: [config.absenteeDetection.adminEmail],
        subject: `📋 Daily Absence Report - ${new Date().toLocaleDateString()}`,
        emailContent: adminSummary.html,
        smsContent: adminSummary.sms,
      });
      logger.info('Admin absence summary sent');
    } catch (adminError) {
      logger.error('Failed to send admin summary:', adminError.message);
    }
  }
  
  logger.info(`Absentee processing complete: ${results.marked.success.length} marked, ${results.notifications.sent} notifications sent`);
  
  return results;
};

/**
 * Generate admin summary email content.
 * @param {Object} results - Processing results
 * @returns {Object} HTML and SMS content
 */
const generateAdminSummary = (results) => {
  const noPickup = results.detection.absentees.noPickup;
  const incomplete = results.detection.absentees.incompleteCommute;
  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #EF4444;">📋 Daily Absence Report</h2>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Total Absent:</strong> ${noPickup.length + incomplete.length} students</p>
      
      ${noPickup.length > 0 ? `
        <h3 style="color: #F59E0B;">No Morning Pickup (${noPickup.length})</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #FEF3C7;">
            <th style="padding: 8px; border: 1px solid #ddd;">Student</th>
            <th style="padding: 8px; border: 1px solid #ddd;">ID</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Grade</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Bus</th>
          </tr>
          ${noPickup.map(s => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.studentId}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.grade}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.bus || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      
      ${incomplete.length > 0 ? `
        <h3 style="color: #EF4444;">⚠️ Incomplete Commute (${incomplete.length})</h3>
        <p style="color: #DC2626; font-weight: bold;">These students were picked up but did not arrive at school!</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #FEE2E2;">
            <th style="padding: 8px; border: 1px solid #ddd;">Student</th>
            <th style="padding: 8px; border: 1px solid #ddd;">ID</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Grade</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Bus</th>
          </tr>
          ${incomplete.map(s => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.name}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.studentId}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.grade}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${s.bus || 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This report was auto-generated by SafeRide Absentee Detection System.
      </p>
    </div>
  `;
  
  const sms = `📋 Absence Report ${new Date().toLocaleDateString()}: ${noPickup.length + incomplete.length} students absent. ${incomplete.length > 0 ? `⚠️ ${incomplete.length} incomplete commutes require attention!` : ''}`;
  
  return { html, sms };
};

/**
 * Run absentee detection manually (for testing or admin trigger).
 * @param {Object} options - Options
 * @returns {Promise<Object>} Results
 */
export const runManualDetection = async (options = {}) => {
  logger.info('Manual absentee detection triggered');
  return processAbsentees(options);
};

/**
 * Get absentee detection status and last run info.
 * @returns {Object} Status information
 */
export const getDetectionStatus = () => {
  return {
    enabled: config.absenteeDetection.enabled,
    schedule: config.absenteeDetection.cronSchedule,
    timezone: config.absenteeDetection.timezone,
    cutoffTimes: config.absenteeDetection.cutoffTimes,
    notifyParents: config.absenteeDetection.notifyParents,
    notifyAdmin: config.absenteeDetection.notifyAdmin,
  };
};

export default {
  detectAbsentStudents,
  processAbsentees,
  runManualDetection,
  getDetectionStatus,
};
